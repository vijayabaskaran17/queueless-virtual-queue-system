import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Ticket,
  History,
  Bell,
  Sliders,
  Users,
  Layers,
  Monitor,
  FileText,
  LogOut,
  X,
  Layers3,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const customerNav = [
    { name: 'Overview', to: '/customer', icon: LayoutDashboard },
    { name: 'Find a Service', to: '/customer/services', icon: Search },
    { name: 'My Active Token', to: '/customer/active', icon: Ticket },
    { name: 'Queue History', to: '/customer/history', icon: History },
    { name: 'Notifications', to: '/customer/notifications', icon: Bell },
  ];

  const staffNav = [
    { name: 'Queue Operations', to: '/staff', icon: LayoutDashboard },
    { name: 'Counter Control', to: '/staff/counter', icon: Monitor },
  ];

  const adminNav = [
    { name: 'Analytics & Overview', to: '/admin', icon: LayoutDashboard },
    { name: 'User Management', to: '/admin/users', icon: Users },
    { name: 'Service Catalog', to: '/admin/services', icon: Layers },
    { name: 'Counter Setup', to: '/admin/counters', icon: Monitor },
    { name: 'Queue Rules', to: '/admin/settings', icon: Sliders },
    { name: 'Audit Logs', to: '/admin/logs', icon: FileText },
  ];

  let navItems = customerNav;
  if (user?.role === 'staff') navItems = staffNav;
  if (user?.role === 'admin') navItems = adminNav;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Layers3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-white leading-none">
                  Queue<span className="text-indigo-400">Less</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  Intelligent Queue
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User badge */}
          <div className="mx-4 my-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/customer' || item.to === '/staff' || item.to === '/admin'}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
