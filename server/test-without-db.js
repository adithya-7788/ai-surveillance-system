// Test notifications without database dependency
require('dotenv').config();

// Set environment variables explicitly
process.env.EMAIL_USER = 'adhithyareddy921@gmail.com';
process.env.EMAIL_PASS = 'kgsmqmicbnnidqut';

const { sendEmailNotification } = require('./services/notificationService');

async function testWithoutDatabase() {
  console.log('🚨 Testing Notifications Without Database\n');
  
  // This is what should happen when your system creates an alert
  const user = {
    email: 'adhithyareddy921@gmail.com', // Your email from user profile
    phoneNumber: '+919876543210' // Your phone number from user profile
  };
  
  const alerts = [
    {
      alertKey: 'entry-123-' + Date.now(),
      type: 'entry',
      title: 'Person Entered',
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created',
      personId: '123'
    },
    {
      alertKey: 'exit-456-' + Date.now(),
      type: 'exit', 
      title: 'Person Exited',
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created',
      personId: '456'
    },
    {
      alertKey: 'suspicious-789-' + Date.now(),
      type: 'suspicious_activity',
      title: 'Suspicious Activity Detected',
      priority: 'high',
      time: new Date().toLocaleString(),
      changeType: 'created',
      personId: '789',
      objectType: 'backpack'
    }
  ];
  
  console.log('👤 User Profile:');
  console.log('   Email:', user.email);
  console.log('   Phone:', user.phoneNumber);
  console.log('');
  
  for (const alert of alerts) {
    console.log(`📧 Sending ${alert.type} alert...`);
    console.log(`   Alert Key: ${alert.alertKey}`);
    console.log(`   Change Type: ${alert.changeType}`);
    
    try {
      const result = await sendEmailNotification(user, alert);
      if (result) {
        console.log('✅ Email sent successfully!');
      } else {
        console.log('❌ Email failed to send');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    console.log('');
    
    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎯 Test completed!');
  console.log('📧 Check your inbox for the alert emails');
}

testWithoutDatabase();
