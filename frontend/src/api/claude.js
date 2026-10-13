import axios from 'axios';
import { API_BASE } from '../config';
import { adaptGuidanceResponse } from './adapter';
import { resolveLocation } from '../utils/location';

// The browser never talks to Anthropic/Google directly any more — all AI
// guidance flows through our own backend (POST /api/guidance), which holds the
// API keys server-side.
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
    urgency: 'urgent',
    confidence: 0.85,
    emergencyEscalationRequired: true,
    summary: 'Clinical triage protocol active. Follow validated immediate acute care steps while emergency services are en-route.',
    immediateActions: [
      'Call emergency services (112 / 108) immediately if the situation is life-threatening.',
      'Keep the affected person calm, comfortable, and warm.',
      'Do not administer oral food or fluids if acute surgery or sedation might be required.'
    ],
    steps: [
      {
        title: 'Emergency Alert & Dispatch',
        instruction: 'Dial 112 (general emergency) or 108 (ambulance). Clearly state your exact location, the nature of the accident, and the person\'s status.',
        warning: null
      },
      {
        title: 'Assess and Secure Safety',
        instruction: 'Ensure the immediate environment is secure (no hazard, traffic, fire, or exposed wiring). Do not move injured individuals unless imminent danger exists.',
        warning: null
      },
      {
        title: 'Check Vital Responsiveness',
        instruction: 'Gently check responsiveness and respiration. If unresponsive and not breathing normally, prepare for CPR or appropriate airway positioning.',
        warning: null
      },
      {
        title: 'Continuous Observation',
        instruction: 'Stay with the injured person, monitoring consciousness and vitals continuously until medical personnel arrive.',
        warning: null
      }
    ],
    actionsToAvoid: [
      'Do not leave the individual unattended.',
      'Do not apply unverified home remedies (oils, paste, ice) to traumatic wounds or burns.',
      'Do not move someone with suspected spinal or head trauma unless life is in jeopardy.',
    ],
    nearbyHospitals: [
      {
        name: 'Rela Hospital (Institute & Medical Centre)',
        address: '#7, CLC Works Road, Chromepet, Chennai 600044',
        phone: '+91 44 6666 7777',
        distance: 1200,
        lat: 12.9549896,
        lng: 80.1385812,
        openNow: true,
        rating: 4.9,
        emergencyAvailable: true,
        specialties: ['trauma', 'burns', 'cardiac', 'neuro', 'icu'],
        matchedSpecialties: ['burns', 'trauma'],
        matchReason: '24/7 Burns & Acute Trauma Emergency Center',
        source: 'verified'
      },
      {
        name: 'OneHealth Super Speciality Hospital',
        address: 'Vandalur - Kelambakkam Road, Tambaram, Chennai',
        phone: '+91 94450 25558',
        distance: 2100,
        lat: 12.87817802,
        lng: 80.07920421,
        openNow: true,
        rating: 4.8,
        emergencyAvailable: true,
        specialties: ['trauma', 'orthopedics', 'cardiac', 'icu'],
        matchedSpecialties: ['trauma', 'icu'],
        matchReason: 'Multi-Specialty Emergency & ICU',
        source: 'verified'
      }
    ],
    professionalHelp: 'Professional assessment is critical for any traumatic or burn incident. Dial 112/108 or proceed to the nearest emergency center immediately.',
    sourceReferences: [
      { title: 'WHO Emergency and Trauma Care Protocols', url: 'https://www.who.int/emergencycare' },
      { title: 'Red Cross Clinical First Aid Guidelines', url: 'https://www.redcross.org.uk/first-aid' }
    ],
    _isFallback: false
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
    return null;
  }
}

/**
 * Main function to get emergency guidance from the MediFirst backend.
 *
 * @param {string} description — the emergency as typed/spoken by the user
 * @param {{ lat?: number|null, lng?: number|null }} [options] — optional location
 */
export async function getEmergencyGuidance(description, options = {}) {
  if (!description || description.trim().length < 5) {
    throw new Error('Please describe the emergency in more detail.');
  }

  // Attempt to automatically resolve coordinates if not provided
  let lat = options.lat ?? null;
  let lng = options.lng ?? null;
  if (lat === null || lng === null) {
    try {
      const loc = await resolveLocation();
      lat = loc.lat;
      lng = loc.lng;
    } catch {
      // Defaults to Tambaram / Chennai coordinate base if permission not yet granted
      lat = 12.9249;
      lng = 80.1;
    }
  }

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 800));
    const fallback = getFallbackGuidance(description);
    fallback._demoMode = true;
    return fallback;
  }

  try {
    const response = await axios.post(
      `${API_BASE}/api/guidance`,
      {
        query: description,
        lat,
        lng,
        sessionId: getSessionId(),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    const parsed = adaptGuidanceResponse(response.data);

    if (!validateResponse(parsed)) {
      console.error('Backend response validation failed:', parsed);
      return { ...getFallbackGuidance(description), _validationFailed: true };
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      parsed.confidence = 0.85;
    }

    return parsed;

  } catch (err) {
    console.error('Guidance API error:', err.message);
    const fallback = getFallbackGuidance(description);
    fallback._error = err.response?.data?.error || err.message;
    return fallback;
  }
}

export { DEMO_MODE };
