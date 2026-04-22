const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Alert = require('../models/Alert');
const { runVisionDetection } = require('../services/visionService');
const {
  toRelativeDetections,
  updateStateWithFrame,
  getVisionState,
  formatISTDateTime,
} = require('../services/trackingState');

const inFlightUsers = new Set();
const latestFrameResponseByUser = new Map();

const serializeAlert = (alert) => ({
  id: alert._id.toString(),
  alertKey: alert.alertKey,
  type: alert.type,
  title: alert.title,
  timestamp: alert.timestamp.toISOString(),
  time: formatISTDateTime(alert.timestamp),
  status: alert.status,
  personId: alert.personId ?? null,
  objectType: alert.objectType ?? null,
  metadata: alert.metadata || {},
  resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
});

const persistAlertChanges = async (userId, changes) => {
  if (!Array.isArray(changes) || changes.length === 0) {
    return;
  }

  await Promise.all(
    changes.map((alert) =>
      Alert.findOneAndUpdate(
        { userId, alertKey: alert.alertKey },
        {
          userId,
          alertKey: alert.alertKey,
          type: alert.type,
          title: alert.title,
          timestamp: new Date(alert.timestamp),
          status: alert.status,
          personId: alert.personId ?? null,
          objectType: alert.objectType ?? null,
          metadata: alert.metadata || {},
          resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : null,
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      )
    )
  );
};

const getObjectObservations = (visionResponse, requestBody) => {
  // Extract objects from AI service response (detections with non-person classes)
  const detections = Array.isArray(visionResponse?.detections) ? visionResponse.detections : [];
  const allowedObjectClasses = ['backpack', 'handbag', 'suitcase'];
  
  const objects = detections
    .filter((det) => det && allowedObjectClasses.includes(String(det.class || '').toLowerCase()))
    .map((det, index) => ({
      id: det.id ?? index,
      class: det.class,
      class_name: det.class,
      x: det.x,
      y: det.y,
      w: det.w,
      h: det.h,
    }));

  if (objects.length > 0) {
    return objects;
  }

  // Fallback to request body if provided
  const candidates = [requestBody?.objectObservations, requestBody?.objects];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const normalizeObjectObservations = (objects, frameWidth, frameHeight) => {
  return objects
    .map((item, index) => {
      const x = Number(item?.x);
      const y = Number(item?.y);
      const w = Number(item?.w);
      const h = Number(item?.h);

      if (![x, y, w, h].every(Number.isFinite)) {
        return null;
      }

      const isRelative = x <= 1 && y <= 1 && w <= 1 && h <= 1;
      const normalizedX = isRelative ? x : x / frameWidth;
      const normalizedY = isRelative ? y : y / frameHeight;
      const normalizedW = isRelative ? w : w / frameWidth;
      const normalizedH = isRelative ? h : h / frameHeight;

      const objectType = String(item?.class || item?.class_name || item?.objectType || item?.className || item?.label || 'object').toLowerCase();

      return {
        id: String(item?.id ?? item?.objectId ?? item?.trackerId ?? index),
        objectType,
        class: objectType,
        personId: Number.isFinite(Number(item?.personId)) ? Number(item.personId) : null,
        pickedUp: Boolean(item?.pickedUp ?? item?.picked_up ?? item?.state === 'picked_up'),
        stationary: Boolean(item?.stationary ?? item?.isStationary ?? item?.is_stationary),
        x: normalizedX,
        y: normalizedY,
        w: normalizedW,
        h: normalizedH,
        cx: normalizedX + normalizedW / 2,
        cy: normalizedY + normalizedH / 2,
      };
    })
    .filter(Boolean);
};

const isBase64Image = (value) => {
  if (typeof value !== 'string' || value.length < 40) return false;

  const base64Body = value.includes(',') ? value.split(',').pop() : value;
  return /^[A-Za-z0-9+/=\r\n]+$/.test(base64Body);
};

const postVisionFrame = async (req, res, next) => {
  const userId = String(req.user._id);

  if (inFlightUsers.has(userId)) {
    const cached = latestFrameResponseByUser.get(userId);
    if (cached) {
      return res.status(200).json({
        ...cached,
        dropped: true,
      });
    }

    return res.status(429).json({ message: 'Vision processor busy. Frame dropped, retry next frame.' });
  }

  inFlightUsers.add(userId);

  try {
    const { image } = req.body || {};

    if (!isBase64Image(image)) {
      return res.status(400).json({ message: 'Invalid image payload. Expected base64 image string.' });
    }

    const [visionResponse, config, settings] = await Promise.all([
      runVisionDetection(image),
      Config.findOne({ userId: req.user._id }).select('entryLine insideDirection restrictedZones zoneMask insideMask roiMask'),
      Settings.findOne({ userId: req.user._id }).lean(),
    ]);

    const frameWidth = Number(visionResponse?.frameWidth);
    const frameHeight = Number(visionResponse?.frameHeight);
    const detections = Array.isArray(visionResponse?.detections) ? visionResponse.detections : [];

    if (!frameWidth || !frameHeight) {
      return res.status(502).json({ message: 'AI service returned invalid frame dimensions.' });
    }

    const relativeDetections = toRelativeDetections(detections, frameWidth, frameHeight);
    const objectObservations = normalizeObjectObservations(
      getObjectObservations(visionResponse, req.body || {}),
      frameWidth,
      frameHeight
    );
    const state = updateStateWithFrame({
      userId,
      detections: relativeDetections,
      entryLine: config?.entryLine || null,
      insideDirection: config?.insideDirection || null,
      restrictedZones: config?.restrictedZones || [],
      settings,
      objectObservations,
      zoneMask: config?.zoneMask || null,
      insideMask: config?.insideMask || null,
      roiMask: config?.roiMask || null,
    });

    const detectionAnnotations = state.detectionAnnotations || {};

    await persistAlertChanges(userId, state.changes);

    const responsePayload = {
      detections: relativeDetections.map(({ cx, cy, ...rest }) => {
        const annotations = detectionAnnotations[String(rest.id)] || detectionAnnotations[Number(rest.id)] || {};
        return {
          ...rest,
          zoneInside: Boolean(annotations.zoneInside),
          zoneDurationSeconds: Number(annotations.zoneDurationSeconds || 0),
          roiInside: Boolean(annotations.roiInside),
          roiDurationSeconds: Number(annotations.roiDurationSeconds || 0),
        };
      }),
      stats: state.stats,
      alerts: state.alerts.slice(0, 20),
      dropped: false,
    };

    latestFrameResponseByUser.set(userId, responsePayload);

    return res.status(200).json(responsePayload);
  } catch (error) {
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EAI_AGAIN' ||
      error.code === 'ECONNRESET'
    ) {
      return res.status(503).json({ message: 'AI service offline. Start the Python AI service and try again.' });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'AI service timeout. Please try again.' });
    }

    if (error.response) {
      return res.status(502).json({ message: error.response.data?.message || 'AI service failed.' });
    }

    return next(error);
  } finally {
    inFlightUsers.delete(userId);
  }
};

const getVisionSummary = async (req, res, next) => {
  try {
    const state = getVisionState(String(req.user._id));

    return res.status(200).json({
      stats: state.stats,
      alerts: state.alerts.slice(0, 20),
    });
  } catch (error) {
    return next(error);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const alerts = await Alert.find({ userId: req.user._id })
      .sort({ updatedAt: -1, timestamp: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      alerts: alerts.map(serializeAlert),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  postVisionFrame,
  getVisionSummary,
  getAlerts,
};
