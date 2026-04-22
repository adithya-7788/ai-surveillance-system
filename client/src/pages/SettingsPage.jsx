import { useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULT_SETTINGS = {
  suspiciousInteractionTimeThreshold: 20,
  crowdThreshold: 10,
  loiteringThreshold: 60,
  restrictedStartTime: '00:00',
  restrictedEndTime: '00:00',
};

const SettingsPage = () => {
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setFormData({
          suspiciousInteractionTimeThreshold: Number(
            data?.suspiciousInteractionTimeThreshold ?? DEFAULT_SETTINGS.suspiciousInteractionTimeThreshold
          ),
          crowdThreshold: Number(data?.crowdThreshold ?? DEFAULT_SETTINGS.crowdThreshold),
          loiteringThreshold: Number(data?.loiteringThreshold ?? DEFAULT_SETTINGS.loiteringThreshold),
          restrictedStartTime: data?.restrictedStartTime ?? DEFAULT_SETTINGS.restrictedStartTime,
          restrictedEndTime: data?.restrictedEndTime ?? DEFAULT_SETTINGS.restrictedEndTime,
        });
      } catch (error) {
        setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to load settings.' });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'suspiciousInteractionTimeThreshold' || name === 'crowdThreshold' || name === 'loiteringThreshold'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const { data } = await api.post('/settings', formData);
      setFormData({
        suspiciousInteractionTimeThreshold: Number(
          data?.settings?.suspiciousInteractionTimeThreshold ?? formData.suspiciousInteractionTimeThreshold
        ),
        crowdThreshold: Number(data?.settings?.crowdThreshold ?? formData.crowdThreshold),
        loiteringThreshold: Number(data?.settings?.loiteringThreshold ?? formData.loiteringThreshold),
        restrictedStartTime: data?.settings?.restrictedStartTime ?? formData.restrictedStartTime,
        restrictedEndTime: data?.settings?.restrictedEndTime ?? formData.restrictedEndTime,
      });
      setStatus({ type: 'success', message: 'Settings saved successfully.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">System Settings</h2>
        <p className="mt-1 text-slate-400">
          Configure suspicious, crowd-density, loitering, and restricted-time thresholds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Crowd Density Threshold</label>
            <input
              type="number"
              min="1"
              name="crowdThreshold"
              value={formData.crowdThreshold}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-brand-400 transition focus:ring-2"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Loitering Threshold (seconds)</label>
            <input
              type="number"
              min="1"
              name="loiteringThreshold"
              value={formData.loiteringThreshold}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-brand-400 transition focus:ring-2"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Suspicious Interaction Threshold (seconds)
            </label>
            <input
              type="number"
              min="1"
              name="suspiciousInteractionTimeThreshold"
              value={formData.suspiciousInteractionTimeThreshold}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-brand-400 transition focus:ring-2"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Restricted Entry Start Time</label>
            <input
              type="time"
              name="restrictedStartTime"
              value={formData.restrictedStartTime}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-brand-400 transition focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Restricted Entry End Time</label>
            <input
              type="time"
              name="restrictedEndTime"
              value={formData.restrictedEndTime}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-brand-400 transition focus:ring-2"
            />
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Set start and end to the same time if you want to disable restricted-time alerts.
        </p>

        {status.message && (
          <p className={`mt-4 text-sm ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || loading}
          className="mt-5 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-500 disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
