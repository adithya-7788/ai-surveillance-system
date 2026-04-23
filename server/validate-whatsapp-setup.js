// Validate WhatsApp notification setup
require('dotenv').config();

console.log('🔍 WhatsApp Notification Setup Validation\n');

// Check environment variables
const requiredVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 
  'TWILIO_WHATSAPP_FROM'
];

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'TWILIO_ACCOUNT_SID') {
      console.log(`✅ ${varName}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`);
    } else if (varName === 'TWILIO_AUTH_TOKEN') {
      console.log(`✅ ${varName}: ${'*'.repeat(value.length)} (length: ${value.length})`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: Missing`);
    allConfigured = false;
  }
});

console.log('\n📱 Testing Twilio Connection...');

if (allConfigured) {
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Test account connection
    client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()
      .then(account => {
        console.log('✅ Twilio connection successful');
        console.log(`📊 Account: ${account.friendlyName}`);
        console.log(`📊 Status: ${account.status}`);
        
        // Test notification service import
        const { sendWhatsAppNotification } = require('./services/notificationService');
        console.log('✅ Notification service loaded successfully');
        
        console.log('\n🎯 Setup is ready for testing!');
        console.log('📋 To test: node test-whatsapp.js');
        console.log('📋 To test via API: POST /api/notifications/test/whatsapp');
        
      })
      .catch(error => {
        console.log('❌ Twilio connection failed');
        console.log(`Error: ${error.message}`);
        console.log(`Code: ${error.code}`);
        
        if (error.code === 20003) {
          console.log('\n🔧 Solution: Check your Account SID and Auth Token in Twilio Console');
          console.log('🔗 https://www.twilio.com/console');
        }
      });
      
  } catch (error) {
    console.log('❌ Failed to create Twilio client');
    console.log(`Error: ${error.message}`);
  }
} else {
  console.log('\n❌ Configuration incomplete');
  console.log('🔧 Please set all required environment variables in .env file');
}

console.log('\n📖 For setup help: WHATSAPP_SETUP_GUIDE.md');
