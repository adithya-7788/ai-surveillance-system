// Test email with snapshot attachment
require('dotenv').config();

// Set environment variables explicitly
process.env.EMAIL_USER = 'adhithyareddy921@gmail.com';
process.env.EMAIL_PASS = 'kgsmqmicbnnidqut';

const { sendEmailNotification } = require('./services/notificationService');
const fs = require('fs');
const path = require('path');

async function testEmailWithSnapshot() {
  console.log('📧 Testing Email with Snapshot Attachment\n');
  
  // Create a mock image for testing (since we might not have real snapshots)
  const testImagePath = path.join(__dirname, 'test-snapshot.jpg');
  
  // Create a simple test image if it doesn't exist
  if (!fs.existsSync(testImagePath)) {
    console.log('📸 Creating test snapshot image...');
    // Create a simple 1x1 pixel JPEG for testing
    const testImageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==', 'base64');
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('✅ Test snapshot created');
  }
  
  const testUser = {
    email: 'adhithyareddy921@gmail.com',
    phoneNumber: '+919876543210'
  };
  
  // Test 1: Email with snapshot
  console.log('📧 Test 1: Email WITH snapshot attachment');
  const alertWithSnapshot = {
    alertKey: 'test-with-snapshot-' + Date.now(),
    type: 'entry',
    title: 'Person Entered - WITH SNAPSHOT',
    priority: 'medium',
    time: new Date().toLocaleString(),
    changeType: 'created',
    personId: '123',
    snapshotPath: '/test-snapshot.jpg' // Relative path from server directory
  };
  
  try {
    const result1 = await sendEmailNotification(testUser, alertWithSnapshot);
    console.log('Result:', result1 ? '✅ SUCCESS' : '❌ FAILED');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n⏳ Waiting 2 seconds before next test...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Email without snapshot
  console.log('📧 Test 2: Email WITHOUT snapshot attachment');
  const alertWithoutSnapshot = {
    alertKey: 'test-without-snapshot-' + Date.now(),
    type: 'exit',
    title: 'Person Exited - NO SNAPSHOT',
    priority: 'medium',
    time: new Date().toLocaleString(),
    changeType: 'created',
    personId: '456',
    snapshotPath: null
  };
  
  try {
    const result2 = await sendEmailNotification(testUser, alertWithoutSnapshot);
    console.log('Result:', result2 ? '✅ SUCCESS' : '❌ FAILED');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🎯 Test completed!');
  console.log('📧 Check your inbox for two emails:');
  console.log('   1. Email with embedded snapshot image');
  console.log('   2. Email without snapshot (text only)');
  
  // Clean up test image
  try {
    fs.unlinkSync(testImagePath);
    console.log('🧹 Test image cleaned up');
  } catch (error) {
    // Ignore cleanup errors
  }
}

testEmailWithSnapshot();
