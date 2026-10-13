/**
 * adapter.js — maps the backend /api/guidance contract onto the shape the
 * frontend UI (validateResponse in claude.js, Result.jsx, StepCard.jsx) expects.
 *
 * Pure function: no network, no env reads — easy to unit test.
 *
 * Urgency mapping table (backend urgency.level → frontend data.urgency):
 *   CRITICAL → 'emergency'       (call 112/108 now)
 *   HIGH     → 'urgent'          (professional care within hours; callAmbulance
 *                                 is carried separately so the UI can still
 *                                 escalate — e.g. a seizure is HIGH + callAmbulance)
 *   MODERATE → 'non_emergency'   (manageable at home with follow-up)
 *   LOW      → 'uncertain'       (no keywords matched — err on the side of caution)
 */

const URGENCY_MAP = {
  CRITICAL: 'emergency',
  HIGH: 'urgent',
  MODERATE: 'non_emergency',
  LOW: 'uncertain',
};

// Keys on stepsDetailed[i] that the rich step renderer consumes.
const DETAIL_KEYS = ['imageUrl', 'caption', 'alt', 'metronomeBpm'];

function titleize(emergencyType) {
  return emergencyType
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * @param {object} backendJson — raw JSON body from POST /api/guidance
 * @returns {object} frontend-shaped guidance object
 */
export function adaptGuidanceResponse(backendJson) {
  const src = backendJson && typeof backendJson === 'object' ? backendJson : {};

  // ── Urgency ────────────────────────────────────────────────
  const rawLevel = (src.urgency && typeof src.urgency === 'object')
    ? src.urgency.level
    : (typeof src.urgency === 'string' ? src.urgency : null);
  const level = String(rawLevel || '').toUpperCase();
  const urgency = URGENCY_MAP[level] || 'uncertain';
  const callAmbulance = (src.urgency && typeof src.urgency === 'object')
    ? src.urgency.callAmbulance === true
    : src.callAmbulance === true;

  // ── Steps: backend string[] → frontend step objects ────────
  const rawSteps = Array.isArray(src.steps) ? src.steps : [];
  const detailed = Array.isArray(src.stepsDetailed) ? src.stepsDetailed : [];
  const steps = rawSteps.map((s, i) => {
    const text = typeof s === 'string' ? s : (s && (s.text || s.instruction)) || '';
    const step = {
      order: i + 1,
      text,
      title: (detailed[i] && detailed[i].title) || null,
      instruction: text,
      warning: (detailed[i] && detailed[i].warning) || null,
    };
    // Pass through renderer details (image / caption / alt / CPR metronome)
    for (const key of DETAIL_KEYS) {
      const perStep = detailed[i] && detailed[i][key];
      if (perStep !== undefined) step[key] = perStep;
      else if (Array.isArray(src[key]) && src[key][i] !== undefined) step[key] = src[key][i];
    }
    return step;
  });

  // ── Category / summary ─────────────────────────────────────
  const emergencyType = (src.urgency && src.urgency.emergencyType) || src.emergencyType;
  const category = typeof src.category === 'string' && src.category
    ? src.category
    : (emergencyType ? titleize(emergencyType) : 'General Emergency');
  const summary = typeof src.summary === 'string' && src.summary
    ? src.summary
    : (steps[0] ? steps[0].text : '');

  // ── Pass-through fields (unchanged) ────────────────────────
  const doNotDo = Array.isArray(src.doNotDo) ? src.doNotDo : [];
  const adapted = {
    category,
    urgency,
    confidence: typeof src.confidence === 'number' ? src.confidence : 0.7,
    emergencyEscalationRequired: callAmbulance,
    callAmbulance,
    summary,
    immediateActions: Array.isArray(src.immediateActions) ? src.immediateActions : [],
    steps,
    actionsToAvoid: doNotDo,
    professionalHelp: src.professionalHelp
      || (callAmbulance
        ? 'Call emergency services (112 / 108) now and keep following these steps until help arrives.'
        : 'Seek professional medical assessment for this injury, even if the person seems fine.'),
    sourceReferences: Array.isArray(src.sourceReferences) ? src.sourceReferences : [],

    // Backend fields carried through verbatim
    doNotDo,
    nearbyHospitals: src.nearbyHospitals,
    hospitalDataSource: src.hospitalDataSource,
    spokenScript: src.spokenScript,
    guidanceSource: src.guidanceSource || src.aiSource,
    timings: src.timings !== undefined ? src.timings : src.responseTimeMs,
    estimatedResponseTime: src.estimatedResponseTime,
    mistakes: src.mistakes,
    watchFor: src.watchFor,
    urgencyLevelRaw: level || null,
    emergencyType: emergencyType || 'general',
    matchedKeywords: (src.urgency && src.urgency.matchedKeywords) || [],
    sessionId: src.sessionId,
    queryLogId: src.queryLogId,
    feedbackAvailable: src.feedbackAvailable,
    aiSource: src.aiSource,
    aiModel: src.aiModel,
    degraded: src.degraded,
  };

  // A safety-fallback response (success:false) that still carries steps must
  // reach the screen — adapt it anyway and surface the error as a flag.
  if (src.success === false) {
    adapted._error = src.error || 'The guidance service returned an error; showing fallback steps.';
    if (steps.length === 0) adapted._isFallback = true;
  }

  return adapted;
}

export default adaptGuidanceResponse;
