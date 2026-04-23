// Check user profile for notification settings
require('dotenv').config();
const User = require('./models/User');

async function checkUserProfile() {
  console.log('🔍 Checking user profiles...\n');
  
  try {
    if (!process.env.MONGO_URI) {
      console.log('❌ MONGO_URI not set. Please configure your database connection.');
      return;
    }
    
    const users = await User.find({});
    console.log(`Found ${users.length} users in database\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email || '❌ NOT SET'}`);
      console.log(`   Phone: ${user.phoneNumber || '❌ NOT SET'}`);
      console.log('');
    });
    
    if (users.length > 0) {
      const user = users[0];
      console.log('📧 Email notifications will work:', !!user.email);
      console.log('📱 WhatsApp notifications will work:', !!user.phoneNumber);
      
      if (!user.email) {
        console.log('\n⚠️  WARNING: No email address found for user!');
        console.log('🔧 Fix: Update user profile with email address');
      }
      
      if (!user.phoneNumber) {
        console.log('\n⚠️  WARNING: No phone number found for user!');
        console.log('🔧 Fix: Update user profile with phone number');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking user profiles:', error.message);
  }
}

checkUserProfile();
