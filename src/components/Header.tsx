import React from 'react';
import { Logo } from './Logo.js';
import { useApp } from '../context/AppContext.js';
import { Bell, UserCheck, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  title = 'WEALTHERA',
  showBack = false,
  onBack,
}) => {
  const { user, admin, isImpersonating, stopImpersonating, notifications } = useApp();

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      {/* Impersonation Alert Banner */}
      {isImpersonating && (
        <div className="bg-aqua-950 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b-2 border-peach-500 shadow-sm">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-peach-400" />
            <span>Impersonating user @{user?.username}</span>
          </div>
          <button
            id="return-to-admin-btn"
            onClick={stopImpersonating}
            className="bg-peach-500 hover:bg-peach-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold transition-all shadow-xs"
          >
            Exit to Admin
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Back button + Brand Logo */}
        <div className="flex items-center gap-2.5">
          {showBack && (
            <button
              id="header-back-btn"
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Logo variant="icon" size="sm" className="shrink-0" />

          <div className="flex flex-col">
            {title === 'WEALTHERA' ? (
              <div className="flex items-center gap-1 font-black text-lg tracking-tight text-slate-900 leading-tight">
                <span className="text-emerald-600 font-black">W</span>
                <span>EALTHER</span>
                <span className="relative inline-flex items-center justify-center">
                  <span>A</span>
                  <span className="absolute top-1 inset-x-0 flex justify-center text-[6px] text-peach-500 font-black pointer-events-none">
                    ▲
                  </span>
                </span>
              </div>
            ) : (
              <h1 className="text-base font-black tracking-tight text-aqua-950 truncate max-w-[170px] sm:max-w-[220px]">
                {title}
              </h1>
            )}
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <button
            id="header-notifications-btn"
            onClick={onOpenNotifications}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-peach-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile / Avatar */}
          {user && (
            <button
              id="header-profile-btn"
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-xl bg-aqua-800 p-[2px] focus:outline-none transition-transform active:scale-95 shadow-xs"
            >
              <div className="w-full h-full bg-aqua-50 rounded-[9px] flex items-center justify-center text-xs font-black text-aqua-900 uppercase">
                {(user.username || user.fullName || 'U').charAt(0).toUpperCase()}
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
