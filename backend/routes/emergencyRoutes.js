const router = require('express').Router();
const { assess, alertRelative } = require('../controllers/emergencyController');

router.post('/assess', assess);
router.post('/alert-relative', alertRelative);

module.exports = router;
// In server.js / app.js:  app.use('/api/emergency', require('./routes/emergencyRoutes'));
