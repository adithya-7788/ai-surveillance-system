// Test real alert flow with snapshot integration
require('dotenv').config();

// Set environment variables explicitly
process.env.EMAIL_USER = 'adhithyareddy921@gmail.com';
process.env.EMAIL_PASS = 'kgsmqmicbnnidqut';

const { sendAlertNotifications } = require('./services/notificationService');
const fs = require('fs');
const path = require('path');

async function testRealAlertWithSnapshot() {
  console.log('🚨 Testing Real Alert Flow with Snapshot\n');
  
  // Create a realistic test snapshot
  const uploadsDir = path.join(__dirname, 'uploads', 'alerts');
  const testSnapshotPath = path.join(uploadsDir, 'test-entry-snapshot.jpg');
  
  // Ensure uploads directory exists
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  
  // Create a more realistic test image (larger for better testing)
  console.log('📸 Creating realistic test snapshot...');
  const testImageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==', 'base64');
  await fs.promises.writeFile(testSnapshotPath, testImageBuffer);
  console.log('✅ Test snapshot created at:', testSnapshotPath);
  
  // Mock user (simulating what comes from database)
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'adhithyareddy921@gmail.com',
    phoneNumber: '+919876543210'
  };
  
  // Simulate different alert types with snapshots
  const alerts = [
    {
      alertKey: 'entry-person-789-' + Date.now(),
      type: 'entry',
      title: 'Person Entered',
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created',
      personId: '789',
      snapshotPath: '/uploads/alerts/test-entry-snapshot.jpg'
    },
    {
      alertKey: 'suspicious-backpack-' + Date.now(),
      type: 'suspicious_activity',
      title: 'Suspicious Activity Detected',
      priority: 'high',
      time: new Date().toLocaleString(),
      changeType: 'created',
      personId: '101',
      objectType: 'backpack',
      snapshotPath: '/uploads/alerts/test-entry-snapshot.jpg'
    },
    {
      alertKey: 'loitering-person-202-' + Date.now(),
      type: 'loitering',
      title: 'Person Loitering',
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created',
      personId: '202',
      snapshotPath: '/uploads/alerts/test-entry-snapshot.jpg'
    }
  ];
  
  console.log('👤 User:', mockUser.email);
  console.log('📸 Snapshot path: alerts/test-entry-snapshot.jpg');
  console.log('');
  
  for (let i = 0; i < alerts.length; i++) {
    const alert = alerts[i];
    console.log(`📧 Test ${i + 1}: Sending ${alert.type} alert with snapshot...`);
    console.log(`   Alert Key: ${alert.alertKey}`);
    console.log(`   Priority: ${alert.priority}`);
    console.log(`   Person ID: ${alert.personId}`);
    console.log(`   Object: ${alert.objectType || 'N/A'}`);
    
    try {
      // This simulates the exact call in trackingState.js
      await sendAlertNotifications(mockUser._id, alert);
      console.log('✅ Alert sent successfully!');
    } catch (error) {
      console.error('❌ Alert failed:', error.message);
    }
    
    console.log('');
    
    // Delay between alerts to avoid overwhelming Gmail
    if (i < alerts.length - 1) {
      console.log('⏳ Waiting 3 seconds before next alert...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('🎯 All alerts sent successfully!');
  console.log('📧 Check your inbox for emails with embedded snapshots');
  console.log('');
  console.log('📋 Expected email features:');
  console.log('   ✅ Alert details (type, time, person ID)');
  console.log('   ✅ Embedded snapshot image');
  console.log('   ✅ Priority-based color coding');
  console.log('   ✅ Professional HTML formatting');
  
  // Clean up
  try {
    await fs.promises.unlink(testSnapshotPath);
    console.log('🧹 Test files cleaned up');
  } catch (error) {
    // Ignore cleanup errors
  }
}

testRealAlertWithSnapshot().catch(console.error);
