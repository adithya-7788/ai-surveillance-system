const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getConfig, upsertConfig } = require('../controllers/configController');

const router = express.Router();

router.get('/', authMiddleware, getConfig);
router.post('/', authMiddleware, upsertConfig);

module.exports = router;
