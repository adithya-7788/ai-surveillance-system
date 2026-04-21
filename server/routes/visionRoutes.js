const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { postVisionFrame, getVisionSummary, getAlerts } = require('../controllers/visionController');

const router = express.Router();

router.post('/frame', authMiddleware, postVisionFrame);
router.get('/summary', authMiddleware, getVisionSummary);
router.get('/alerts', authMiddleware, getAlerts);

module.exports = router;
