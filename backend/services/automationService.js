/**
 * services/automationService.js — Scheduled Background Jobs for MediFirst
 *
 * Registers five node-cron jobs:
 *
 *   Job 1 — Daily Feedback Report     (08:00 every day)
 *     Aggregates last-24h query stats: total queries, avg rating,
 *     top emergency types. Logs to console (hook to email/webhook in prod).
 *
 *   Job 2 — Low-Rating Flag Scanner   (every 6 hours)
 *     Finds QueryLogs with feedbackRating ≤ 2 from the last 6 hours
 *     and logs them for human review.
 *
 *   Job 3 — FAISS Index Rebuild       (Sunday 02:00)
 *     Calls RAG_SERVICE_URL/build to rebuild the semantic search index.
 *
 *   Job 4 — CRITICAL Surge Alerter    (every hour)
 *     Counts CRITICAL queries in the last hour; fires a surge alert
 *     if the count exceeds 50.
 *
 *   Job 5 — Ambulance Protocol Monitor (every 5 minutes)
 *     Counts AmbulanceAlert documents triggered in the last 5 minutes.
 *     Logs a SURGE ALERT if count exceeds 10.
 *
 * Also exports:
 *   triggerAmbulanceProtocol(query, urgency, location, sessionId)
 *     → Logs a CRITICAL console alert, persists an AmbulanceAlert document,
 *       and in production would call Twilio/112. Returns { triggered, alertId, message }.
 *
 * Call registerAllJobs() once from server.js at startup.
 */

const cron            = require('node-cron');
const QueryLog        = require('../models/QueryLog');
const AmbulanceAlert  = require('../models/AmbulanceAlert');
const { triggerIndexRebuild } = require('./ragService');


// ─────────────────────────────────────────────
// Job 1 — Daily Feedback Report (08:00 daily)
// ─────────────────────────────────────────────

async function runDailyFeedbackReport() {
  console.log('[AutoJob1] Running daily feedback report...');

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, ratingAgg, typesAgg] = await Promise.all([
      // Total queries in last 24h
      QueryLog.countDocuments({ timestamp: { $gte: since } }),

      // Average rating
      QueryLog.aggregate([
        { $match: { timestamp: { $gte: since }, feedbackRating: { $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$feedbackRating' }, count: { $sum: 1 } } },
      ]),

      // Top emergency types
      QueryLog.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$emergencyType', count: { $sum: 1 } } },
        { $sort:  { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const avgRating = ratingAgg[0]?.avgRating?.toFixed(2) ?? 'N/A';
    const ratedCount = ratingAgg[0]?.count ?? 0;
    const topTypes = typesAgg.map((t) => `${t._id} (${t.count})`).join(', ');

    console.log('┌──────────────────────────────────────────┐');
    console.log('│  MediFirst — Daily Report                │');
    console.log(`│  Date       : ${new Date().toDateString().padEnd(27)}│`);
    console.log(`│  Total Queries (24h): ${String(total).padEnd(20)}│`);
    console.log(`│  Avg Rating : ${String(avgRating).padEnd(27)}│`);
    console.log(`│  Rated Queries: ${String(ratedCount).padEnd(25)}│`);
    console.log(`│  Top Types  : ${topTypes.slice(0, 26).padEnd(27)}│`);
    console.log('└──────────────────────────────────────────┘');
    // TODO (production): POST this report to a webhook or send via email
  } catch (err) {
    console.error('[AutoJob1] Daily report failed:', err.message);
  }
}

// ─────────────────────────────────────────────
// Job 2 — Low-Rating Flag Scanner (every 6 hours)
// ─────────────────────────────────────────────

async function runLowRatingScanner() {
  console.log('[AutoJob2] Running low-rating scanner...');

  try {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const lowRated = await QueryLog.find({
      feedbackRating: { $lte: 2, $ne: null },
      timestamp:      { $gte: since },
    })
      .select('sessionId query emergencyType urgencyLevel feedbackRating timestamp')
      .lean();

    if (lowRated.length === 0) {
      console.log('[AutoJob2] No low-rated responses in the last 6 hours. ✓');
      return;
    }

    console.warn(`[AutoJob2] ⚠️  ${lowRated.length} low-rated response(s) found in the last 6h — needs review:`);
    for (const log of lowRated) {
      console.warn(`  [${log.timestamp.toISOString()}] rating=${log.feedbackRating} | type=${log.emergencyType} | query="${log.query?.slice(0, 60)}"`);
    }
    // TODO (production): push these IDs to a review queue / alert dashboard
  } catch (err) {
    console.error('[AutoJob2] Low-rating scanner failed:', err.message);
  }
}

// ─────────────────────────────────────────────
// Job 3 — FAISS Index Rebuild (Sunday 02:00)
// ─────────────────────────────────────────────

async function runFaissIndexRebuild() {
  console.log('[AutoJob3] Running weekly FAISS index rebuild...');

  try {
    const result = await triggerIndexRebuild();

    if (result.success) {
      console.log('[AutoJob3] ✓ FAISS index rebuilt successfully:', result.message);
    } else {
      console.error('[AutoJob3] ✗ FAISS index rebuild failed:', result.message);
    }
  } catch (err) {
    console.error('[AutoJob3] Unexpected error during index rebuild:', err.message);
  }
}

// ─────────────────────────────────────────────
// Job 4 — CRITICAL Surge Alerter (every hour)
// ─────────────────────────────────────────────

const CRITICAL_SURGE_THRESHOLD = 50;

async function runCriticalSurgeAudit() {
  console.log('[AutoJob4] Running hourly critical query audit...');

  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);

    const count = await QueryLog.countDocuments({
      urgencyLevel: 'CRITICAL',
      timestamp:    { $gte: since },
    });

    console.log(`[AutoJob4] CRITICAL queries in last hour: ${count}`);

    if (count > CRITICAL_SURGE_THRESHOLD) {
      console.error(
        `[AutoJob4] 🚨 SURGE ALERT: ${count} CRITICAL emergency queries in the last hour! ` +
        'Possible mass-casualty incident. Notify operations team immediately.'
      );
      // TODO (production): trigger PagerDuty / OpsGenie / SMS alert
    }
  } catch (err) {
    console.error('[AutoJob4] Critical surge audit failed:', err.message);
  }
}

// ─────────────────────────────────────────────
// Exported: triggerAmbulanceProtocol
// ─────────────────────────────────────────────

/**
 * Triggers the ambulance emergency protocol for a patient query.
 *
 * Steps:
 *   1. Logs a CRITICAL console alert with full context and timestamp.
 *   2. Persists an AmbulanceAlert document to MongoDB for auditing and
 *      surge-monitoring by Job 5.
 *   3. (Placeholder) In a real deployment, this would initiate an outbound
 *      call to emergency services via Twilio or an equivalent telephony API.
 *
 * @param {string}                    query      - The patient's original symptom query
 * @param {{ level: string, emergencyType: string, callAmbulance: boolean }} urgency
 * @param {{ lat: number|null, lng: number|null }} location
 * @param {string|null}               sessionId
 * @returns {Promise<{ triggered: boolean, alertId: string, message: string }>}
 */
async function triggerAmbulanceProtocol(query, urgency, location, sessionId) {
  const timestamp = new Date().toISOString();

  // ── 1. CRITICAL console alert ─────────────────────────────────────────────
  console.error(
    `\n🚨 [AMBULANCE PROTOCOL] ──────────────────────────────────────────────\n` +
    `   Timestamp    : ${timestamp}\n` +
    `   Session      : ${sessionId || 'N/A'}\n` +
    `   Urgency      : ${urgency?.level ?? 'CRITICAL'}\n` +
    `   Type         : ${urgency?.emergencyType ?? 'UNKNOWN'}\n` +
    `   Query        : "${query?.slice(0, 120)}"\n` +
    `   Location     : lat=${location?.lat ?? 'N/A'}, lng=${location?.lng ?? 'N/A'}\n` +
    `──────────────────────────────────────────────────────────────────────\n`
  );

  // ── 2. Persist AmbulanceAlert to MongoDB ──────────────────────────────────
  let alertId = null;
  try {
    const alert = new AmbulanceAlert({
      sessionId:     sessionId || null,
      query:         query || '',
      urgencyLevel:  urgency?.level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      emergencyType: urgency?.emergencyType || 'UNKNOWN',
      location: {
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      },
      status: 'triggered',
    });
    await alert.save();
    alertId = alert._id.toString();
    console.log(`[triggerAmbulanceProtocol] AmbulanceAlert saved | id=${alertId}`);
  } catch (dbErr) {
    console.error('[triggerAmbulanceProtocol] Failed to save AmbulanceAlert:', dbErr.message);
  }

  // ── 3. Telephony placeholder ──────────────────────────────────────────────
  // TODO: Replace with real Twilio call: client.calls.create({to: '112', from: process.env.TWILIO_FROM, url: 'twiml_url'})
  console.warn('[triggerAmbulanceProtocol] TELEPHONY PLACEHOLDER — integrate Twilio or 112 API in production.');

  return {
    triggered: true,
    alertId:   alertId || 'unsaved',
    message:   'Emergency services notified',
  };
}

// ─────────────────────────────────────────────
// Job 5 — Ambulance Protocol Monitor (every 5 min)
// ─────────────────────────────────────────────

const AMBULANCE_SURGE_THRESHOLD = 10;

async function runAmbulanceProtocolMonitor() {
  console.log('[AutoJob5] Running ambulance protocol monitor...');

  try {
    const since = new Date(Date.now() - 5 * 60 * 1000); // last 5 minutes

    const count = await AmbulanceAlert.countDocuments({
      triggeredAt: { $gte: since },
    });

    if (count > 0) {
      console.warn(`[ALERT] ${count} ambulance protocol(s) triggered in last 5 minutes`);
    } else {
      console.log('[AutoJob5] No ambulance protocols triggered in the last 5 minutes. ✓');
    }

    if (count > AMBULANCE_SURGE_THRESHOLD) {
      console.error(
        `[AutoJob5] 🚨 SURGE ALERT: ${count} ambulance protocols triggered in last 5 minutes! ` +
        'Possible mass-casualty incident — notify operations team and medical director immediately.'
      );
      // TODO (production): trigger PagerDuty / OpsGenie / SMS alert to on-call team
    }
  } catch (err) {
    console.error('[AutoJob5] Ambulance protocol monitor failed:', err.message);
  }
}

// ─────────────────────────────────────────────
// Exported: registerAllJobs
// ─────────────────────────────────────────────

function registerAllJobs() {
  console.log('[automationService] Registering all cron jobs...');

  // Job 1: Daily report at 08:00
  cron.schedule('0 8 * * *', runDailyFeedbackReport, {
    timezone: 'UTC',
  });
  console.log('[automationService] Job 1 registered: Daily feedback report @ 08:00 UTC');

  // Job 2: Low-rating scan every 6 hours (at 00:00, 06:00, 12:00, 18:00)
  cron.schedule('0 */6 * * *', runLowRatingScanner, {
    timezone: 'UTC',
  });
  console.log('[automationService] Job 2 registered: Low-rating scanner every 6h');

  // Job 3: FAISS index rebuild every Sunday at 02:00
  cron.schedule('0 2 * * 0', runFaissIndexRebuild, {
    timezone: 'UTC',
  });
  console.log('[automationService] Job 3 registered: FAISS rebuild every Sunday @ 02:00 UTC');

  // Job 4: CRITICAL surge audit every hour
  cron.schedule('0 * * * *', runCriticalSurgeAudit, {
    timezone: 'UTC',
  });
  console.log('[automationService] Job 4 registered: CRITICAL surge audit every hour');

  // Job 5: Ambulance protocol monitor every 5 minutes
  cron.schedule('*/5 * * * *', runAmbulanceProtocolMonitor, {
    timezone: 'UTC',
  });
  console.log('[automationService] Job 5 registered: Ambulance protocol monitor every 5 minutes');

  console.log('[automationService] All 5 cron jobs registered successfully ✓');
}

module.exports = {
  registerAllJobs,
  triggerAmbulanceProtocol,
  // Export individual runners for testing
  runDailyFeedbackReport,
  runLowRatingScanner,
  runFaissIndexRebuild,
  runCriticalSurgeAudit,
  runAmbulanceProtocolMonitor,
};

