/**
 * server.js — MediFirst Express Entry Point
 *
 * Bootstraps the Express application:
 *  - Loads env from the repo-root .env (the single source of truth)
 *  - Connects to MongoDB via Mongoose
 *  - Registers JSON middleware; CORS only outside production (dev runs the
 *    frontend on :3000, production is same-origin)
 *  - Mounts all API route groups
 *  - In production, serves frontend/build and backend/assets from this server
 *  - Attaches global error-handling middleware
 *  - Registers all node-cron automation jobs
 *  - Starts listening on PORT (default 5000)
 *
 * `node server.js --production` sets NODE_ENV for cross-platform npm scripts
 * (PowerShell 5.1 has no `&&`; cmd's `set X=1&&` is not portable).
 *
 * Sample curl commands are included at the bottom of this file.
 */

const path = require('path');
const fs = require('fs');

if (process.argv.slice(2).some((a) => a === '--production' || a === '--prod')) {
  process.env.NODE_ENV = 'production';
}

// One source of truth: the repo-root .env. The old backend/.env fallback has
// been removed so secrets live in exactly one file.
const rootEnv = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
} else {
  console.warn('[Server] ⚠ root .env not found at', rootEnv, '— using process environment only.');
}

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const axios    = require('axios');
const dns      = require('dns');

const guidanceRoutes    = require('./routes/guidance');
const hospitalsRoutes   = require('./routes/hospitals');
const feedbackRoutes    = require('./routes/feedback');
const logRoutes         = require('./routes/log');
const emergencyRoutes   = require('./routes/emergencyRoutes');
const resourceRoutes    = require('./routes/resourceRoutes');
const { registerAllJobs } = require('./services/automationService');

const app  = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;
let currentPort = DEFAULT_PORT;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
// CORS is only needed while the frontend is served from a different origin
// (dev: :3000 -> :5000). In production this server serves the built frontend
// itself, so requests are same-origin and the permissive '*' policy is dropped.
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use('/api/guidance',  guidanceRoutes);
app.use('/api/hospitals', hospitalsRoutes);
app.use('/api/feedback',  feedbackRoutes);
app.use('/api/log',       logRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api',          resourceRoutes);

// Frontend configuration
app.get('/api/config', (_req, res) => {
  res.json({
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    assetBaseUrl: process.env.ASSET_BASE_URL || '/assets',
  });
});

// Aggregate health check used by the monorepo tooling and the UI: mongo comes
// from the live Mongoose socket state, rag from a 1 s probe of the FastAPI
// service so a slow or dead RAG worker can never stall this endpoint.
app.get('/api/health', async (_req, res) => {
  const mongo = mongoose.connection.readyState === 1;

  let rag = false;
  const ragBase = (process.env.RAG_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  try {
    const ragRes = await axios.get(`${ragBase}/health`, { timeout: 1000 });
    rag = ragRes.status === 200;
  } catch {
    rag = false;
  }

  res.status(mongo && rag ? 200 : 503).json({
    ok:    mongo && rag,
    mongo,
    rag,
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'MediFirst Backend',
    timestamp: new Date().toISOString(),
    mongodb:   mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ────────────────────────────────────────────────
// Production: this one server also serves the built frontend
// Mounted AFTER every API route and BEFORE the 404/error handlers so that API
// paths keep their JSON 404 and deep links (/result, /services) resolve.
// ────────────────────────────────────────────────
const IS_PRODUCTION    = process.env.NODE_ENV === 'production';
const FRONTEND_BUILD   = path.join(__dirname, '..', 'frontend', 'build');
const FRONTEND_INDEX   = path.join(FRONTEND_BUILD, 'index.html');
const ASSETS_DIR       = path.join(__dirname, 'assets');

if (IS_PRODUCTION) {
  // Images and downloads are served from backend/assets (never backend/public)
  app.use('/assets', express.static(ASSETS_DIR));

  if (fs.existsSync(FRONTEND_BUILD)) {
    app.use(express.static(FRONTEND_BUILD));
    console.log(`[Server] Serving frontend build from ${FRONTEND_BUILD}`);
  } else {
    console.warn('[Server] ⚠ frontend/build not found — run "npm run build" at the repo root.');
    console.warn('[Server]   API endpoints stay available; the UI will not be served.');
  }

  // SPA fallback: any GET outside /api and /assets returns index.html so a
  // refresh on a client-side route does not 404.
  app.get('*', (req, res, next) => {
    const url = req.path;
    if (url.startsWith('/api') || url.startsWith('/assets')) return next();
    if (!fs.existsSync(FRONTEND_INDEX)) return next();
    return res.sendFile(FRONTEND_INDEX);
  });
}

// 404 catch-all (API paths in production, everything else in development)
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[GlobalError]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error:   err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────
// MongoDB Connection + Server Start
// ─────────────────────────────────────────────

// Log MongoDB connection events for visibility
mongoose.connection.on('connected',    () => console.log('[MongoDB] ✓ Connected'));
mongoose.connection.on('disconnected', () => console.warn('[MongoDB] ✗ Disconnected'));
mongoose.connection.on('error',        (err) => console.error('[MongoDB] Error:', err.message));

// Connection strings to try, in order of preference.
// `mongodb+srv://` needs a DNS SRV lookup, which some networks (captive-router
// DNS, IPv6 link-local resolvers) refuse — a direct host-list URI is tried first
// when available, with the SRV string and a local server as fallbacks.
function candidateUris() {
  return [
    process.env.MONGODB_URI,
    process.env.MONGODB_URI_SRV,
    process.env.MONGODB_URI_LOCAL,
  ].filter(Boolean);
}

// Hide credentials before a URI reaches the console
function redact(uri) {
  return uri.replace(/\/\/[^@/]+@/, '//***:***@');
}

async function connectOnce(uri) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      maxIdleTimeMS: 10000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    if (err.message && (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED'))) {
      console.log('[MongoDB] DNS SRV query failed with local resolver — trying public DNS (8.8.8.8, 1.1.1.1)...');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        maxIdleTimeMS: 10000,
        socketTimeoutMS: 45000,
      });
      return;
    }
    throw err;
  }
}

async function connectMongo() {
  for (const uri of candidateUris()) {
    try {
      console.log('[MongoDB] Trying', redact(uri));
      await connectOnce(uri);
      return uri;
    } catch (err) {
      console.warn(`[MongoDB] ✗ ${redact(uri)} -> ${err.code || err.name}: ${err.message}`);
    }
  }
  return null;
}

function warnDbDisabled(err) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════╗');
  console.error('║  ⚠  MongoDB not reachable — DB features disabled    ║');
  console.error('║  Retrying in the background every 30s:              ║');
  console.error('║   • Query logging   • Feedback   • Admin logs       ║');
  console.error('║  Guidance & Hospitals endpoints still work!         ║');
  console.error('╚══════════════════════════════════════════════════════╝');
  console.error('');
  if (err) console.error('[MongoDB] Last error:', err.message);
}

// While the DB is down, keep probing so logging/feedback recover without a
// restart of the backend.
function retryMongoForever() {
  const timer = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(timer);
      return;
    }
    const uri = await connectMongo();
    if (uri) {
      clearInterval(timer);
      console.log('[MongoDB] ✓ Recovered — DB features enabled');
      registerAllJobs();
    }
  }, 30000);
  timer.unref();
}

function startServer(port) {
  const server = app.listen(port, () => {
    currentPort = port;
    process.env.PORT = String(port);
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   MediFirst AI First Aid Backend v1.0   ║');
    console.log(`║   http://localhost:${port}                  ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`[Server] Port ${port} is already in use — another service owns it. ` +
                   `Backend is moving to ${nextPort}; if a MediFirst backend is already ` +
                   `running on ${port}, stop it instead of starting a second one.`);
      startServer(nextPort);
      return;
    }

    console.error('[Server] Failed to start backend:', err.message);
    process.exit(1);
  });
}

async function start() {
  // Start HTTP server immediately — don't wait for MongoDB
  startServer(DEFAULT_PORT);

  // Connect to MongoDB in the background (non-blocking)
  if (!process.env.MONGODB_URI) {
    console.warn('[MongoDB] MONGODB_URI is not set — DB features disabled');
    warnDbDisabled();
    return;
  }

  const connectedUri = await connectMongo();
  if (connectedUri) {
    // Register all scheduled cron jobs only after DB is available
    registerAllJobs();
  } else {
    warnDbDisabled();
    retryMongoForever();
  }
}

start();

/*
 * ─────────────────────────────────────────────
 * SAMPLE CURL COMMANDS
 * ─────────────────────────────────────────────
 *
 * 1. Health check
 *    curl http://localhost:5000/health
 *
 * 2. Get first aid guidance (with location)
 *    curl -X POST http://localhost:5000/api/guidance \
 *      -H "Content-Type: application/json" \
 *      -d '{"query":"The person is not breathing and has no pulse","lat":12.9716,"lng":77.5946}'
 *
 * 3. Get guidance (no location)
 *    curl -X POST http://localhost:5000/api/guidance \
 *      -H "Content-Type: application/json" \
 *      -d '{"query":"Someone is having a seizure and fell to the ground","sessionId":"abc123"}'
 *
 * 4. Get nearby hospitals
 *    curl "http://localhost:5000/api/hospitals?lat=12.9716&lng=77.5946&radius=3000"
 *
 * 5. Submit feedback
 *    curl -X POST http://localhost:5000/api/feedback \
 *      -H "Content-Type: application/json" \
 *      -d '{"queryLogId":"<MONGO_ID>","rating":4,"comment":"Very helpful guidance"}'
 *
 * 6. Get recent logs (admin)
 *    curl http://localhost:5000/api/log
 *
 * 7. Get guidance for burn
 *    curl -X POST http://localhost:5000/api/guidance \
 *      -H "Content-Type: application/json" \
 *      -d '{"query":"Child touched hot stove and has a severe burn on hand"}'
 *
 * 8. Get guidance for choking
 *    curl -X POST http://localhost:5000/api/guidance \
 *      -H "Content-Type: application/json" \
 *      -d '{"query":"Adult is choking on food and cannot speak or breathe"}'
 * ─────────────────────────────────────────────
 */
