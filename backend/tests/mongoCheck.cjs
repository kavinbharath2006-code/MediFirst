// mongoCheck.cjs — MongoDB connection diagnosis. Prints NO secret values:
// hosts and variable names only, credentials always redacted.
const path = require('path');
const dns = require('dns').promises;
const net = require('net');
const fs = require('fs');

const rootEnv = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnv)) require('dotenv').config({ path: rootEnv });

const vars = ['MONGODB_URI', 'MONGODB_URI_SRV', 'MONGODB_URI_LOCAL'];
console.log('=== env variables (names + set/not-set only) ===');
for (const v of vars) console.log(`  ${v}: ${process.env[v] ? 'SET' : 'not set'}`);

function hostsOf(uri) {
  try {
    const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const beforeSlash = withoutScheme.split('/')[0];
    const hostPart = beforeSlash.includes('@') ? beforeSlash.split('@')[1] : beforeSlash;
    return hostPart.split(',').map((h) => h.replace(/:\d+$/, ''));
  } catch { return []; }
}

function redact(uri) { return uri.replace(/\/\/[^@/]+@/, '//***:***@'); }

function tcpCheck(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const sock = net.connect({ host, port, timeout });
    const done = (result) => { sock.destroy(); resolve(result); };
    sock.on('connect', () => done('TCP OK'));
    sock.on('timeout', () => done('TCP TIMEOUT'));
    sock.on('error', (e) => done(`TCP FAIL: ${e.code || e.message}`));
  });
}

(async () => {
  console.log('\n=== DNS + TCP per host ===');
  for (const v of vars) {
    const uri = process.env[v];
    if (!uri) continue;
    if (uri.startsWith('mongodb+srv')) {
      console.log(`\n${v}: SRV URI (needs _mongodb._tcp DNS SRV lookup)`);
    }
    const hosts = [...new Set(hostsOf(uri))];
    for (const h of hosts) {
      if (!/[a-zA-Z]/.test(h)) { console.log(`  ${h}: (ip literal)`); continue; }
      let ips = 'DNS FAIL';
      try {
        const recs = await dns.resolve4(h);
        ips = `DNS OK (${recs.length} A record${recs.length > 1 ? 's' : ''})`;
      } catch (e) { ips = `DNS FAIL: ${e.code || e.message}`; }
      const port = uri.includes(':27017') || v === 'MONGODB_URI' ? 27017 : 27017;
      const tcp = (await tcpCheck(h, port));
      console.log(`  ${h}:${port} -> ${ips} | ${tcp}`);
    }
  }

  console.log('\n=== mongoose connection attempt (direct URI, 8s budget) ===');
  const mongoose = require('mongoose');
  for (const v of vars) {
    const uri = process.env[v];
    if (!uri) continue;
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      const st = mongoose.connection;
      console.log(`  ${v} (${redact(uri).slice(0, 60)}...): CONNECTED to db "${st.name}", readyState ${st.readyState}`);
      const cols = await st.db.listCollections().toArray();
      console.log(`  collections in db: ${cols.map((c) => c.name).join(', ')}`);
      const Hosp = require('../models/Hospital');
      const count = await Hosp.countDocuments();
      console.log(`  hospitals count: ${count}`);
      await mongoose.disconnect();
      console.log('\nRESULT: MongoDB is reachable — connection SUCCEEDED via ' + v);
      return;
    } catch (e) {
      console.log(`  ${v}: FAILED -> ${e.code || e.name}: ${String(e.message).split('\n')[0].slice(0, 160)}`);
      await mongoose.disconnect().catch(() => {});
    }
  }
  console.log('\nRESULT: no candidate URI connected.');
})();
