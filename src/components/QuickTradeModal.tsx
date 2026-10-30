import React, { useState } from 'react';
import { X, Zap, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const QuickTradeModal: React.FC = () => {
  const {
    isQuickTradeOpen,
    setIsQuickTradeOpen,
    assets,
    selectedSymbol,
    setSelectedSymbol,
    openTrade,
    user
  } = useApp();

  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<number>(250);
  const [leverage, setLeverage] = useState<number>(10);

  if (!isQuickTradeOpen) return null;

  const currentAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsset) return;
    const ok = openTrade(currentAsset.symbol, orderType, amount, leverage);
    if (ok) {
      setIsQuickTradeOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0a1020] border border-blue-500/40 rounded-2xl p-6 text-white shadow-2xl my-8">
        <button
          onClick={() => setIsQuickTradeOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow">
            <Zap size={18} className="fill-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Instant Trade Execution</h2>
            <p className="text-[11px] text-slate-400">Zero-latency order routing engine</p>
          </div>
        </div>

        {/* Symbol Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Select Instrument</label>
          <select
            value={currentAsset?.symbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
          >
            {assets.map(a => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol} - ${a.price.toLocaleString()} ({a.change24h >= 0 ? '+' : ''}{a.change24h}%)
              </option>
            ))}
          </select>
        </div>

        {/* Live Price Pill */}
        {currentAsset && (
          <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between mb-4 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Live Market Price</span>
              <span className="text-xl font-extrabold text-white">
                ${currentAsset.price.toLocaleString(undefined, {
                  minimumFractionDigits: currentAsset.category === 'forex' ? 4 : 2,
                  maximumFractionDigits: currentAsset.category === 'forex' ? 4 : 2
                })}
              </span>
            </div>
            <div
              className={`text-xs font-bold flex items-center gap-0.5 ${
                currentAsset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {currentAsset.change24h >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{currentAsset.change24h >= 0 ? '+' : ''}{currentAsset.change24h}%</span>
            </div>
          </div>
        )}

        {/* Buy/Sell Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setOrderType('BUY')}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              orderType === 'BUY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            BUY / LONG
          </button>
          <button
            type="button"
            onClick={() => setOrderType('SELL')}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              orderType === 'SELL' ? 'bg-red-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            SELL / SHORT
          </button>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Order Margin ($ USD)</span>
              <span className="text-slate-400 font-mono">
                Avail: ${(user.isDemoMode ? user.demoBalance : user.accountBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <input
              type="number"
              min="10"
              step="10"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Leverage</span>
              <span className="text-blue-400 font-mono font-bold">{leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max={currentAsset?.leverageMax || 50}
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              orderType === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
            }`}
          >
            <Zap size={16} />
            <span>Confirm {orderType} Order (${(amount * leverage).toLocaleString()} Total Value)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
