import React from 'react';
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatIndianDateTime } from '../../utils/dateUtils';

const CustomerNotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'called':
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-teal-600" />;
      default:
        return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time alerts, token updates, and turn announcements</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            You do not have any notifications yet.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && markAsRead(notif._id)}
              className={`p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50/80 ${
                !notif.isRead ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900">{notif.title}</h3>
                  <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatIndianDateTime(notif.createdAt)} (IST)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
              </div>
              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerNotificationsPage;
