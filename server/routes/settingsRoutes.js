const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getSettings, upsertSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', authMiddleware, getSettings);
router.post('/', authMiddleware, upsertSettings);

module.exports = router;
