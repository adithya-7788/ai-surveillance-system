// Test the complete alert flow with notifications
require('dotenv').config();

// Set environment variables explicitly
process.env.EMAIL_USER = 'adhithyareddy921@gmail.com';
process.env.EMAIL_PASS = 'kgsmqmicbnnidqut';
process.env.TWILIO_ACCOUNT_SID = 'ACdd2c8e95b06778f06a36835bced942';
process.env.TWILIO_AUTH_TOKEN = 'b619868c02a09f13cfe68a51cc452986';
process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';

const { sendAlertNotifications } = require('./services/notificationService');
const User = require('./models/User');

async function testAlertFlow() {
  console.log('🔍 Testing complete alert flow...\n');
  
  try {
    // Find a user (you'll need to have a user in your database)
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    const testUser = users[0];
    console.log(`👤 Testing with user: ${testUser.email || 'no email'} | Phone: ${testUser.phoneNumber || 'no phone'}`);
    
    // Create a test alert
    const testAlert = {
      alertKey: 'flow-test-' + Date.now(),
      type: 'entry',
      title: 'Entry Alert',
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created', // This is crucial!
      personId: '123',
      objectType: null
    };
    
    console.log('\n🚨 Creating alert:', testAlert.alertKey);
    console.log('📧 Change type:', testAlert.changeType);
    
    // Send notifications (this is what happens in the alert system)
    await sendAlertNotifications(testUser._id, testAlert);
    
    console.log('\n✅ Alert flow test completed');
    console.log('📧 Check your email and WhatsApp for the alert message');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Only run if MongoDB is available
if (process.env.MONGO_URI) {
  testAlertFlow();
} else {
  console.log('❌ MONGO_URI not set. Please configure your database connection.');
}
