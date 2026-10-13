/**
 * services/specialtyRouter.js — Specialty-based hospital ranking
 *
 * Pure functions (no DB, no network) that sort a candidate hospital list for
 * a given emergency type, used by geoService.getNearbyHospitals() behind
 * /api/hospitals and the nearbyHospitals field of /api/guidance.
 *
 * Ranking tiers (each tier sorted by distance ascending):
 *   a) emergencyAvailable === true AND the hospital carries at least one of
 *      the REQUIRED tags for the emergency type (data/specialtyMap.json)
 *   b) emergencyAvailable === true without a matching tag — "General emergency"
 *   c) everything else (emergency unavailable / unknown)
 *
 * The tiers partition the input, so a non-empty input always yields a
 * non-empty output — when nothing matches the specialty, the caller still
 * gets the nearest emergency-available hospital first.
 */

const specialtyMap = require('../data/specialtyMap.json');

// Tags the seed script and the map agree on; anything else is a typo.
const ALLOWED_TAGS = [
  'trauma', 'orthopedics', 'neuro', 'burns', 'cardiac', 'toxicology',
  'eye', 'ent', 'obstetrics', 'icu', 'general_surgery', 'plastic_surgery',
];

// Human-readable labels for matchReason, e.g. burns → "Burns unit"
const TAG_LABELS = {
  trauma:           'Trauma center',
  orthopedics:      'Orthopedics',
  neuro:            'Neurology',
  burns:            'Burns unit',
  cardiac:          'Cardiac unit',
  toxicology:       'Toxicology unit',
  eye:              'Eye care',
  ent:              'ENT unit',
  obstetrics:       'Maternity unit',
  icu:              'ICU',
  general_surgery:  'General surgery',
  plastic_surgery:  'Plastic surgery',
};

/**
 * REQUIRED specialty tags for an emergency type; unknown/empty type → []
 * (behaves like 'general': no specialty filtering, pure distance order).
 *
 * @param {string} emergencyType
 * @returns {string[]}
 */
function getRequiredTags(emergencyType) {
  const key = String(emergencyType || '').trim().toLowerCase();
  const tags = specialtyMap[key];
  return Array.isArray(tags) ? tags : [];
}

/** Normalise a hospital's specialties to a lowercase string array. */
function normalizeTags(hospital) {
  return Array.isArray(hospital.specialties)
    ? hospital.specialties.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
    : [];
}

/** Distance sort key: missing/NaN distances go last instead of first. */
function distanceOf(hospital) {
  const d = Number(hospital.distance);
  return Number.isFinite(d) ? d : Number.MAX_SAFE_INTEGER;
}

/**
 * Rank a hospital list for one emergency type and annotate each entry.
 * Does not mutate the input; each output item is a shallow copy plus
 * `matchedSpecialties: string[]` and `matchReason: string`.
 *
 * @param {Array<object>} hospitals — must carry distance (m), emergencyAvailable
 *   (boolean) and specialties (string[]) for meaningful ranking
 * @param {string} emergencyType — slug from urgencyEngine / specialtyMap.json
 * @returns {object[]} ranked list (same length as input)
 */
function rankHospitals(hospitals, emergencyType) {
  if (!Array.isArray(hospitals)) return [];

  const required = getRequiredTags(emergencyType);
  const tierMatched = [];   // a) emergency-available WITH a required specialty
  const tierGeneral = [];   // b) emergency-available, no specialty match
  const tierRest = [];      // c) everything else

  for (const h of hospitals) {
    const matched = required.length
      ? normalizeTags(h).filter((s) => required.includes(s))
      : [];
    const available = h.emergencyAvailable === true;

    const ranked = {
      ...h,
      matchedSpecialties: matched,
      matchReason: available
        ? (matched.length
            ? matched.map((t) => TAG_LABELS[t] || t).join(' · ')
            : 'General emergency')
        : (matched.length
            ? 'Specialty unit, emergency availability unconfirmed'
            : 'Emergency availability unconfirmed'),
    };

    if (available && matched.length > 0) tierMatched.push(ranked);
    else if (available) tierGeneral.push(ranked);
    else tierRest.push(ranked);
  }

  const byDistance = (a, b) => distanceOf(a) - distanceOf(b);
  return [
    ...tierMatched.sort(byDistance),
    ...tierGeneral.sort(byDistance),
    ...tierRest.sort(byDistance),
  ];
}

module.exports = { rankHospitals, getRequiredTags, ALLOWED_TAGS, TAG_LABELS };
