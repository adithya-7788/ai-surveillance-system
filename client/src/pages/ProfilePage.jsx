import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.phoneNumber !== undefined) {
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const handleSave = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const { data } = await api.put('/user/profile/phone', { phoneNumber });
      updateUser(data.user);
      setStatus({ type: 'success', message: 'Phone number updated successfully.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update phone number.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Profile</h2>
        <p className="mt-1 text-slate-400">
          Configure contact details used for future SMS/WhatsApp alert workflows.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="max-w-xl space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-soft"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            readOnly
            value={user?.email || ''}
            className="w-full cursor-not-allowed rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="e.g. +1 555 010 1234"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-brand-400 transition focus:ring-2"
          />
        </div>

        {status.message && (
          <p className={`text-sm ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-500 disabled:opacity-70"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
