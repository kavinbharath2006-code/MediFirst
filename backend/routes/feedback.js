/**
 * routes/feedback.js — User Feedback Submission Route
 *
 * Mounts at: /api/feedback (via server.js)
 * POST /  → feedbackController.submitFeedback
 *
 * Request body: { queryLogId: string, rating: number (1-5), comment?: string }
 */

const router = require('express').Router();
const { submitFeedback } = require('../controllers/feedbackController');

router.post('/', submitFeedback);

module.exports = router;
