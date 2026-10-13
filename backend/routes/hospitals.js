/**
 * routes/hospitals.js — Nearby Hospital Lookup Route
 *
 * Mounts at: /api/hospitals (via server.js)
 * GET /  → hospitalController.getNearby
 *
 * Query parameters:
 *   lat    {number}  required — latitude of user
 *   lng    {number}  required — longitude of user
 *   radius {number}  optional — search radius in metres (default: 5000)
 *   emergencyType {string} optional — urgencyEngine slug (e.g. 'burn'); when
 *     given, hospitals with a matching specialty rank first (see specialtyRouter)
 */

const router = require('express').Router();
const { getNearby } = require('../controllers/hospitalController');

router.get('/', getNearby);

module.exports = router;
