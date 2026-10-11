/**
 * controllers/hospitalController.js — Nearby Hospital Lookup Controller
 *
 * Handles GET /api/hospitals?lat=&lng=&radius=
 *
 * Delegates to geoService.getNearbyHospitals() which tries the Google Maps
 * Places API first and falls back to the MongoDB $near query automatically.
 */

const { getNearbyHospitals, reverseGeocode } = require('../services/geoService');

// ─────────────────────────────────────────────
// Exported: getNearby
// ─────────────────────────────────────────────

/**
 * GET /api/hospitals
 * Query params: lat (required), lng (required), radius (optional, metres)
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getNearby(req, res, next) {
  console.log('[hospitalController] getNearby called | params:', req.query);

  try {
    const { lat, lng, radius } = req.query;

    // ── Validate ──────────────────────────────
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({
        success: false,
        error:   'lat and lng are required numeric query parameters.',
      });
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({
        success: false,
        error:   'lat must be -90 to 90 and lng must be -180 to 180.',
      });
    }

    const parsedRadius = radius ? parseInt(radius, 10) : 5000;
    const safeRadius   = Math.min(Math.max(parsedRadius, 500), 50000); // clamp 500m–50km

    // ── Fetch hospitals + reverse geocode in parallel ──
    const [hospitals, location] = await Promise.all([
      getNearbyHospitals(parsedLat, parsedLng, safeRadius),
      reverseGeocode(parsedLat, parsedLng),
    ]);

    console.log(`[hospitalController] getNearby returning ${hospitals.length} hospitals`);

    return res.status(200).json({
      success:         true,
      location,
      radiusMeters:    safeRadius,
      count:           hospitals.length,
      // Provenance of the returned pins: 'places' = live Google Maps data,
      // 'mongo' = local seeded database, 'demo' = synthetic placeholder pins,
      // 'none' = nothing returned
      dataSource:      hospitals[0]?.source || 'none',
      nearbyHospitals: hospitals,
    });
  } catch (err) {
    console.error('[hospitalController] Unhandled error:', err);
    next(err);
  }
}

module.exports = { getNearby };
