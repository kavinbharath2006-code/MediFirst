/**
 * routes/guidance.js — First Aid Guidance Route
 *
 * Mounts at: /api/guidance (via server.js)
 * POST /  → guidanceController.handleGuidance
 */

const router = require('express').Router();
const { handleGuidance } = require('../controllers/guidanceController');

router.post('/', handleGuidance);

module.exports = router;
