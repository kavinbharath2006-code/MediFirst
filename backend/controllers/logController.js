/**
 * controllers/logController.js — Admin Query Log Viewer Controller
 *
 * Handles GET /api/log
 *
 * Returns the 20 most recent QueryLog entries, newest-first.
 * Intended for the admin dashboard / expo demo review panel.
 * No authentication is required (open demo mode).
 */

const QueryLog = require('../models/QueryLog');

// ─────────────────────────────────────────────
// Exported: getRecentLogs
// ─────────────────────────────────────────────

/**
 * GET /api/log
 * Query params: limit (optional, 1–100, default 20), urgency (optional filter)
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getRecentLogs(req, res, next) {
  console.log('[logController] getRecentLogs called | query:', req.query);

  try {
    const { limit, urgency, type } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // Optional filters
    const filter = {};
    if (urgency && ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(urgency.toUpperCase())) {
      filter.urgencyLevel = urgency.toUpperCase();
    }
    if (type) {
      filter.emergencyType = type.toLowerCase();
    }

    const logs = await QueryLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parsedLimit)
      .select('-responseSteps -doNotDo -mistakes -watchFor -ragChunksUsed')  // keep payload small
      .lean();

    // Summary stats
    const total = await QueryLog.countDocuments(filter);

    console.log(`[logController] getRecentLogs returning ${logs.length} of ${total} total logs`);

    return res.status(200).json({
      success:    true,
      total,
      count:      logs.length,
      limit:      parsedLimit,
      logs,
    });
  } catch (err) {
    console.error('[logController] Unhandled error:', err);
    next(err);
  }
}

module.exports = { getRecentLogs };
