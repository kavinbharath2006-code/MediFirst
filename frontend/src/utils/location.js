// Approximate centres, used when GPS is off or blocked. Adjust if you add more areas.
export const AREAS = {
  vandalur: { label: 'Vandalur', lat: 12.8923, lng: 80.0817 },
  tambaram: { label: 'Tambaram', lat: 12.9249, lng: 80.1 },
  chromepet: { label: 'Chromepet', lat: 12.9516, lng: 80.1462 },
};

export function getPosition(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    );
  });
}

export async function permissionState() {
  try {
    if (!navigator.permissions) return 'unknown';
    return (await navigator.permissions.query({ name: 'geolocation' })).state; // granted | prompt | denied
  } catch {
    return 'unknown';
  }
}

// GPS if the user allowed it in Settings, otherwise the area they picked.
export async function resolveLocation(settings = {}) {
  if (settings?.useLocation) {
    try {
      return { ...(await getPosition()), source: 'gps' };
    } catch { /* fall through to area */ }
  }
  const areaKey = settings?.area;
  const a = (areaKey && AREAS[areaKey]) || AREAS.tambaram;
  return { lat: a.lat, lng: a.lng, source: 'area', label: a.label };
}
