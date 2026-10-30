import React from 'react';
import {
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InvestorAuthGate } from './InvestorAuthGate';

export const PortfolioView: React.FC = () => {
  const {
    user,
    isLoggedIn,
    positions,
    closePosition,
    setIsDepositModalOpen,
    setIsQuickTradeOpen,
    setActiveTab
  } = useApp();

  if (!isLoggedIn) {
    return (
      <InvestorAuthGate
        title="Portfolio & Asset Holdings"
        description="Active market exposure, position margin, and real-time net asset values are protected behind authenticated client access."
      />
    );
  }

  const currentCash = user.isDemoMode ? user.demoBalance : user.accountBalance;
  const investedInPositions = positions.reduce((acc, p) => acc + p.amount, 0);
  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const totalPortfolioValue = currentCash + investedInPositions + totalUnrealizedPnl;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Top Portfolio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Portfolio Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time equity valuation, position monitoring, and margin exposure across global assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Funds</span>
          </button>
          <button
            onClick={() => setIsQuickTradeOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight size={15} />
            <span>New Position</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Net Asset Value
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Available Cash + Open Equity
          </div>
        </div>

        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Unrealized Floating P&L
          </div>
          <div
            className={`text-2xl font-extrabold font-mono flex items-center gap-1 ${
              totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {totalUnrealizedPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span>{totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active position performance
          </div>
        </div>

        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Liquid Available Cash
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            ${currentCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            100% Free Margin
          </div>
        </div>

        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Active Margin Allocated
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            ${investedInPositions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {positions.length} position(s)
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Holdings & Open Positions
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Live prices auto-updating
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl">
            <PieIcon size={36} className="text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">No active holdings</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Execute trades in Live Markets or subscribe to an investment tier to build your portfolio.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('markets')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Explore Live Markets
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
              >
                View Yield Tiers
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Margin Allocated</th>
                  <th className="py-3 px-4 text-right">Entry Price</th>
                  <th className="py-3 px-4 text-right">Current Price</th>
                  <th className="py-3 px-4 text-right">Floating P&L</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {positions.map(pos => (
                  <tr key={pos.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-sans font-bold text-white">
                      {pos.symbol}
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">
                        Opened: {pos.openedAt}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pos.type === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {pos.type} {pos.leverage}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ${pos.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      ${pos.entryPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-white font-bold">
                      ${pos.currentPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      <span className={pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent}%)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <button
                        onClick={() => closePosition(pos.id)}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold cursor-pointer transition"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custody & SIPC Insurance Notice */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck size={24} className="text-emerald-400 flex-shrink-0" />
        <div>
          <strong className="text-slate-200">Segregated Custodial Accounts:</strong> All client uninvested capital and trading balances are held in segregated, bankruptcy-remote accounts at Tier-1 depository institutions (J.P. Morgan & BNY Mellon) with up to $500,000 SIPC protection.
        </div>
      </div>
    </div>
  );
};
