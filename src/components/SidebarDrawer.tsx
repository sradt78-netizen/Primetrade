import React, { useState } from 'react';
import {
  X,
  LayoutDashboard,
  FileText,
  Target,
  PieChart,
  LineChart,
  Activity,
  Users,
  Bot,
  Zap,
  PlusCircle,
  MinusCircle,
  ArrowLeftRight,
  User,
  ShieldAlert,
  ShieldCheck,
  Headphones,
  LogOut,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SidebarDrawer: React.FC = () => {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    activeTab,
    setActiveTab,
    user,
    logout,
    setIsDepositModalOpen,
    setIsWithdrawModalOpen,
    setIsKycModalOpen,
    isLoggedIn,
    setIsLoginOpen
  } = useApp();

  const [investmentPlansExpanded, setInvestmentPlansExpanded] = useState(false);
  const [identityExpanded, setIdentityExpanded] = useState(false);

  if (!isSidebarOpen) return null;

  const navigateTo = (tab: string) => {
    const protectedTabs = ['dashboard', 'statements', 'portfolio', 'performance', 'wallet', 'profile', 'kyc'];
    if (!isLoggedIn && protectedTabs.includes(tab)) {
      setIsSidebarOpen(false);
      setIsLoginOpen(true);
      return;
    }
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-[#090f1d] border-l border-slate-800 text-slate-200 flex flex-col shadow-2xl overflow-y-auto">
          {/* Header inside Drawer */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#090f1d]/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-2">
              <img
                src="/brand/blue-edge-logo.png"
                alt="Blue Edge Market"
                className="h-7 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Balance:</span>
                  <span className="text-sm font-bold text-white font-mono">
                    ${(user.isDemoMode ? user.demoBalance : user.accountBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Sign In
                </button>
              )}

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 py-4 px-3 space-y-6 text-sm">
            {/* OVERVIEW SECTION */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                OVERVIEW
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => navigateTo('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => navigateTo('statements')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'statements'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <FileText size={18} />
                  <span>Account Statement</span>
                </button>
              </div>
            </div>

            {/* PORTFOLIO & INVESTMENTS */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PORTFOLIO & INVESTMENTS
              </div>
              <div className="space-y-1">
                {/* Investment Plans with Accordion */}
                <div>
                  <button
                    onClick={() => setInvestmentPlansExpanded(!investmentPlansExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                      activeTab === 'plans'
                        ? 'bg-blue-600/90 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 flex-1 text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('plans');
                      }}
                    >
                      <Target size={18} />
                      <span>Investment Plans</span>
                    </div>
                    {investmentPlansExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {investmentPlansExpanded && (
                    <div className="pl-9 pr-2 py-1.5 space-y-1 text-xs text-slate-300 bg-slate-900/40 rounded-lg mt-1 border border-slate-800/50">
                      <button
                        onClick={() => navigateTo('plans')}
                        className="w-full text-left py-1.5 px-2 hover:text-blue-400 flex items-center justify-between cursor-pointer"
                      >
                        <span>Conservative Yield</span>
                        <span className="text-[10px] text-emerald-400 font-bold">63.5% APY</span>
                      </button>
                      <button
                        onClick={() => navigateTo('plans')}
                        className="w-full text-left py-1.5 px-2 hover:text-blue-400 flex items-center justify-between cursor-pointer"
                      >
                        <span>Balanced Multi-Asset</span>
                        <span className="text-[10px] text-blue-400 font-bold">71.8% APY</span>
                      </button>
                      <button
                        onClick={() => navigateTo('plans')}
                        className="w-full text-left py-1.5 px-2 hover:text-blue-400 flex items-center justify-between cursor-pointer"
                      >
                        <span>High-Yield Growth</span>
                        <span className="text-[10px] text-indigo-400 font-bold">81.4% APY</span>
                      </button>
                      <button
                        onClick={() => navigateTo('plans')}
                        className="w-full text-left py-1.5 px-2 hover:text-blue-400 flex items-center justify-between cursor-pointer"
                      >
                        <span>Crypto Alpha Vault</span>
                        <span className="text-[10px] text-cyan-400 font-bold">93.2% APY</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigateTo('portfolio')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'portfolio'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <PieChart size={18} />
                  <span>My Portfolio</span>
                </button>

                <button
                  onClick={() => navigateTo('performance')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'performance'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Activity size={18} />
                  <span>Performance History</span>
                </button>
              </div>
            </div>

            {/* TRADING & MARKETS */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                TRADING & MARKETS
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => navigateTo('markets')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'markets'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LineChart size={18} />
                    <span>Live Markets</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    Live
                  </span>
                </button>

                <button
                  onClick={() => navigateTo('copy-trading')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'copy-trading'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={18} />
                    <span>Copy Trading</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                    Pro
                  </span>
                </button>

                <button
                  onClick={() => navigateTo('ai-bots')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'ai-bots'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bot size={18} />
                    <span>AI Trading Bots</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                    AI
                  </span>
                </button>
              </div>
            </div>

            {/* MARKET INTELLIGENCE */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                MARKET INTELLIGENCE
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => navigateTo('signals')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'signals'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap size={18} />
                    <span>Premium Signals</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                    Premium
                  </span>
                </button>
              </div>
            </div>

            {/* WALLET & FUNDS */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                WALLET & FUNDS
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    if (isLoggedIn) setIsDepositModalOpen(true);
                    else setIsLoginOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer"
                >
                  <PlusCircle size={18} className="text-emerald-400" />
                  <span>Deposit Funds</span>
                </button>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    if (isLoggedIn) setIsWithdrawModalOpen(true);
                    else setIsLoginOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer"
                >
                  <MinusCircle size={18} className="text-amber-400" />
                  <span>Withdraw Funds</span>
                </button>

                <button
                  onClick={() => navigateTo('wallet')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'wallet'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <ArrowLeftRight size={18} />
                  <span>Internal Transfer</span>
                </button>
              </div>
            </div>

            {/* ACCOUNT MANAGEMENT */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ACCOUNT MANAGEMENT
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => navigateTo('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <User size={18} />
                  <span>Profile Settings</span>
                </button>

                {/* Identity Verification Accordion */}
                <div>
                  <button
                    onClick={() => setIdentityExpanded(!identityExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSidebarOpen(false);
                        setIsKycModalOpen(true);
                      }}
                    >
                      {user.isKycVerified ? (
                        <ShieldCheck size={18} className="text-emerald-400" />
                      ) : (
                        <ShieldAlert size={18} className="text-amber-400" />
                      )}
                      <span>Identity Verification</span>
                    </div>
                    {identityExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {identityExpanded && (
                    <div className="pl-9 pr-2 py-2 space-y-1.5 text-xs text-slate-300 bg-slate-900/40 rounded-lg mt-1 border border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <span>Current Status:</span>
                        <span className={user.isKycVerified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {user.kycTier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {user.isKycVerified
                          ? 'Your account is fully compliant with FINRA/SEC identity protocols.'
                          : 'Complete document verification to unlock unthrottled withdrawals.'}
                      </p>
                      <button
                        onClick={() => {
                          setIsSidebarOpen(false);
                          setIsKycModalOpen(true);
                        }}
                        className="text-blue-400 text-xs font-semibold hover:underline block pt-1 cursor-pointer"
                      >
                        {user.isKycVerified ? 'View Documents' : 'Submit ID Documents ->'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GROWTH & REWARDS */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                GROWTH & REWARDS
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => navigateTo('referral')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'referral'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={18} />
                    <span>Referral Program</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    5%
                  </span>
                </button>
              </div>
            </div>

            {/* SUPPORT & HELP */}
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                SUPPORT & HELP
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => navigateTo('support')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer ${
                    activeTab === 'support'
                      ? 'bg-blue-600/90 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Headphones size={18} />
                  <span>Support Center</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer: Sign In/Out and Legal Notice */}
          <div className="p-4 border-t border-slate-800 bg-[#070b16] space-y-3">

            {isLoggedIn ? (
              <button
                onClick={() => {
                  logout();
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition cursor-pointer border border-red-500/20"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsLoginOpen(true);
                }}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition cursor-pointer shadow-md"
              >
                Sign In to Trading Portal
              </button>
            )}

            <div className="text-[10px] text-slate-500 text-center leading-relaxed">
              Licensed Broker Dealer • Segregated Custodial Accounts • SIPC Protected
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
