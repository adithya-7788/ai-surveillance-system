// Setup WhatsApp configuration
const fs = require('fs');
const path = require('path');

console.log('Setting up WhatsApp configuration...');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Update or add Twilio configuration
const twilioConfig = [
  'TWILIO_ACCOUNT_SID=ACdd2c8e95b06778f06a36835bced942',
  'TWILIO_AUTH_TOKEN=b619868c02a09f13cfe68a51cc452986',
  'TWILIO_WHATSAPP_FROM=whatsapp:+14155238886'
];

twilioConfig.forEach(line => {
  const key = line.split('=')[0];
  if (envContent.includes(key + '=')) {
    envContent = envContent.replace(new RegExp(key + '=.*'), line);
  } else {
    envContent += '\n' + line;
  }
});

// Write back to .env file
fs.writeFileSync(envPath, envContent);
console.log('✅ WhatsApp configuration updated in .env file');
console.log('📱 Twilio Account SID:', 'ACdd2c8e95b06778f06a36835bced942');
console.log('📱 WhatsApp From Number:', 'whatsapp:+14155238886');
console.log('');
console.log('📋 Next steps:');
console.log('1. Join Twilio sandbox: Send "join <sandbox_code>" to +14155238886');
console.log('2. Test with: curl -X POST http://localhost:5001/api/notifications/test/whatsapp -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d \'{"phoneNumber": "+919876543210"}\'');
console.log('3. Or run: node test-whatsapp.js');
