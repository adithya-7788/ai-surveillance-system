const express = require('express');
const { getProfile, updatePhoneNumber } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile/phone', authMiddleware, updatePhoneNumber);

module.exports = router;
