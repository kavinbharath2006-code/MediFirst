/**
 * services/ragService.js — RAG Retrieval Service for MediFirst
 *
 * Communicates with the Python FastAPI FAISS microservice running at
 * RAG_SERVICE_URL. Provides:
 *   • retrieve(query, topK) — fetches semantically similar first-aid chunks
 *   • triggerIndexRebuild() — triggers a full FAISS index rebuild
 *
 * A 2-second timeout is enforced on retrieval; on any failure the function
 * returns an empty array so the Gemini call can still proceed without RAG.
 *
 * Reference: QuickAid (ICCCT 2025) — Hybrid RAG + LLM architecture where
 * retrieval failure degrades gracefully rather than blocking the response.
 */

const axios = require('axios');

const RAG_SERVICE_URL  = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
// Retrieval budget. The very first query after startup embeds through a cold
// sentence-transformer pipeline, which can exceed 2s and used to drop the whole
// knowledge context silently. Configurable via RAG_TIMEOUT_MS.
const RETRIEVE_TIMEOUT = Number(process.env.RAG_TIMEOUT_MS) || 5000; // 5 seconds max
const REBUILD_TIMEOUT  = Number(process.env.RAG_REBUILD_TIMEOUT_MS) || 30000; // 30 seconds for index rebuild

// ─────────────────────────────────────────────
// Exported: retrieve
// ─────────────────────────────────────────────

/**
 * Retrieves top-k semantically relevant first-aid knowledge chunks from FAISS.
 *
 * @param {string} query   — User emergency description
 * @param {number} [topK=3] — Number of chunks to retrieve
 * @returns {Promise<Array<{ id: string, content: string, source: string, emergencyType: string, score: number }>>}
 */
async function retrieve(query, topK = 3) {
  const startedAt = Date.now();
  console.log(`[ragService] retrieve called | topK=${topK} | query="${query.slice(0, 60)}..."`);

  try {
    const response = await axios.post(
      `${RAG_SERVICE_URL}/retrieve`,
      { query, top_k: topK },
      {
        timeout: RETRIEVE_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const chunks = response.data?.results || [];
    console.log(`[ragService] Retrieved ${chunks.length} chunks from FAISS (${Date.now() - startedAt}ms)`);
    return chunks;
  } catch (err) {
    // Graceful degradation: log and return empty array
    if (err.code === 'ECONNABORTED') {
      console.warn(`[ragService] RAG retrieval timed out after ${RETRIEVE_TIMEOUT}ms — proceeding without knowledge context`);
    } else if (err.code === 'ECONNREFUSED') {
      console.warn('[ragService] RAG service unreachable — degrading gracefully with empty context');
    } else {
      console.error('[ragService] Retrieval error:', err.message);
    }
    return [];
  }
}

// ─────────────────────────────────────────────
// Exported: triggerIndexRebuild
// ─────────────────────────────────────────────

/**
 * Tells the Python FAISS service to rebuild its index from knowledge_base.json.
 * Used by the weekly cron job in automationService.
 *
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function triggerIndexRebuild() {
  console.log('[ragService] triggerIndexRebuild called');

  try {
    const response = await axios.post(
      `${RAG_SERVICE_URL}/build`,
      {},
      {
        timeout: REBUILD_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = { success: true, message: response.data?.message || 'Index rebuilt successfully' };
    console.log('[ragService] Index rebuild result:', result);
    return result;
  } catch (err) {
    const result = { success: false, message: err.message };
    console.error('[ragService] Index rebuild failed:', err.message);
    return result;
  }
}

module.exports = { retrieve, triggerIndexRebuild };
