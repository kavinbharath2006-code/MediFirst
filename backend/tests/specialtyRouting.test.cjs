/**
 * tests/specialtyRouting.test.cjs — Specialty hospital ranking regression test
 *
 * Run with: npm test   (from the backend folder)
 *
 * Pure unit test over services/specialtyRouter.js — no DB, no network.
 * Guards the tier rules: matched specialty beats no match when both are
 * emergency-available, and an emergencyAvailable=false hospital may never
 * outrank an available one, no matter how close or well-staffed it is.
 */
const assert = require('assert');
const { rankHospitals, getRequiredTags } = require('../services/specialtyRouter');

// Fixture set around one user location, all distances in metres
const nearGeneral = { name: 'Near General Hospital',  distance: 500,  emergencyAvailable: true,  specialties: ['general_surgery'] };
const farBurns    = { name: 'Regional Burns Centre',    distance: 3200, emergencyAvailable: true,  specialties: ['burns', 'plastic_surgery'] };
const closedBurns = { name: 'Closed Burns Ward',      distance: 100,  emergencyAvailable: false, specialties: ['burns'] };

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('burn: farther hospital WITH burns outranks nearer one without', () => {
  const out = rankHospitals([nearGeneral, farBurns], 'burn');
  assert.strictEqual(out[0].name, 'Regional Burns Centre');
  assert.deepStrictEqual(out[0].matchedSpecialties, ['burns']);
  assert.strictEqual(out[0].matchReason, 'Burns unit');
  // tier (b): available but unmatched → labelled general emergency
  assert.strictEqual(out[1].name, 'Near General Hospital');
  assert.deepStrictEqual(out[1].matchedSpecialties, []);
  assert.strictEqual(out[1].matchReason, 'General emergency');
});

test('emergencyAvailable=false never outranks an available hospital', () => {
  // Closest AND specialty-matched, but not emergency-available → must land
  // behind the unmatched-but-available hospital.
  const out = rankHospitals([closedBurns, nearGeneral, farBurns], 'burn');
  assert.strictEqual(out[0].name, 'Regional Burns Centre');       // tier a
  assert.strictEqual(out[1].name, 'Near General Hospital');       // tier b
  assert.strictEqual(out[2].name, 'Closed Burns Ward');           // tier c, last
  assert.ok(out.findIndex((h) => h.name === 'Closed Burns Ward') >
            out.findIndex((h) => h.name === 'Near General Hospital'));
  assert.strictEqual(out[2].matchReason, 'Specialty unit, emergency availability unconfirmed');
});

test('empty required tags (general): pure distance order, all "General emergency"', () => {
  assert.deepStrictEqual(getRequiredTags('general'), []);
  const out = rankHospitals([farBurns, nearGeneral], 'general');
  assert.strictEqual(out[0].name, 'Near General Hospital');
  assert.strictEqual(out[1].name, 'Regional Burns Centre');
  out.forEach((h) => {
    assert.deepStrictEqual(h.matchedSpecialties, []);
    assert.strictEqual(h.matchReason, 'General emergency');
  });
});

test('unknown emergency type degrades to general, never an error', () => {
  const out = rankHospitals([nearGeneral], 'snake_bite');
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].matchReason, 'General emergency');
});

test('never returns an empty list: no match falls back to nearest available', () => {
  // Only hospitals carry unrelated specialties — tier (a) is empty, but the
  // nearest emergency-available one must still come first, list stays full.
  const eyeClinic = { name: 'Eye Clinic', distance: 800, emergencyAvailable: true, specialties: ['eye'] };
  const out = rankHospitals([eyeClinic, closedBurns], 'burn');
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[0].name, 'Eye Clinic'); // nearest emergency-available
});

test('multiple required matches produce one combined matchReason', () => {
  const traumaIcu = { name: 'Super Specialty Hospital', distance: 4000, emergencyAvailable: true, specialties: ['trauma', 'icu'] };
  const out = rankHospitals([traumaIcu], 'fracture'); // fracture requires [orthopedics, trauma]
  assert.deepStrictEqual(out[0].matchedSpecialties, ['trauma']);
  assert.strictEqual(out[0].matchReason, 'Trauma center');
});

let failures = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`pass  ${name}`);
  } catch (err) {
    failures++;
    console.log(`FAIL  ${name}\n      ${err.message}`);
  }
}

console.log('');
console.log(`${tests.length - failures}/${tests.length} cases passed`);
process.exit(failures ? 1 : 0);
