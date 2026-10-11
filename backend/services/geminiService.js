/**
 * services/geminiService.js — Google Gemini 1.5 Flash Integration for MediFirst
 *
 * Provides two Gemini call functions:
 *   • getGuidance(query, urgency, ragChunks)
 *       → Primary first-aid step generator. Builds a carefully engineered
 *         prompt that injects RAG context + urgency classification and
 *         requests a structured JSON response with 6 actionable steps.
 *
 *   • getExtraGuidance(query, steps, urgencyLevel, emergencyType)
 *       → Secondary "personalisation" call implementing the ICEMPS 2024
 *         Context-Aware approach: surfaces common bystander mistakes and
 *         what to watch for in the next 10 minutes.
 *
 * Both functions return plain JS objects. JSON parse failures are handled
 * with regex fallbacks so the response pipeline never breaks.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('[geminiService] GEMINI_API_KEY is not set — guidance will degrade to hardcoded steps');
}
const genAI = new GoogleGenerativeAI(API_KEY || 'unset');

// Models to try, in order. Google retired `gemini-1.5-flash`, and a retired
// model name makes every call 404 — which the catch blocks used to swallow,
// silently serving hardcoded first-aid text instead of AI guidance. Override
// with GEMINI_MODEL in .env; the remaining candidates act as a failover chain.
const FALLBACK_MODELS = ['gemini-3-flash-preview', 'gemini-flash-latest'];
const MODEL_CANDIDATES = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL, ...FALLBACK_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
  : FALLBACK_MODELS;

// Remember the model that last worked so each request does not re-probe dead ones
let activeModel = null;

/**
 * Calls Gemini, walking the failover chain until a model answers.
 * JSON is requested through generationConfig so the response does not need
 * markdown-fence stripping to be parseable.
 *
 * @param {string} prompt
 * @returns {Promise<{ text: string, tokensUsed: number, model: string }>}
 */
async function callGemini(prompt) {
  const order = activeModel
    ? [activeModel, ...MODEL_CANDIDATES.filter((m) => m !== activeModel)]
    : MODEL_CANDIDATES;

  let lastError = null;
  for (const name of order) {
    try {
      const model = genAI.getGenerativeModel({
        model: name,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
      });
      const result = await model.generateContent(prompt);
      const text = String(result.response.text() || '');

      if (activeModel !== name) {
        console.log(`[geminiService] Active model: '${name}'${activeModel ? ` (failed over from '${activeModel}')` : ''}`);
        activeModel = name;
      }
      return {
        text,
        tokensUsed: result.response.usageMetadata?.totalTokenCount || 0,
        model: name,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[geminiService] Model '${name}' failed: ${String(err.message).split('\n')[0]}`);
      if (activeModel === name) activeModel = null;
    }
  }
  throw lastError || new Error(`No Gemini model available (tried: ${order.join(', ')})`);
}

function getActiveModel() {
  return activeModel;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Strips markdown fences (```json … ```) that Gemini sometimes wraps around
 * its JSON output, then attempts JSON.parse.
 *
 * @param {string} text
 * @returns {object|null}
 */
function safeJsonParse(text) {
  try {
    // Remove ```json ... ``` wrappers
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Fallback: extract numbered lines from raw text as steps array.
 * @param {string} text
 * @returns {string[]}
 */
function extractNumberedSteps(text) {
  const lines = text.split('\n');
  const steps = [];
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)[.)]\s+(.+)/);
    if (match) steps.push(match[2].trim());
  }
  return steps.slice(0, 6);
}

// ─────────────────────────────────────────────
// Prompt Builder
// ─────────────────────────────────────────────

/**
 * Constructs the primary guidance prompt.
 *
 * @param {string} query
 * @param {{ level: string, emergencyType: string, callAmbulance: boolean }} urgency
 * @param {Array<{ content: string, source: string }>} ragChunks
 * @returns {string}
 */
function buildPrompt(query, urgency, ragChunks) {
  const ragSection =
    ragChunks.length > 0
      ? ragChunks.map((c) => `- ${c.content} (Source: ${c.source})`).join('\n')
      : '- No additional knowledge context available. Use your training data.';

  const emergencyCallNote =
    urgency.callAmbulance
      ? '\n⚠️  This is a CRITICAL or HIGH urgency emergency — include emergency number 112 in step 1 or 2.'
      : '';

  return `You are MediFirst, an AI-powered first aid assistant trained on WHO and Red Cross guidelines.

A user has reported the following emergency:
"${query}"

Emergency classification: ${urgency.level} — ${urgency.emergencyType}${emergencyCallNote}

Relevant first aid knowledge from the MediFirst knowledge base:
${ragSection}

Your task: Provide EXACTLY 6 numbered first aid steps for this emergency.

Each step MUST be:
1. Concise (1–2 sentences maximum)
2. Immediately actionable and specific (not vague advice)
3. Ordered by priority — most life-saving action first
4. Grounded in the knowledge provided above
5. Safe to perform by a non-medical bystander

Respond ONLY with valid JSON in this exact format (no markdown fences, no extra text):
{
  "steps": [
    "Step 1 text here",
    "Step 2 text here",
    "Step 3 text here",
    "Step 4 text here",
    "Step 5 text here",
    "Step 6 text here"
  ],
  "doNotDo": ["One critical thing NOT to do in this emergency"],
  "callAmbulance": ${urgency.callAmbulance},
  "estimatedResponseTime": "X–Y minutes"
}`;
}

// ─────────────────────────────────────────────
// Exported: getGuidance
// ─────────────────────────────────────────────

/**
 * Calls Gemini 1.5 Flash to generate structured first-aid guidance.
 *
 * @param {string} query
 * @param {{ level: string, emergencyType: string, callAmbulance: boolean }} urgency
 * @param {Array<{ content: string, source: string, id: string }>} ragChunks
 * @returns {Promise<{
 *   steps: string[],
 *   doNotDo: string[],
 *   callAmbulance: boolean,
 *   estimatedResponseTime: string,
 *   tokensUsed: number
 * }>}
 */
async function getGuidance(query, urgency, ragChunks) {
  console.log(`[geminiService] getGuidance called | urgency=${urgency.level} | ragChunks=${ragChunks.length}`);

  const prompt = buildPrompt(query, urgency, ragChunks);

  try {
    const { text, tokensUsed, model } = await callGemini(prompt);

    console.log(`[geminiService] getGuidance received response | model=${model} | tokens=${tokensUsed}`);

    // Attempt JSON parse
    let parsed = safeJsonParse(text);

    if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
      console.log('[geminiService] JSON parse successful');
      return {
        steps:                 parsed.steps.slice(0, 6),
        doNotDo:               Array.isArray(parsed.doNotDo) ? parsed.doNotDo : [],
        callAmbulance:         parsed.callAmbulance ?? urgency.callAmbulance,
        estimatedResponseTime: parsed.estimatedResponseTime || '5–10 minutes',
        tokensUsed,
        aiModel:               model,
        source:                'gemini',
      };
    }

    // Fallback: extract numbered lines
    console.warn('[geminiService] JSON parse failed — using numbered-line fallback');
    const steps = extractNumberedSteps(text);
    return {
      steps:                 steps.length > 0 ? steps : ['Call emergency services immediately (112).'],
      doNotDo:               [],
      callAmbulance:         urgency.callAmbulance,
      estimatedResponseTime: '5–10 minutes',
      tokensUsed,
      aiModel:               model,
      source:                steps.length > 0 ? 'gemini_unstructured' : 'fallback',
    };
  } catch (err) {
    console.error('[geminiService] getGuidance error — returning hardcoded fallback steps:', err.message);
    // Hard fallback
    return {
      steps: [
        `Call emergency services immediately at 112. This is a ${urgency.level} emergency.`,
        'Keep the person calm and still until help arrives.',
        'Do not move the person unless they are in immediate danger.',
        'Loosen tight clothing around the neck and chest.',
        'Monitor breathing and pulse continuously.',
        'Send someone to meet emergency responders at the entrance.',
      ],
      doNotDo:               ['Do not give food or water to an unconscious person.'],
      callAmbulance:         urgency.callAmbulance,
      estimatedResponseTime: '5–10 minutes',
      tokensUsed:            0,
      aiModel:               null,
      source:                'fallback',
    };
  }
}

// ─────────────────────────────────────────────
// Exported: getExtraGuidance
// ─────────────────────────────────────────────

/**
 * Secondary Gemini call — surfaces common bystander mistakes and monitoring
 * checkpoints. Implements the personalised contextual layer from the
 * Context-Aware Emergency Chatbot (ICEMPS 2024) paper.
 *
 * @param {string} query
 * @param {string[]} steps         — The 6 steps already generated
 * @param {string} urgencyLevel    — 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
 * @param {string} emergencyType   — e.g. 'cardiac_arrest'
 * @returns {Promise<{ mistakes: string[], watchFor: string[] }>}
 */
async function getExtraGuidance(query, steps, urgencyLevel, emergencyType) {
  console.log(`[geminiService] getExtraGuidance called | type=${emergencyType} | level=${urgencyLevel}`);

  const stepsText = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  const prompt = `You are MediFirst, an expert first aid advisor.

Emergency query: "${query}"
Emergency type: ${emergencyType}
Urgency level: ${urgencyLevel}

The following first aid steps have been given to a bystander:
${stepsText}

Based on these steps and the emergency type, answer ONLY with valid JSON (no markdown fences):
{
  "mistakes": [
    "Common mistake 1 that bystanders make for this specific emergency",
    "Common mistake 2",
    "Common mistake 3"
  ],
  "watchFor": [
    "Sign or symptom to monitor in the next 10 minutes — item 1",
    "Sign or symptom to monitor — item 2",
    "Sign or symptom to monitor — item 3"
  ]
}`;

  try {
    const { text } = await callGemini(prompt);

    console.log('[geminiService] getExtraGuidance received response');

    const parsed = safeJsonParse(text);

    if (parsed && Array.isArray(parsed.mistakes) && Array.isArray(parsed.watchFor)) {
      console.log('[geminiService] getExtraGuidance JSON parse successful');
      return {
        mistakes:  parsed.mistakes.slice(0, 3),
        watchFor:  parsed.watchFor.slice(0, 3),
        source:    'gemini',
      };
    }

    console.warn('[geminiService] getExtraGuidance JSON parse failed — using defaults');
    return {
      mistakes: [
        'Moving the patient unnecessarily before stabilising.',
        'Panicking and forgetting to call emergency services first.',
        'Giving food or drink to someone who is unconscious or semi-conscious.',
      ],
      watchFor: [
        'Changes in breathing rate or depth.',
        'Loss of consciousness or unresponsiveness.',
        'Skin colour changes (pallor, blueness, or flushing).',
      ],
      source: 'fallback',
    };
  } catch (err) {
    console.error('[geminiService] getExtraGuidance error — using defaults:', err.message);
    return {
      mistakes: [
        'Failing to call emergency services immediately.',
        'Attempting to move the patient without assessing spinal injuries.',
        'Stopping CPR too early if no AED is available.',
      ],
      watchFor: [
        'Laboured or absent breathing.',
        'Pulse becoming weak or irregular.',
        'Increasing confusion or loss of consciousness.',
      ],
      source: 'fallback',
    };
  }
}

module.exports = { getGuidance, getExtraGuidance, buildPrompt, getActiveModel, callGemini };
