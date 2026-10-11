/**
 * tests/urgency.test.cjs — Urgency classifier regression test
 *
 * Run with: npm test   (from the backend folder)
 *
 * Guards the keyword tiers in services/urgencyEngine.js. These cases encode
 * mistakes that were actually shipped once: a swallowed battery classified as
 * LOW, and "collapsed / not breathing" losing its cardiac_arrest protocol.
 */
const { classifyUrgency } = require('../services/urgencyEngine');

const CASES = [
  { query: 'My child swallowed a battery',                    level: 'HIGH',     emergencyType: 'poisoning' },
  { query: 'Drank some cleaning bleach by accident',          level: 'HIGH',     emergencyType: 'poisoning' },
  { query: 'Adult collapsed and is not breathing normally',   level: 'CRITICAL', emergencyType: 'cardiac_arrest' },
  { query: 'Adult is choking on food and cannot speak',       level: 'CRITICAL', emergencyType: 'choking' },
  { query: 'Deep cut on the forearm with heavy bleeding',     level: 'CRITICAL', emergencyType: 'bleeding' },
  { query: 'Man complaining of chest pain and sweating',      level: 'HIGH',     emergencyType: 'cardiac_arrest' },
  { query: 'Person had a seizure that stopped a minute ago',  level: 'HIGH',     emergencyType: 'seizure' },
  { query: 'Child touched hot stove and has a burn on hand',  level: 'MODERATE', emergencyType: 'burn' },
  { query: 'I twisted my ankle and there is swelling',        level: 'MODERATE', emergencyType: 'general' },
  { query: 'Mild headache since morning',                     level: 'LOW',      emergencyType: 'general' },
];

// Anything flagged CRITICAL/HIGH must always tell the caller to call an ambulance
const MUST_CALL_AMBULANCE = ['CRITICAL', 'HIGH'];

let failures = 0;

for (const { query, level, emergencyType } of CASES) {
  const got = classifyUrgency(query);
  const problems = [];
  if (got.level !== level) problems.push(`level ${got.level} != ${level}`);
  if (got.emergencyType !== emergencyType) problems.push(`type ${got.emergencyType} != ${emergencyType}`);
  if (MUST_CALL_AMBULANCE.includes(got.level) && got.callAmbulance !== true) {
    problems.push(`${got.level} did not set callAmbulance`);
  }

  if (problems.length) {
    failures++;
    console.log(`FAIL  "${query}" -> ${problems.join(', ')}`);
  } else {
    console.log(`pass  "${query}" -> ${got.level}/${got.emergencyType}`);
  }
}

console.log('');
console.log(`${CASES.length - failures}/${CASES.length} cases passed`);
process.exit(failures ? 1 : 0);
