import { useMemo } from 'react';
import { useVision } from '../context/VisionContext';
import { getAlertBadge, getAlertMetadata } from '../utils/alertUtils';

const DashboardPage = () => {
  const { stats, activeAlerts } = useVision();

  const cards = useMemo(
    () => [
      { label: 'Total Entries', value: String(stats.entries), hint: 'Crossed configured entry line' },
      { label: 'Total Exits', value: String(stats.exits), hint: 'Crossed configured exit direction' },
      { label: 'Current People', value: String(stats.current), hint: 'Live tracked persons in frame' },
    ],
    [stats.current, stats.entries, stats.exits]
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-white">Security Overview</h2>
        <p className="mt-1 text-slate-400">
          Real-time monitoring dashboard for your AI-enabled surveillance network.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <h3 className="mt-2 text-3xl font-bold text-white">{card.value}</h3>
            <p className="mt-1 text-sm text-brand-300">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-white">Recent Movement Alerts</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {activeAlerts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 md:col-span-2">
              <p className="text-sm text-slate-400">No alerts yet. Start live camera to generate events.</p>
            </div>
          ) : (
            activeAlerts.slice(0, 4).map((alert) => {
              const badge = getAlertBadge(alert.type, alert.status);
              const metadata = getAlertMetadata(alert);

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border border-slate-800 bg-slate-950 p-4 ${alert.status === 'resolved' ? 'opacity-80' : ''}`}
                >
                  <p className="text-xs text-slate-400">{alert.time}</p>
                  <p className="mt-1 text-base font-medium text-white">{alert.title}</p>
                  {metadata && <p className="mt-1 text-xs text-slate-400">{metadata}</p>}
                  {alert.objectType && <p className="mt-1 text-xs text-slate-500">Object: {alert.objectType}</p>}
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${badge.bgColor} ${badge.textColor}`}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
