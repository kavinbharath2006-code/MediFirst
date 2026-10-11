/**
 * config.js — the single place any URL that points at *our own* server is built.
 *
 * Dev  : react-webpack dev server proxies /api and /assets to the Express
 *        backend (see "proxy" in frontend/package.json), so API_BASE is empty.
 * Prod : the Express server serves this bundle itself, so the same relative
 *        paths are still same-origin. No CORS and no hard-coded host anywhere.
 *
 * Third-party URLs (https://api.anthropic.com, https://www.google.com/maps...)
 * are NOT built here — they are external services and must stay absolute.
 */

// Empty string means "same origin" — the correct default for both modes.
export const API_BASE = process.env.REACT_APP_API_BASE || '';

// Backend static folder: files in backend/assets are served under /assets.
export const ASSET_BASE_URL = process.env.REACT_APP_ASSET_BASE_URL || '/assets';

/**
 * Build an API path: apiUrl('/api/health') -> '/api/health'
 * @param {string} pathSegment must start with '/'
 * @returns {string}
 */
export function apiUrl(pathSegment) {
  const clean = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;
  return `${API_BASE}${clean}`;
}

/**
 * Build a served-asset URL: assetUrl('brochure.pdf') -> '/assets/brochure.pdf'
 * @param {string} fileName
 * @returns {string}
 */
export function assetUrl(fileName) {
  const base = ASSET_BASE_URL.replace(/\/+$/, '');
  const clean = fileName.startsWith('/') ? fileName.slice(1) : fileName;
  return `${base}/${clean}`;
}

export default { API_BASE, ASSET_BASE_URL, apiUrl, assetUrl };
