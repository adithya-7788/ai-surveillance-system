# 📱 WhatsApp Notifications Setup Guide

## ⚠️ Current Issue

The provided Twilio credentials are returning "Authentication Error - invalid username". This means either:
1. The Account SID is incorrect
2. The Auth Token is incorrect
3. The account is not active for WhatsApp

## 🔧 Step-by-Step Fix

### 1. Get Valid Twilio Credentials

1. **Login to Twilio Console**: https://www.twilio.com/console
2. **Get Account SID**: 
   - Dashboard → Show API Credentials
   - Copy the "Account SID" (starts with "AC")
3. **Get Auth Token**:
   - Click the "eye" icon to reveal
   - Copy the "Auth Token"

### 2. Update Environment Variables

Edit your `server/.env` file:
```bash
TWILIO_ACCOUNT_SID=your_actual_account_sid_here
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. Verify WhatsApp Sandbox

1. **Go to Twilio Console**: Messaging → Try it out → Send a WhatsApp message
2. **Get Sandbox Code**: You'll see a code like "join clever-koala"
3. **Join Sandbox**: Send "join clever-koala" to +14155238886 via WhatsApp
4. **Wait for Confirmation**: You should receive a confirmation message

## 🧪 Testing After Fix

### Method 1: Direct Test
```bash
cd server
node test-whatsapp.js
```

### Method 2: API Test
```bash
# First login to get token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email","password":"your_password"}'

# Then test WhatsApp
curl -X POST http://localhost:5001/api/notifications/test/whatsapp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210"}'
```

### Method 3: Server Logs
Start server and watch logs:
```bash
cd server
npm run dev
```

Look for:
- "Twilio initialized for WhatsApp notifications"
- "WHATSAPP TRIGGERED: entry"
- "WHATSAPP SENT to +919876543210"

## 🚨 Common Error Solutions

### "Authentication Error - invalid username"
- **Cause**: Wrong Account SID or Auth Token
- **Fix**: Double-check credentials in Twilio Console

### "Unsubscribed number"
- **Cause**: User hasn't joined Twilio sandbox
- **Fix**: Send "join <sandbox_code>" to +14155238886

### "Permission denied"
- **Cause**: Account not verified for WhatsApp
- **Fix**: Complete WhatsApp Business Profile verification

## 📋 Expected Message Format

When working, you should receive:
```
🚨 Alert Detected
Type: entry
Time: 4/23/2026, 3:30:00 PM
Person ID: 123
Please check your system.
```

## 🔍 Debugging Steps

1. **Check Server Logs**: Look for "Twilio initialized" message
2. **Verify Environment**: Ensure .env file is loaded correctly
3. **Test Directly**: Use `test-twilio-direct.js` to isolate the issue
4. **Check Twilio Console**: Verify account status and permissions

## 📞 If Still Not Working

1. **Create New Twilio Account**: Sometimes account setup issues occur
2. **Use Trial Credits**: Twilio provides trial credits for testing
3. **Contact Twilio Support**: They can help with account-specific issues

## ✅ Success Indicators

When working correctly:
- ✅ "Twilio initialized for WhatsApp notifications" in server logs
- ✅ "WHATSAPP TRIGGERED: entry" when alert is created
- ✅ "WHATSAPP SENT to +919876543210" with message SID
- ✅ Actual WhatsApp message received on phone

---

**Next Steps**: Get valid Twilio credentials from your Twilio Console and update the .env file.
