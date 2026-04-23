import { useEffect, useMemo, useState } from 'react';
import { useVision } from '../context/VisionContext';
import { getAlertBadge, getAlertMetadata, getPriorityBadge } from '../utils/alertUtils';

const formatTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const AlertsPage = () => {
  const { activeAlerts, alertHistory, refreshSummary } = useVision();
  const [previewImage, setPreviewImage] = useState(null);
  const entryExitSessions = useMemo(
    () => alertHistory.filter((alert) => alert.type === 'entry_exit_session'),
    [alertHistory]
  );
  const resolvedHistory = useMemo(
    () => alertHistory.filter((alert) => alert.type !== 'entry_exit_session'),
    [alertHistory]
  );
  const snapshotBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
  const toSnapshotUrl = (snapshotPath) => {
    if (!snapshotPath) return null;
    if (/^https?:\/\//.test(snapshotPath)) return snapshotPath;
    return `${snapshotBase}${snapshotPath.startsWith('/') ? snapshotPath : `/${snapshotPath}`}`;
  };
  const openImageModal = (snapshotPath) => {
    const imageUrl = toSnapshotUrl(snapshotPath);
    if (!imageUrl) return;
    setPreviewImage(imageUrl);
  };

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (activeAlerts[0]) {
      console.log('Active alert sample:', activeAlerts[0]);
    }
    if (resolvedHistory[0]) {
      console.log('History alert sample:', resolvedHistory[0]);
    }
  }, [activeAlerts, resolvedHistory]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPreviewImage(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Alerts</h2>
        <p className="mt-1 text-slate-400">Structured monitoring view with live alerts, movement sessions, and past events.</p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {activeAlerts.length === 0 ? (
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft lg:col-span-2">
              <p className="text-slate-400">No active alerts.</p>
            </article>
          ) : (
            activeAlerts.map((alert) => {
              const badge = getAlertBadge(alert.type, alert.status);
              const priorityBadge = getPriorityBadge(alert.priority);
              const metadata = getAlertMetadata(alert);
              const hasSnapshot = Boolean(alert.snapshotPath);

              return (
                <article
                  key={alert.id}
                  className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft ${hasSnapshot ? 'cursor-pointer transition hover:border-slate-600' : 'cursor-default'}`}
                  onClick={() => openImageModal(alert.snapshotPath)}
                  role={hasSnapshot ? 'button' : undefined}
                  tabIndex={hasSnapshot ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!hasSnapshot) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openImageModal(alert.snapshotPath);
                    }
                  }}
                >
                  <p className="text-sm text-slate-400">{alert.time}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{alert.title}</h3>
                  {metadata && <p className="mt-1 text-sm text-slate-300">{metadata}</p>}
                  {alert.personId && <p className="mt-1 text-xs text-slate-500">Person ID: {alert.personId}</p>}
                  {alert.duration > 0 && <p className="mt-1 text-xs text-slate-500">Duration: {alert.duration}s</p>}
                  {alert.snapshotPath ? (
                    <div className="mt-2">
                      <p className="mb-1 inline-flex items-center rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">📸 Click to view snapshot</p>
                      <img
                        src={toSnapshotUrl(alert.snapshotPath)}
                        alt={`${alert.title} snapshot`}
                        className="h-28 w-full rounded-lg border border-slate-800 object-cover"
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No snapshot available</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.bgColor} ${badge.textColor}`}>{badge.label}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge.bgColor} ${priorityBadge.textColor}`}>{priorityBadge.label}</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white">Entry/Exit Sessions</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {entryExitSessions.length === 0 ? (
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft lg:col-span-2">
              <p className="text-slate-400">No entry/exit sessions.</p>
            </article>
          ) : (
            entryExitSessions.map((alert) => {
              const hasSnapshot = Boolean(alert.snapshotPath);
              return (
              <article
                key={alert.id}
                className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft opacity-85 ${hasSnapshot ? 'cursor-pointer transition hover:border-slate-600' : 'cursor-default'}`}
                onClick={() => openImageModal(alert.snapshotPath)}
                role={hasSnapshot ? 'button' : undefined}
                tabIndex={hasSnapshot ? 0 : -1}
                onKeyDown={(event) => {
                  if (!hasSnapshot) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openImageModal(alert.snapshotPath);
                  }
                }}
              >
                <p className="text-sm text-slate-400">{alert.time}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{alert.title}</h3>
                {alert.personId && <p className="mt-1 text-xs text-slate-500">Person ID: {alert.personId}</p>}
                <p className="mt-1 text-xs text-slate-500">Entry: {formatTime(alert.startTime)}</p>
                <p className="mt-1 text-xs text-slate-500">Exit: {formatTime(alert.resolvedAt || alert.lastUpdatedTime)}</p>
                <p className="mt-1 text-xs text-slate-500">Duration: {Number(alert.duration || alert.metadata?.duration || 0)}s</p>
                {hasSnapshot ? (
                  <p className="mt-2 inline-flex items-center rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">📸 Click to view snapshot</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No snapshot available</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-300">Session</span>
                  <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-semibold text-emerald-300">Resolved</span>
                </div>
              </article>
            );
            })
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white">Alert History</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {resolvedHistory.length === 0 ? (
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft lg:col-span-2">
              <p className="text-slate-400">No past alerts.</p>
            </article>
          ) : (
            resolvedHistory.map((alert) => {
              const badge = getAlertBadge(alert.type, alert.status);
              const priorityBadge = getPriorityBadge(alert.priority);
              const metadata = getAlertMetadata(alert);
              const hasSnapshot = Boolean(alert.snapshotPath);

              return (
                <article
                  key={alert.id}
                  className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft opacity-85 ${hasSnapshot ? 'cursor-pointer transition hover:border-slate-600' : 'cursor-default'}`}
                  onClick={() => openImageModal(alert.snapshotPath)}
                  role={hasSnapshot ? 'button' : undefined}
                  tabIndex={hasSnapshot ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!hasSnapshot) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openImageModal(alert.snapshotPath);
                    }
                  }}
                >
                  <p className="text-sm text-slate-400">{alert.time}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{alert.title}</h3>
                  {metadata && <p className="mt-1 text-sm text-slate-300">{metadata}</p>}
                  {alert.personId && <p className="mt-1 text-xs text-slate-500">Person ID: {alert.personId}</p>}
                  {alert.duration > 0 && <p className="mt-1 text-xs text-slate-500">Duration: {alert.duration}s</p>}
                  {alert.snapshotPath ? (
                    <div className="mt-2">
                      <p className="mb-1 inline-flex items-center rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">📸 Click to view snapshot</p>
                      <img
                        src={toSnapshotUrl(alert.snapshotPath)}
                        alt={`${alert.title} snapshot`}
                        className="h-28 w-full rounded-lg border border-slate-800 object-cover"
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No snapshot available</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.bgColor} ${badge.textColor}`}>{badge.label}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge.bgColor} ${priorityBadge.textColor}`}>{priorityBadge.label}</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Alert snapshot preview"
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white"
              onClick={() => setPreviewImage(null)}
            >
              Close
            </button>
            <img
              src={previewImage}
              alt="Alert snapshot preview"
              className="max-h-[85vh] max-w-[90vw] rounded-xl border border-slate-700 object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AlertsPage;
