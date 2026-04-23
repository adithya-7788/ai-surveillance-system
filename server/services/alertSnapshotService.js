const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const Alert = require('../models/Alert');

const SNAPSHOT_DIR = path.join(__dirname, '..', 'uploads', 'alerts');
const SNAPSHOT_TYPES = new Set([
  'suspicious',
  'suspicious_activity',
  'loitering',
  'entry',
  'exit',
  'entry_exit_session',
]);

const parseBase64Image = (imageData) => {
  if (typeof imageData !== 'string') return null;
  const [header, rawBody] = imageData.includes(',') ? imageData.split(',', 2) : ['data:image/jpeg;base64', imageData];
  const mimeType = header.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
  const body = (rawBody || '').replace(/\s/g, '');
  if (!body) return null;
  return {
    mimeType,
    buffer: Buffer.from(body, 'base64'),
  };
};

const toSnapshotSource = ({ frame, imageData }) => {
  if (frame?.buffer && Buffer.isBuffer(frame.buffer) && frame.buffer.length > 0) {
    return {
      mimeType: frame.mimeType || 'image/jpeg',
      buffer: frame.buffer,
      source: 'frame-buffer',
    };
  }

  if (typeof frame?.base64 === 'string' && frame.base64.length > 0) {
    return {
      mimeType: frame.mimeType || 'image/jpeg',
      buffer: Buffer.from(frame.base64, 'base64'),
      source: 'frame-base64',
    };
  }

  const parsedFromImageData = parseBase64Image(imageData);
  if (parsedFromImageData?.buffer?.length) {
    return {
      ...parsedFromImageData,
      source: 'imageData',
    };
  }

  return null;
};

const getDetectionForAlert = (alert, detections = []) => {
  if (!Number.isFinite(Number(alert?.personId))) return null;
  const personId = Number(alert.personId);
  return detections.find((det) => Number(det?.id) === personId) || null;
};

const buildOverlaySvg = (width, height, detection) => {
  if (!detection) return null;
  const x = Math.max(0, Math.round(Number(detection.x || 0) * width));
  const y = Math.max(0, Math.round(Number(detection.y || 0) * height));
  const w = Math.max(1, Math.round(Number(detection.w || 0) * width));
  const h = Math.max(1, Math.round(Number(detection.h || 0) * height));
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#22d3ee" stroke-width="3"/>
      <rect x="${x}" y="${Math.max(0, y - 22)}" width="80" height="20" fill="#22d3ee"/>
      <text x="${x + 6}" y="${Math.max(14, y - 8)}" font-size="12" fill="#0f172a" font-family="Arial, sans-serif">ID ${Number(detection.id)}</text>
    </svg>`
  );
};

const createSnapshotForAlert = async ({ alert, frame, imageData, detections }) => {
  console.log('SNAPSHOT FUNCTION CALLED');
  console.log('FRAME EXISTS:', Boolean(frame?.buffer || frame?.base64 || imageData));
  if (!alert?.alertKey || !SNAPSHOT_TYPES.has(alert.type)) return null;
  const latest = await Alert.findOne({ userId: alert.userId, alertKey: alert.alertKey })
    .select('_id snapshotPath personId type')
    .lean();
  if (!latest || latest.snapshotPath) return null;

  const snapshotSource = toSnapshotSource({ frame, imageData });
  if (!snapshotSource || !snapshotSource.buffer?.length) {
    console.error('Snapshot skipped: frame missing');
    return null;
  }

  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });

  const fileName = `${String(latest._id)}_${Date.now()}.jpg`;
  const filePath = path.join(SNAPSHOT_DIR, fileName);
  const relativePath = `/uploads/alerts/${fileName}`;
  console.log('WRITING IMAGE TO:', filePath);

  const detection = getDetectionForAlert(latest, detections);
  console.log('SNAPSHOT SOURCE:', snapshotSource.source);
  let pipeline = sharp(snapshotSource.buffer).rotate().resize({ width: 540, withoutEnlargement: true });
  const metadata = await pipeline.metadata();
  const width = Number(metadata.width || 540);
  const height = Number(metadata.height || 360);
  const overlay = buildOverlaySvg(width, height, detection);
  if (overlay) {
    pipeline = pipeline.composite([{ input: overlay }]);
  }

  await pipeline.jpeg({ quality: 72, mozjpeg: true }).toFile(filePath);

  await Alert.updateOne(
    { _id: latest._id, snapshotPath: null },
    { $set: { snapshotPath: relativePath, lastUpdatedTime: new Date() } }
  );

  console.log(`[alerts:snapshot] saved alertKey=${alert.alertKey} path=${relativePath}`);

  return relativePath;
};

const scheduleSnapshotsForAlerts = ({ userId, frame, imageData, detections = [], createdAlerts = [] }) => {
  if (!userId || (!frame && !imageData) || !Array.isArray(createdAlerts) || createdAlerts.length === 0) return;
  const uniqueByKey = new Map();
  for (const alert of createdAlerts) {
    if (!alert?.alertKey || uniqueByKey.has(alert.alertKey)) continue;
    uniqueByKey.set(alert.alertKey, alert);
  }

  for (const alert of uniqueByKey.values()) {
    createSnapshotForAlert({
      alert: { ...alert, userId },
      frame,
      imageData,
      detections,
    }).catch((error) => {
      console.error(`Snapshot capture failed for ${alert.alertKey}:`, error.message);
    });
  }
};

module.exports = {
  scheduleSnapshotsForAlerts,
};
