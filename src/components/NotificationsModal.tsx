import React from 'react';
import { X, Bell, CheckCheck, Zap, Shield, Wallet, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotifRead,
    markAllNotifsRead,
    requestPushPermissions
  } = useApp();

  if (!isNotificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0a1020] border border-slate-700 rounded-2xl p-6 text-white shadow-2xl my-8">
        <button
          onClick={() => setIsNotificationsOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-400" />
            <h2 className="text-base font-extrabold text-white">Push & System Notifications</h2>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={markAllNotifsRead}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No new alerts or notifications.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markNotifRead(n.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  n.read
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-900 border-blue-500/40 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {n.type === 'trade' && <Zap size={14} className="text-blue-400" />}
                    {n.type === 'security' && <Shield size={14} className="text-indigo-400" />}
                    {n.type === 'wallet' && <Wallet size={14} className="text-emerald-400" />}
                    <span className="text-xs font-bold text-white">{n.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{n.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Real-Time Web Push</span>
          <button
            onClick={requestPushPermissions}
            className="text-xs font-bold text-blue-400 hover:underline cursor-pointer"
          >
            Enable Browser Push Alerts
          </button>
        </div>
      </div>
    </div>
  );
};
