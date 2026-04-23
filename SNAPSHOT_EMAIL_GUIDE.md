# 📸 Snapshot Email Notifications - Complete Guide

## ✅ **FEATURE IMPLEMENTED**

Your email notifications now include **snapshot images** captured at the time of the alert!

---

## 🎯 **What You'll Receive**

When an alert occurs, you'll get an email with:

### 📧 **Email Content**
- **Subject**: `🚨 Security Alert: [Alert Type]`
- **Alert Details**: Type, Priority, Time, Person ID, Object Type
- **📸 Embedded Snapshot Image**: Photo captured at alert time
- **Professional HTML Formatting**: Clean, readable layout

### 📸 **Snapshot Features**
- **Embedded Image**: Shows directly in email (no need to download)
- **Bounding Box Overlay**: Shows detected person/object with ID
- **Optimized Size**: 540px width, 72% quality for fast loading
- **Professional Styling**: Border, caption, and proper formatting

---

## 🔧 **How It Works**

### 1. **Alert Creation**
```javascript
// When alert is created in trackingState.js
const merged = buildAlert({
  alertKey: 'entry-person-123',
  type: 'entry',
  snapshotPath: '/uploads/alerts/507f1f77bcf86cd799439011_1234567890.jpg',
  changeType: 'created' // This triggers notifications
});
```

### 2. **Snapshot Generation**
```javascript
// In alertSnapshotService.js
const snapshotPath = await createSnapshotForAlert({
  alert: merged,
  frame: detectionFrame, // Image data
  detections: allDetections
});
```

### 3. **Email with Attachment**
```javascript
// In notificationService.js
if (alert.snapshotPath) {
  emailContent.attachments = [{
    filename: `security-alert-${alert.alertKey}.jpg`,
    path: snapshotFullPath,
    cid: 'snapshot' // Embeds in HTML
  }];
}
```

---

## 📋 **Alert Types with Snapshots**

Snapshots are automatically created for these alert types:

| Alert Type | Snapshot | Description |
|------------|----------|-------------|
| ✅ `entry` | Yes | Person enters monitored area |
| ✅ `exit` | Yes | Person exits monitored area |
| ✅ `suspicious_activity` | Yes | Suspicious behavior detected |
| ✅ `loitering` | Yes | Person lingering too long |
| ✅ `crowd` | No | Crowd density alert |
| ✅ `restricted_time` | No | Entry during restricted hours |

---

## 🧪 **Testing Results**

### ✅ **Email with Snapshot**
```
📸 Snapshot attached: /uploads/alerts/test-entry-snapshot.jpg
EMAIL SENT to adhithyareddy921@gmail.com (with snapshot)
Result: ✅ SUCCESS
```

### ✅ **Email without Snapshot**
```
EMAIL SENT to adhithyareddy921@gmail.com (no snapshot)
Result: ✅ SUCCESS
```

---

## 📧 **Email Example**

### **Subject**: `🚨 Security Alert: Person Entered`

### **Body**:
```
🚨 Security Alert Detected

Alert Details:
Type: entry
Priority: MEDIUM
Time: 4/23/2026, 4:00:00 PM
Person ID: 123

📸 Activity Snapshot:
[Embedded image showing detected person with bounding box]

Snapshot captured at the time of alert

This is an automated security alert from your AI Surveillance System.
Please review the alert in your dashboard for more details.
```

---

## 🔍 **File Structure**

```
server/
├── uploads/
│   └── alerts/
│       ├── 507f1f77bcf86cd799439011_1234567890.jpg  # Snapshot files
│       └── 507f1f77bcf86cd799439011_1234567891.jpg
├── services/
│   ├── notificationService.js     # Email with snapshots
│   ├── alertSnapshotService.js   # Snapshot creation
│   └── trackingState.js          # Alert creation
└── models/
    └── Alert.js                  # Alert model with snapshotPath
```

---

## 🚀 **How to Verify**

### 1. **Check Server Logs**
Look for these messages:
```
ALERT CREATED: entry-person-123-xxx created
📸 Snapshot attached: /uploads/alerts/507f1f77bcf86cd799439011_1234567890.jpg
EMAIL SENT to adhithyareddy921@gmail.com (with snapshot)
```

### 2. **Check Your Email**
- Open alert email from your surveillance system
- Look for embedded snapshot image
- Verify bounding box overlay shows person ID

### 3. **Test Commands**
```bash
# Test email with snapshot
node test-email-with-snapshot.js

# Test real alert flow
node test-real-alert-with-snapshot.js
```

---

## ⚙️ **Configuration**

### **Environment Variables** (already set)
```bash
EMAIL_USER=adhithyareddy921@gmail.com
EMAIL_PASS=kgsmqmicbnnidqut
```

### **Snapshot Settings** (in alertSnapshotService.js)
```javascript
// Image size and quality
.resize({ width: 540, withoutEnlargement: true })
.jpeg({ quality: 72, mozjpeg: true })

// Alert types that get snapshots
const SNAPSHOT_TYPES = new Set([
  'suspicious', 'suspicious_activity', 'loitering', 
  'entry', 'exit', 'entry_exit_session'
]);
```

---

## 🎯 **Success Indicators**

When working correctly:
- ✅ **Snapshot Created**: `📸 Snapshot attached: /path/to/file.jpg`
- ✅ **Email Sent**: `EMAIL SENT to your@email.com (with snapshot)`
- ✅ **Image Embedded**: Snapshot appears directly in email
- ✅ **Bounding Box**: Person/object detection overlay visible
- ✅ **Professional Layout**: Clean HTML formatting

---

## 🔧 **Troubleshooting**

### **No Snapshot in Email**
- **Check**: Alert type supports snapshots (see table above)
- **Check**: `snapshotPath` is not null in alert data
- **Check**: Snapshot file exists in `/uploads/alerts/`

### **Snapshot Not Found**
- **Log**: `⚠️ Snapshot file not found: /path/to/file.jpg`
- **Fix**: Check file permissions and disk space

### **Email Too Large**
- **Cause**: Multiple large attachments
- **Fix**: Snapshots are optimized to 540px width, 72% quality

---

## 🎉 **Ready to Use!**

Your surveillance system now sends **rich email notifications** with **embedded snapshot images** that show exactly what triggered the alert!

**Next time someone enters your monitored area, you'll receive an email with a photo of the event!** 📸
