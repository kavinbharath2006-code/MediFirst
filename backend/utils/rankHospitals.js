// Pure function, easy to unit test. If you already have a ranking function, call that instead.
const FALLBACK_TAGS = {
  trauma: ['trauma', 'icu', 'general_surgery'],
  fracture: ['orthopedics', 'trauma'],
  burns: ['burns', 'icu'],
  cardiac: ['cardiac', 'icu'],
  stroke: ['neuro', 'icu'],
  seizure: ['neuro'],
  poisoning: ['toxicology', 'icu'],
  snakebite: ['toxicology', 'icu'],
  breathing: ['icu'],
  pregnancy: ['obstetrics'],
  eye: ['eye'],
};

const toRad = (d) => (d * Math.PI) / 180;
function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function mapsUrl(h) {
  const lat = typeof h.lat === 'number' ? h.lat : (h.location?.coordinates?.[1]);
  const lng = typeof h.lng === 'number' ? h.lng : (h.location?.coordinates?.[0]);
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${h.address || ''}`)}`;
}

// Score out of 100: specialty match 60, 24-hour casualty 25, distance 15.
function rankHospitals(hospitals, { requiredTags, origin, limit = 5 }) {
  const required = requiredTags.map((t) => t.toLowerCase());
  const scored = hospitals.map((h) => {
    const tags = (h.specialties || []).map((t) => String(t).toLowerCase());
    const matched = required.filter((t) => tags.includes(t));
    const match = required.length ? matched.length / required.length : 0;
    const lat = typeof h.lat === 'number' ? h.lat : (h.location?.coordinates?.[1]);
    const lng = typeof h.lng === 'number' ? h.lng : (h.location?.coordinates?.[0]);
    const hasCoords = typeof lat === 'number' && typeof lng === 'number';
    const distanceKm = origin && hasCoords ? haversineKm(origin, { lat, lng }) : null;
    const distScore = distanceKm == null ? 0 : Math.max(0, 1 - distanceKm / 20);
    return {
      id: h._id ? String(h._id) : undefined,
      name: h.name,
      address: h.address,
      phone: h.phone || '',
      emergencyAvailable: !!h.emergencyAvailable,
      matched,
      distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
      mapsUrl: mapsUrl({ ...h, lat, lng }),
      score: Math.round(match * 60 + (h.emergencyAvailable ? 25 : 0) + distScore * 15),
    };
  });
  return scored
    .filter((h) => h.matched.length > 0)
    .sort((a, b) => b.score - a.score || (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, limit);
}

module.exports = { rankHospitals, FALLBACK_TAGS, haversineKm };
