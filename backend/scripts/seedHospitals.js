 /**
 * scripts/seedHospitals.js — seed/refresh the hospitals collection from CSV
 *
 * Reads backend/data/hospitals.csv with columns:
 *   name,address,phone,lat,lng,emergencyAvailable,city,specialties,source,notes
 * (`specialties` is semicolon-separated, `source`/`notes` are free text; the
 * three optional columns may be absent in older CSV files.)
 * and UPSERTS each row into the `hospitals` collection (matched on name+city),
 * converting lat/lng into the GeoJSON Point that the 2dsphere index needs.
 *
 * Usage (from the repo root, with the root .env in place):
 *   node backend/scripts/seedHospitals.js
 *
 * The CSV ships with a single clearly fake "DEMO HOSPITAL (replace)" row;
 * real rows must be added by a human. Never invent hospital names, phone
 * numbers or locations — this script only mirrors what the CSV contains.
 */

const path    = require('path');
const fs      = require('fs');
const mongoose = require('mongoose');

// Same single source of truth as server.js: the repo-root .env
const rootEnv = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

const Hospital = require('../models/Hospital');
const { ALLOWED_TAGS } = require('../services/specialtyRouter');

// SEED_CSV_PATH lets tests/checks point at a scratch CSV without touching data/
const CSV_PATH = process.env.SEED_CSV_PATH
  ? path.resolve(process.env.SEED_CSV_PATH)
  : path.join(__dirname, '..', 'data', 'hospitals.csv');
// name/address/phone/lat/lng/emergencyavailable/city are mandatory; the last
// three may be missing from older CSV files (they are then stored as defaults).
// All lowercase — the parsed header is normalised with toLowerCase().
const REQUIRED_HEADER = ['name', 'address', 'phone', 'lat', 'lng', 'emergencyavailable', 'city'];
const OPTIONAL_HEADER = ['specialties', 'source', 'notes'];

/**
 * Parse one CSV line with minimal double-quote support ("a,b" stays one field).
 * @param {string} line
 * @returns {string[]}
 */
function splitCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '' && !l.trim().startsWith('#'));
  if (lines.length === 0) throw new Error('CSV is empty — nothing to seed.');

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {};
  header.forEach((h, i) => { idx[h] = i; });

  const missing = REQUIRED_HEADER.filter((h) => !(h in idx));
  if (missing.length > 0) {
    throw new Error(
      `CSV header mismatch — missing column(s): ${missing.join(', ')}\n  found: ${header.join(',')}`
    );
  }
  const absentOptional = OPTIONAL_HEADER.filter((h) => !(h in idx));
  if (absentOptional.length > 0) {
    console.warn(`[seed] CSV has no ${absentOptional.join(', ')} column(s) — using defaults`);
  }

  // Cell accessor: '' for absent optional columns and for short rows.
  const cell = (fields, name) => {
    const i = idx[name];
    return i !== undefined && i < fields.length ? fields[i] : '';
  };

  /**
   * "Trauma; burns " → ['trauma', 'burns'], warning about unknown tags.
   * @param {string} raw  @param {string} hospitalName
   */
  const parseSpecialties = (raw, hospitalName) => {
    const tags = raw.split(';').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const known = [];
    for (const tag of tags) {
      if (ALLOWED_TAGS.includes(tag)) known.push(tag);
      else console.warn(`[seed] ${hospitalName}: unknown specialty tag "${tag}" — dropped (allowed: ${ALLOWED_TAGS.join(', ')})`);
    }
    return known;
  };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]);
    if (f.length < REQUIRED_HEADER.length) {
      console.warn(`[seed] Skipping line ${i + 1}: expected at least ${REQUIRED_HEADER.length} columns, got ${f.length}`);
      continue;
    }
    const hospitalName = f[idx.name] || `(unnamed, line ${i + 1})`;
    const rawLat = cell(f, 'lat');
    const rawLng = cell(f, 'lng');
    if (rawLat === '' || rawLng === '') {
      console.warn(`[seed] Skipping "${hospitalName}": empty lat/lng`);
      continue;
    }
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn(`[seed] Skipping "${hospitalName}": invalid lat/lng "${rawLat}" / "${rawLng}"`);
      continue;
    }
    rows.push({
      name: f[idx.name],
      address: f[idx.address] || null,
      phone: f[idx.phone] || null,
      location: { type: 'Point', coordinates: [lng, lat] },
      emergencyAvailable: ['true', '1', 'yes', 'y'].includes(f[idx.emergencyavailable].toLowerCase()),
      city: f[idx.city] || null,
      specialties: parseSpecialties(cell(f, 'specialties'), hospitalName),
      source: cell(f, 'source') || null,
      notes: cell(f, 'notes') || null,
      updatedAt: new Date(),
    });
  }
  if (rows.length === 0) throw new Error('CSV contained no valid data rows.');
  return rows;
}

async function connect() {
  const uris = [
    process.env.MONGODB_URI,
    process.env.MONGODB_URI_SRV,
    process.env.MONGODB_URI_LOCAL,
  ].filter(Boolean);
  let lastErr = null;
  for (const uri of uris) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      return;
    } catch (err) {
      if (err.message && (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED'))) {
        try {
          const dns = require('dns');
          dns.setServers(['8.8.8.8', '1.1.1.1']);
          await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
          return;
        } catch (retryErr) {
          lastErr = retryErr;
        }
      } else {
        lastErr = err;
      }
      console.warn('[seed] Connection attempt failed:', err.message.split('\n')[0]);
    }
  }
  throw lastErr || new Error('No MONGODB_URI* variable is set in the root .env');
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`[seed] CSV not found at ${CSV_PATH}`);
    process.exitCode = 1;
    return;
  }
  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  console.log(`[seed] Parsed ${rows.length} row(s) from ${CSV_PATH}`);

  await connect();
  console.log('[seed] MongoDB connected');

  let upserted = 0;
  for (const row of rows) {
    const res = await Hospital.updateOne(
      { name: row.name, city: row.city },          // natural key for the upsert
      { $set: row },
      { upsert: true }
    );
    upserted += res.upsertedCount || res.modifiedCount || 0;
    console.log(`[seed] ${res.upsertedCount ? 'inserted' : 'updated'}: ${row.name} (${row.city || 'no city'})`);
  }

  const total = await Hospital.countDocuments();
  console.log(`[seed] Done. ${upserted} row(s) written, collection now holds ${total} hospitals.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[seed] FAILED:', err.message);
  process.exitCode = 1;
});
