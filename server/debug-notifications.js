// Comprehensive notification system debugging
require('dotenv').config();

// Set environment variables explicitly
process.env.EMAIL_USER = 'adhithyareddy921@gmail.com';
process.env.EMAIL_PASS = 'kgsmqmicbnnidqut';

console.log('🔍 Email Notification System Debug\n');

// Test 1: Email Configuration
console.log('📧 Test 1: Email Configuration');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

// Test 2: Email Transporter
const nodemailer = require('nodemailer');

console.log('\n📧 Test 2: Email Transporter Creation');
try {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('✅ Email transporter created successfully');
  
  // Test 3: Verify connection
  console.log('\n📧 Test 3: Gmail Connection Verification');
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Gmail connection failed:', error.message);
      if (error.code === 'EAUTH') {
        console.log('🔧 Fix: Use Gmail App Password, not regular password');
        console.log('🔗 Get App Password: https://myaccount.google.com/apppasswords');
      }
    } else {
      console.log('✅ Gmail connection verified successfully');
      
      // Test 4: Send test email
      console.log('\n📧 Test 4: Sending Test Email');
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'adhithyareddy921@gmail.com',
        subject: '🚨 Test Email - Surveillance System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc3545; margin: 0;">🚨 Test Alert</h2>
            </div>
            <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
              <h3>Test Details:</h3>
              <p><strong>Type:</strong> Test Notification</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Status:</strong> Email system working correctly</p>
            </div>
          </div>
        `
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('❌ Test email failed:', error.message);
        } else {
          console.log('✅ Test email sent successfully!');
          console.log('📧 Message ID:', info.messageId);
          console.log('📧 Response:', info.response);
          console.log('\n🎯 Check your inbox for the test email!');
        }
      });
    }
  });
  
} catch (error) {
  console.error('❌ Email transporter creation failed:', error.message);
}

// Test 5: Notification Service
console.log('\n📧 Test 5: Notification Service Integration');
try {
  const { sendEmailNotification } = require('./services/notificationService');
  console.log('✅ Notification service loaded successfully');
  
  // Test with mock user and alert
  const testUser = { email: 'adhithyareddy921@gmail.com' };
  const testAlert = {
    alertKey: 'debug-test-' + Date.now(),
    type: 'entry',
    title: 'Debug Test Alert',
    priority: 'medium',
    time: new Date().toLocaleString(),
    changeType: 'created',
    personId: '123'
  };
  
  sendEmailNotification(testUser, testAlert).then(result => {
    console.log('📧 Notification service result:', result);
  }).catch(error => {
    console.error('❌ Notification service failed:', error.message);
  });
  
} catch (error) {
  console.error('❌ Failed to load notification service:', error.message);
}

console.log('\n📋 Debug Summary:');
console.log('1. ✅ Email configuration loaded');
console.log('2. 🔄 Gmail connection testing...');
console.log('3. 🔄 Test email sending...');
console.log('4. 🔄 Notification service testing...');
