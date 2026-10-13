/**
 * routes/guidance.js — First Aid Guidance Route
 *
 * Mounts at: /api/guidance (via server.js)
 * POST /       → guidanceController.handleGuidance  (fast critical path)
 * POST /extra  → guidanceController.handleGuidanceExtra (lazily fetched
 *                 mistakes/watchFor layer — keeps the second LLM call off the
 *                 response path)
 */

const router = require('express').Router();
const { handleGuidance, handleGuidanceExtra } = require('../controllers/guidanceController');

router.post('/',        handleGuidance);
router.post('/extra',   handleGuidanceExtra);

module.exports = router;
