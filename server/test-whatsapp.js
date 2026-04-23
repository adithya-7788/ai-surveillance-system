// Test WhatsApp functionality directly
require('dotenv').config();

// Set environment variables explicitly
process.env.TWILIO_ACCOUNT_SID = 'ACdd2c8e95b06778f06a36835bced942';
process.env.TWILIO_AUTH_TOKEN = 'b619868c02a09f13cfe68a51cc452986';
process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';

const { sendWhatsAppNotification } = require('./services/notificationService');

async function testWhatsApp() {
  console.log('Testing WhatsApp notification...');
  console.log('Using Account SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('Using From Number:', process.env.TWILIO_WHATSAPP_FROM);
  
  const testUser = {
    phoneNumber: '+919876543210', // Replace with your actual phone number
  };
  
  const testAlert = {
    alertKey: 'manual-test-' + Date.now(),
    type: 'entry',
    title: 'Manual Test Alert',
    priority: 'medium',
    time: new Date().toLocaleString(),
    changeType: 'created',
    personId: '123'
  };
  
  try {
    const result = await sendWhatsAppNotification(testUser, testAlert);
    console.log('Test result:', result);
  } catch (error) {
    console.error('Test error:', error);
  }
}

testWhatsApp();
