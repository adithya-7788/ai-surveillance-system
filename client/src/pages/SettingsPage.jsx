import { useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULT_SETTINGS = {
  crowdThreshold: 10,
  loiteringTime: 60,
  disappearanceFrameThreshold: 5,
  restrictedStartTime: '00:00',
  restrictedEndTime: '00:00',
  monitoredObjectClasses: '',
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
          crowdThreshold: Number(data?.crowdThreshold ?? DEFAULT_SETTINGS.crowdThreshold),
          loiteringTime: Number(data?.loiteringTime ?? DEFAULT_SETTINGS.loiteringTime),
          disappearanceFrameThreshold: Number(
            data?.disappearanceFrameThreshold ?? DEFAULT_SETTINGS.disappearanceFrameThreshold
          ),
          restrictedStartTime: data?.restrictedStartTime ?? DEFAULT_SETTINGS.restrictedStartTime,
          restrictedEndTime: data?.restrictedEndTime ?? DEFAULT_SETTINGS.restrictedEndTime,
          monitoredObjectClasses: Array.isArray(data?.monitoredObjectClasses)
            ? data.monitoredObjectClasses.join(', ')
            : DEFAULT_SETTINGS.monitoredObjectClasses,
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
      [name]: name === 'crowdThreshold' || name === 'loiteringTime' || name === 'disappearanceFrameThreshold' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const { data } = await api.post('/settings', formData);
      setFormData({
        crowdThreshold: Number(data?.settings?.crowdThreshold ?? formData.crowdThreshold),
        loiteringTime: Number(data?.settings?.loiteringTime ?? formData.loiteringTime),
        disappearanceFrameThreshold: Number(
          data?.settings?.disappearanceFrameThreshold ?? formData.disappearanceFrameThreshold
        ),
        restrictedStartTime: data?.settings?.restrictedStartTime ?? formData.restrictedStartTime,
        restrictedEndTime: data?.settings?.restrictedEndTime ?? formData.restrictedEndTime,
        monitoredObjectClasses: Array.isArray(data?.settings?.monitoredObjectClasses)
          ? data.settings.monitoredObjectClasses.join(', ')
          : formData.monitoredObjectClasses,
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
          Configure crowd, loitering, suspicious-activity, and restricted-time alert thresholds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Crowd Threshold</label>
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
            <label className="mb-2 block text-sm font-medium text-slate-300">Loitering Time (seconds)</label>
            <input
              type="number"
              min="1"
              name="loiteringTime"
              value={formData.loiteringTime}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-brand-400 transition focus:ring-2"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Disappearance Frame Threshold</label>
            <input
              type="number"
              min="1"
              name="disappearanceFrameThreshold"
              value={formData.disappearanceFrameThreshold}
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

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Monitored Object Classes
            </label>
            <input
              type="text"
              name="monitoredObjectClasses"
              value={formData.monitoredObjectClasses}
              onChange={handleChange}
              placeholder="bag, backpack, suitcase"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-brand-400 transition focus:ring-2"
            />
            <p className="mt-2 text-xs text-slate-500">Comma-separated values. Leave blank to monitor all object classes when object data is available.</p>
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
