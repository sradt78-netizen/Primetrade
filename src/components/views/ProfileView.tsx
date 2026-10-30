import React, { useState } from 'react';
import { User, Shield, Lock, Bell, Check, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProfileView: React.FC = () => {
  const { user, showToast } = useApp();
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [twoFa, setTwoFa] = useState(user.twoFactorEnabled);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile settings saved successfully', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Profile & Account Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, trading security credentials, and 2FA authentication.
        </p>
      </div>

      <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
              {user.avatarInitials || (user.fullName || user.username || 'U')[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-lg font-bold text-white">{user.fullName || user.username || 'Trader'}</div>
              <div className="text-xs text-slate-400 font-mono">Username: @{user.username || 'trader'}</div>
              <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                Broker Account ID: #BEM-9924-US
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jurisdiction</label>
              <input
                type="text"
                disabled
                value={user.country}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Security & 2FA */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              <span>Two-Factor Authentication (2FA)</span>
            </h3>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Google Authenticator / Biometric Key</div>
                <div className="text-[11px] text-slate-400">Requires a 6-digit one-time code for all withdrawals and password changes.</div>
              </div>
              <button
                type="button"
                onClick={() => setTwoFa(!twoFa)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  twoFa ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {twoFa ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} />
            <span>Save Profile Updates</span>
          </button>
        </form>
      </div>
    </div>
  );
};
