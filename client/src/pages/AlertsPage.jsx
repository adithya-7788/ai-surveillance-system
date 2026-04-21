import { useEffect } from 'react';
import { useVision } from '../context/VisionContext';
import { getAlertBadge, getAlertMetadata } from '../utils/alertUtils';

const AlertsPage = () => {
  const { alerts, refreshSummary } = useVision();

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Alerts</h2>
        <p className="mt-1 text-slate-400">Recent system-generated notifications.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {alerts.length === 0 ? (
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft lg:col-span-2">
            <p className="text-slate-400">No alerts yet. Start live camera processing to generate activity.</p>
          </article>
        ) : (
          alerts.map((alert) => {
            const badge = getAlertBadge(alert.type, alert.status);
            const metadata = getAlertMetadata(alert);
            const isResolved = alert.status === 'resolved';

            return (
              <article
                key={alert.id}
                className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft ${isResolved ? 'opacity-80' : ''}`}
              >
                <p className="text-sm text-slate-400">{alert.time}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{alert.title}</h3>
                {metadata && <p className="mt-1 text-sm text-slate-300">{metadata}</p>}
                {alert.personId && <p className="mt-1 text-xs text-slate-500">Person ID: {alert.personId}</p>}
                {alert.objectType && <p className="mt-1 text-xs text-slate-500">Object: {alert.objectType}</p>}
                {isResolved && <p className="mt-1 text-xs text-slate-500">Resolved</p>}
                <span
                  className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge.bgColor} ${badge.textColor}`}
                >
                  {badge.label}
                </span>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
