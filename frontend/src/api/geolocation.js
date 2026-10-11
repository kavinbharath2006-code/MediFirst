/**
 * Geolocation and emergency services utilities.
 * Uses browser Geolocation API and Google Maps deep-links.
 * No API key required for deep-links.
 */

/**
 * Requests the user's current position.
 * Returns a promise that resolves with { lat, lng } or rejects with an error message.
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission was denied. Please enable location access in your browser settings.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location information is currently unavailable. Please try again.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('An unknown error occurred getting your location.'));
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}

/**
 * Builds a Google Maps URL to search for nearby hospitals.
 * Works without any API key.
 */
export function buildNearbyHospitalsUrl(lat, lng) {
  return `https://www.google.com/maps/search/hospital+near+me/@${lat},${lng},14z`;
}

/**
 * Builds a Google Maps directions URL to a destination.
 */
export function buildDirectionsUrl(destination, originLat, originLng) {
  const origin = originLat && originLng ? `${originLat},${originLng}` : '';
  const dest = encodeURIComponent(destination);
  return `https://www.google.com/maps/dir/${origin}/${dest}`;
}

/**
 * Opens Google Maps with nearby hospital search.
 */
export function openNearbyHospitals(lat, lng) {
  window.open(buildNearbyHospitalsUrl(lat, lng), '_blank', 'noopener,noreferrer');
}

/**
 * Returns a Google Maps Embed URL for displaying a map preview.
 * Requires REACT_APP_GOOGLE_MAPS_API_KEY for full embed functionality.
 */
export function getMapEmbedUrl(lat, lng, apiKey) {
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') return null;
  return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=hospital&center=${lat},${lng}&zoom=14`;
}
