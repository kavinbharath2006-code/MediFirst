#!/usr/bin/env node
/**
 * Monorepo pre-flight checks (cross-platform, no dependencies)
 *
 *   node scripts/precheck.cjs               -> dev mode   (npm run dev)
 *   node scripts/precheck.cjs --production  -> prod mode  (npm start)
 *
 * Dev mode: `npm run dev` spawns three services on fixed ports. When a stack is
 * already running, react-scripts refuses to start, uvicorn dies with WSAEADDRINUSE
 * (10048) and Express drifts to the next free port, which looks like a random
 * failure. This check reports the real situation before anything is spawned.
 *
 * Production mode: verifies the frontend build exists and the single server port
 * is free, since `npm start` serves the UI and the API from one origin.
 */
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PRODUCTION = process.argv.includes('--production') || process.argv.includes('--prod');

// Read PORT from the repo-root .env without a dotenv dependency
function serverPort() {
  const fromEnvVar = Number(process.env.PORT);
  if (fromEnvVar) return fromEnvVar;
  try {
    const text = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    const match = text.match(/^\s*PORT\s*=\s*(\d+)/m);
    if (match) return Number(match[1]);
  } catch {
    // no root .env yet — fall through
  }
  return 5000;
}

const DEV_SERVICES = [
  { port: 3000, name: 'Frontend (react-scripts)' },
  { port: serverPort(), name: 'Backend  (Express)' },
  { port: 8000, name: 'RAG      (uvicorn)' },
];

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    const finish = (used) => {
      socket.destroy();
      resolve(used);
    };
    socket.setTimeout(1200);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function warnIfNoEnvFile() {
  if (!fs.existsSync(path.join(ROOT, '.env'))) {
    console.log('');
    console.log('NOTE: no repo-root .env found. Copy .env.example to .env, otherwise');
    console.log('      MongoDB, Gemini and the RAG URL fall back to backend/.env defaults.');
  }
}

async function devCheck() {
  const results = await Promise.all(
    DEV_SERVICES.map(async (s) => ({ ...s, used: await portInUse(s.port) }))
  );
  const busy = results.filter((r) => r.used);

  console.log('MediFirst pre-flight (dev) — port status:');
  for (const r of results) {
    console.log(`  ${String(r.port).padEnd(6)} ${r.name}  ${r.used ? 'IN USE' : 'free'}`);
  }
  warnIfNoEnvFile();

  if (busy.length === results.length) {
    console.log('');
    console.log('All three services are already running — open http://localhost:3000');
    console.log('Stop the existing "npm run dev" terminal before starting another one.');
    process.exit(1);
  }

  if (busy.length > 0) {
    console.log('');
    console.log(`Already running: ${busy.map((b) => `${b.name} (:${b.port})`).join(', ')}`);
    console.log('Only the remaining services will start.');
  }
  console.log('');
}

async function productionCheck() {
  const port = serverPort();
  const buildIndex = path.join(ROOT, 'frontend', 'build', 'index.html');
  const used = await portInUse(port);

  console.log('MediFirst pre-flight (production):');
  console.log(`  port ${port} ............ ${used ? 'IN USE' : 'free'}`);
  console.log(`  frontend/build/index.html ${fs.existsSync(buildIndex) ? 'present' : 'MISSING'}`);
  warnIfNoEnvFile();
  console.log('');

  if (!fs.existsSync(buildIndex)) {
    console.error('Cannot start in production mode: the frontend is not built.');
    console.error('Run:  npm run build');
    process.exit(1);
  }

  if (used) {
    console.error(`Port ${port} is already in use — a server (probably the dev backend) holds it.`);
    console.error('Stop it first, or set PORT in the repo-root .env to another value.');
    process.exit(1);
  }
}

(PRODUCTION ? productionCheck() : devCheck()).catch((err) => {
  console.error('Pre-flight check failed:', err.message);
  process.exit(1);
});
