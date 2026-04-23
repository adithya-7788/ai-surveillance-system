// Test Twilio client directly
require('dotenv').config();

// Set environment variables explicitly
process.env.TWILIO_ACCOUNT_SID = 'ACdd2c8e95b06778f06a36835bced942';
process.env.TWILIO_AUTH_TOKEN = 'b619868c02a09f13cfe68a51cc452986';
process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';

const twilio = require('twilio');

async function testTwilioDirect() {
  console.log('Testing Twilio client directly...');
  console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('Auth Token length:', process.env.TWILIO_AUTH_TOKEN.length);
  
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client created successfully');
    
    // Test account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('Account status:', account.status);
    console.log('Account friendly name:', account.friendlyName);
    
    // Send test message
    const message = await client.messages.create({
      body: '🚨 Test Alert\nType: entry\nTime: ' + new Date().toLocaleString() + '\nPerson ID: 123\nPlease check your system.',
      from: 'whatsapp:+14155238886', // Use the sandbox number directly
      to: 'whatsapp:+919876543210'
    });
    
    console.log('Message sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Message status:', message.status);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
  }
}

testTwilioDirect();
