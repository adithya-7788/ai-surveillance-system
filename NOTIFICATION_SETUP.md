# Notification System Setup

This document explains how to configure email and WhatsApp notifications for the AI Surveillance System.

## 📧 Email Notifications (Gmail)

### Prerequisites
- Gmail account
- 2-Step Verification enabled on your Google Account
- App Password generated

### Setup Steps

1. **Enable 2-Step Verification**
   - Go to your Google Account settings
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to Google Account → Security → App Passwords
   - Select "Mail" for the app and "Other (Custom name)" for the device
   - Enter "AI Surveillance System" as the name
   - Copy the generated 16-character password

3. **Configure Environment Variables**
   ```bash
   # In server/.env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```

## 💬 WhatsApp Notifications (Twilio)

### Prerequisites
- Twilio account
- WhatsApp-enabled Twilio phone number

### Setup Steps

1. **Create Twilio Account**
   - Sign up at https://www.twilio.com
   - Verify your phone number

2. **Get WhatsApp Sandbox Number**
   - Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Follow the setup process to get a WhatsApp number

3. **Get Credentials**
   - Account SID: Found in Twilio Console dashboard
   - Auth Token: Found in Twilio Console dashboard
   - Phone Number: Your Twilio WhatsApp number (format: +14155238886)

4. **Configure Environment Variables**
   ```bash
   # In server/.env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+14155238886
   ```

## 👤 User Profile Setup

Ensure your user profile has the correct contact information:

1. **Email Address**: Set in user profile
2. **Phone Number**: Set in user profile (include country code, e.g., +1234567890)

## 🧪 Testing Notifications

### Test via API
```bash
# First, login to get auth token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email","password":"your_password"}'

# Then test notifications
curl -X POST http://localhost:5001/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test by Triggering Alerts
1. Start the surveillance system
2. Walk in front of the camera to trigger entry/exit alerts
3. Check your email and WhatsApp for notifications

## 🔧 Troubleshooting

### Email Issues
- **"Invalid login"**: Ensure you're using an App Password, not your regular password
- **"Connection refused"**: Check your internet connection and Gmail settings
- **No email received**: Check spam folder

### WhatsApp Issues
- **"Number not connected"**: Ensure your Twilio WhatsApp number is properly configured
- **"Media unsupported"**: Twilio sandbox has limitations on media types
- **No message received**: Ensure the recipient number is in the correct format (+countrycode)

### General Issues
- **No notifications**: Check server logs for error messages
- **Environment variables**: Ensure all required variables are set in server/.env
- **User data**: Verify user profile has correct email and phone number

## 📝 Notification Content

### Email Format
- Subject: `🚨 Security Alert: [Alert Type]`
- Includes alert type, priority, time, person ID (if available)
- HTML formatted with proper styling

### WhatsApp Format
```
🚨 Alert Detected
Type: [alert type]
Time: [timestamp]
Person ID: [id] (if available)
Object: [object type] (if available)
```

## 🚨 Important Notes

- **Security**: Never commit your .env file to version control
- **Rate Limits**: Both Gmail and Twilio have rate limits
- **Cost**: Twilio WhatsApp messages incur costs per message
- **Privacy**: Ensure compliance with privacy regulations in your region
