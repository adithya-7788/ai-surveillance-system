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

export const getAlertMetadata = (alert) => {
  if (!alert?.metadata) return null;

  if (alert.type === 'suspicious_activity' && alert.metadata.reason) {
    return alert.metadata.reason;
  }

  if (alert.type === 'loitering' && alert.metadata.duration) {
    return `Duration: ${alert.metadata.duration}s`;
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
    const leftTime = new Date(left.timestamp || left.time || 0).getTime();
    const rightTime = new Date(right.timestamp || right.time || 0).getTime();
    return rightTime - leftTime;
  });
};
