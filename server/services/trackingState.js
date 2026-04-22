const USER_STATE_TTL_MS = 1000 * 60 * 60;
const TRACK_STALE_MS = 15000;
const SIDE_EPSILON = 0.003;
const LINE_HYSTERESIS_MARGIN = 0.008;
const SIDE_STABILITY_FRAMES = 3;
const TRANSITION_COOLDOWN_MS = 1200;
const MAX_ALERTS = 200;
const IST_TIME_ZONE = 'Asia/Kolkata';

// Object tracking constants
const OBJECT_PLACEMENT_THRESHOLD_MS = 2000; // Object must be stationary for 2 seconds to be "placed"
const OBJECT_PLACEMENT_DISTANCE_THRESHOLD = 0.02; // Max distance to consider object stationary
const OBJECT_PICKUP_CONFIRMATION_FRAMES = 2; // Frames to confirm pickup
const OBJECT_DEFAULT_INTERACTION_DISTANCE = 0.1; // Default proximity for person-object association
const ZONE_STATE_STABILITY_FRAMES = 3;
const ROI_DETECTION_RADIUS = 0.03; // Circular region radius around centroid for ROI detection (normalized coordinates)
// Helper: Check if any part of a circular region overlaps with ROI mask
const isInsideROIMask = (centroid, roiMask) => {
  if (!roiMask) return false;

  const x = clampRelative(centroid.x);
  const y = clampRelative(centroid.y);
  const radiusPixels = ROI_DETECTION_RADIUS * roiMask.width; // Convert normalized radius to pixels

  // Check if centroid or nearby pixels overlap with ROI
  const checkPoints = [
    { px: x, py: y }, // centroid
    { px: x - radiusPixels / roiMask.width, py: y }, // left
    { px: x + radiusPixels / roiMask.width, py: y }, // right
    { px: x, py: y - radiusPixels / roiMask.height }, // top
    { px: x, py: y + radiusPixels / roiMask.height }, // bottom
  ];

  for (const pt of checkPoints) {
    const px = Math.min(roiMask.width - 1, Math.max(0, Math.floor(pt.px * roiMask.width)));
    const py = Math.min(roiMask.height - 1, Math.max(0, Math.floor(pt.py * roiMask.height)));
    const index = py * roiMask.width + px;
    if (roiMask.data[index] === 1) {
      return true;
    }
  }

  return false;
};

const alertTitles = {
  entry: 'Person entered',
  exit: 'Person exited',
  loitering: 'Loitering detected',
  crowd: 'Crowd threshold exceeded',
  restricted_time: 'Restricted time entry',
  suspicious_activity: 'Suspicious Activity Detected',
  suspicious: 'Suspicious Activity Detected',
};

const userStateMap = new Map();

const formatISTDateTime = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return formatter.format(date).replace(',', '');
};

const toISOString = (value = Date.now()) => new Date(value).toISOString();

const timeToMinutes = (value) => {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
};

const isRestrictedTime = (settings, now = new Date()) => {
  if (!settings) return false;

  const { restrictedStartTime, restrictedEndTime } = settings;
  if (!restrictedStartTime || !restrictedEndTime || restrictedStartTime === restrictedEndTime) {
    return false;
  }

  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  const currentMinutes = hour * 60 + minute;
  const startMinutes = timeToMinutes(restrictedStartTime);
  const endMinutes = timeToMinutes(restrictedEndTime);

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};

const lineSide = (point, line) => {
  const ax = line.x1;
  const ay = line.y1;
  const bx = line.x2;
  const by = line.y2;

  return (bx - ax) * (point.y - ay) - (by - ay) * (point.x - ax);
};

const isInsideSide = (sideValue, insideDirection) => {
  if (insideDirection === 'positive') {
    return sideValue > SIDE_EPSILON;
  }

  if (insideDirection === 'negative') {
    return sideValue < -SIDE_EPSILON;
  }

  return false;
};

const getEntryExitDirection = (previousSide, currentSide, insideDirection) => {
  if (
    typeof previousSide !== 'number' ||
    typeof currentSide !== 'number' ||
    Math.abs(previousSide) <= SIDE_EPSILON ||
    Math.abs(currentSide) <= SIDE_EPSILON
  ) {
    return null;
  }

  const previousInside = isInsideSide(previousSide, insideDirection);
  const currentInside = isInsideSide(currentSide, insideDirection);

  if (previousInside === currentInside) {
    return null;
  }

  return currentInside ? 'entry' : 'exit';
};

const classifySideByLine = (sideValue, insideDirection) => {
  if (typeof sideValue !== 'number' || !insideDirection) {
    return 'unknown';
  }

  if (Math.abs(sideValue) <= LINE_HYSTERESIS_MARGIN) {
    return 'buffer';
  }

  if (insideDirection === 'positive') {
    return sideValue > 0 ? 'inside' : 'outside';
  }

  return sideValue < 0 ? 'inside' : 'outside';
};

const getConfirmedTransition = ({ previousTrack, rawSide, now }) => {
  const stableSide = previousTrack.lastStableSide || null;
  const previousCandidateSide = previousTrack.candidateSide || null;
  const previousCandidateFrames = Number(previousTrack.candidateFrames || 0);
  const previousTransitionAt = Number(previousTrack.lastTransitionTime || 0);

  if (rawSide === 'unknown' || rawSide === 'buffer') {
    return {
      stableSide,
      candidateSide: previousCandidateSide,
      candidateFrames: previousCandidateFrames,
      transitionDirection: null,
      transitionAt: previousTransitionAt,
      transitionFrom: null,
      transitionTo: null,
    };
  }

  if (!stableSide) {
    return {
      stableSide: rawSide,
      candidateSide: null,
      candidateFrames: 0,
      transitionDirection: null,
      transitionAt: previousTransitionAt,
      transitionFrom: null,
      transitionTo: null,
    };
  }

  if (rawSide === stableSide) {
    return {
      stableSide,
      candidateSide: null,
      candidateFrames: 0,
      transitionDirection: null,
      transitionAt: previousTransitionAt,
      transitionFrom: null,
      transitionTo: null,
    };
  }

  const nextCandidateFrames = previousCandidateSide === rawSide ? previousCandidateFrames + 1 : 1;
  const cooldownOk = now - previousTransitionAt >= TRANSITION_COOLDOWN_MS;

  if (nextCandidateFrames < SIDE_STABILITY_FRAMES || !cooldownOk) {
    return {
      stableSide,
      candidateSide: rawSide,
      candidateFrames: nextCandidateFrames,
      transitionDirection: null,
      transitionAt: previousTransitionAt,
      transitionFrom: null,
      transitionTo: null,
    };
  }

  const transitionDirection = stableSide === 'outside' && rawSide === 'inside'
    ? 'entry'
    : stableSide === 'inside' && rawSide === 'outside'
      ? 'exit'
      : null;

  return {
    stableSide: rawSide,
    candidateSide: null,
    candidateFrames: 0,
    transitionDirection,
    transitionAt: now,
    transitionFrom: stableSide,
    transitionTo: rawSide,
  };
};

const clampRelative = (value) => Math.max(0, Math.min(1, value));

const toRelativeDetections = (detections, frameWidth, frameHeight) => {
  return detections.map((det) => {
    const x = clampRelative(det.x / frameWidth);
    const y = clampRelative(det.y / frameHeight);
    const width = clampRelative(det.w / frameWidth);
    const height = clampRelative(det.h / frameHeight);

    return {
      id: Number(det.id),
      class: det.class || 'person',
      x,
      y,
      w: width,
      h: height,
      cx: clampRelative(x + width / 2),
      cy: clampRelative(y + height / 2),
    };
  });
};

const getStateKey = (type, suffix) => `${type}:${suffix}`;

const buildAlert = ({
  alertKey,
  type,
  title,
  status = 'active',
  timestamp = Date.now(),
  personId = null,
  objectType = null,
  metadata = {},
  resolvedAt = null,
}) => ({
  id: alertKey,
  alertKey,
  type,
  title,
  status,
  timestamp: toISOString(timestamp),
  time: formatISTDateTime(new Date(timestamp)),
  personId: Number.isFinite(Number(personId)) ? Number(personId) : null,
  objectType: objectType || null,
  metadata: metadata || {},
  resolvedAt: resolvedAt ? toISOString(resolvedAt) : null,
});

const getOrCreateState = (userId) => {
  if (!userStateMap.has(userId)) {
    userStateMap.set(userId, {
      stats: {
        entries: 0,
        exits: 0,
        current: 0,
      },
      trackMemory: new Map(),
      objectMemory: new Map(),
      alertsByKey: new Map(),
      alertFeed: [],
      pendingAlertChanges: new Map(),
      crowdAlertKey: null,
      updatedAt: Date.now(),
    });
  }

  const state = userStateMap.get(userId);
  state.updatedAt = Date.now();
  return state;
};

const cleanupUserStates = () => {
  const now = Date.now();

  for (const [userId, state] of userStateMap.entries()) {
    if (now - state.updatedAt > USER_STATE_TTL_MS) {
      userStateMap.delete(userId);
    }
  }
};

const refreshFeed = (state) => {
  state.alertFeed = Array.from(state.alertsByKey.values())
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, MAX_ALERTS);
};

const queueAlertChange = (state, alert) => {
  state.pendingAlertChanges.set(alert.alertKey, alert);
};

const upsertAlert = (state, nextAlert) => {
  const existing = state.alertsByKey.get(nextAlert.alertKey);
  const merged = buildAlert({
    alertKey: nextAlert.alertKey,
    type: nextAlert.type || existing?.type,
    title: nextAlert.title || existing?.title || alertTitles[nextAlert.type],
    status: nextAlert.status || existing?.status || 'active',
    timestamp: nextAlert.timestamp || Date.now(),
    personId: nextAlert.personId ?? existing?.personId ?? null,
    objectType: nextAlert.objectType ?? existing?.objectType ?? null,
    metadata: {
      ...(existing?.metadata || {}),
      ...(nextAlert.metadata || {}),
    },
    resolvedAt: nextAlert.resolvedAt ?? existing?.resolvedAt ?? null,
  });

  state.alertsByKey.set(merged.alertKey, merged);
  queueAlertChange(state, merged);
  refreshFeed(state);
  return merged;
};

const createEventAlert = (state, { type, personId = null, objectType = null, metadata = {}, reason = null }) => {
  const alertKey = `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  return upsertAlert(state, {
    alertKey,
    type,
    title: alertTitles[type],
    status: 'active',
    personId,
    objectType,
    metadata: {
      ...(metadata || {}),
      ...(reason ? { reason } : {}),
      ...(personId !== null ? { personId } : {}),
      ...(objectType ? { objectType } : {}),
    },
  });
};

const createStatefulAlert = (state, { alertKey, type, personId = null, objectType = null, metadata = {} }) => {
  return upsertAlert(state, {
    alertKey,
    type,
    title: alertTitles[type],
    status: 'active',
    personId,
    objectType,
    metadata,
  });
};

const resolveAlert = (state, alertKey, metadata = {}) => {
  const existing = state.alertsByKey.get(alertKey);
  if (!existing || existing.status === 'resolved') {
    return existing || null;
  }

  return upsertAlert(state, {
    alertKey,
    type: existing.type,
    title: existing.title,
    status: 'resolved',
    personId: existing.personId,
    objectType: existing.objectType,
    metadata: {
      ...(existing.metadata || {}),
      ...(metadata || {}),
    },
    resolvedAt: Date.now(),
    timestamp: Date.now(),
  });
};

const isPointInZone = (point, zone) => {
  return (
    point.x >= zone.x &&
    point.x <= zone.x + zone.width &&
    point.y >= zone.y &&
    point.y <= zone.y + zone.height
  );
};

const isInsideMonitoredArea = (point, entryLine, insideDirection, restrictedZones = []) => {
  if (entryLine && insideDirection) {
    const sideValue = lineSide(point, entryLine);
    return isInsideSide(sideValue, insideDirection);
  }

  if (Array.isArray(restrictedZones) && restrictedZones.length > 0) {
    return restrictedZones.some((zone) => isPointInZone(point, zone));
  }

  return true;
};

const decodeZoneMask = (zoneMask) => {
  if (!zoneMask || typeof zoneMask !== 'object') {
    return null;
  }

  const width = Number(zoneMask.width);
  const height = Number(zoneMask.height);
  const data = String(zoneMask.data || '');

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || !data) {
    return null;
  }

  try {
    const bytes = Buffer.from(data, 'base64');
    if (bytes.length !== width * height) {
      return null;
    }

    return { width, height, data: bytes };
  } catch {
    return null;
  }
};

const isInsideZoneMask = (point, zoneMask) => {
  if (!zoneMask) return null;

  const x = clampRelative(point.x);
  const y = clampRelative(point.y);
  const px = Math.min(zoneMask.width - 1, Math.max(0, Math.floor(x * zoneMask.width)));
  const py = Math.min(zoneMask.height - 1, Math.max(0, Math.floor(y * zoneMask.height)));
  const index = py * zoneMask.width + px;
  return zoneMask.data[index] === 1;
};

const getConfirmedZoneTransition = ({ previousTrack, rawInside, now }) => {
  const rawSide = rawInside ? 'inside' : 'outside';
  const stableSide = previousTrack.lastStableSide || null;
  const previousCandidateSide = previousTrack.candidateSide || null;
  const previousCandidateFrames = Number(previousTrack.candidateFrames || 0);
  const previousTransitionAt = Number(previousTrack.lastTransitionTime || 0);

  if (!stableSide) {
    return {
      stableSide: rawSide,
      candidateSide: null,
      candidateFrames: 0,
      transitionDirection: null,
      transitionAt: previousTransitionAt,
      transitionFrom: null,
      transitionTo: null,
      rawSide,
    };
  }

  if (rawSide === stableSide) {
    return {
      stableSide,
      candidateSide: null,
      candidateFrames: 0,
      transitionDirection: null,
      transitionAt: previousTransitionAt,
      transitionFrom: null,
      transitionTo: null,
      rawSide,
    };
  }

  const nextCandidateFrames = previousCandidateSide === rawSide ? previousCandidateFrames + 1 : 1;
  const cooldownOk = now - previousTransitionAt >= TRANSITION_COOLDOWN_MS;

  if (nextCandidateFrames < ZONE_STATE_STABILITY_FRAMES || !cooldownOk) {
    return {
      stableSide,
      candidateSide: rawSide,
      candidateFrames: nextCandidateFrames,
      transitionDirection: null,
      transitionAt: previousTransitionAt,
      transitionFrom: null,
      transitionTo: null,
      rawSide,
    };
  }

  return {
    stableSide: rawSide,
    candidateSide: null,
    candidateFrames: 0,
    transitionDirection: stableSide === 'outside' ? 'entry' : 'exit',
    transitionAt: now,
    transitionFrom: stableSide,
    transitionTo: rawSide,
    rawSide,
  };
};

const updateTrackState = ({ state, det, inside, roiInside, currentSide, now, settings, sideState }) => {
  const trackId = Number(det.id);
  const previous = state.trackMemory.get(trackId) || {};
  const loiteringThresholdSeconds = Number(settings?.loiteringThreshold ?? 60);
  const loiteringThresholdMs = loiteringThresholdSeconds * 1000;
  const suspiciousInteractionThresholdSeconds = Number(settings?.suspiciousInteractionTimeThreshold ?? 20);

  const nextTrack = {
    lastPosition: { x: det.cx, y: det.cy },
    previousSide: previous.currentSide ?? previous.lastStableSide ?? null,
    currentSide: sideState.rawSide,
    lastStableSide: sideState.stableSide,
    candidateSide: sideState.candidateSide,
    candidateFrames: sideState.candidateFrames,
    lastTransitionTime: sideState.transitionAt || previous.lastTransitionTime || 0,
    lastTransitionSide: sideState.transitionTo || previous.lastTransitionSide || null,
    lastSide: currentSide,
    inside,
    roiInside: Boolean(roiInside),
    lastSeenAt: now,
    firstSeenAt: previous.firstSeenAt || now,
    insideSinceAt: previous.insideSinceAt ?? (inside ? now : null),
    roiInsideSinceAt: previous.roiInsideSinceAt ?? (roiInside ? now : null),
    loiteringAlertKey: previous.loiteringAlertKey || null,
    loiteringDurationSeconds: previous.loiteringDurationSeconds || 0,
    suspiciousAlertKey: previous.suspiciousAlertKey || null,
    zoneDurationSeconds: previous.zoneDurationSeconds || 0,
    roiDurationSeconds: previous.roiDurationSeconds || 0,
  };

  if (inside && !previous.insideSinceAt) {
    nextTrack.insideSinceAt = now;
  }

  if (!inside) {
    nextTrack.insideSinceAt = null;
    nextTrack.zoneDurationSeconds = 0;
  }

  if (!roiInside) {
    nextTrack.roiInsideSinceAt = null;
    nextTrack.roiDurationSeconds = 0;
    if (previous.suspiciousAlertKey) {
      resolveAlert(state, previous.suspiciousAlertKey, {
        reason: 'person left ROI zone',
        personId: trackId,
      });
      nextTrack.suspiciousAlertKey = null;
    }
  }

  if (inside) {
    const insideSinceAt = nextTrack.insideSinceAt || now;
    const zoneDurationSeconds = Math.max(0, Math.floor((now - insideSinceAt) / 1000));
    nextTrack.zoneDurationSeconds = zoneDurationSeconds;
  }

  if (roiInside) {
    const roiInsideSinceAt = nextTrack.roiInsideSinceAt || now;
    const roiDurationSeconds = Math.max(0, Math.floor((now - roiInsideSinceAt) / 1000));
    nextTrack.roiDurationSeconds = roiDurationSeconds;

    if (roiDurationSeconds >= suspiciousInteractionThresholdSeconds) {
      const suspiciousAlertKey = previous.suspiciousAlertKey || getStateKey('suspicious', `${trackId}:${roiInsideSinceAt}`);
      nextTrack.suspiciousAlertKey = suspiciousAlertKey;

      createStatefulAlert(state, {
        alertKey: suspiciousAlertKey,
        type: 'suspicious',
        personId: trackId,
        metadata: {
          personId: trackId,
          duration: roiDurationSeconds,
          reason: 'prolonged interaction inside ROI zone',
        },
      });
    }
  }

  if (loiteringThresholdMs > 0) {
    const firstSeenAt = nextTrack.firstSeenAt || now;
    const durationSeconds = Math.max(0, Math.floor((now - firstSeenAt) / 1000));

    if (durationSeconds >= loiteringThresholdSeconds) {
      const alertKey = previous.loiteringAlertKey || getStateKey('loitering', `${trackId}:${firstSeenAt}`);
      nextTrack.loiteringAlertKey = alertKey;
      nextTrack.loiteringDurationSeconds = durationSeconds;

      createStatefulAlert(state, {
        alertKey,
        type: 'loitering',
        personId: trackId,
        metadata: {
          duration: durationSeconds,
          personId: trackId,
          reason: 'person remained in view for extended duration',
        },
      });
    }
  }

  state.trackMemory.set(trackId, nextTrack);
  return nextTrack;
};

const updateCrowdAlert = (state, settings, now, currentCount) => {
  const crowdThreshold = Number(settings?.crowdThreshold ?? 10);

  if (crowdThreshold > 0 && currentCount > crowdThreshold) {
    if (!state.crowdAlertKey) {
      state.crowdAlertKey = getStateKey('crowd', now);
    }

    createStatefulAlert(state, {
      alertKey: state.crowdAlertKey,
      type: 'crowd',
      metadata: {
        count: currentCount,
        reason: 'count exceeded configured crowd threshold',
      },
    });
  } else if (state.crowdAlertKey) {
    resolveAlert(state, state.crowdAlertKey, {
      count: currentCount,
      reason: 'count returned below crowd threshold',
    });
    state.crowdAlertKey = null;
  }
};

const updateSuspiciousActivity = ({ state, objects, settings, entryLine, insideDirection, restrictedZones, now, personDetections }) => {
  const allowedObjects = ['backpack', 'handbag', 'suitcase'];
  const objectDisappearanceThreshold = 10;
  const interactionDistance = Number(settings?.objectInteractionDistanceThreshold || OBJECT_DEFAULT_INTERACTION_DISTANCE);
  
  // Filter objects to only allowed types
  const seenObjectIds = new Set();
  const placedObjectsWithDistance = [];

  for (const obj of objects || []) {
    if (!obj || typeof obj.id === 'undefined') {
      continue;
    }

    const objectType = String(obj.class || '').toLowerCase();
    if (!allowedObjects.includes(objectType)) {
      continue;
    }

    const objectId = String(obj.id);
    seenObjectIds.add(objectId);
    const previous = state.objectMemory.get(objectId) || {
      state: 'idle',
      objectType,
      personId: null,
      missingFrames: 0,
      alertTriggered: false,
      lastPosition: null,
      placedSinceAt: null,
      pickedUpAt: null,
      lastSeenAt: now,
    };

    const currentPosition = { x: obj.cx, y: obj.cy };
    const distance = previous.lastPosition
      ? Math.sqrt(
          Math.pow(currentPosition.x - previous.lastPosition.x, 2) +
          Math.pow(currentPosition.y - previous.lastPosition.y, 2)
        )
      : 0;

    const nextState = {
      ...previous,
      objectType,
      lastPosition: currentPosition,
      missingFrames: 0,
      lastSeenAt: now,
    };

    // State machine: idle → placed → picked_up → moving → resolved
    if (previous.state === 'idle' || previous.state === 'moving') {
      if (distance < OBJECT_PLACEMENT_DISTANCE_THRESHOLD) {
        if (!previous.placedSinceAt) {
          nextState.placedSinceAt = now;
          nextState.state = 'idle';
        } else if (now - previous.placedSinceAt >= OBJECT_PLACEMENT_THRESHOLD_MS) {
          nextState.state = 'placed';
        } else {
          nextState.state = 'idle';
        }
      } else {
        nextState.placedSinceAt = null;
        nextState.state = 'idle';
      }
    } else if (previous.state === 'placed') {
      // Object is placed - find nearest person within interaction distance
      if (distance > OBJECT_PLACEMENT_DISTANCE_THRESHOLD) {
        nextState.state = 'moving';
        nextState.pickedUpAt = null;
      } else {
        // Check if any person is nearby
        const nearbyPerson = (personDetections || []).find((person) => {
          const personDist = Math.sqrt(
            Math.pow(currentPosition.x - person.cx, 2) +
            Math.pow(currentPosition.y - person.cy, 2)
          );
          return personDist <= interactionDistance;
        });

        if (nearbyPerson) {
          nextState.state = 'picked_up';
          nextState.personId = nearbyPerson.id;
          nextState.pickedUpAt = now;
          nextState.placedSinceAt = null;
        } else {
          nextState.state = 'placed';
        }
      }
    } else if (previous.state === 'picked_up') {
      // Object is picked up - check if moved or person association is lost
      if (distance > OBJECT_PLACEMENT_DISTANCE_THRESHOLD) {
        nextState.state = 'moving';
      } else if (!obj.stationary) {
        nextState.state = 'moving';
      } else {
        // Object moved back to stationary - check if person is still nearby
        const nearbyPerson = (personDetections || []).find((person) => person.id === nextState.personId);
        if (!nearbyPerson) {
          const anyNearby = (personDetections || []).find((person) => {
            const personDist = Math.sqrt(
              Math.pow(currentPosition.x - person.cx, 2) +
              Math.pow(currentPosition.y - person.cy, 2)
            );
            return personDist <= interactionDistance;
          });
          if (anyNearby) {
            nextState.personId = anyNearby.id;
          } else {
            nextState.state = 'placed';
            nextState.personId = null;
            nextState.pickedUpAt = null;
          }
        }
      }
    } else if (previous.state === 'moving' && previous.pickedUpAt) {
      // Object is moving with pickup - check for exit or disappearance
      const currentInside = entryLine
        ? isInsideSide(lineSide(currentPosition, entryLine), insideDirection)
        : true;
      const wasInside = previous.lastInside !== false;

      if (wasInside && !currentInside && !previous.alertTriggered) {
        // Object exited
        createEventAlert(state, {
          type: 'suspicious_activity',
          personId: nextState.personId,
          objectType,
          metadata: {
            objectType,
            personId: nextState.personId,
            reason: 'Object exited monitored area',
          },
          reason: 'Object exited monitored area',
        });
        nextState.alertTriggered = true;
        nextState.state = 'resolved';
      }

      nextState.lastInside = currentInside;
    }

    placedObjectsWithDistance.push({ objectId, nextState, distance });
    state.objectMemory.set(objectId, nextState);
  }

  // Handle missing objects (disappearance detection)
  for (const [objectId, objectState] of state.objectMemory.entries()) {
    if (seenObjectIds.has(objectId)) {
      continue;
    }

    if (objectState.state === 'idle' || objectState.state === 'resolved') {
      state.objectMemory.delete(objectId);
      continue;
    }

    const missingFrames = (objectState.missingFrames || 0) + 1;
    const nextState = {
      ...objectState,
      missingFrames,
      lastSeenAt: now,
    };

    if (objectState.state === 'picked_up' && !objectState.alertTriggered && missingFrames >= objectDisappearanceThreshold) {
      createEventAlert(state, {
        type: 'suspicious_activity',
        personId: objectState.personId,
        objectType: objectState.objectType,
        metadata: {
          objectType: objectState.objectType,
          personId: objectState.personId,
          reason: 'Object disappeared after pickup',
          missingFrames,
        },
        reason: 'Object disappeared after pickup',
      });
      nextState.alertTriggered = true;
      nextState.state = 'resolved';
    }

    state.objectMemory.set(objectId, nextState);
  }
};

const updateStateWithFrame = ({
  userId,
  detections,
  entryLine,
  insideDirection,
  settings,
  restrictedZones = [],
  objectObservations = [],
  zoneMask = null,
  insideMask = null,
  roiMask = null,
}) => {
  cleanupUserStates();
  const state = getOrCreateState(userId);
  const now = Date.now();

  const decodedInsideMask = decodeZoneMask(insideMask || zoneMask);
  const decodedROIMask = decodeZoneMask(roiMask);
  const detectionAnnotations = {};

  const personDetections = detections.filter((det) => det.class === 'person');
  const allDetections = detections;

  for (const [trackId, track] of state.trackMemory.entries()) {
    if (now - track.lastSeenAt > TRACK_STALE_MS) {
      if (track.loiteringAlertKey) {
        resolveAlert(state, track.loiteringAlertKey, { reason: 'person left frame' });
      }
      if (track.suspiciousAlertKey) {
        resolveAlert(state, track.suspiciousAlertKey, { reason: 'person left frame' });
      }
      state.trackMemory.delete(trackId);
    }
  }

  for (const det of personDetections) {
    const trackId = Number(det.id);
    if (!Number.isFinite(trackId)) continue;

    const centroid = { x: det.cx, y: det.cy };
    const previous = state.trackMemory.get(trackId) || {};

    const insideByMask = decodedInsideMask ? isInsideZoneMask(centroid, decodedInsideMask) : null;
    const roiInside = decodedROIMask ? isInsideROIMask(centroid, decodedROIMask) : false;

    const currentSide = entryLine ? lineSide(centroid, entryLine) : undefined;
    const sideState = decodedInsideMask
      ? getConfirmedZoneTransition({ previousTrack: previous, rawInside: Boolean(insideByMask), now })
      : entryLine
        ? getConfirmedTransition({
            previousTrack: previous,
            rawSide: classifySideByLine(currentSide, insideDirection),
            now,
          })
        : {
            stableSide: null,
            candidateSide: null,
            candidateFrames: 0,
            transitionDirection: null,
            transitionAt: previous.lastTransitionTime || 0,
            transitionFrom: null,
            transitionTo: null,
            rawSide: 'unknown',
          };

    const inside = decodedInsideMask
      ? sideState.stableSide === 'inside'
      : entryLine
        ? sideState.stableSide === 'inside'
        : isInsideMonitoredArea(centroid, entryLine, insideDirection, restrictedZones);

    const nextTrack = updateTrackState({
      state,
      det,
      inside,
      roiInside,
      currentSide,
      now,
      settings,
      sideState,
    });

    const effectiveDirection = sideState.transitionDirection;
    if (effectiveDirection === 'entry') {
      state.stats.entries += 1;
      createEventAlert(state, {
        type: 'entry',
        personId: trackId,
        metadata: { personId: trackId },
      });

      if (isRestrictedTime(settings, new Date(now))) {
        const timeStr = formatISTDateTime(new Date(now)).split(' ').pop();
        createEventAlert(state, {
          type: 'restricted_time',
          personId: trackId,
          metadata: {
            personId: trackId,
            time: timeStr,
            reason: 'entry occurred during restricted time window',
          },
          reason: 'entry occurred during restricted time window',
        });
      }
    } else if (effectiveDirection === 'exit') {
      state.stats.exits += 1;
      createEventAlert(state, {
        type: 'exit',
        personId: trackId,
        metadata: { personId: trackId },
      });
    }

    detectionAnnotations[trackId] = {
      zoneInside: Boolean(nextTrack.inside),
      zoneDurationSeconds: Number(nextTrack.zoneDurationSeconds || 0),
      roiInside: Boolean(nextTrack.roiInside),
      roiDurationSeconds: Number(nextTrack.roiDurationSeconds || 0),
    };

    state.trackMemory.set(trackId, nextTrack);
  }

  state.stats.current = personDetections.length;

  updateCrowdAlert(state, settings, now, state.stats.current);
  updateSuspiciousActivity({
    state,
    objects: allDetections,
    settings,
    entryLine,
    insideDirection,
    restrictedZones,
    now,
    personDetections,
  });

  state.updatedAt = now;

  const changes = Array.from(state.pendingAlertChanges.values());
  state.pendingAlertChanges.clear();

  return {
    stats: state.stats,
    alerts: state.alertFeed.slice(0, MAX_ALERTS),
    changes,
    detectionAnnotations,
  };
};

const getVisionState = (userId) => {
  const state = getOrCreateState(userId);

  return {
    stats: state.stats,
    alerts: state.alertFeed.slice(0, MAX_ALERTS),
  };
};

module.exports = {
  toRelativeDetections,
  updateStateWithFrame,
  getVisionState,
  formatISTDateTime,
};
