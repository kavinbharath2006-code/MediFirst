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
// Models to try, in order. We include modern 3.x flash models with automatic
// fallback to ensure live generation succeeds even during high-demand spikes.
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
];
const MODEL_CANDIDATES = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL, ...FALLBACK_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
  : FALLBACK_MODELS;

// Remember the model that last worked so each request does not re-probe dead ones
let activeModel = null;

// Latency budget for the primary Gemini call (default 12 seconds)
const GUIDANCE_TIMEOUT_MS = Number(process.env.GUIDANCE_TIMEOUT_MS) || 12000;

// Generation budget: 6 short steps + doNotDo is well under 500 tokens
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 600;

/**
 * Calls Gemini, walking the failover chain until a model answers.
 * If a 503 / high demand error occurs, retries once after a brief delay.
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
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: name,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
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
        const msg = String(err.message || '');
        const isTransient = msg.includes('503') || msg.includes('high demand') || msg.includes('429');
        if (isTransient && attempt === 0) {
          // Brief backoff before retry
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        console.warn(`[geminiService] Model '${name}' failed: ${msg.split('\n')[0]}`);
        if (activeModel === name) activeModel = null;
        break; // proceed to next candidate model
      }
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
// Curated static fallback steps (used when Gemini exceeds the latency budget
// or fails entirely). Generic, safe, WHO/Red-Cross-aligned bystander actions —
// never invented treatment. Keyed by urgency.emergencyType.
// ─────────────────────────────────────────────
const STATIC_FALLBACK_STEPS = {
  cardiac_arrest: [
    'Call emergency services immediately (112 / 108) and put the phone on speaker.',
    'Start chest compressions: push hard and fast in the centre of the chest, about 2 compressions per second.',
    'Do not stop compressions unless the person shows signs of life or help takes over.',
    'If trained and willing, give rescue breaths: 30 compressions then 2 breaths.',
    'Send someone for an AED if one is nearby and follow its voice prompts.',
    'Keep monitoring breathing and pulse until emergency services arrive.',
  ],
  choking: [
    'Call emergency services (112 / 108) if the person cannot breathe, cough or speak.',
    'Encourage forceful coughing if the person can still breathe.',
    'Give up to 5 sharp back blows between the shoulder blades, leaning the person forward.',
    'If ineffective, give up to 5 abdominal thrusts: fist above the navel, pull inward and upward.',
    'Alternate 5 back blows and 5 abdominal thrusts until the object comes out.',
    'If the person collapses, begin CPR and call emergency services if not already done.',
  ],
  seizure: [
    'Call emergency services (112 / 108) if this is their first seizure, it lasts over 5 minutes, or they are injured.',
    'Clear the area of hard or sharp objects and cushion the head.',
    'Do NOT restrain the person or put anything in their mouth.',
    'Time the seizure from when it started.',
    'Once the jerking stops, place them in the recovery position (on their side).',
    'Stay with them and reassure them until fully alert; breathing may be noisy at first.',
  ],
  bleeding: [
    'Call emergency services (112 / 108) immediately for heavy or spurting bleeding.',
    'Apply firm, continuous direct pressure on the wound with a clean cloth or sterile bandage.',
    'Do not remove soaked dressings — add more pads on top and maintain steady pressure.',
    'Lie the person down and elevate legs slightly if in shock, keeping them warm.',
    'Keep continuous pressure applied until medical responders take over.',
    'Monitor responsiveness, pulse, and normal breathing continuously.',
  ],
  severe_bleeding: [
    'Call emergency services (112 / 108) immediately for heavy bleeding.',
    'Apply firm, continuous direct pressure on the wound with a clean cloth or bandage.',
    'Do not remove soaked dressings — add more on top and keep pressing.',
    'Lie the person down and raise their legs if they show shock signs.',
    'Keep pressure constant until professional help arrives.',
    'Watch breathing and responsiveness continuously.',
  ],
  burn: [
    'Move the person away from the heat source or chemical safely.',
    'Cool the burn immediately under gently running cool water for at least 20 minutes.',
    'Do NOT use ice, butter, creams, oils or toothpaste on the burn.',
    'Gently remove jewelry or constricting items near the burn before swelling begins; do not peel stuck fabric.',
    'Cover the burn loosely with clean plastic wrap or a sterile non-stick bandage.',
    'Call emergency services (112 / 108) for burns on face, hands, joints, large areas, or chemical/electrical burns.',
  ],
  burns: [
    'Move the person away from the heat source safely.',
    'Cool the burn under gently running cool water for at least 20 minutes.',
    'Do NOT use ice, creams, ointments or toothpaste.',
    'Remove rings or tight items near the burn before it swells; do not peel stuck clothing.',
    'Cover loosely with clean, non-fluffy material or a saline dressing.',
    'Call emergency services (112 / 108) for large, deep, face, hand, genital or circumferential burns.',
  ],
  poisoning: [
    'Call emergency services (112 / 108) or National Poison Control immediately.',
    'Do NOT induce vomiting unless specifically instructed by medical professionals.',
    'Do NOT give anything to eat or drink (including milk or water) unless instructed by poison control.',
    'Identify the substance, container, or chemical ingested and keep it for emergency responders.',
    'If the person is unconscious or vomiting, place them onto their side in the recovery position.',
    'Monitor their breathing and responsiveness continuously until emergency help arrives.',
  ],
  fracture: [
    'Call emergency services (112 / 108) if the bone has pierced the skin or limb looks severely deformed.',
    'Do NOT try to push a bone back or straighten a crooked limb.',
    'Keep the injured area completely still and supported in the position found.',
    'Apply a cold ice pack wrapped in a cloth to reduce swelling (never put ice directly on skin).',
    'If bleeding is present, apply gentle pressure around the wound without pressing on the bone.',
    'Keep the person calm, still, and warm while waiting for emergency assistance.',
  ],
  stroke: [
    'Call emergency services (112 / 108) immediately — every minute counts for stroke treatment.',
    'Check FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 112.',
    'Note down the exact time the symptoms first appeared.',
    'Keep the person lying down on their side with head slightly elevated.',
    'Do NOT give them any food, liquids, or aspirin.',
    'Stay with the person, keep them calm and monitor breathing until help arrives.',
  ],
  allergic_reaction: [
    'Call emergency services (112 / 108) immediately if there is swelling of throat, lips, tongue, or wheezing.',
    'If an epinephrine auto-injector (EpiPen) is available and prescribed, administer it into the outer mid-thigh.',
    'Help the person lie down flat with legs raised; if breathing is difficult, allow them to sit up slightly.',
    'Loosen tight clothing around their neck and chest.',
    'Do NOT offer food or drink, and avoid standing up rapidly.',
    'Monitor breathing constantly; prepare to give a second dose of epinephrine after 5-15 minutes if needed.',
  ],
  drowning: [
    'Call emergency services (112 / 108) immediately and get the person out of water safely.',
    'Check if the person is responsive and breathing normally.',
    'If not breathing, immediately give 5 initial rescue breaths followed by 30 chest compressions.',
    'Continue CPR cycles of 30 chest compressions and 2 rescue breaths without stopping.',
    'Remove wet clothing and cover the person with blankets to prevent hypothermia.',
    'Do NOT perform abdominal thrusts to drain water; focus purely on high-quality CPR.',
  ],
  general: [
    'Call emergency services (112 / 108) if the situation may be life-threatening.',
    'Keep the person calm, still and warm.',
    'Check responsiveness and normal breathing continuously.',
    'Do not give food or drink in case surgery is needed.',
    'Do not move the person unless they are in immediate danger.',
    'Send someone to meet the emergency responders at the entrance.',
  ],
};

function getStaticSteps(urgency) {
  return [...(STATIC_FALLBACK_STEPS[urgency.emergencyType] || STATIC_FALLBACK_STEPS.general)];
}

/**
 * Calls Gemini with a hard latency budget. On timeout the caller serves
 * curated static fallback steps instead of waiting for a slow generation.
 *
 * @param {string} prompt
 * @returns {Promise<{ text: string, tokensUsed: number, model: string }>}
 */
function callGeminiWithBudget(prompt) {
  let timer;
  const budget = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini exceeded ${GUIDANCE_TIMEOUT_MS}ms latency budget`)), GUIDANCE_TIMEOUT_MS);
  });
  return Promise.race([callGemini(prompt), budget]).finally(() => clearTimeout(timer));
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
    const { text, tokensUsed, model } = await callGeminiWithBudget(prompt);

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
    console.error('[geminiService] getGuidance error/timeout — serving curated static fallback steps:', err.message);
    // Latency budget tripped or every model failed: curated safety steps
    return {
      steps:                 getStaticSteps(urgency),
      doNotDo:               ['Do not give food or water to an unconscious person.'],
      callAmbulance:         urgency.callAmbulance,
      estimatedResponseTime: '5–10 minutes',
      tokensUsed:            0,
      aiModel:               null,
      source:                'static-fallback',
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

module.exports = { getGuidance, getExtraGuidance, buildPrompt, getActiveModel, callGemini, callGeminiWithBudget, getStaticSteps };
