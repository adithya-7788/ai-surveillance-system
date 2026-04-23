const express = require('express');
const router = express.Router();
const { testNotifications, testEmailNotification, testWhatsAppNotification, sendWhatsAppNotification } = require('../services/notificationService');
const auth = require('../middleware/authMiddleware');

// Test both notifications for authenticated user
router.post('/test', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await testNotifications(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test notifications',
      error: error.message 
    });
  }
});

// Test email notification only
router.post('/test/email', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await testEmailNotification(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Test email notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email notification',
      error: error.message 
    });
  }
});

// Test WhatsApp notification only
router.post('/test/whatsapp', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user.id;
    
    // If phone number provided, use it; otherwise use user's profile
    if (phoneNumber) {
      // Create a temporary user object with the provided phone number
      const testUser = { phoneNumber: phoneNumber };
      const testAlert = {
        alertKey: 'test-whatsapp-' + Date.now(),
        type: 'test',
        title: 'Test WhatsApp Notification',
        priority: 'medium',
        time: new Date().toLocaleString(),
        changeType: 'created',
      };
      
      const result = await sendWhatsAppNotification(testUser, testAlert);
      res.status(200).json({
        success: result,
        message: result ? 'Test WhatsApp message sent successfully' : 'Failed to send test WhatsApp message',
        phoneNumber: phoneNumber
      });
    } else {
      // Use user's profile phone number
      const result = await testWhatsAppNotification(userId);
      res.status(200).json(result);
    }
  } catch (error) {
    console.error('Test WhatsApp notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test WhatsApp notification',
      error: error.message 
    });
  }
});

module.exports = router;
