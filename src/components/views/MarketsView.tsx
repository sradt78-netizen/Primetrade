import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Zap,
  BarChart2,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchRealCandles, Candle } from '../../services/marketApi';
import { MarketAsset } from '../../types';

export const MarketsView: React.FC = () => {
  const {
    assets,
    selectedSymbol,
    setSelectedSymbol,
    openTrade,
    user,
    showToast,
    setIsDepositModalOpen
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'crypto' | 'stocks' | 'forex' | 'commodities' | 'bonds'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);
  const [chartMode, setChartMode] = useState<'candlestick' | 'line'>('candlestick');

  // Order execution form state
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderAmount, setOrderAmount] = useState<number>(500);
  const [leverage, setLeverage] = useState<number>(10);
  const [stopLossPercent, setStopLossPercent] = useState<number>(5);
  const [takeProfitPercent, setTakeProfitPercent] = useState<number>(15);

  const selectedAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];

  // Fetch real candles whenever selected symbol changes
  useEffect(() => {
    if (!selectedAsset) return;
    let isCurrent = true;
    setIsLoadingCandles(true);

    fetchRealCandles(selectedAsset.symbol).then(data => {
      if (isCurrent) {
        setCandles(data);
        setIsLoadingCandles(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedSymbol]);

  const filteredAssets = assets.filter(a => {
    const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
    const matchesSearch = a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const currentPrice = selectedAsset.price;
    const sl = orderType === 'BUY'
      ? currentPrice * (1 - stopLossPercent / 100)
      : currentPrice * (1 + stopLossPercent / 100);
    const tp = orderType === 'BUY'
      ? currentPrice * (1 + takeProfitPercent / 100)
      : currentPrice * (1 - takeProfitPercent / 100);

    openTrade(selectedAsset.symbol, orderType, orderAmount, leverage, sl, tp);
  };

  // Calculate SVG candlestick dimensions
  const candleHigh = candles.length > 0 ? Math.max(...candles.map(c => c.high)) : 100;
  const candleLow = candles.length > 0 ? Math.min(...candles.map(c => c.low)) : 0;
  const priceRange = candleHigh - candleLow || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Title & Execution Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Live Institutional Markets</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              Real-Time Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Direct market access with institutional routing, tight spreads, and sub-millisecond execution.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Zap size={14} className="text-blue-400" />
          <span>Execution Latency: <strong className="text-emerald-400 font-mono">3.8 ms</strong></span>
        </div>
      </div>

      {/* Main Terminal Grid: Chart & Order Execution */}
      {selectedAsset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real Interactive Chart (Col 1 & 2) */}
          <div className="lg:col-span-2 bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            {/* Asset Header Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-extrabold flex items-center justify-center text-sm">
                  {selectedAsset.symbol.substring(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-white">{selectedAsset.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                      {selectedAsset.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">{selectedAsset.name}</div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xl sm:text-2xl font-extrabold text-white">
                  ${selectedAsset.price.toLocaleString(undefined, {
                    minimumFractionDigits: selectedAsset.category === 'forex' ? 4 : 2,
                    maximumFractionDigits: selectedAsset.category === 'forex' ? 4 : 2
                  })}
                </div>
                <div
                  className={`text-xs font-bold flex items-center justify-end gap-1 ${
                    selectedAsset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}% (24h)
                </div>
              </div>
            </div>

            {/* Chart Toolbar */}
            <div className="flex items-center justify-between py-3 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setChartMode('candlestick')}
                  className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                    chartMode === 'candlestick' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Candles
                </button>
                <button
                  onClick={() => setChartMode('line')}
                  className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                    chartMode === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Line
                </button>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono hidden sm:flex">
                <span>24h High: <strong className="text-white">${selectedAsset.high24h.toLocaleString()}</strong></span>
                <span>24h Low: <strong className="text-white">${selectedAsset.low24h.toLocaleString()}</strong></span>
                <span>Vol: <strong className="text-white">{selectedAsset.volume}</strong></span>
              </div>
            </div>

            {/* Live Candlestick / Line Chart Area */}
            <div className="relative h-64 sm:h-80 w-full bg-[#080d19] rounded-xl border border-slate-800/80 p-3 overflow-hidden flex items-end">
              {isLoadingCandles ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 gap-2">
                  <RefreshCw size={18} className="animate-spin text-blue-500" />
                  <span>Loading real exchange kline data...</span>
                </div>
              ) : chartMode === 'candlestick' ? (
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 240">
                  {/* Grid Lines */}
                  {[40, 90, 140, 190].map(y => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  ))}

                  {/* Candlesticks */}
                  {candles.map((c, i) => {
                    const x = i * (600 / candles.length) + 6;
                    const w = Math.max(3, (600 / candles.length) - 5);
                    const isUp = c.close >= c.open;

                    const yHigh = 220 - ((c.high - candleLow) / priceRange) * 200;
                    const yLow = 220 - ((c.low - candleLow) / priceRange) * 200;
                    const yOpen = 220 - ((c.open - candleLow) / priceRange) * 200;
                    const yClose = 220 - ((c.close - candleLow) / priceRange) * 200;

                    const bodyTop = Math.min(yOpen, yClose);
                    const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
                    const color = isUp ? '#10b981' : '#ef4444';

                    return (
                      <g key={i}>
                        {/* High/Low Wick */}
                        <line x1={x + w / 2} y1={yHigh} x2={x + w / 2} y2={yLow} stroke={color} strokeWidth="1.5" />
                        {/* Open/Close Body */}
                        <rect x={x} y={bodyTop} width={w} height={bodyHeight} fill={color} rx="1" />
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 240">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <polygon
                    points={`0,240 ${candles
                      .map((c, i) => `${i * (600 / (candles.length - 1))},${220 - ((c.close - candleLow) / priceRange) * 200}`)
                      .join(' ')} 600,240`}
                    fill="url(#chartGradient)"
                  />
                  {/* Line */}
                  <polyline
                    points={candles
                      .map((c, i) => `${i * (600 / (candles.length - 1))},${220 - ((c.close - candleLow) / priceRange) * 200}`)
                      .join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                  />
                </svg>
              )}
            </div>

            {/* Depth Order Book Mini Strip */}
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex justify-between">
                <span className="text-slate-400">Best Bid:</span>
                <span className="text-emerald-400 font-bold">${(selectedAsset.price * 0.9998).toFixed(selectedAsset.category === 'forex' ? 4 : 2)}</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex justify-between">
                <span className="text-slate-400">Best Ask:</span>
                <span className="text-red-400 font-bold">${(selectedAsset.price * 1.0002).toFixed(selectedAsset.category === 'forex' ? 4 : 2)}</span>
              </div>
            </div>
          </div>

          {/* Trade Execution Desk (Col 3) */}
          <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Instant Order Desk
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Avail: ${(user.isDemoMode ? user.demoBalance : user.accountBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Buy / Sell Tab Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setOrderType('BUY')}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    orderType === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('SELL')}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    orderType === 'SELL'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>

              <form onSubmit={handleExecuteTrade} className="space-y-4">
                {/* Margin Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Order Margin ($ USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(Math.max(10, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      {[100, 500, 1000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setOrderAmount(amt)}
                          className="px-1.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leverage Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">Leverage</span>
                    <span className="text-blue-400 font-mono font-bold">{leverage}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={selectedAsset.leverageMax || 50}
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1x</span>
                    <span>10x</span>
                    <span>25x</span>
                    <span>50x</span>
                    <span>{selectedAsset.leverageMax || 50}x</span>
                  </div>
                </div>

                {/* Position Sizing Calculation */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Exposure:</span>
                    <span className="text-white font-bold">${(orderAmount * leverage).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Units:</span>
                    <span className="text-slate-200">
                      {((orderAmount * leverage) / selectedAsset.price).toFixed(selectedAsset.category === 'crypto' ? 4 : 2)}
                    </span>
                  </div>
                </div>

                {/* Stop Loss & Take Profit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Stop Loss (-%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={stopLossPercent}
                      onChange={(e) => setStopLossPercent(parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Take Profit (+%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={takeProfitPercent}
                      onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Submit Trade Button */}
                <button
                  type="submit"
                  className={`w-full py-3 px-4 font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                    orderType === 'BUY'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                  }`}
                >
                  <Zap size={15} />
                  <span>Execute {orderType} {selectedAsset.symbol} ({leverage}x)</span>
                </button>
              </form>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Protected by Negative Balance Protection • Zero Slippage Guarantee
            </div>
          </div>
        </div>
      )}

      {/* Asset Directory & Filterable Market Table */}
      <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'crypto', 'stocks', 'forex', 'commodities', 'bonds'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or asset..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table of Real Market Instruments */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-900/50">
              <tr>
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Real-Time Price</th>
                <th className="py-3 px-4 text-right">24h Change</th>
                <th className="py-3 px-4 text-right hidden sm:table-cell">24h High / Low</th>
                <th className="py-3 px-4 text-right hidden md:table-cell">24h Volume</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAssets.map(asset => {
                const isSelected = asset.symbol === selectedSymbol;
                return (
                  <tr
                    key={asset.symbol}
                    onClick={() => setSelectedSymbol(asset.symbol)}
                    className={`hover:bg-slate-800/40 transition cursor-pointer ${
                      isSelected ? 'bg-blue-600/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{asset.symbol}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{asset.name}</div>
                    </td>

                    <td className="py-3.5 px-4 capitalize font-sans text-slate-400">
                      {asset.category}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                      ${asset.price.toLocaleString(undefined, {
                        minimumFractionDigits: asset.category === 'forex' ? 4 : 2,
                        maximumFractionDigits: asset.category === 'forex' ? 4 : 2
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 hidden sm:table-cell text-[11px]">
                      ${asset.high24h.toLocaleString()} / ${asset.low24h.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 hidden md:table-cell">
                      {asset.volume}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSymbol(asset.symbol);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
