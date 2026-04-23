# 🔐 Secure Configuration Guide

## ⚠️ IMPORTANT SECURITY NOTES

- **NEVER commit .env files to version control**
- **Use App Passwords, not regular passwords**
- **Keep credentials secure and private**
- **Rotate credentials regularly**

## 📧 Gmail Configuration

### 1. Enable 2-Step Verification
1. Go to [Google Account Settings](https://myaccount.google.com)
2. Security → 2-Step Verification
3. Enable it for your account

### 2. Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" for the app
3. Select "Other (Custom name)" for the device
4. Enter "AI Surveillance System"
5. Click "Generate"
6. **Copy the 16-character password** (you won't see it again)

### 3. Configure Environment Variables
```bash
# In server/.env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password_here
```

## 💬 WhatsApp Configuration (Twilio)

### 1. Get Twilio Account
1. Sign up at [twilio.com](https://www.twilio.com)
2. Verify your phone number
3. Get your Account SID and Auth Token from the dashboard

### 2. Set Up WhatsApp Sandbox
1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Follow the setup instructions
3. Get your sandbox number (usually +14155238886)

### 3. Configure Environment Variables
```bash
# In server/.env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 4. Join WhatsApp Sandbox
1. Send "join <your-sandbox-key>" to the Twilio WhatsApp number
2. Wait for the confirmation message
3. Your number is now verified for testing

## 🔧 Environment Setup

### 1. Create .env file
```bash
cd server
cp .env.example .env
```

### 2. Edit .env with your credentials
```bash
# Database
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Other settings
PORT=5001
CLIENT_URL=http://localhost:5173
```

### 3. Verify .gitignore
Ensure `.env` is in your `.gitignore`:
```gitignore
# Environment variables
.env
.env.local
.env.production
```

## 🧪 Testing Configuration

### Test Email Only
```bash
curl -X POST http://localhost:5001/api/notifications/test/email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test WhatsApp Only
```bash
curl -X POST http://localhost:5001/api/notifications/test/whatsapp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Both
```bash
curl -X POST http://localhost:5001/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 Common Issues & Solutions

### Email Issues

**Error**: "Authentication failed"
- **Solution**: Use Gmail App Password, not regular password
- **Check**: 2-Step Verification is enabled
- **Check**: App Password is correctly copied (16 characters)

**Error**: "Connection refused"
- **Solution**: Check internet connection
- **Check**: Firewall settings
- **Check**: Gmail service is accessible

### WhatsApp Issues

**Error**: "Unsubscribed number"
- **Solution**: Join Twilio sandbox first
- **Command**: Send "join <sandbox-key>" to the Twilio number

**Error**: "Permission denied"
- **Solution**: Check Twilio account permissions
- **Check**: Account SID and Auth Token are correct

**Error**: "Invalid phone format"
- **Solution**: Use format +1234567890
- **Check**: Country code is included

## 🔍 Debugging

### Enable Verbose Logging
Add this to your server startup:
```bash
DEBUG=nodemailer:* npm run dev
```

### Check Configuration
```javascript
// Test configuration in Node.js console
console.log('Email configured:', !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS);
console.log('WhatsApp configured:', !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN);
```

### Monitor Server Logs
```bash
# Watch for notification logs
tail -f logs/app.log | grep "EMAIL\|WHATSAPP\|NOTIFICATION"
```

## 📋 Security Checklist

- [ ] Gmail 2-Step Verification enabled
- [ ] Using Gmail App Password (not regular password)
- [ ] Twilio credentials are valid
- [ ] WhatsApp sandbox joined
- [ ] .env file is in .gitignore
- [ ] No credentials in code
- [ ] Regular password rotation scheduled
- [ ] Monitoring for failed notifications

## 🆘 Support

If you encounter issues:

1. **Check server logs** for detailed error messages
2. **Verify environment variables** are correctly set
3. **Test each service individually** using the test endpoints
4. **Consult the logs** - they provide specific error details

## 📚 Additional Resources

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp/api)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Environment Variables Best Practices](https://12factor.net/config)
