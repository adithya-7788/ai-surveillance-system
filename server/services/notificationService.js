const nodemailer = require('nodemailer');
const twilio = require('twilio');
const User = require('../models/User');

// Log Twilio initialization on server start
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
  console.log('Twilio initialized for WhatsApp notifications');
} else {
  console.warn('Twilio configuration missing. WhatsApp notifications will be disabled.');
}

// Validate email configuration
const validateEmailConfig = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    console.warn('EMAIL_USER or EMAIL_PASS not configured. Email notifications will be skipped.');
    return false;
  }
  
  if (!emailUser.includes('@gmail.com')) {
    console.warn('EMAIL_USER should be a Gmail address for optimal compatibility.');
  }
  
  return true;
};

// Email configuration with security validation
const createEmailTransporter = () => {
  if (!validateEmailConfig()) {
    return null;
  }
  
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add security settings
      tls: {
        rejectUnauthorized: true
      }
    });
  } catch (error) {
    console.error('EMAIL CONFIG ERROR: Failed to create email transporter:', error.message);
    return null;
  }
};

// Validate WhatsApp configuration
const validateWhatsAppConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
  
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM not configured. WhatsApp notifications will be skipped.');
    return false;
  }
  
  if (!accountSid.startsWith('AC')) {
    console.warn('TWILIO_ACCOUNT_SID should start with "AC".');
  }
  
  if (!fromNumber.startsWith('whatsapp:+')) {
    console.warn('TWILIO_WHATSAPP_FROM should start with "whatsapp:+".');
  }
  
  return true;
};

// WhatsApp configuration with security validation
const createWhatsAppClient = () => {
  if (!validateWhatsAppConfig()) {
    return null;
  }
  
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    return twilio(accountSid, authToken);
  } catch (error) {
    console.error('WHATSAPP CONFIG ERROR: Failed to create Twilio client:', error.message);
    return null;
  }
};

// Send email notification with enhanced validation and snapshot attachment
const sendEmailNotification = async (user, alert) => {
  try {
    // Data validation
    if (!user || !user.email) {
      console.log('EMAIL FAILED: No email address found for user');
      return false;
    }

    if (!alert || !alert.alertKey) {
      console.log('EMAIL FAILED: Invalid alert data');
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      console.log(`EMAIL FAILED: Invalid email format: ${user.email}`);
      return false;
    }

    const transporter = createEmailTransporter();
    if (!transporter) {
      console.log('EMAIL FAILED: Email transporter not available - check configuration');
      return false;
    }
    
    // Prepare email content
    const emailContent = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `🚨 Security Alert: ${alert.title || 'Unknown Alert'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc3545; margin: 0;">🚨 Security Alert Detected</h2>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="color: #495057; margin-top: 0;">Alert Details:</h3>
            
            <div style="margin-bottom: 15px;">
              <strong>Type:</strong> ${alert.type || 'Unknown'}<br>
              <strong>Priority:</strong> <span style="color: ${getPriorityColor(alert.priority)}; font-weight: bold;">${(alert.priority || 'low').toUpperCase()}</span><br>
              <strong>Time:</strong> ${alert.time || new Date().toLocaleString()}<br>
              ${alert.personId ? `<strong>Person ID:</strong> ${alert.personId}<br>` : ''}
              ${alert.objectType ? `<strong>Object:</strong> ${alert.objectType}<br>` : ''}
            </div>
            
            ${alert.snapshotPath ? `
              <div style="margin: 20px 0;">
                <h4 style="color: #495057; margin-bottom: 10px;">📸 Activity Snapshot:</h4>
                <div style="text-align: center; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                  <img src="cid:snapshot" alt="Security Alert Snapshot" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #dee2e6;">
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #6c757d; font-style: italic;">
                    Snapshot captured at the time of alert
                  </p>
                </div>
              </div>
            ` : ''}
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="margin: 0; color: #6c757d;">
                This is an automated security alert from your AI Surveillance System. 
                Please review the alert in your dashboard for more details.
              </p>
            </div>
          </div>
        </div>
      `,
    };
    
    // Add snapshot attachment if available
    if (alert.snapshotPath) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Construct full path to snapshot
        const snapshotFullPath = path.join(__dirname, '..', alert.snapshotPath);
        
        // Check if file exists
        if (fs.existsSync(snapshotFullPath)) {
          emailContent.attachments = [{
            filename: `security-alert-${alert.alertKey}.jpg`,
            path: snapshotFullPath,
            cid: 'snapshot' // This matches the cid in the HTML img tag
          }];
          console.log(`📸 Snapshot attached: ${alert.snapshotPath}`);
        } else {
          console.log(`⚠️ Snapshot file not found: ${snapshotFullPath}`);
        }
      } catch (attachmentError) {
        console.error(`⚠️ Failed to attach snapshot: ${attachmentError.message}`);
        // Continue without attachment - don't fail the email
      }
    }

    await transporter.sendMail(emailContent);
    console.log(`EMAIL SENT to ${user.email} for alert ${alert.alertKey} ${alert.snapshotPath ? '(with snapshot)' : '(no snapshot)'}`);
    return true;
  } catch (error) {
    // Enhanced error logging
    if (error.code === 'EAUTH') {
      console.error(`EMAIL FAILED: Authentication failed for ${user.email}. Check EMAIL_USER and EMAIL_PASS (use App Password, not regular password)`);
    } else if (error.code === 'ECONNECTION') {
      console.error(`EMAIL FAILED: Connection failed for ${user.email}. Check internet connection`);
    } else {
      console.error(`EMAIL FAILED to ${user.email}: ${error.message}`);
    }
    return false;
  }
};

// Send WhatsApp notification with enhanced validation and logging for real delivery
const sendWhatsAppNotification = async (user, alert) => {
  try {
    // Data validation
    if (!user || !user.phoneNumber) {
      console.log('WHATSAPP FAILED: No phone number found for user');
      return false;
    }

    if (!alert || !alert.alertKey) {
      console.log('WHATSAPP FAILED: Invalid alert data');
      return false;
    }

    // Enhanced phone number validation
    let phoneNumber = user.phoneNumber.trim();
    
    // Remove any spaces, dashes, or parentheses
    phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Ensure starts with +
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }
    
    // Validate phone format (should be 10-15 digits after +)
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.log(`WHATSAPP FAILED: Invalid phone format: ${phoneNumber}. Use format: +1234567890`);
      return false;
    }

    const client = createWhatsAppClient();
    if (!client) {
      console.log('WHATSAPP FAILED: WhatsApp client not available - check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM');
      return false;
    }

    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
    const toNumber = `whatsapp:${phoneNumber}`;

    // Construct proper message format
    const alertTime = alert.time || new Date().toLocaleString();
    const alertType = alert.type || 'Unknown';
    const personId = alert.personId || 'N/A';
    
    const messageBody = `🚨 Alert Detected\nType: ${alertType}\nTime: ${alertTime}\nPerson ID: ${personId}\nPlease check your system.`;

    console.log(`WHATSAPP TRIGGERED: ${alertType} for alert ${alert.alertKey}`);

    const message = await client.messages.create({
      body: messageBody,
      from: fromNumber,
      to: toNumber,
    });

    console.log(`WHATSAPP SENT to ${phoneNumber} for alert ${alert.alertKey} (SID: ${message.sid})`);
    return true;
  } catch (error) {
    // Enhanced error logging with specific Twilio error codes
    if (error.code === 21610) {
      console.error(`WHATSAPP FAILED: Unsubscribed number or user has not joined Twilio sandbox.`);
      console.error(`Join Twilio sandbox: Send 'join <sandbox_code>' to +14155238886 via WhatsApp`);
    } else if (error.code === 21612) {
      console.error(`WHATSAPP FAILED: Media type not supported in sandbox`);
    } else if (error.code === 21408) {
      console.error(`WHATSAPP FAILED: Permission denied. Check Twilio account permissions`);
    } else if (error.code === 21614) {
      console.error(`WHATSAPP FAILED: Phone number is incapable of receiving WhatsApp messages`);
    } else if (error.code === 21611) {
      console.error(`WHATSAPP FAILED: The 'To' phone number is not currently reachable via WhatsApp`);
    } else {
      console.error(`WHATSAPP FAILED: ${error.message}`);
    }
    return false;
  }
};

// Get priority color for email styling
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#dc3545';
    case 'medium': return '#ffc107';
    case 'low': return '#28a745';
    case 'info': return '#17a2b8';
    default: return '#6c757d';
  }
};

// Main notification function - send notifications for newly created alerts only
const sendAlertNotifications = async (userId, alert) => {
  // Strict validation: Only send notifications for newly created alerts
  if (!alert || alert.changeType !== 'created') {
    return; // Silently ignore updates, only process new alerts
  }

  try {
    // Fetch user details with timeout handling
    let user;
    try {
      user = await User.findById(userId).maxTimeMS(5000); // 5 second timeout
    } catch (dbError) {
      console.error(`NOTIFICATION FAILED: Database timeout for user ${userId}: ${dbError.message}`);
      console.log('🔧 Fix: Check MongoDB connection or use fallback user data');
      return;
    }
    
    if (!user) {
      console.log(`NOTIFICATION FAILED: User not found for ID: ${userId}`);
      return;
    }

    console.log(`Processing notifications for alert ${alert.alertKey} (user: ${user.email || user.phoneNumber || 'unknown'})`);

    // Send notifications asynchronously without blocking main detection pipeline
    const notificationPromises = [];

    // Add email notification if user has valid email
    if (user.email && user.email.trim() !== '') {
      notificationPromises.push(
        sendEmailNotification(user, alert).catch(error => {
          console.error(`Email notification error for ${user.email}:`, error.message);
          return false;
        })
      );
    }

    // Add WhatsApp notification if user has valid phone number
    if (user.phoneNumber && user.phoneNumber.trim() !== '') {
      notificationPromises.push(
        sendWhatsAppNotification(user, alert).catch(error => {
          console.error(`WhatsApp notification error for ${user.phoneNumber}:`, error.message);
          return false;
        })
      );
    }

    // Process notifications asynchronously without blocking
    if (notificationPromises.length > 0) {
      // Fire and forget - don't await to avoid blocking detection pipeline
      Promise.allSettled(notificationPromises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value !== true)).length;
        
        if (successful > 0) {
          console.log(`NOTIFICATION SUCCESS: ${successful} notifications sent for alert ${alert.alertKey}`);
        }
        if (failed > 0) {
          console.log(`NOTIFICATION FAILED: ${failed} notifications failed for alert ${alert.alertKey}`);
        }
      }).catch(error => {
        console.error(`Notification processing error for alert ${alert.alertKey}:`, error.message);
      });
    } else {
      console.log(`NOTIFICATION SKIPPED: No email or phone number found for user ${userId}`);
    }

  } catch (error) {
    console.error(`CRITICAL NOTIFICATION ERROR for alert ${alert.alertKey}:`, error.message);
    // Don't throw - continue with detection pipeline
  }
};

// Test email notification only
const testEmailNotification = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const testAlert = {
      alertKey: 'test-email-' + Date.now(),
      type: 'test',
      title: 'Test Email Notification',
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created',
      snapshotPath: null // Test without snapshot by default
    };

    const result = await sendEmailNotification(user, testAlert);
    if (result) {
      console.log('Test email notification sent successfully');
      return { success: true, message: 'Email test successful' };
    } else {
      return { success: false, message: 'Email test failed' };
    }
  } catch (error) {
    console.error('Failed to send test email notification:', error.message);
    return { success: false, message: error.message };
  }
};

// Test WhatsApp notification only
const testWhatsAppNotification = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const testAlert = {
      alertKey: 'test-whatsapp-' + Date.now(),
      type: 'test',
      title: 'Test WhatsApp Notification',
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created',
    };

    const result = await sendWhatsAppNotification(user, testAlert);
    if (result) {
      console.log('Test WhatsApp notification sent successfully');
      return { success: true, message: 'WhatsApp test successful' };
    } else {
      return { success: false, message: 'WhatsApp test failed' };
    }
  } catch (error) {
    console.error('Failed to send test WhatsApp notification:', error.message);
    return { success: false, message: error.message };
  }
};

// Test both notifications
const testNotifications = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const testAlert = {
      alertKey: 'test-alert-' + Date.now(),
      type: 'test',
      title: 'Test Notification',
      priority: 'medium',
      time: new Date().toLocaleString(),
      changeType: 'created',
    };

    await sendAlertNotifications(userId, testAlert);
    console.log('Test notifications sent successfully');
    return { success: true, message: 'Test notifications sent' };
  } catch (error) {
    console.error('Failed to send test notifications:', error.message);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendAlertNotifications,
  sendEmailNotification,
  sendWhatsAppNotification,
  testNotifications,
  testEmailNotification,
  testWhatsAppNotification,
};
