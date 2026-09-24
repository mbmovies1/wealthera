import React from 'react';
import { useApp } from '../context/AppContext.js';
import { Bell, CheckCheck, Clock, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-aqua-700" />;
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">Notifications</h3>
          <p className="text-xs text-slate-500">System notices, dividends, and approval alerts</p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-xs font-bold text-aqua-800 hover:text-aqua-900 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-2">
        {(!notifications || notifications.length === 0) ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <span>No notifications yet. You're all caught up!</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(notifications || []).map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                className={`py-3 px-2 flex items-start gap-3 rounded-2xl transition-all cursor-pointer ${
                  notif.read ? 'opacity-80 hover:bg-slate-50/50' : 'bg-peach-50/50 hover:bg-peach-50/80'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className={`text-xs ${notif.read ? 'font-semibold text-slate-800' : 'font-black text-slate-900'}`}>
                      {notif.title}
                    </h5>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-peach-500 shrink-0"></span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
