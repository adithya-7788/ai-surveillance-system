export const getAlertBadge = (type, status = 'active') => {
  const badges = {
    entry: {
      label: 'Entry',
      bgColor: 'bg-emerald-900/40',
      textColor: 'text-emerald-300',
    },
    exit: {
      label: 'Exit',
      bgColor: 'bg-amber-900/40',
      textColor: 'text-amber-300',
    },
    loitering: {
      label: 'Loitering',
      bgColor: 'bg-yellow-900/40',
      textColor: 'text-yellow-300',
    },
    crowd: {
      label: 'Crowd',
      bgColor: 'bg-red-900/40',
      textColor: 'text-red-300',
    },
    restricted_time: {
      label: 'Restricted',
      bgColor: 'bg-red-900/40',
      textColor: 'text-red-300',
    },
    suspicious_activity: {
      label: 'Suspicious',
      bgColor: 'bg-red-900/40',
      textColor: 'text-red-300',
    },
    suspicious: {
      label: 'Suspicious',
      bgColor: 'bg-red-900/40',
      textColor: 'text-red-300',
    },
  };

  const badge = badges[type] || badges.entry;

  if (status === 'resolved') {
    return {
      ...badge,
      bgColor: `${badge.bgColor} opacity-70`,
    };
  }

  return badge;
};

export const getPriorityBadge = (priority = 'low') => {
  const badges = {
    high: { label: 'HIGH', bgColor: 'bg-rose-900/40', textColor: 'text-rose-300' },
    medium: { label: 'MEDIUM', bgColor: 'bg-amber-900/40', textColor: 'text-amber-300' },
    low: { label: 'LOW', bgColor: 'bg-emerald-900/40', textColor: 'text-emerald-300' },
    info: { label: 'INFO', bgColor: 'bg-sky-900/40', textColor: 'text-sky-300' },
  };
  return badges[priority] || badges.low;
};

export const getAlertMetadata = (alert) => {
  if (!alert?.metadata) return null;

  if (alert.type === 'suspicious_activity' && alert.metadata.reason) {
    return alert.metadata.reason;
  }

  if (alert.type === 'suspicious') {
    const duration = Number(alert.metadata.duration);
    if (Number.isFinite(duration) && duration > 0) {
      return `Duration: ${duration}s`;
    }
    return alert.metadata.reason || null;
  }

  if (alert.type === 'loitering' && alert.metadata.duration) {
    return `Duration: ${alert.metadata.duration}s`;
  }

  if (alert.type === 'entry_exit_session') {
    const duration = Number(alert.metadata?.duration ?? alert.duration);
    if (Number.isFinite(duration) && duration > 0) {
      return `Session duration: ${duration}s`;
    }
    return 'Entry to exit session completed';
  }

  if (alert.type === 'crowd' && alert.metadata.count) {
    return `Count: ${alert.metadata.count} people`;
  }

  if (alert.type === 'restricted_time' && alert.metadata.time) {
    return `Time: ${alert.metadata.time}`;
  }

  if (alert.personId) {
    return `Person ID: ${alert.personId}`;
  }

  return null;
};

export const mergeAlertsById = (currentAlerts = [], incomingAlerts = []) => {
  const priorityWeight = { high: 4, medium: 3, low: 2, info: 1 };
  const alertMap = new Map();

  for (const alert of [...currentAlerts, ...incomingAlerts]) {
    if (!alert || !alert.id) {
      continue;
    }

    const existing = alertMap.get(alert.id) || {};
    alertMap.set(alert.id, {
      ...existing,
      ...alert,
      metadata: {
        ...(existing.metadata || {}),
        ...(alert.metadata || {}),
      },
    });
  }

  return Array.from(alertMap.values()).sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1;
    }

    if (left.status === 'active') {
      const priorityDelta = (priorityWeight[right.priority] || 0) - (priorityWeight[left.priority] || 0);
      if (priorityDelta !== 0) return priorityDelta;
    }

    const leftTime = new Date(left.lastUpdatedTime || left.timestamp || left.time || 0).getTime();
    const rightTime = new Date(right.lastUpdatedTime || right.timestamp || right.time || 0).getTime();
    return rightTime - leftTime;
  });
};

export const mergeAlertCollections = (currentCollections, incomingPayload = {}) => {
  const activeAlerts = mergeAlertsById(currentCollections.activeAlerts || [], incomingPayload.activeAlerts || []);
  const alertHistory = mergeAlertsById(currentCollections.alertHistory || [], incomingPayload.alertHistory || []);
  const alerts = mergeAlertsById(currentCollections.alerts || [], incomingPayload.alerts || []);

  return {
    alerts,
    activeAlerts,
    alertHistory,
  };
};
