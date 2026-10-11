/**
 * services/urgencyEngine.js — Keyword-based Emergency Urgency Classifier
 *
 * Provides two exported functions:
 *   • classifyUrgency(query)    → { level, matchedKeywords, emergencyType, callAmbulance }
 *   • detectEmergencyType(query) → string (type slug)
 *
 * Classification is purely keyword-driven for speed (<1 ms) and is used as
 * the first gate before the Gemini LLM call. The Gemini call can override
 * or refine the type, but urgency level is always validated here first.
 *
 * Reference: Context-Aware Emergency Chatbot (ICEMPS 2024) — keyword
 * pre-classification stage before RNN personalisation.
 */

// ─────────────────────────────────────────────
// Keyword Dictionaries
// ─────────────────────────────────────────────

const URGENCY_KEYWORDS = {
  CRITICAL: [
    'not breathing',
    'no breathing',
    'stopped breathing',
    'cardiac arrest',
    'heart stopped',
    'no pulse',
    'unconscious',
    'unresponsive',
    'choking',
    'severe bleeding',
    'heavy bleeding',
    'profuse bleeding',
    'stroke',
    'anaphylaxis',
    'anaphylactic',
    'severe allergic',
    'drowning',
    'not responding',
    'collapsed',
    'blue lips',
    'cyanosis',
  ],

  HIGH: [
    'seizure',
    'convulsion',
    'fitting',
    'chest pain',
    'heart attack',
    'broken bone',
    'fracture',
    'deep cut',
    'deep wound',
    'head injury',
    'head trauma',
    'poisoning',
    'overdose',
    'electric shock',
    'electrocution',
    'difficulty breathing',
    'trouble breathing',
    'shortness of breath',
    'concussion',
    'spinal injury',
    'severe burn',
    // Ingestion hazards previously fell through to LOW — a swallowed battery or
    // poison is an immediate-ER emergency, never a low-urgency event
    'poison',
    'swallowed',
    'swallowing',
    'ingested',
    'button battery',
    'battery',
    'bleach',
    'chemical',
    'toxic',
    'drugs',
    'tablets taken',
  ],

  MODERATE: [
    'burn',
    'sprain',
    'nausea',
    'dizzy',
    'dizziness',
    'fever',
    'high temperature',
    'allergic reaction',
    'minor cut',
    'small cut',
    'bruise',
    'vomiting',
    'fainted',
    'fainting',
    'mild pain',
    'rash',
    'swelling',
    'minor burn',
    'twisted ankle',
  ],
};

// Emergency type → associated keywords
const EMERGENCY_TYPE_MAP = [
  // 'collapsed' / 'not breathing' are CRITICAL triggers that previously fell
  // through to type 'general', losing the cardiac-arrest (CPR) protocol.
  { type: 'cardiac_arrest',    keywords: ['cardiac arrest', 'heart stopped', 'no pulse', 'heart attack', 'cpr', 'defibrillator', 'not breathing', 'no breathing', 'stopped breathing', 'collapsed', 'unresponsive', 'unconscious and', 'chest pain', 'chest pressure', 'sweating and nauseated'] },
  { type: 'seizure',           keywords: ['seizure', 'convulsion', 'fitting', 'epilepsy', 'shaking uncontrollably'] },
  { type: 'burn',              keywords: ['burn', 'burned', 'burning', 'fire', 'scald', 'hot water', 'chemical burn'] },
  { type: 'fracture',          keywords: ['fracture', 'broken bone', 'broken arm', 'broken leg', 'broken wrist', 'snap', 'cracked bone'] },
  { type: 'choking',           keywords: ['chok', 'heimlich', 'object in throat', 'can\'t breathe', 'cannot breathe', 'can not breathe', 'airway blocked', 'food stuck'] },
  { type: 'poisoning',         keywords: ['poisoning', 'poison', 'overdose', 'swallowed', 'toxic', 'ingested', 'drug overdose', 'chemical ingestion', 'chemical', 'bleach', 'detergent', 'cleaning product', 'button battery', 'battery'] },
  { type: 'drowning',          keywords: ['drowning', 'drowned', 'underwater', 'submerged', 'waterlogged'] },
  { type: 'bleeding',          keywords: ['bleeding', 'blood', 'cut', 'wound', 'laceration', 'gash', 'hemorrhage'] },
  { type: 'allergic_reaction', keywords: ['allerg', 'anaphylax', 'hives', 'swollen throat', 'bee sting', 'insect bite', 'epipen'] },
  { type: 'stroke',            keywords: ['stroke', 'facial droop', 'arm weakness', 'slurred speech', 'sudden numbness', 'face drooping', 'fast test'] },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Returns all keywords from a list that appear in the normalised query string.
 * @param {string} query   — lowercased query text
 * @param {string[]} list  — keyword list to scan
 * @returns {string[]}
 */
function findMatches(query, list) {
  return list.filter((kw) => query.includes(kw));
}

// ─────────────────────────────────────────────
// Exported: detectEmergencyType
// ─────────────────────────────────────────────

/**
 * Maps query text to the closest emergency type slug.
 * Returns 'general' if no specific type is detected.
 *
 * @param {string} query
 * @returns {string}
 */
function detectEmergencyType(query) {
  console.log('[urgencyEngine] detectEmergencyType called');
  const normalised = query.toLowerCase();

  for (const { type, keywords } of EMERGENCY_TYPE_MAP) {
    const hit = keywords.some((kw) => normalised.includes(kw));
    if (hit) {
      console.log(`[urgencyEngine] Emergency type detected: ${type}`);
      return type;
    }
  }

  console.log('[urgencyEngine] Emergency type: general (no specific match)');
  return 'general';
}

// ─────────────────────────────────────────────
// Exported: classifyUrgency
// ─────────────────────────────────────────────

/**
 * Classifies the urgency level of an emergency query using keyword matching.
 *
 * @param {string} query — Raw user emergency description
 * @returns {{
 *   level: 'CRITICAL'|'HIGH'|'MODERATE'|'LOW',
 *   matchedKeywords: string[],
 *   emergencyType: string,
 *   callAmbulance: boolean
 * }}
 */
function classifyUrgency(query) {
  console.log('[urgencyEngine] classifyUrgency called with query length:', query.length);

  if (!query || typeof query !== 'string') {
    // Non-text input cannot be classified; the controller rejects it with 400
    // before this matters, so stay neutral and let validation handle it.
    console.warn('[urgencyEngine] Invalid query received, defaulting to LOW');
    return { level: 'LOW', matchedKeywords: [], emergencyType: 'general', callAmbulance: false };
  }

  const normalised = query.toLowerCase();

  // Check levels in descending priority order
  const criticalMatches  = findMatches(normalised, URGENCY_KEYWORDS.CRITICAL);
  if (criticalMatches.length > 0) {
    const emergencyType = detectEmergencyType(query);
    const result = {
      level:           'CRITICAL',
      matchedKeywords: criticalMatches,
      emergencyType,
      callAmbulance:   true,
    };
    console.log('[urgencyEngine] Classified as CRITICAL:', result);
    return result;
  }

  const highMatches = findMatches(normalised, URGENCY_KEYWORDS.HIGH);
  if (highMatches.length > 0) {
    const emergencyType = detectEmergencyType(query);
    const result = {
      level:           'HIGH',
      matchedKeywords: highMatches,
      emergencyType,
      callAmbulance:   true,
    };
    console.log('[urgencyEngine] Classified as HIGH:', result);
    return result;
  }

  const moderateMatches = findMatches(normalised, URGENCY_KEYWORDS.MODERATE);
  if (moderateMatches.length > 0) {
    const emergencyType = detectEmergencyType(query);
    const result = {
      level:           'MODERATE',
      matchedKeywords: moderateMatches,
      emergencyType,
      callAmbulance:   false,
    };
    console.log('[urgencyEngine] Classified as MODERATE:', result);
    return result;
  }

  // Default: LOW
  const emergencyType = detectEmergencyType(query);
  const result = {
    level:           'LOW',
    matchedKeywords: [],
    emergencyType,
    callAmbulance:   false,
  };
  console.log('[urgencyEngine] Classified as LOW');
  return result;
}

module.exports = { classifyUrgency, detectEmergencyType };
