import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowDownLeft,
  Zap,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Lock,
  Layers,
  AlertCircle,
  Users,
  Star
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { InvestorAuthGate } from './InvestorAuthGate';

export const DashboardView: React.FC = () => {
  const {
    user,
    isLoggedIn,
    assets,
    isLoadingMarketData,
    positions,
    closePosition,
    setIsDepositModalOpen,
    setIsWithdrawModalOpen,
    setIsKycModalOpen,
    setIsWalletModalOpen,
    setSelectedSymbol,
    setIsQuickTradeOpen,
    setActiveTab,
    requestPushPermissions,
    copyTraders,
    copySubscriptions,
    showToast
  } = useApp();


  const [idVerificationExpanded, setIdVerificationExpanded] = useState(false);
  const [currentTime] = useState(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  if (!isLoggedIn) {
    return (
      <InvestorAuthGate
        title="Investor Trading Dashboard"
        description="Segregated portfolio valuation, trading accounts, and order management are restricted to authenticated Blue Edge Market clients."
      />
    );
  }

  const btc = assets.find(a => a.symbol === 'BTC/USD');
  const eth = assets.find(a => a.symbol === 'ETH/USD');
  const displayBalance = user.isDemoMode ? user.demoBalance : user.accountBalance;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Welcome Banner (Screenshot 7) */}
      <div className="text-center sm:text-left pt-2 pb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome back, {user.fullName || user.username || 'Trader'}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Your investment dashboard overview
        </p>
      </div>


      {/* Main Account Balance Card (Screenshot 7) */}
      <div className="bg-gradient-to-b from-[#111c34] to-[#0c1527] border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 mb-2">
          <Wallet size={16} className="text-blue-400" />
          <span>Account Balance</span>
        </div>
        <div className="text-[11px] text-slate-400 mb-3">Your available funds</div>

        {/* Balance Amount */}
        <div className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight my-2">
          ${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Clean unboxed metadata row */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mt-3 mb-5">
          <span className="text-slate-300">Available for withdrawal</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <button
            onClick={() => setIsKycModalOpen(true)}
            className={`inline-flex items-center gap-1 font-semibold transition cursor-pointer hover:underline ${
              user.isKycVerified ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {user.isKycVerified ? <ShieldCheck size={13} /> : <AlertCircle size={13} />}
            <span>{user.isKycVerified ? 'Verified Account' : 'Verification Required'}</span>
          </button>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono text-slate-500">{currentTime}</span>
        </div>

        {/* Deposit & Withdraw Buttons (Screenshot 7) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="py-3 px-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Deposit</span>
          </button>

          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="py-3 px-5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowUpRight size={16} />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Identity Verification Alert Card (Screenshot 2) */}
      {!user.isKycVerified && (
        <div className="bg-[#0e172a] border border-blue-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <ShieldAlert size={26} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Identity Verification
            </h3>
            <p className="text-xs text-slate-300 max-w-md mb-4">
              Complete verification to access all institutional features, high-leverage CFD trading, and instant crypto/fiat withdrawals.
            </p>

            <button
              onClick={() => setIdVerificationExpanded(!idVerificationExpanded)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>View Details</span>
              {idVerificationExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {idVerificationExpanded && (
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-3 max-w-lg mx-auto">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                <div>
                  <div className="font-semibold text-white">Tier 1: Government ID / Passport</div>
                  <div className="text-slate-400 text-[11px]">Enables deposits up to $50,000/day and immediate order execution.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                <div>
                  <div className="font-semibold text-white">Tier 2: Proof of Residential Address</div>
                  <div className="text-slate-400 text-[11px]">Unlocks unlimited fiat bank wire withdrawals and VIP spreads.</div>
                </div>
              </div>

              <button
                onClick={() => setIsKycModalOpen(true)}
                className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-center cursor-pointer"
              >
                Start Verification Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connect Crypto Wallet Card (Screenshot 2) */}
      <div className="bg-gradient-to-br from-[#10192e] to-[#0a1224] border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
            <Wallet size={26} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {user.connectedWalletAddress ? 'Wallet Connected' : 'Connect Your Wallet to Start Earning'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
            {user.connectedWalletAddress ? (
              <span className="text-emerald-400 font-mono font-medium">
                Active Web3 Address: {user.connectedWalletAddress}
              </span>
            ) : (
              'Connect your cryptocurrency wallet to unlock daily earning opportunities of up to $300 a day with automated on-chain yield compounding.'
            )}
          </p>

          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <Wallet size={15} />
            <span>{user.connectedWalletAddress ? 'Manage Connected Wallet' : 'Connect Web3 Wallet'}</span>
          </button>
        </div>
      </div>

      {/* Real Live Positions Section */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Open Trading Positions ({positions.length})
            </h3>
          </div>
          <button
            onClick={() => setIsQuickTradeOpen(true)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            <span>+ New Trade</span>
          </button>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl">
            <Layers size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No active open positions</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Execute low-latency trades across Bitcoin, Ethereum, Tech Equities, and Forex with real live prices.
            </p>
            <button
              onClick={() => setIsQuickTradeOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Open Instant Trade
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map(pos => (
              <div
                key={pos.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                      pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {pos.type} {pos.leverage}x
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white">{pos.symbol}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Entry: ${pos.entryPrice.toLocaleString()} • Mark: ${pos.currentPrice.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 border-slate-800 pt-2 sm:pt-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Floating P&L</div>
                    <div
                      className={`text-sm font-extrabold font-mono ${
                        pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent}%)
                    </div>
                  </div>

                  <button
                    onClick={() => closePosition(pos.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    Close Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Copy Expert Traders Showcase */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Copy Expert Traders ({copyTraders.length} Verified)
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              Live Mirroring
            </span>
          </div>
          <button
            onClick={() => setActiveTab('copy-trading')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All {copyTraders.length}+ Experts</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* 3 Featured Traders from Screenshots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {copyTraders.slice(0, 3).map(trader => {
            const isCopying = copySubscriptions.some(s => s.traderId === trader.id && s.status !== 'stopped');
            return (
              <div
                key={trader.id}
                onClick={() => setActiveTab('copy-trading')}
                className="bg-[#121a2c] hover:bg-[#152138] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 rounded">
                      Active
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Min: ${trader.minInvestment.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={trader.avatar}
                      alt={trader.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-900"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{trader.name}</h4>
                      <p className="text-xs text-slate-400">{trader.specialty}</p>
                      <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                        <Star size={11} className="fill-amber-400" />
                        <span>{trader.rating.toFixed(1)}</span>
                        <span className="text-slate-500">({trader.followers} copiers)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#090f1e] p-2.5 rounded-lg text-xs mb-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Win Rate</span>
                      <span className="font-bold text-white">{trader.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Return</span>
                      <span className="font-extrabold text-emerald-400">+{trader.totalReturn.toLocaleString()}%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('copy-trading');
                  }}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isCopying
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <span>{isCopying ? 'Currently Copying' : 'Copy Trader'}</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Live Watchlist Bar */}

      <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Real Live Exchange Rates
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('markets')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Market Desk</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {isLoadingMarketData ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-blue-400" />
            <span>Streaming real live tickers from Binance & Exchange Rate API...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assets.slice(0, 6).map(asset => (
              <div
                key={asset.symbol}
                onClick={() => {
                  setSelectedSymbol(asset.symbol);
                  setIsQuickTradeOpen(true);
                }}
                className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 rounded-xl p-3.5 transition cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                    {asset.symbol}
                  </div>
                  <div className="text-[10px] text-slate-400">{asset.name}</div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-white">
                    ${asset.price.toLocaleString(undefined, {
                      minimumFractionDigits: asset.category === 'forex' ? 4 : 2,
                      maximumFractionDigits: asset.category === 'forex' ? 4 : 2
                    })}
                  </div>
                  <div
                    className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                      asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {asset.change24h >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    <span>{asset.change24h >= 0 ? '+' : ''}{asset.change24h}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Push Notification Opt-in Prompt */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Zap size={16} className="text-amber-400" />
          <span>Enable real-time push notifications for instant trade execution and price spike alerts.</span>
        </div>
        <button
          onClick={requestPushPermissions}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer whitespace-nowrap"
        >
          Enable Push Alerts
        </button>
      </div>
    </div>
  );
};
