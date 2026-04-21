import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { mergeAlertsById } from '../utils/alertUtils';

const VisionContext = createContext(null);

const INITIAL_STATS = { entries: 0, exits: 0, current: 0 };

export const VisionProvider = ({ children }) => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [alerts, setAlerts] = useState([]);

  const updateFromFrame = useCallback((payload) => {
    if (payload?.stats) {
      setStats({
        entries: Number(payload.stats.entries || 0),
        exits: Number(payload.stats.exits || 0),
        current: Number(payload.stats.current || 0),
      });
    }

    if (Array.isArray(payload?.alerts)) {
      setAlerts((previousAlerts) => mergeAlertsById(previousAlerts, payload.alerts));
    }
  }, []);

  const refreshSummary = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStats(INITIAL_STATS);
      setAlerts([]);
      return;
    }

    try {
      const [summaryResponse, alertsResponse] = await Promise.all([
        api.get('/vision/summary'),
        api.get('/vision/alerts?limit=100'),
      ]);

      updateFromFrame(summaryResponse.data);

      if (Array.isArray(alertsResponse.data?.alerts)) {
        setAlerts((previousAlerts) => mergeAlertsById(previousAlerts, alertsResponse.data.alerts));
      }
    } catch {
      // Keep last known values for graceful UX on transient failures.
    }
  }, [updateFromFrame]);

  useEffect(() => {
    refreshSummary();
    const intervalId = setInterval(refreshSummary, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshSummary]);

  const value = useMemo(
    () => ({ stats, alerts, updateFromFrame, refreshSummary }),
    [alerts, refreshSummary, stats, updateFromFrame]
  );

  return <VisionContext.Provider value={value}>{children}</VisionContext.Provider>;
};

export const useVision = () => {
  const context = useContext(VisionContext);
  if (!context) {
    throw new Error('useVision must be used within VisionProvider');
  }
  return context;
};
