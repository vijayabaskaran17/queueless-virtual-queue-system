import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.warn('Notification fetch notice:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  // Listen for real-time notifications over socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Play soft alert chime using Web Audio API if permitted
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // Audio might be blocked without user interaction
      }

      // Show toast
      setToast(notification);
      setTimeout(() => {
        setToast((current) => (current?._id === notification._id ? null : current));
      }, 6000);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}

      {/* Floating In-App Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-indigo-500/40 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-sm font-bold">🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white tracking-wide">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  return useContext(NotificationContext) || {
    notifications: [],
    unreadCount: 0,
    markAsRead: () => {},
    markAllAsRead: () => {},
    refreshNotifications: () => {},
  };
};
