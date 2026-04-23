// Test email functionality directly
require('dotenv').config();

// Set environment variables explicitly
process.env.EMAIL_USER = 'adhithyareddy921@gmail.com';
process.env.EMAIL_PASS = 'kgsmqmicbnnidqut';

const { sendEmailNotification } = require('./services/notificationService');

async function testEmail() {
  console.log('Testing email notification...');
  console.log('Using email:', process.env.EMAIL_USER);
  console.log('Password length:', process.env.EMAIL_PASS.length);
  
  const testUser = {
    email: 'adhithyareddy921@gmail.com', // Your email
  };
  
  const testAlert = {
    alertKey: 'email-test-' + Date.now(),
    type: 'entry',
    title: 'Test Email Notification',
    priority: 'medium',
    time: new Date().toLocaleString(),
    changeType: 'created',
    personId: '123'
  };
  
  try {
    const result = await sendEmailNotification(testUser, testAlert);
    console.log('Test result:', result);
  } catch (error) {
    console.error('Test error:', error);
  }
}

testEmail();
