import axios from 'axios';

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;
const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true' || !ANTHROPIC_KEY || ANTHROPIC_KEY === 'your_anthropic_api_key_here';

/**
 * Validates the structure of an AI guidance response.
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
 * Safe fallback when AI is unavailable or returns invalid data.
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

/**
 * Builds the Claude API prompt for structured emergency guidance.
 */
function buildPrompt(description) {
  return `You are MediFirst, an emergency first-aid guidance assistant. A person has described an emergency situation.

EMERGENCY DESCRIPTION:
"${description}"

Provide structured, calm, actionable first-aid guidance. You MUST respond with ONLY a valid JSON object matching this exact schema:

{
  "category": "string (e.g. Burns, Seizures, Cardiac emergency, Severe bleeding, etc.)",
  "urgency": "emergency | urgent | non_emergency | uncertain",
  "confidence": 0.0-1.0,
  "emergencyEscalationRequired": true/false,
  "summary": "string (1-2 sentences describing the situation and severity)",
  "immediateActions": ["string", "string", "string"],
  "steps": [
    {
      "title": "string (short action title)",
      "instruction": "string (clear, specific instruction)",
      "warning": "string or null"
    }
  ],
  "actionsToAvoid": ["string"],
  "professionalHelp": "string (when/how to seek professional help)",
  "sourceReferences": [
    { "title": "string", "url": "string" }
  ]
}

GUIDELINES:
- urgency "emergency" = call 112/108 NOW (cardiac arrest, anaphylaxis, severe bleeding, choking, etc.)
- urgency "urgent" = professional care within hours (fractures, burns, seizures that resolved, etc.)
- urgency "non_emergency" = manageable at home with clear guidance and professional follow-up
- urgency "uncertain" = symptoms unclear or ambiguous — err on the side of caution
- emergencyEscalationRequired = true for any suspected life-threatening condition
- Keep instructions simple, clear, and suitable for a stressed bystander
- Maximum 6 steps. Each step must be specific and actionable.
- Include 2-4 reference URLs from NHS, Red Cross, or WHO when relevant
- NEVER invent drug doses, medical diagnoses, or treatments not based on established first-aid guidance
- Respond with ONLY the JSON object — no preamble, no markdown fences`;
}

/**
 * Main function to get emergency guidance from Claude API.
 * Falls back gracefully if the API is unavailable.
 */
export async function getEmergencyGuidance(description) {
  if (!description || description.trim().length < 5) {
    throw new Error('Please describe the emergency in more detail.');
  }

  if (DEMO_MODE) {
    // Return fallback guidance in demo mode (no API call)
    await new Promise(r => setTimeout(r, 1200)); // simulate latency
    const fallback = getFallbackGuidance(description);
    fallback._demoMode = true;
    return fallback;
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: buildPrompt(description)
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        timeout: 30000
      }
    );

    const rawText = response.data?.content?.[0]?.text;
    if (!rawText) throw new Error('Empty response from AI service.');

    // Parse and validate
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('AI response parse error:', rawText);
      throw new Error('The AI returned an unreadable response. Using safe fallback.');
    }

    if (!validateResponse(parsed)) {
      console.error('AI response validation failed:', parsed);
      return { ...getFallbackGuidance(description), _validationFailed: true };
    }

    // Clamp confidence
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      parsed.confidence = 0.7;
    }

    // Normalize urgency
    const validUrgencies = ['emergency', 'urgent', 'non_emergency', 'uncertain'];
    if (!validUrgencies.includes(parsed.urgency)) {
      parsed.urgency = 'uncertain';
    }

    return parsed;

  } catch (err) {
    if (err.response?.status === 401) {
      console.error('Claude API: Invalid API key.');
      return { ...getFallbackGuidance(description), _error: 'Invalid API key — running in safe fallback mode.' };
    }
    if (err.response?.status === 429) {
      console.error('Claude API: Rate limited.');
      return { ...getFallbackGuidance(description), _error: 'Rate limit reached — using safe fallback guidance.' };
    }
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return { ...getFallbackGuidance(description), _error: 'Request timed out — using safe fallback guidance.' };
    }

    console.error('Claude API error:', err.message);
    return { ...getFallbackGuidance(description), _error: err.message };
  }
}

export { DEMO_MODE };
