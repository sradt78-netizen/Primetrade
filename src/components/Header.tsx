import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Menu, ChevronDown, CheckCircle2, AlertCircle, Shield, User, LogOut, Wallet, ArrowUpRight, TrendingUp, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';


export interface LiveMarketCap {
  symbol: string;
  name: string;
  category: 'stock' | 'crypto' | 'index' | 'commodity';
  price: number;
  change24h: number;
  marketCap: string;
  source?: string;
}

const DEFAULT_MARKET_CAPS: LiveMarketCap[] = [
  { symbol: 'TOTAL CRYPTO', name: 'Global Crypto MCap', category: 'index', price: 2775409214827, change24h: 2.15, marketCap: '$2.78T', source: 'Yahoo Finance' },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', price: 348.22, change24h: 1.23, marketCap: '$5.26T', source: 'Yahoo Finance' },
  { symbol: 'S&P 500', name: 'S&P 500 Market Cap', category: 'index', price: 5860.50, change24h: 0.55, marketCap: '$48.20T', source: 'Yahoo Finance' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'stock', price: 212.21, change24h: -4.40, marketCap: '$5.21T', source: 'Yahoo Finance' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'stock', price: 521.08, change24h: -2.23, marketCap: '$3.87T', source: 'Yahoo Finance' },
  { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', price: 81382.00, change24h: -3.85, marketCap: '$1.61T', source: 'Binance Live' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stock', price: 324.22, change24h: -3.15, marketCap: '$4.00T', source: 'Yahoo Finance' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stock', price: 250.38, change24h: -4.57, marketCap: '$2.62T', source: 'Yahoo Finance' },
  { symbol: 'META', name: 'Meta Platforms', category: 'stock', price: 648.85, change24h: -6.98, marketCap: '$1.65T', source: 'Yahoo Finance' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', category: 'stock', price: 374.58, change24h: -3.08, marketCap: '$1.19T', source: 'Yahoo Finance' },
  { symbol: 'ETH', name: 'Ethereum', category: 'crypto', price: 2386.13, change24h: -4.21, marketCap: '$287.3B', source: 'Binance Live' },
  { symbol: 'SOL', name: 'Solana', category: 'crypto', price: 103.51, change24h: -3.98, marketCap: '$48.5B', source: 'Binance Live' },
  { symbol: 'XAU/GOLD', name: 'Gold Bullion', category: 'commodity', price: 2736.50, change24h: 1.35, marketCap: '$17.80T', source: 'Yahoo Finance' },
];

export const Header: React.FC = () => {
  const {
    user,
    isLoggedIn,
    logout,
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    assets,
    setSelectedSymbol,
    setIsSidebarOpen,
    setIsLoginOpen,
    setIsRegisterOpen,
    setIsNotificationsOpen,
    unreadNotifsCount,
    toggleDemoMode,
    setIsDepositModalOpen,
    neonDbStatus,
    setIsNeonDbModalOpen
  } = useApp();


  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [marketCaps, setMarketCaps] = useState<LiveMarketCap[]>(DEFAULT_MARKET_CAPS);

  // Fetch live market caps from server route (proxying Yahoo Finance & Binance)
  useEffect(() => {
    let isMounted = true;
    const loadMarketCaps = async () => {
      try {
        const res = await fetch('/api/market-caps');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0 && isMounted) {
            setMarketCaps(data.data);
          }
        }
      } catch (err) {
        console.warn('Live market cap feed notice:', err);
      }
    };

    loadMarketCaps();
    const interval = setInterval(loadMarketCaps, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Synchronize crypto prices dynamically if real-time assets tick
  useEffect(() => {
    if (!assets || assets.length === 0) return;
    setMarketCaps(prev => {
      return prev.map(item => {
        if (item.symbol === 'BTC') {
          const btc = assets.find(a => a.symbol === 'BTC/USD');
          if (btc) {
            const rawCap = btc.price * 19.78e6;
            return {
              ...item,
              price: btc.price,
              change24h: btc.change24h,
              marketCap: `$${(rawCap / 1e12).toFixed(2)}T`
            };
          }
        }
        if (item.symbol === 'ETH') {
          const eth = assets.find(a => a.symbol === 'ETH/USD');
          if (eth) {
            const rawCap = eth.price * 120.4e6;
            return {
              ...item,
              price: eth.price,
              change24h: eth.change24h,
              marketCap: `$${(rawCap / 1e9).toFixed(1)}B`
            };
          }
        }
        if (item.symbol === 'SOL') {
          const sol = assets.find(a => a.symbol === 'SOL/USD');
          if (sol) {
            const rawCap = sol.price * 468.5e6;
            return {
              ...item,
              price: sol.price,
              change24h: sol.change24h,
              marketCap: `$${(rawCap / 1e9).toFixed(1)}B`
            };
          }
        }
        return item;
      });
    });
  }, [assets]);

  const handleTickerClick = (sym: string) => {
    const symbolMap: Record<string, string> = {
      'BTC': 'BTC/USD',
      'ETH': 'ETH/USD',
      'SOL': 'SOL/USD',
      'NVDA': 'NVDA',
      'AAPL': 'AAPL',
      'TSLA': 'TSLA',
      'XAU/GOLD': 'XAU/USD'
    };
    const targetSymbol = symbolMap[sym] || sym;
    const exists = assets.some(a => a.symbol === targetSymbol);
    if (exists) {
      setSelectedSymbol(targetSymbol);
      setActiveTab('markets');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090e1a]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* 1. TOP-MOST CONTINUOUS MOVING LIVE MARKET CAP TICKER (Yahoo Finance Live Feed) */}
      <div className="w-full bg-[#050811] border-b border-slate-800/90 text-xs overflow-hidden select-none py-1.5 flex items-center relative z-20 shadow-inner">
        {/* Left Branding Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-0.5 bg-[#0b1324] border-r border-slate-800/80 text-[11px] font-semibold text-slate-300 shrink-0 z-10 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-purple-400 font-extrabold tracking-wider text-[10px]">YAHOO FINANCE</span>
          <span className="text-slate-600 font-normal">|</span>
          <span className="text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={11} className="text-emerald-400" />
            LIVE MARKET CAPS
          </span>
        </div>

        {/* Mobile Compact Badge */}
        <div className="flex sm:hidden items-center gap-1.5 px-2 py-0.5 bg-[#0b1324] border-r border-slate-800 text-[10px] font-bold text-purple-400 shrink-0 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Y! MCAP</span>
        </div>

        {/* Continuous Horizontal Marquee Tape */}
        <div className="flex overflow-hidden w-full relative">
          <div
            className="ticker-track flex items-center whitespace-nowrap will-change-transform"
            title="Hover to pause live feed"
          >
            {/* Seamless Double Loop: Set 1 + Set 2 */}
            {[...marketCaps, ...marketCaps].map((item, idx) => (
              <div
                key={`${item.symbol}-${idx}`}
                onClick={() => handleTickerClick(item.symbol)}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-0.5 shrink-0 text-xs font-mono border-r border-slate-800/60 hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                {/* Asset Symbol */}
                <span className="font-bold text-white group-hover:text-blue-400 transition-colors tracking-wide">
                  {item.symbol}
                </span>

                {/* Live Market Cap Tag */}
                <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  MCap {item.marketCap}
                </span>

                {/* Live Price (for equities, cryptos, and commodities) */}
                {item.category !== 'index' || item.price < 100000 ? (
                  <span className="text-slate-300 font-medium text-[11px]">
                    ${item.price >= 1000 ? item.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : item.price.toFixed(2)}
                  </span>
                ) : null}

                {/* 24h Percentage Change */}
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-bold ${
                    item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {item.change24h >= 0 ? (
                    <>
                      <span className="text-[9px]">▲</span>+{item.change24h.toFixed(2)}%
                    </>
                  ) : (
                    <>
                      <span className="text-[9px]">▼</span>{item.change24h.toFixed(2)}%
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Regulatory Subtitle */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab(isLoggedIn ? 'dashboard' : 'landing')}
            className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
          >
            <img
              src="/brand/blue-edge-logo.png"
              alt="Blue Edge Market"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs uppercase tracking-widest text-blue-400 font-bold -mb-1">
                Licensed Broker
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                FINRA / SEC Regulated
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 ml-4">
            <button
              onClick={() => {
                if (isLoggedIn) setActiveTab('dashboard');
                else setIsLoginOpen(true);
              }}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('markets')}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'markets' ? 'text-blue-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Markets
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'plans' ? 'text-blue-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Investment Plans
            </button>
            <button
              onClick={() => setActiveTab('copy-trading')}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'copy-trading' ? 'text-blue-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Copy Trading
            </button>
            <button
              onClick={() => {
                if (isLoggedIn) setActiveTab('portfolio');
                else setIsLoginOpen(true);
              }}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'portfolio' ? 'text-blue-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Portfolio
            </button>
          </nav>
        </div>

        {/* Right Controls: Balance (Strictly Auth Only), Switcher, Notifications, Profile / Auth Buttons */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Demo / Live Account Switcher (Authenticated Only) */}
          {isLoggedIn && (
            <button
              onClick={toggleDemoMode}
              title="Click to toggle between Demo & Live accounts"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 transition cursor-pointer"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${user.isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span>{user.isDemoMode ? 'Demo Trading' : 'Live Trading'}</span>
            </button>
          )}

          {/* Account Balance Display - STRICTLY for authenticated investors only */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs shadow-sm">
              <span className="text-slate-400 text-[11px] font-medium">Balance:</span>
              <span className="font-bold text-white text-xs sm:text-sm">
                ${(user.isDemoMode ? user.demoBalance : user.accountBalance).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          )}

          {/* Quick Deposit Button (Authenticated Only) */}
          {isLoggedIn && (
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Wallet size={14} />
              <span>Deposit</span>
            </button>
          )}


          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            aria-label="View notifications"
            className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
          >
            <Bell size={20} />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>


          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
          >
            {theme === 'dark' ? <Moon size={19} /> : <Sun size={19} className="text-amber-400" />}
          </button>

          {/* User Profile Avatar with Dropdown OR Sign In / Open Account */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-800/60 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {user.avatarInitials || (user.fullName || user.username || 'U')[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 glass-dropdown rounded-xl py-2 z-50 shadow-2xl border border-slate-700">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{user.fullName || user.username || 'Trader'}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          user.isKycVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {user.kycTier}
                        </span>
                        <span className="text-[10px] text-slate-400">ID: #BEM-9924</span>
                      </div>
                    </div>

                    <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                      <div className="text-[11px] text-slate-400">Available Balance</div>
                      <div className="text-base font-extrabold text-white font-mono">
                        ${(user.isDemoMode ? user.demoBalance : user.accountBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
                      >
                        <User size={15} className="text-blue-400" />
                        <span>Trading Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Shield size={15} className="text-indigo-400" />
                        <span>Account & Security</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('kyc');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
                      >
                        {user.isKycVerified ? (
                          <CheckCircle2 size={15} className="text-emerald-400" />
                        ) : (
                          <AlertCircle size={15} className="text-amber-400" />
                        )}
                        <span>Identity Verification (KYC)</span>
                      </button>

                      <button
                        onClick={() => {
                          toggleDemoMode();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
                      >
                        <ArrowUpRight size={15} className="text-cyan-400" />
                        <span>Switch to {user.isDemoMode ? 'Live Account' : 'Demo Account'}</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-800 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Open Account
              </button>
            </div>
          )}

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar menu"
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
};
