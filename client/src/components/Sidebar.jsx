import { LayoutDashboard, Camera, Bell, User, LogOut, ShieldCheck, Menu, SlidersHorizontal, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Live Camera', to: '/dashboard/live-camera', icon: Camera },
  { label: 'Configuration', to: '/config', icon: SlidersHorizontal },
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'Alerts', to: '/dashboard/alerts', icon: Bell },
  { label: 'Profile', to: '/dashboard/profile', icon: User },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-slate-900/80 p-2 text-slate-100 shadow-soft lg:hidden"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <button
          aria-label="Close sidebar backdrop"
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-900/95 p-6 backdrop-blur transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-brand-600/20 p-2 text-brand-300">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-300">AI Security</p>
            <h1 className="text-lg font-semibold text-white">Smart Surveillance</h1>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-auto flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 hover:border-red-500 hover:text-red-300"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
