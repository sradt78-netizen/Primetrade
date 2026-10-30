import React from 'react';
import { Lock, ShieldCheck, ArrowRight, UserCheck, LineChart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface InvestorAuthGateProps {
  title?: string;
  description?: string;
}

export const InvestorAuthGate: React.FC<InvestorAuthGateProps> = ({
  title = 'Client Account Authentication Required',
  description = 'Segregated investor funds, live balances, and execution portfolios are restricted to authenticated Blue Edge Market clients.'
}) => {
  const { setIsLoginOpen, setIsRegisterOpen, setActiveTab } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-gradient-to-b from-[#101b33] to-[#09101f] border border-blue-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl mb-6 border border-blue-400/40">
          <Lock size={30} />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/30 inline-block mb-3">
          SEC Rule 15c3-3 Segregated Custody
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {title}
        </h2>

        <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-8">
          {description} Please authenticate to access your personal brokerage dashboard and asset records.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-8">
          <button
            onClick={() => setIsLoginOpen(true)}
            className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck size={16} />
            <span>Sign In to Client Portal</span>
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="w-full sm:w-auto py-3 px-6 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Account</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Security badges */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>SIPC Protected up to $500,000</span>
          </div>
          <span>•</span>
          <button
            onClick={() => setActiveTab('markets')}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
          >
            <LineChart size={14} />
            <span>Explore Public Market Feeds</span>
          </button>
        </div>
      </div>
    </div>
  );
};
