import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useISTClock } from '../hooks/useISTClock';

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const istTime = useISTClock();

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <main className="w-full flex-1 p-6 lg:p-10">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Welcome back</p>
            <h2 className="text-xl font-semibold text-white">{user?.email}</h2>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-widest text-brand-300">India Time</p>
            <p className="text-sm font-medium text-white">{istTime}</p>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
