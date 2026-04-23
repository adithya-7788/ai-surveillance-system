# AI Surveillance Entrance System

Real-time surveillance platform that combines a React dashboard, a Node.js/Express API, and a Python/OpenCV/YOLO AI module to monitor entrances, track people, and raise alerts for suspicious activity with instant email and WhatsApp notifications.

## What it solves

This project helps secure monitored areas by detecting people and relevant carried objects in real time, counting entry/exit movement, and surfacing alerts in a clean dashboard with instant notifications. It is designed for practical surveillance workflows where stability, low latency, and minimal false alerts matter.

## ✨ Key Features

### 🎯 **Core Surveillance**
- Object detection for people, backpacks, handbags, and suitcases
- Real-time entry and exit alerts
- Loitering and crowd alerts
- Suspicious activity detection for carried objects
- React dashboard for live monitoring and alert review
- JWT-based authentication for protected routes

### 📧 **Email Notifications**
- **Instant Email Alerts** - Get notified immediately when alerts are created
- **📸 Snapshot Attachments** - Photos captured at the time of the alert
- **Professional HTML Formatting** - Clean, readable email layout
- **Priority-based Color Coding** - Visual severity indicators
- **Gmail Integration** - Secure App Password authentication

### 📱 **WhatsApp Notifications**
- **Instant WhatsApp Alerts** - Real-time notifications on your phone
- **Twilio Integration** - Reliable message delivery
- **Smart Error Handling** - Sandbox verification guidance
- **Phone Number Validation** - Proper format checking

### 🔧 **Advanced Features**
- **Snapshot System** - Automatic photo capture with detection overlays
- **Bounding Box Overlays** - Visual detection indicators with person/object IDs
- **Non-blocking Processing** - Notifications don't impact detection performance
- **Database Timeout Protection** - Graceful handling of connection issues
- **Comprehensive Logging** - Clear success/failure messages for debugging

## Tech Stack

### Backend
- **MongoDB** - Alert and user data storage
- **Express.js** - REST API server
- **Node.js** - Runtime environment
- **Nodemailer** - Email notifications
- **Twilio** - WhatsApp notifications

### Frontend
- **React** - Dashboard UI
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling framework

### AI Module
- **Python** - AI service language
- **OpenCV** - Image processing
- **YOLO** - Object detection model
- **FastAPI** - API framework
- **Uvicorn** - ASGI server

## Folder Structure

```text
TBP_Proj/
├── client/                     # React frontend
│   ├── src/
│   ├── package.json
│   └── .env.example
├── server/                     # Node.js backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/               # Notification services
│   ├── uploads/alerts/         # Snapshot storage
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── ai-module/                  # Python AI service
│   ├── app/
│   │   └── main.py
│   └── requirements.txt
├── docs/                       # Documentation guides
│   ├── EMAIL_NOTIFICATION_FIX.md
│   ├── SNAPSHOT_EMAIL_GUIDE.md
│   ├── WHATSAPP_SETUP_GUIDE.md
│   └── SECURE_CONFIG_GUIDE.md
└── README.md
```

## Environment Setup

### 1. Copy Environment Files
```bash
cp .env.example server/.env
cp .env.example client/.env
```

### 2. Core Configuration
```bash
# Database
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Server
PORT=5001
CLIENT_URL=http://localhost:5173

# AI Service
AI_SERVICE_URL=http://127.0.0.1:8000/detect
PYTHON_VISION_URL=http://127.0.0.1:8000/detect
VISION_API_TIMEOUT_MS=10000
```

### 3. Email Notifications (Gmail)
```bash
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 4. WhatsApp Notifications (Twilio)
```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 5. Client Configuration
```bash
# In client/.env
VITE_API_BASE_URL=http://localhost:5001/api
```

## Setup Instructions

### 1. AI Module (Python)
```bash
cd ai-module
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Backend Server (Node.js)
```bash
cd server
npm install
npm run dev
```

### 3. Frontend Client (React)
```bash
cd client
npm install
npm run dev
```

## 🚀 Notification Setup

### Email Notifications (Gmail)
1. **Enable 2-Step Verification** on your Google Account
2. **Generate App Password**: https://myaccount.google.com/apppasswords
3. **Update Environment Variables** in `server/.env`:
   ```bash
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```

### WhatsApp Notifications (Twilio)
1. **Create Twilio Account**: https://www.twilio.com
2. **Get WhatsApp Sandbox Number**: +14155238886
3. **Join Sandbox**: Send "join <sandbox_code>" to +14155238886
4. **Update Environment Variables** in `server/.env`:
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

### Test Notifications
```bash
# Test email only
curl -X POST http://localhost:5001/api/notifications/test/email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test WhatsApp only  
curl -X POST http://localhost:5001/api/notifications/test/whatsapp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test both
curl -X POST http://localhost:5001/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Run the Full System

1. **Start MongoDB** locally or use a hosted connection string
2. **Start AI Module** on port `8000`
3. **Start Backend Server** on port `5001`
4. **Start React Client** on port `5173`
5. **Configure Notifications** (see above)
6. **Sign in** and open the live camera dashboard

### Expected Startup Order
```bash
# Terminal 1: MongoDB (if running locally)
mongod

# Terminal 2: AI Module  
cd ai-module && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Backend Server
cd server && npm run dev

# Terminal 4: Frontend Client
cd client && npm run dev
```

### Verify Setup
- ✅ **AI Module**: http://localhost:8000/docs
- ✅ **Backend API**: http://localhost:5001/api/health
- ✅ **Frontend**: http://localhost:5173
- ✅ **Notifications**: Check email/WhatsApp when alerts trigger

## 🔒 Security Notes

- **Environment Variables**: `.env` files are ignored by git - never commit credentials
- **Secrets Management**: Use App Passwords for Gmail, not regular passwords
- **Twilio Security**: Keep WhatsApp credentials secure and rotate regularly
- **File Exclusions**: Large binaries, model weights, and virtualenv folders are excluded
- **HTTPS**: Use HTTPS in production for all API communications

## 📊 What to Expect

### Email Notifications
- **Subject**: `🚨 Security Alert: [Alert Type]`
- **Content**: Alert details + embedded snapshot photo
- **Delivery**: Instant when new alerts are created (`changeType: 'created'`)

### WhatsApp Notifications  
- **Format**: Text message with alert type, time, and person ID
- **Delivery**: Instant when new alerts are created
- **Sandbox**: Must join Twilio sandbox first

### Dashboard Features
- **Live Camera Feed**: Real-time video monitoring
- **Alert History**: View all past alerts with snapshots
- **User Management**: Configure email and phone numbers
- **Settings**: Adjust detection thresholds and zones

## 🚀 Future Improvements

### Planned Features
- **Multi-camera Support**: Monitor multiple camera feeds
- **Advanced Analytics**: Historical data analysis and trends
- **Mobile App**: Native mobile application for alerts
- **Cloud Deployment**: Docker and cloud hosting automation
- **Advanced AI**: Custom model training and fine-tuning

### Technical Enhancements
- **Performance Optimization**: GPU acceleration for AI processing
- **Scalability**: Horizontal scaling for multiple locations
- **Integration**: Third-party security system integrations
- **Compliance**: GDPR and privacy regulation compliance

## 📚 Documentation

### Detailed Guides
- **[Email Notification Setup](docs/EMAIL_NOTIFICATION_FIX.md)** - Complete Gmail configuration
- **[Snapshot Email Guide](docs/SNAPSHOT_EMAIL_GUIDE.md)** - Photo attachment details
- **[WhatsApp Setup Guide](docs/WHATSAPP_SETUP_GUIDE.md)** - Twilio configuration
- **[Security Configuration](docs/SECURE_CONFIG_GUIDE.md)** - Best practices

### API Documentation
- **Backend API**: http://localhost:5001/api/health
- **AI Module**: http://localhost:8000/docs
- **Notification Endpoints**: `/api/notifications/test/*`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. **Check Documentation**: Review the detailed guides in `/docs/`
2. **Test Notifications**: Use the test endpoints to verify setup
3. **Check Logs**: Monitor server logs for error messages
4. **GitHub Issues**: Open an issue for bugs or feature requests
