import axios from 'axios';
import { API_BASE } from '../config';
import { adaptGuidanceResponse } from './adapter';

// The browser never talks to Anthropic/Google directly any more — all AI
// guidance flows through our own backend (POST /api/guidance), which holds the
// API keys server-side. API_BASE defaults to '' so the CRA dev proxy (and the
// same-origin production server) handles routing.
const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

/**
 * Validates the structure of an adapted guidance response.
 * Returns true if the response meets minimum requirements for display.
 */
function validateResponse(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.category || typeof data.category !== 'string') return false;
  if (!['emergency', 'urgent', 'non_emergency', 'uncertain'].includes(data.urgency)) return false;
  if (!Array.isArray(data.steps) || data.steps.length === 0) return false;
  if (!Array.isArray(data.immediateActions)) return false;
  return true;
}

/**
 * Safe fallback when the backend is unreachable or returns invalid data.
 * Based on generic Red Cross / NHS first-aid principles.
 */
function getFallbackGuidance(description) {
  return {
    category: 'General Emergency',
    urgency: 'uncertain',
    confidence: 0,
    emergencyEscalationRequired: true,
    summary: 'AI guidance is currently unavailable. The following is conservative general first-aid advice. Always call emergency services for any serious emergency.',
    immediateActions: [
      'Call emergency services (112 / 108) if the situation may be life-threatening.',
      'Keep the affected person calm and still.',
      'Do not give food or water if surgery might be needed.'
    ],
    steps: [
      {
        title: 'Call for help',
        instruction: 'Dial 112 (general emergency) or 108 (ambulance). Describe the situation clearly — location, what happened, person\'s condition.',
        warning: null
      },
      {
        title: 'Ensure scene safety',
        instruction: 'Check that neither you nor the injured person are in further danger (traffic, fire, electricity, etc.). Only move the person if leaving them is immediately dangerous.',
        warning: null
      },
      {
        title: 'Check responsiveness',
        instruction: 'Gently tap the person\'s shoulders and ask "Are you OK?". If they do not respond and are not breathing normally, begin CPR if you are trained.',
        warning: null
      },
      {
        title: 'Stay with the person',
        instruction: 'Remain with the person, keep them reassured and warm, and provide information to arriving emergency services.',
        warning: null
      }
    ],
    actionsToAvoid: [
      'Do not leave the person alone if they are seriously injured.',
      'Do not give anything to eat or drink to someone who may need surgery.',
      'Do not move someone with a suspected spinal injury unless there is immediate danger.',
    ],
    professionalHelp: 'This is general fallback advice only. Always call emergency services (112 / 108) when in doubt.',
    sourceReferences: [],
    _isFallback: true
  };
}

// One session id per browser tab so the backend can correlate follow-up queries.
function getSessionId() {
  try {
    let id = sessionStorage.getItem('medifirst_session_id');
    if (!id) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('medifirst_session_id', id);
    }
    return id;
  } catch {
    return null; // sessionStorage unavailable (private mode) — backend generates one
  }
}

/**
 * Main function to get emergency guidance from the MediFirst backend.
 * Falls back gracefully if the backend is unavailable.
 *
 * @param {string} description — the emergency as typed/spoken by the user
 * @param {{ lat?: number|null, lng?: number|null }} [options] — optional location
 */
export async function getEmergencyGuidance(description, options = {}) {
  if (!description || description.trim().length < 5) {
    throw new Error('Please describe the emergency in more detail.');
  }

  if (DEMO_MODE) {
    // Explicit demo mode: no network call at all
    await new Promise(r => setTimeout(r, 1200)); // simulate latency
    const fallback = getFallbackGuidance(description);
    fallback._demoMode = true;
    return fallback;
  }

  try {
    const response = await axios.post(
      `${API_BASE}/api/guidance`,
      {
        query: description,
        lat: options.lat ?? null,
        lng: options.lng ?? null,
        sessionId: getSessionId(),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    // Adapt the backend contract onto the frontend shape. Even a
    // success:false body that carries safety-fallback steps is adapted so
    // those steps reach the screen.
    const parsed = adaptGuidanceResponse(response.data);

    if (!validateResponse(parsed)) {
      console.error('Backend response validation failed:', parsed);
      return { ...getFallbackGuidance(description), _validationFailed: true };
    }

    // Clamp confidence the same way the old direct-AI path did
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      parsed.confidence = 0.7;
    }

    return parsed;

  } catch (err) {
    if (err.code === 'ECONNABORTED' || (err.message || '').includes('timeout')) {
      return { ...getFallbackGuidance(description), _error: 'Request timed out — using safe fallback guidance.' };
    }
    const serverMsg = err.response?.data?.error;
    console.error('Guidance API error:', err.message);
    return { ...getFallbackGuidance(description), _error: serverMsg || err.message };
  }
}

export { DEMO_MODE };
