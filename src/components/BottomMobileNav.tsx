import React from 'react';
import { Home, Wallet, User, Headphones, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomMobileNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsDepositModalOpen,
    setIsQuickTradeOpen,
    isLoggedIn,
    setIsLoginOpen
  } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#090f1d]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around relative">
        {/* Deposit Button */}
        <button
          onClick={() => {
            if (isLoggedIn) {
              setIsDepositModalOpen(true);
            } else {
              setIsLoginOpen(true);
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-3 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <Wallet size={19} className="text-slate-300" />
          <span className="text-[10px] font-semibold mt-1">Deposit</span>
        </button>

        {/* Profile Button */}
        <button
          onClick={() => {
            if (isLoggedIn) {
              setActiveTab('profile');
            } else {
              setIsLoginOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 transition cursor-pointer ${
            activeTab === 'profile' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User size={19} />
          <span className="text-[10px] font-semibold mt-1">Profile</span>
        </button>

        {/* Center Glowing Lightning Quick-Action Button (exact match to screenshots 2 & 7) */}
        <div className="relative -top-5">
          <button
            onClick={() => setIsQuickTradeOpen(true)}
            aria-label="Execute instant trade"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.8)] border-2 border-blue-400/80 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Zap size={24} className="fill-white drop-shadow" />
          </button>
        </div>

        {/* Support Button */}
        <button
          onClick={() => setActiveTab('support')}
          className={`flex flex-col items-center justify-center py-1 px-3 transition cursor-pointer ${
            activeTab === 'support' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Headphones size={19} />
          <span className="text-[10px] font-semibold mt-1">Support</span>
        </button>

        {/* Home / Dashboard Button */}
        <button
          onClick={() => setActiveTab(isLoggedIn ? 'dashboard' : 'landing')}
          className={`flex flex-col items-center justify-center py-1 px-3 transition cursor-pointer ${
            activeTab === 'dashboard' || activeTab === 'landing' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home size={19} />
          <span className="text-[10px] font-semibold mt-1">Home</span>
        </button>
      </div>
    </nav>
  );
};
