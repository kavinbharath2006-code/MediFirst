// directConnectProbe.cjs — can we reach Atlas bypassing the broken local DNS?
// Resolves shard hosts via 8.8.8.8, TCP-checks them, then tries a real mongoose
// connection built from MONGODB_URI's credentials with the resolved host list.
// Prints NO credential values.
const path = require('path');
const fs = require('fs');
const dns = require('dns').promises;
const net = require('net');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

const srvUri = process.env.MONGODB_URI || process.env.MONGODB_URI_SRV;

function tcp(host, port, timeout = 6000) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port, timeout });
    const d = (r) => { s.destroy(); resolve(r); };
    s.on('connect', () => d('TCP OK'));
    s.on('timeout', () => d('TCP TIMEOUT'));
    s.on('error', (e) => d(`TCP FAIL: ${e.code || e.message}`));
  });
}

(async () => {
  // cluster0.<id>.mongodb.net  -> <id>
  const m = srvUri.match(/@cluster0\.([a-z0-9]+)\.mongodb\.net\//i);
  if (!m) { console.log('Could not extract cluster id from MONGODB_URI'); process.exit(1); }
  const clusterId = m[1];
  const u = new URL(srvUri);
  const dbNameRaw = decodeURIComponent(u.pathname.replace(/^\//, '')) || 'medifirst';
  const queryPart = u.search.toLowerCase();
  console.log(`cluster id: ${clusterId}, db: "${dbNameRaw}", hasAuthSource: ${queryPart.includes('authsource')}`);

  // WHATWG URL getters return DECODED parts — pass them via mongoose's auth
  // option instead of embedding in the URI (avoids all encoding pitfalls).
  const username = u.username;
  const password = u.password;

  dns.setServers(['8.8.8.8']);
  const shardHosts = [];
  for (let i = 0; i < 3; i++) {
    const host = `ac-iwrpgno-shard-00-0${i}.${clusterId}.mongodb.net`; // from SRV result earlier
    try {
      const rec = await dns.resolveSrv(`_mongodb._tcp.cluster0.${clusterId}.mongodb.net`);
      shardHosts.push(...rec.map((r) => r.name));
      break;
    } catch (e) { console.log(`SRV via 8.8.8.8 failed: ${e.code || e.message}`); }
    try {
      const a = await dns.resolve4(host);
      shardHosts.push(host);
      console.log(`  ${host} -> ${a[0]} (direct A)`);
    } catch (e) { console.log(`  ${host} resolve FAIL: ${e.code || e.message}`); }
  }
  const uniqueHosts = [...new Set(shardHosts)].slice(0, 3);
  console.log(`shard hosts discovered: ${uniqueHosts.length}`);

  console.log('\n=== TCP :27017 to each shard (resolving IPs via 8.8.8.8, connecting by IP) ===');
  const ipByHost = {};
  for (const h of uniqueHosts) {
    let ip = h;
    try { ip = (await dns.resolve4(h))[0]; ipByHost[h] = ip; } catch (e) { console.log(`  ${h}: resolve FAIL ${e.code}`); continue; }
    console.log(`  ${h} (${ip}):27017 -> ` + await tcp(ip, 27017));
  }

  console.log('\n=== mongoose direct-URI attempt (hostnames via 8.8.8.8 lookup, tls, 10 s) ===');
  // Connect by HOSTNAME (TLS cert verification needs it) with a custom lookup
  // that bypasses the broken 127.0.0.1 stub resolver.
  const hostList = uniqueHosts.map((h) => `${h}:27017`).join(',');
  const directUri = `mongodb://${hostList}/${encodeURIComponent(dbNameRaw)}?tls=true&directConnection=false` +
    (queryPart.includes('authsource') ? '' : '&authSource=admin');
  const resolver = require('dns').promises;
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
  const customLookup = (hostname, options, cb) => {
    resolver.resolve4(hostname)
      .then((addresses) => cb(null, options.all ? addresses.map((a) => ({ address: a, family: 4 })) : addresses[0]))
      .catch((e) => cb(e));
  };
  try {
    await mongoose.connect(directUri, {
      serverSelectionTimeoutMS: 10000,
      lookup: customLookup,
      auth: { username, password },
    });
    console.log('  CONNECTED. readyState:', mongoose.connection.readyState, 'db:', mongoose.connection.name);
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log('  collections:', cols.map((c) => c.name).join(', ') || '(none)');
    const hosp = require('../models/Hospital');
    console.log('  hospitals count:', await hosp.countDocuments());
    await mongoose.disconnect();
    console.log('\nRESULT: direct connection WORKS — SRV/OS DNS is the only blocker.');
  } catch (e) {
    // Sanitize: driver errors can echo the credential section of the URI
    const safeMsg = String(e.message || '')
      .split('\n')[0]
      .replace(/Unable to parse .* with URL/, 'Unable to parse <redacted> with URL')
      .replace(/[^\s]*:[^\s]*@/, '***:***@')
      .slice(0, 180);
    console.log('  FAILED:', e.code || e.name, '-', safeMsg);
    console.log('\nRESULT: direct connection FAILED (error redacted above).');
  }
})();
