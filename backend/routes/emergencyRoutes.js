const router = require('express').Router();
const { assess } = require('../controllers/emergencyController');

router.post('/assess', assess);

module.exports = router;
// In server.js / app.js:  app.use('/api/emergency', require('./routes/emergencyRoutes'));
