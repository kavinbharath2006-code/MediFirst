/**
 * controllers/guidanceController.js — Core First Aid Guidance Controller
 *
 * Handles POST /api/guidance — the primary endpoint of MediFirst.
 *
 * Pipeline:
 *   1. Validate query (5–500 chars)
 *   2. Start response timer
 *   3. classifyUrgency() → urgency object
 *   4. [parallel] retrieve RAG chunks + get nearby hospitals (if lat/lng given)
 *   5. getGuidance() via Gemini 1.5 Flash
 *   6. getExtraGuidance() for mistakes & watchFor arrays (ICEMPS 2024 layer)
 *   7. Persist to QueryLog
 *   8. Return structured JSON response
 *
 * Reference: QuickAid (ICCCT 2025) — parallel RAG + location fetch reduces
 * perceived latency by up to 40% vs sequential calls.
 */

const { v4: uuidv4 }           = require('uuid');
const { classifyUrgency }      = require('../services/urgencyEngine');
const { retrieve }             = require('../services/ragService');
const { getGuidance, getExtraGuidance } = require('../services/geminiService');
const { getNearbyHospitals }   = require('../services/geoService');
const { triggerAmbulanceProtocol } = require('../services/automationService');
const QueryLog                 = require('../models/QueryLog');

// ─────────────────────────────────────────────
// Exported: handleGuidance
// ─────────────────────────────────────────────

/**
 * POST /api/guidance
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function handleGuidance(req, res, next) {
  console.log('[guidanceController] handleGuidance called');

  const startTime = Date.now();

  // Per-stage wall-clock timings, logged with every request and returned in
  // the response so the frontend/monitoring can see where latency lives.
  const timings = { classify: 0, rag: 0, geo: 0, gemini: 0, extraGuidance: 0, db: 0 };

  try {
    const { query, lat, lng, sessionId } = req.body;

    // ── 1. Validate ──────────────────────────
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'query is required and must be a string.' });
    }
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 5) {
      return res.status(400).json({ success: false, error: 'query must be at least 5 characters.' });
    }
    if (trimmedQuery.length > 500) {
      return res.status(400).json({ success: false, error: 'query must not exceed 500 characters.' });
    }

    const hasLocation = typeof lat === 'number' && typeof lng === 'number';
    const resolvedSessionId = sessionId || uuidv4();

    // ── 2. Urgency Classification ────────────
    let tStage = Date.now();
    const urgency = classifyUrgency(trimmedQuery);
    timings.classify = Date.now() - tStage;
    console.log('[guidanceController] Urgency:', urgency.level, '|', urgency.emergencyType);

    // ── 3. Parallel: RAG retrieval + Hospital lookup ──
    const tRag = Date.now();
    const ragTask = retrieve(trimmedQuery, 3).then((r) => {
      timings.rag = Date.now() - tRag;
      return r;
    });
    const tGeo = Date.now();
    // Specialty routing: the classified emergencyType decides which nearby
    // hospitals rank first (see services/specialtyRouter.js).
    const geoTask = (hasLocation ? getNearbyHospitals(lat, lng, 5000, urgency.emergencyType) : Promise.resolve([])).then((r) => {
      timings.geo = Date.now() - tGeo;
      return r;
    });

    const [ragChunks, nearbyHospitals] = await Promise.all([ragTask, geoTask]);
    console.log(`[guidanceController] RAG chunks: ${ragChunks.length} | Hospitals: ${nearbyHospitals.length}`);

    // ── 4. Primary Gemini Guidance ───────────
    tStage = Date.now();
    const guidance = await getGuidance(trimmedQuery, urgency, ragChunks);
    timings.gemini = Date.now() - tStage;

    // ── 4a. Ambulance Protocol (fire-and-forget) ──
    // Triggered when Gemini classifies the situation as requiring ambulance dispatch.
    // We do NOT await so the HTTP response is never delayed by the telephony logic.
    let ambulanceTriggered = false;
    if (guidance.callAmbulance === true) {
      ambulanceTriggered = true;
      console.warn('[guidanceController] 🚨 callAmbulance=true — triggering ambulance protocol (fire-and-forget)');
      triggerAmbulanceProtocol(
        trimmedQuery,
        urgency,
        hasLocation ? { lat, lng } : { lat: null, lng: null },
        resolvedSessionId
      ).catch((err) => {
        console.error('[guidanceController] triggerAmbulanceProtocol async error:', err.message);
      });
    }

    // ── 5. Extra Guidance (ICEMPS 2024 layer) ──
    // REMOVED FROM THE CRITICAL PATH: the second sequential LLM call added
    // ~3 s to every response. Clients fetch it lazily from POST
    // /api/guidance/extra when the UI actually renders mistakes/watchFor.
    const extra = { mistakes: [], watchFor: [], source: 'deferred' };

    // ── 6. Response Timing ───────────────────
    const responseTimeMs = Date.now() - startTime;
    console.log(`[guidanceController] timings(ms) ${JSON.stringify(timings)}`);

    // ── 7. Persist to MongoDB ────────────────
    // Fire-and-forget: the doc's _id exists synchronously, so feedback can
    // reference it, but the HTTP response never waits on the DB write.
    let queryLogId = null;
    try {

      const logEntry = new QueryLog({
        sessionId:        resolvedSessionId,
        query:            trimmedQuery,
        emergencyType:    urgency.emergencyType,
        urgencyLevel:     urgency.level,
        responseSteps:    guidance.steps,
        doNotDo:          guidance.doNotDo,
        mistakes:         extra.mistakes,
        watchFor:         extra.watchFor,
        ragChunksUsed:    ragChunks.map((c) => c.id || c._id || 'unknown'),
        geminiTokensUsed: guidance.tokensUsed || 0,
        location:         hasLocation ? { lat, lng } : { lat: null, lng: null },
        userAgent:        req.headers['user-agent'] || null,
        responseTimeMs,
        callAmbulance:    guidance.callAmbulance,
      });
      queryLogId = logEntry._id;
      logEntry.save()
        .then(() => console.log('[guidanceController] QueryLog saved (async):', logEntry._id))
        .catch((dbErr) => console.error('[guidanceController] Failed to save QueryLog:', dbErr.message));
    } catch (dbErr) {
      // Non-fatal: log DB error but still return response
      console.error('[guidanceController] Failed to build QueryLog:', dbErr.message);
    }

    // ── 8. Return response ───────────────────
    if (guidance.source !== 'gemini') {
      console.warn(`[guidanceController] ⚠ Guidance served from ${guidance.source} fallback — check GEMINI_API_KEY / model availability`);
    }
    console.log(`[guidanceController] handleGuidance complete in ${responseTimeMs}ms`);

    return res.status(200).json({
      success:               true,
      query:                 trimmedQuery,
      urgency: {
        level:               urgency.level,
        emergencyType:       urgency.emergencyType,
        callAmbulance:       guidance.callAmbulance,
        matchedKeywords:     urgency.matchedKeywords,
      },
      steps:                 guidance.steps,
      // 'gemini' | 'gemini_unstructured' | 'static-fallback' | 'fallback'
      guidanceSource:        guidance.source,
      doNotDo:               guidance.doNotDo,
      estimatedResponseTime: guidance.estimatedResponseTime,
      mistakes:              extra.mistakes,
      watchFor:              extra.watchFor,
      nearbyHospitals:       nearbyHospitals,
      // 'places' | 'mongo' | 'demo' | 'none' — tells the client whether these
      // are real facilities or synthetic placeholders
      hospitalDataSource:    nearbyHospitals[0]?.source || 'none',
      ragSources:            ragChunks.map((c) => ({ id: c.id, source: c.source, emergencyType: c.emergencyType })),
      responseTimeMs,
      timings,
      sessionId:             resolvedSessionId,
      // Needed by clients to rate this answer via POST /api/feedback
      queryLogId:            queryLogId,
      feedbackAvailable:     queryLogId !== null,
      // Make AI degradation visible instead of serving canned text silently:
      // guidanceSource 'gemini' = real LLM guidance, otherwise curated fallback text
      aiSource:              guidance.source,
      aiModel:               guidance.aiModel,
      ragChunksUsed:         ragChunks.length,
      geminiTokensUsed:      guidance.tokensUsed,
      degraded:              guidance.source !== 'gemini' || extra.source === 'fallback',
      ambulanceTriggered:    ambulanceTriggered,
    });
  } catch (err) {
    console.error('[guidanceController] Unhandled error:', err);
    next(err);
  }
}

/**
 * POST /api/guidance/extra
 *
 * Lazily fetches the ICEMPS 2024 "mistakes / watchFor" layer that was removed
 * from the primary response path (it cost a second sequential LLM call of
 * ~3 s per query). The client sends back the query and the steps it already
 * received; this endpoint runs the extra Gemini call and answers when ready.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function handleGuidanceExtra(req, res, next) {
  try {
    const { query, steps, urgencyLevel, emergencyType } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'query is required and must be a string.' });
    }
    const stepList = Array.isArray(steps) ? steps.filter((s) => typeof s === 'string') : [];

    // Reuse the caller's classification when provided; otherwise classify here.
    const level = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(urgencyLevel)
      ? urgencyLevel
      : classifyUrgency(query).level;
    const type = typeof emergencyType === 'string' && emergencyType
      ? emergencyType
      : classifyUrgency(query).emergencyType;

    const extra = await getExtraGuidance(query, stepList, level, type);
    return res.status(200).json({
      success:  true,
      mistakes: extra.mistakes,
      watchFor: extra.watchFor,
      source:   extra.source,
    });
  } catch (err) {
    console.error('[guidanceController] handleGuidanceExtra error:', err);
    next(err);
  }
}

module.exports = { handleGuidance, handleGuidanceExtra };
