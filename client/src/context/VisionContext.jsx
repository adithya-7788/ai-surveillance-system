import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { mergeAlertCollections } from '../utils/alertUtils';

const VisionContext = createContext(null);

const INITIAL_STATS = { entries: 0, exits: 0, current: 0 };

export const VisionProvider = ({ children }) => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [alerts, setAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);

  const updateFromFrame = useCallback((payload) => {
    if (payload?.stats) {
      setStats({
        entries: Number(payload.stats.entries || 0),
        exits: Number(payload.stats.exits || 0),
        current: Number(payload.stats.current || 0),
      });
    }

    setAlerts((previousAlerts) =>
      mergeAlertCollections({ alerts: previousAlerts }, payload).alerts
    );
    setActiveAlerts((previousAlerts) =>
      mergeAlertCollections({ activeAlerts: previousAlerts }, payload).activeAlerts
    );
    setAlertHistory((previousAlerts) =>
      mergeAlertCollections({ alertHistory: previousAlerts }, payload).alertHistory
    );
  }, []);

  const refreshSummary = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStats(INITIAL_STATS);
      setAlerts([]);
      setActiveAlerts([]);
      setAlertHistory([]);
      return;
    }

    try {
      const [summaryResponse, alertsResponse] = await Promise.all([
        api.get('/vision/summary'),
        api.get('/vision/alerts?limit=100'),
      ]);

      updateFromFrame(summaryResponse.data);

      setAlerts((previousAlerts) =>
        mergeAlertCollections({ alerts: previousAlerts }, alertsResponse.data || {}).alerts
      );
      setActiveAlerts((previousAlerts) =>
        mergeAlertCollections({ activeAlerts: previousAlerts }, alertsResponse.data || {}).activeAlerts
      );
      setAlertHistory((previousAlerts) =>
        mergeAlertCollections({ alertHistory: previousAlerts }, alertsResponse.data || {}).alertHistory
      );
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
    () => ({ stats, alerts, activeAlerts, alertHistory, updateFromFrame, refreshSummary }),
    [activeAlerts, alertHistory, alerts, refreshSummary, stats, updateFromFrame]
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
