/**
 * services/geoService.js — Geolocation & Hospital Discovery for MediFirst
 *
 * Three main functions:
 *   • getNearbyHospitals(lat, lng, radiusMeters)
 *       → Calls Google Maps Places API (nearbysearch) for live hospital data.
 *         Returns top 5, sorted by distance ascending.
 *
 *   • reverseGeocode(lat, lng)
 *       → Calls Google Maps Geocoding API to resolve coordinates to
 *         a human-readable address and city.
 *
 *   • getNearbyHospitalsMongo(lat, lng)
 *       → MongoDB $near fallback using the 2dsphere index on Hospital.location.
 *         Used when the Maps API key is absent or the API call fails.
 */

const axios   = require('axios');
const Hospital = require('../models/Hospital');

const MAPS_API_KEY   = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_BASE    = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GEOCODE_BASE   = 'https://maps.googleapis.com/maps/api/geocode/json';
const PLACES_TIMEOUT = 5000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Haversine formula: returns distance in metres between two lat/lng points.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} metres
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R    = 6371000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────
// Exported: getNearbyHospitals (Google Maps)
// ─────────────────────────────────────────────

/**
 * Fetches up to 5 nearby hospitals from the Google Maps Places API.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radiusMeters=5000]
 * @returns {Promise<Array<{
 *   name: string, address: string, phone: string|null,
 *   distance: number, lat: number, lng: number, placeId: string
 * }>>}
 */
async function getNearbyHospitals(lat, lng, radiusMeters = 5000) {
  console.log(`[geoService] getNearbyHospitals called | lat=${lat} lng=${lng} radius=${radiusMeters}m`);

  if (!MAPS_API_KEY) {
    console.warn('[geoService] GOOGLE_MAPS_API_KEY not set — falling back to MongoDB');
    return getNearbyHospitalsMongo(lat, lng);
  }

  try {
    const response = await axios.get(PLACES_BASE, {
      timeout: PLACES_TIMEOUT,
      params:  {
        location: `${lat},${lng}`,
        radius:   radiusMeters,
        type:     'hospital',
        keyword:  'emergency',
        key:      MAPS_API_KEY,
      },
    });

    const { results, status, error_message } = response.data;

    if (status !== 'OK' && status !== 'ZERO_RESULTS') {
      // Log the real reason (e.g. REQUEST_DENIED = billing or legacy Places API
      // not enabled on the Cloud project) instead of a bare status code
      console.error(`[geoService] Places API ${status}: ${error_message || 'no detail'} — falling back to MongoDB`);
      return getNearbyHospitalsMongo(lat, lng);
    }

    if (!results || results.length === 0) {
      console.warn('[geoService] No hospitals found from Maps API — falling back to MongoDB');
      return getNearbyHospitalsMongo(lat, lng);
    }

    const hospitals = results
      .map((place) => {
        const placeLat = place.geometry?.location?.lat || 0;
        const placeLng = place.geometry?.location?.lng || 0;
        return {
          name:       place.name || 'Unknown Hospital',
          address:    place.vicinity || null,
          phone:      null,                                   // nearbysearch doesn't return phone
          distance:   Math.round(haversineDistance(lat, lng, placeLat, placeLng)),
          lat:        placeLat,
          lng:        placeLng,
          placeId:    place.place_id || null,
          openNow:    place.opening_hours?.open_now ?? null,
          rating:     place.rating || null,
          source:     'places',
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    console.log(`[geoService] getNearbyHospitals returning ${hospitals.length} results`);
    return hospitals;
  } catch (err) {
    console.error('[geoService] getNearbyHospitals error:', err.message);
    return getNearbyHospitalsMongo(lat, lng);
  }
}

// ─────────────────────────────────────────────
// Exported: reverseGeocode
// ─────────────────────────────────────────────

/**
 * Converts coordinates to a human-readable address using Google Geocoding API.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ city: string|null, state: string|null, country: string|null, formattedAddress: string|null }>}
 */
async function reverseGeocode(lat, lng) {
  console.log(`[geoService] reverseGeocode called | lat=${lat} lng=${lng}`);

  if (!MAPS_API_KEY) {
    console.warn('[geoService] GOOGLE_MAPS_API_KEY not set — skipping reverse geocode');
    return { city: null, state: null, country: null, formattedAddress: null };
  }

  try {
    const response = await axios.get(GEOCODE_BASE, {
      timeout: PLACES_TIMEOUT,
      params:  { latlng: `${lat},${lng}`, key: MAPS_API_KEY },
    });

    const { results, status, error_message } = response.data;

    if (status !== 'OK' || !results || results.length === 0) {
      console.warn(`[geoService] Geocoding ${status}: ${error_message || 'no results'}`);
      return { city: null, state: null, country: null, formattedAddress: null };
    }

    const components = results[0].address_components || [];
    const getComponent = (type) =>
      (components.find((c) => c.types.includes(type)) || {}).long_name || null;

    const result = {
      city:             getComponent('locality') || getComponent('administrative_area_level_2'),
      state:            getComponent('administrative_area_level_1'),
      country:          getComponent('country'),
      formattedAddress: results[0].formatted_address || null,
    };

    console.log('[geoService] reverseGeocode result:', result);
    return result;
  } catch (err) {
    console.error('[geoService] reverseGeocode error:', err.message);
    return { city: null, state: null, country: null, formattedAddress: null };
  }
}

// ─────────────────────────────────────────────
// Exported: getNearbyHospitalsMongo (fallback)
// ─────────────────────────────────────────────

/**
 * MongoDB $near fallback that queries the local hospitals collection.
 * Requires the 2dsphere index on Hospital.location.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} [maxDistance=5000]
 * @returns {Promise<Array<object>>}
 */
async function getNearbyHospitalsMongo(lat, lng, maxDistance = 5000) {
  console.log(`[geoService] getNearbyHospitalsMongo called | lat=${lat} lng=${lng}`);

  try {
    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistance,
        },
      },
    })
      .limit(5)
      .lean();

    const mapped = hospitals.map((h) => {
      const [hLng, hLat] = h.location.coordinates;
      return {
        name:       h.name,
        address:    h.address,
        phone:      h.phone,
        distance:   Math.round(haversineDistance(lat, lng, hLat, hLng)),
        lat:        hLat,
        lng:        hLng,
        placeId:    h.placeId || null,
        openNow:    null,
        rating:     h.rating || null,
        source:     'mongo',
      };
    });

    console.log(`[geoService] getNearbyHospitalsMongo returning ${mapped.length} results`);
    
    // DEMO FALLBACK: If we have no hospitals, generate realistic demo pins near
    // the user using natural offsets (0.01–0.02°) in different cardinal directions
    // so they appear plausibly spread on the map rather than clustering in one corner.
    // These are NOT real facilities — every demo record is tagged source:'demo' and
    // the API surfaces that so a caller can never mistake them for actual hospitals.
    if (mapped.length === 0) {
      console.log('[geoService] Generating demo fallback hospitals for map display...');
      return [
        {
          name:     'General Hospital (Demo)',
          address:  '123 Health Ave',
          phone:    '555-0100',
          distance: 1400,
          lat:      lat + 0.012,   // ~1.3 km north-east
          lng:      lng + 0.009,
          placeId:  null,
          openNow:  null,
          rating:   null,
          source:   'demo',
        },
        {
          name:     'City Medical Center (Demo)',
          address:  '456 Recovery Blvd',
          phone:    '555-0200',
          distance: 2100,
          lat:      lat - 0.015,   // ~1.7 km south-west
          lng:      lng - 0.011,
          placeId:  null,
          openNow:  null,
          rating:   null,
          source:   'demo',
        },
        {
          name:     'St. Luke Emergency Clinic (Demo)',
          address:  '789 Wellness Rd',
          phone:    '555-0300',
          distance: 2800,
          lat:      lat + 0.018,   // ~2.0 km north-west
          lng:      lng - 0.014,
          placeId:  null,
          openNow:  null,
          rating:   null,
          source:   'demo',
        },
      ];
    }

    return mapped;
  } catch (err) {
    console.error('[geoService] getNearbyHospitalsMongo error:', err.message);
    // DEMO FALLBACK — catch-block safety net
    return [
      {
        name:     'General Hospital (Demo)',
        address:  '123 Health Ave',
        phone:    '555-0100',
        distance: 1400,
        lat:      lat + 0.012,
        lng:      lng + 0.009,
        placeId:    null,
        openNow:    null,
        rating:     null,
        source:     'demo',
      },
    ];
  }
}

module.exports = { getNearbyHospitals, reverseGeocode, getNearbyHospitalsMongo };
