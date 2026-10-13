const fs = require('fs');
const path = require('path');
const Hospital = require('../models/Hospital');
const { rankHospitals, FALLBACK_TAGS } = require('../utils/rankHospitals');

let specialtyMap = {};
try { specialtyMap = require('../data/specialtyMap.json'); } catch { /* fallback tags are used */ }

function loadFallbackHospitals() {
  try {
    const csvPath = path.join(__dirname, '..', 'data', 'hospitals.csv');
    if (!fs.existsSync(csvPath)) return [];
    const text = fs.readFileSync(csvPath, 'utf8');
    const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
    if (lines.length <= 1) return [];

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (inQuotes) {
          if (ch === '"' && line[j + 1] === '"') { current += '"'; j++; }
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

      const [name, address, phone, latStr, lngStr, emergencyAvailStr, city, specialtiesRaw] = fields;
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const specialties = (specialtiesRaw || '').split(';').map((s) => s.trim().toLowerCase()).filter(Boolean);
      rows.push({
        _id: `fallback-${i}`,
        name,
        address,
        phone: phone || '',
        lat,
        lng,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        emergencyAvailable: String(emergencyAvailStr).toUpperCase() === 'TRUE',
        specialties,
        city,
      });
    }
    return rows;
  } catch (err) {
    console.error('[emergencyController] Could not read fallback hospitals CSV:', err.message);
    return [];
  }
}

const fallbackHospitalsCache = loadFallbackHospitals();

exports.assess = async (req, res) => {
  try {
    const { type, lat, lng } = req.body || {};
    if (typeof type !== 'string' || !type) return res.status(400).json({ error: 'type is required' });

    const tags = specialtyMap[type] || FALLBACK_TAGS[type];
    if (!tags) return res.status(400).json({ error: `unknown emergency type: ${type}` });

    const origin = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

    let hospitals = [];
    try {
      hospitals = await Hospital.find({}).maxTimeMS(2500).lean();
    } catch (dbErr) {
      console.warn('[emergencyController] MongoDB query failed, falling back to local dataset:', dbErr.message);
    }

    if (!Array.isArray(hospitals) || hospitals.length === 0) {
      hospitals = fallbackHospitalsCache;
    }

    const ranked = rankHospitals(hospitals, { requiredTags: tags, origin });
    res.json({ type, requiredTags: tags, hospitals: ranked });
  } catch (err) {
    console.error('assess failed', err);
    try {
      const tags = specialtyMap[req?.body?.type] || FALLBACK_TAGS[req?.body?.type] || [];
      const origin = Number.isFinite(req?.body?.lat) && Number.isFinite(req?.body?.lng)
        ? { lat: req.body.lat, lng: req.body.lng }
        : null;
      const ranked = rankHospitals(fallbackHospitalsCache, { requiredTags: tags, origin });
      return res.json({ type: req?.body?.type || 'general', requiredTags: tags, hospitals: ranked });
    } catch {
      res.status(500).json({ error: 'could not rank hospitals' });
    }
  }
};

/**
 * alertRelative — Constructs live emergency telemetry & location sharing payload
 * for a designated relative via WhatsApp and SMS deep-links.
 */
exports.alertRelative = async (req, res) => {
  try {
    const {
      relativePhone,
      relativeName,
      patientName,
      patientAge,
      bloodGroup,
      emergencyType,
      urgency,
      flags,
      lat,
      lng,
      locationLabel,
      hospitalName,
      hospitalPhone,
      firstAidStep,
      customMessage,
    } = req.body || {};

    if (!relativePhone || typeof relativePhone !== 'string' || !relativePhone.trim()) {
      return res.status(400).json({ error: 'relativePhone is required to dispatch location and emergency notice' });
    }

    const rawPhone = String(relativePhone).trim();
    // Clean phone number: keep only numbers and plus
    let cleanPhone = rawPhone.replace(/[^\d+]/g, '');
    let digitsOnly = cleanPhone.replace(/\D/g, '');

    // Format for WhatsApp: if standard 10 digit Indian number without country code, prefix 91
    if (digitsOnly.length === 10) {
      digitsOnly = `91${digitsOnly}`;
    }

    // Google Maps and OpenStreetMap URLs for real-time live location
    const hasCoords = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    const mapsUrl = hasCoords ? `https://maps.google.com/?q=${lat},${lng}` : null;
    const locationDisplay = mapsUrl
      ? `${mapsUrl}${locationLabel ? ` (${locationLabel})` : ''}`
      : (locationLabel || 'Incident Scene (Location pending)');

    // Build emergency text optimized for WhatsApp and Messages
    const emergencyText = customMessage || [
      `🚨 *MEDIFIRST EMERGENCY FIRST-AID ALERT* 🚨`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Patient*: ${patientName || 'Emergency Patient'}${patientAge ? ` (${patientAge} yrs)` : ''}`,
      bloodGroup ? `🩸 *Blood Group*: ${bloodGroup}` : null,
      `⚠️ *Condition*: ${emergencyType || 'Acute Emergency'}`,
      urgency ? `⚡ *Acuity Tier*: ${urgency}` : null,
      flags?.length ? `🚩 *Observed Symptoms*: ${flags.join(', ')}` : null,
      `📍 *Live Incident Location*:`,
      `${locationDisplay}`,
      hospitalName ? `🏥 *Heading to Hospital*: ${hospitalName}${hospitalPhone ? ` (Casualty: ${hospitalPhone})` : ''}` : null,
      firstAidStep ? `🩹 *Active First-Aid*: ${firstAidStep}` : null,
      `━━━━━━━━━━━━━━━━━━━━`,
      `⏱️ *STATUS*: Immediate first aid is actively being administered. Emergency ambulance dispatched/alerted.`,
    ].filter(Boolean).join('\n');

    // WhatsApp Click-to-Chat URL
    const whatsappUrl = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(emergencyText)}`;

    // SMS URL (RFC 5724 format, compatible with Android and iOS)
    const smsUrl = `sms:${cleanPhone}${cleanPhone ? '?' : ''}body=${encodeURIComponent(emergencyText)}`;

    // Save alert in MongoDB or fallback gracefully
    let alertRecord = null;
    try {
      const RelativeAlert = require('../models/RelativeAlert');
      alertRecord = await RelativeAlert.create({
        patientName: patientName || 'Unknown Patient',
        relativeName: relativeName || 'Relative',
        relativePhone: cleanPhone,
        emergencyType: emergencyType || 'general',
        urgencyLevel: urgency || 'CRITICAL',
        location: {
          lat: hasCoords ? Number(lat) : null,
          lng: hasCoords ? Number(lng) : null,
          label: locationLabel || null,
          mapsUrl,
        },
        hospital: {
          name: hospitalName || null,
          phone: hospitalPhone || null,
        },
        summaryText: emergencyText,
        channel: 'both',
        status: 'notified',
      });
    } catch (dbErr) {
      console.warn('[emergencyController] Mongo save failed for RelativeAlert, proceeding in-memory:', dbErr.message);
    }

    return res.json({
      success: true,
      message: 'Emergency alert packet prepared for relative',
      alertId: alertRecord?._id || `rel-${Date.now()}`,
      relativePhone: cleanPhone,
      relativePhoneFormatted: digitsOnly,
      whatsappUrl,
      smsUrl,
      mapsUrl,
      locationDisplay,
      emergencyText,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[emergencyController] alertRelative error:', err);
    return res.status(500).json({ error: 'Failed to process relative alert' });
  }
};

