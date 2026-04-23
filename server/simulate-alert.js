// Simulate the exact alert creation process
require('dotenv').config();

// Set environment variables explicitly
process.env.EMAIL_USER = 'adhithyareddy921@gmail.com';
process.env.EMAIL_PASS = 'kgsmqmicbnnidqut';

const { sendAlertNotifications } = require('./services/notificationService');

async function simulateAlertCreation() {
  console.log('🚨 Simulating Alert Creation Process\n');
  
  // Simulate a user with your email (this comes from your user profile)
  const mockUser = {
    _id: '507f1f77bcf86cd799439011', // Mock user ID
    email: 'adhithyareddy921@gmail.com',
    phoneNumber: null // You can add your phone number here
  };
  
  // Simulate an entry alert (this is what gets created when someone enters)
  const entryAlert = {
    alertKey: 'entry-person-123-' + Date.now(),
    type: 'entry',
    title: 'Person Entered',
    priority: 'medium',
    time: new Date().toLocaleString(),
    changeType: 'created', // CRITICAL: This triggers notifications
    personId: '123',
    objectType: null
  };
  
  console.log('📋 Alert Details:');
  console.log('   Type:', entryAlert.type);
  console.log('   Change Type:', entryAlert.changeType);
  console.log('   Person ID:', entryAlert.personId);
  console.log('   User Email:', mockUser.email);
  console.log('');
  
  // This is exactly what happens in trackingState.js when an alert is created
  console.log('🔄 Sending notifications...');
  
  try {
    await sendAlertNotifications(mockUser._id, entryAlert);
    console.log('✅ Notifications sent successfully!');
    console.log('📧 Check your email for the alert message');
    
  } catch (error) {
    console.error('❌ Notification failed:', error.message);
  }
  
  // Test different alert types
  console.log('\n🔄 Testing other alert types...');
  
  const alerts = [
    { type: 'exit', title: 'Person Exited', personId: '456' },
    { type: 'loitering', title: 'Person Loitering', personId: '789' },
    { type: 'suspicious_activity', title: 'Suspicious Activity', personId: '101', objectType: 'backpack' }
  ];
  
  for (const alert of alerts) {
    const testAlert = {
      alertKey: `${alert.type}-${alert.personId}-${Date.now()}`,
      type: alert.type,
      title: alert.title,
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created',
      personId: alert.personId,
      objectType: alert.objectType || null
    };
    
    console.log(`📧 Sending ${alert.type} alert...`);
    await sendAlertNotifications(mockUser._id, testAlert);
    
    // Small delay to avoid overwhelming Gmail
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 All test alerts sent!');
  console.log('📧 Check your inbox for multiple alert emails');
}

simulateAlertCreation();
