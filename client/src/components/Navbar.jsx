import React, { useState } from 'react';
import { Bell, Wifi, WifiOff, User as UserIcon, LogOut, Menu, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>QueueLess</span>
            <span>/</span>
            <span className="capitalize text-slate-700 font-semibold">{user?.role} Portal</span>
          </div>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Socket indicator */}
        <div
          title={isConnected ? 'Real-time WebSocket Live' : 'Reconnecting to real-time events...'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isConnected
              ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-teal-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-premium border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-800">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[11px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.isRead && markAsRead(notif._id)}
                      className={`p-3.5 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                        !notif.isRead ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 8 && (
                <div className="p-2 text-center bg-slate-50 border-t border-slate-100">
                  <Link
                    to={user?.role === 'customer' ? '/customer/notifications' : '#'}
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">{user?.name}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {user?.role}
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-premium border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
