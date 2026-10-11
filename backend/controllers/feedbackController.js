/**
 * controllers/feedbackController.js — User Feedback Submission Controller
 *
 * Handles POST /api/feedback
 *
 * Validates the incoming rating (1–5) and queryLogId, creates a Feedback
 * document, and (via the Feedback post-save hook) updates the linked
 * QueryLog.feedbackRating field atomically.
 */

const mongoose = require('mongoose');
const Feedback  = require('../models/Feedback');
const QueryLog  = require('../models/QueryLog');

// ─────────────────────────────────────────────
// Exported: submitFeedback
// ─────────────────────────────────────────────

/**
 * POST /api/feedback
 * Body: { queryLogId: string, rating: number (1-5), comment?: string }
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function submitFeedback(req, res, next) {
  console.log('[feedbackController] submitFeedback called');

  try {
    const { queryLogId, rating, comment } = req.body;

    // ── Validate queryLogId ───────────────────
    if (!queryLogId) {
      return res.status(400).json({ success: false, error: 'queryLogId is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(queryLogId)) {
      return res.status(400).json({ success: false, error: 'queryLogId is not a valid ObjectId.' });
    }

    // ── Validate rating ───────────────────────
    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, error: 'rating must be an integer between 1 and 5.' });
    }

    // ── Verify QueryLog exists ────────────────
    const logExists = await QueryLog.exists({ _id: queryLogId });
    if (!logExists) {
      return res.status(404).json({ success: false, error: 'QueryLog not found for the given queryLogId.' });
    }

    // ── Create Feedback document ──────────────
    const feedback = new Feedback({
      queryLogId,
      rating:  parsedRating,
      comment: comment?.trim() || null,
    });

    await feedback.save(); // post-save hook updates QueryLog.feedbackRating

    console.log(`[feedbackController] Feedback saved: ${feedback._id} | rating=${parsedRating} | queryLog=${queryLogId}`);

    return res.status(201).json({
      success:    true,
      feedbackId: feedback._id,
      rating:     parsedRating,
      message:    'Thank you for your feedback!',
    });
  } catch (err) {
    console.error('[feedbackController] Unhandled error:', err);
    next(err);
  }
}

module.exports = { submitFeedback };
