/**
 * routes/log.js — Admin Query Log Viewer Route
 *
 * Mounts at: /api/log (via server.js)
 * GET /  → logController.getRecentLogs
 *
 * Query parameters:
 *   limit   {number}  optional — max results to return (1–100, default 20)
 *   urgency {string}  optional — filter by urgencyLevel (CRITICAL|HIGH|MODERATE|LOW)
 *   type    {string}  optional — filter by emergencyType (cardiac_arrest|seizure|...)
 */

const router = require('express').Router();
const { getRecentLogs } = require('../controllers/logController');

router.get('/', getRecentLogs);

module.exports = router;
