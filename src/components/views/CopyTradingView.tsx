import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  TrendingUp,
  Shield,
  Search,
  Star,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Briefcase,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  Database,
  ExternalLink,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Info,
  Check,
  Grid,
  List,
  Plus,
  RefreshCw,
  Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CopyTrader } from '../../types';

export const CopyTradingView: React.FC = () => {
  const {
    copyTraders,
    copySubscriptions,
    startCopyingTrader,
    pauseCopyingTrader,
    stopCopyingTrader,
    addRandomTrader,
    user,
    setActiveTab,
    setIsDepositModalOpen,
    neonDbStatus,
    setIsNeonDbModalOpen
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'forex' | 'crypto' | 'hft' | 'pro' | 'commodities' | 'my-copies'>('all');
  const [sortBy, setSortBy] = useState<'return' | 'winrate' | 'followers' | 'equity' | 'minInvestment' | 'risk'>('return');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Pagination state (organized to avoid scattered presentation of 250+ traders)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(18);
  const directoryRef = useRef<HTMLDivElement>(null);

  // Newly added trader highlight animation
  const [highlightedTraderId, setHighlightedTraderId] = useState<string | null>(null);

  // Interactive amount inputs per trader: { [traderId]: amount }
  const [customAmounts, setCustomAmounts] = useState<{ [id: string]: number }>({});
  const [loadingTraderId, setLoadingTraderId] = useState<string | null>(null);

  // Selected trader for confirmation modal
  const [selectedTraderForModal, setSelectedTraderForModal] = useState<CopyTrader | null>(null);
  const [modalAmount, setModalAmount] = useState<number>(100);

  // Reset to page 1 whenever search, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, sortBy, pageSize]);

  // Filtered & Sorted Traders
  const filteredTraders = useMemo(() => {
    return copyTraders.filter(trader => {
      // Category filter
      if (activeCategory === 'forex') {
        const text = (trader.specialty + ' ' + trader.preferredAsset).toLowerCase();
        if (!text.includes('forex') && !text.includes('fx') && !text.includes('eur') && !text.includes('gbp')) return false;
      }
      if (activeCategory === 'crypto') {
        const text = (trader.specialty + ' ' + trader.preferredAsset + ' ' + trader.name).toLowerCase();
        if (!text.includes('crypto') && !text.includes('usdt') && !text.includes('btc') && !text.includes('eth') && !text.includes('defi')) return false;
      }
      if (activeCategory === 'hft') {
        const text = (trader.specialty + ' ' + trader.preferredAsset).toLowerCase();
        if (!text.includes('hft') && !text.includes('quant') && !text.includes('algorithmic') && !text.includes('arbitrage') && !text.includes('day trader')) return false;
      }
      if (activeCategory === 'pro') {
        const text = (trader.specialty + ' ' + trader.badge).toLowerCase();
        if (!text.includes('pro') && trader.minInvestment < 1000 && trader.equity < 100000) return false;
      }
      if (activeCategory === 'commodities') {
        const text = (trader.specialty + ' ' + trader.preferredAsset).toLowerCase();
        if (!text.includes('commodit') && !text.includes('gold') && !text.includes('oil') && !text.includes('energy') && !text.includes('xau')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = trader.name.toLowerCase().includes(query);
        const matchesSpec = trader.specialty.toLowerCase().includes(query);
        const matchesAsset = trader.preferredAsset.toLowerCase().includes(query);
        const matchesBio = trader.description.toLowerCase().includes(query);
        return matchesName || matchesSpec || matchesAsset || matchesBio;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'return') return b.totalReturn - a.totalReturn;
      if (sortBy === 'winrate') return b.winRate - a.winRate;
      if (sortBy === 'followers') return b.followers - a.followers;
      if (sortBy === 'equity') return b.equity - a.equity;
      if (sortBy === 'minInvestment') return a.minInvestment - b.minInvestment;
      if (sortBy === 'risk') return a.riskScore - b.riskScore;
      return 0;
    });
  }, [copyTraders, activeCategory, searchQuery, sortBy]);

  // Paginated Traders for clean, organized display
  const totalPages = Math.max(1, Math.ceil(filteredTraders.length / pageSize));
  const paginatedTraders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTraders.slice(startIndex, startIndex + pageSize);
  }, [filteredTraders, currentPage, pageSize]);

  // Aggregate stats across full directory
  const totalTradersCount = copyTraders.length;
  const totalFollowersCount = copyTraders.reduce((acc, t) => acc + t.followers, 0);
  const totalCombinedEquity = copyTraders.reduce((acc, t) => acc + t.equity, 0);
  const avgWinRate = (copyTraders.reduce((acc, t) => acc + t.winRate, 0) / (totalTradersCount || 1)).toFixed(1);

  const getTraderInputAmount = (trader: CopyTrader): number => {
    return customAmounts[trader.id] !== undefined ? customAmounts[trader.id] : trader.minInvestment;
  };

  const setTraderInputAmount = (traderId: string, value: number) => {
    setCustomAmounts(prev => ({ ...prev, [traderId]: Math.max(0, value) }));
  };

  const handleOpenCopyModal = (trader: CopyTrader) => {
    const amount = getTraderInputAmount(trader);
    setModalAmount(Math.max(amount, trader.minInvestment));
    setSelectedTraderForModal(trader);
  };

  const handleConfirmCopy = () => {
    if (!selectedTraderForModal) return;
    setLoadingTraderId(selectedTraderForModal.id);

    setTimeout(() => {
      const ok = startCopyingTrader(selectedTraderForModal.id, modalAmount);
      setLoadingTraderId(null);
      if (ok) {
        setSelectedTraderForModal(null);
      }
    }, 400);
  };

  // Handle adding dynamic random trader
  const handleAddNewRandomTrader = () => {
    const newTrader = addRandomTrader();
    setHighlightedTraderId(newTrader.id);
    setActiveCategory('all');
    setSearchQuery('');
    setCurrentPage(1);

    // Scroll to directory smoothly
    if (directoryRef.current) {
      directoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Clear highlight pulse after 4s
    setTimeout(() => {
      setHighlightedTraderId(null);
    }, 4000);
  };

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(targetPage);
    if (directoryRef.current) {
      directoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isSubscribed = (traderId: string) => {
    return copySubscriptions.some(s => s.traderId === traderId && s.status !== 'stopped');
  };

  const getSubscription = (traderId: string) => {
    return copySubscriptions.find(s => s.traderId === traderId && s.status !== 'stopped');
  };

  const availableBalance = user.isDemoMode ? user.demoBalance : user.accountBalance;

  // Generate pagination items with ellipses
  const renderPaginationButtons = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 7;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28 md:pb-16 text-slate-100">
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="hover:text-white flex items-center gap-1 transition"
          >
            <ArrowLeft size={13} /> Dashboard
          </button>
          <span>/</span>
          <span className="text-slate-300">Copy Trading</span>
          <span>/</span>
          <span className="text-blue-400 font-medium">Expert Traders Directory ({totalTradersCount}+)</span>
        </div>

        {/* Database, Add Random Trader & Active Copies Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Random Trader Button */}

          {/* Active Copies Button */}
          <button
            onClick={() => setActiveCategory('my-copies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              activeCategory === 'my-copies'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Users size={13} />
            <span>My Active Copies ({copySubscriptions.length})</span>
          </button>
        </div>
      </div>

      {/* Hero Section matching Blue Edge Market Screenshot */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#151f35] to-[#0c1424] border border-slate-800/80 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{totalTradersCount}+ Verified Expert Traders Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Copy Expert Traders
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            Choose from over {totalTradersCount} top-performing traders from around the globe and automatically mirror their trades to your portfolio.
            Every trade executed by the expert is mirrored in real time with disciplined institutional risk management.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>12 Original Authenticated Leaders</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <TrendingUp size={14} className="text-blue-400" />
              <span>250+ Global Top Performers</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <Shield size={14} className="text-amber-400" />
              <span>Automated Stop Loss Guard</span>
            </div>
            <button
              onClick={handleAddNewRandomTrader}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 transition cursor-pointer"
            >
              <Plus size={14} className="text-indigo-300" />
              <span>Spawn More Random Traders</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid Gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#11192b] border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Available Experts</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{totalTradersCount} Verified</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              100% Active
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">250+ Global Specialists Available</div>
        </div>

        <div className="bg-[#11192b] border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Total Trader Equity</div>
          <div className="text-2xl font-bold text-emerald-400">
            ${(totalCombinedEquity).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Institutional liquidity under management</div>
        </div>

        <div className="bg-[#11192b] border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Average Win Rate</div>
          <div className="text-2xl font-bold text-blue-400">
            {avgWinRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Calculated across 85,000+ audited trades</div>
        </div>

        <div className="bg-[#11192b] border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">Active Community Copiers</div>
          <div className="text-2xl font-bold text-white">
            {totalFollowersCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Following & copying across platforms</div>
        </div>
      </div>

      {/* Active Copies View (when selected) */}
      {activeCategory === 'my-copies' && (
        <div className="bg-[#11192b] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">My Active Copy Subscriptions</h2>
              <p className="text-xs text-slate-400">
                Manage your mirrored traders, pause copying, or withdraw allocated capital anytime.
              </p>
            </div>
            <button
              onClick={() => setActiveCategory('all')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              Browse All Experts <ArrowRight size={13} />
            </button>
          </div>

          {copySubscriptions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40">
              <Users size={40} className="mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-300 mb-1">No Active Copy Subscriptions</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                You haven't copied any expert traders yet. Browse the {totalTradersCount}+ verified experts below and start copying with as little as $25.
              </p>
              <button
                onClick={() => setActiveCategory('all')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30"
              >
                Explore {totalTradersCount}+ Expert Traders
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {copySubscriptions.map(sub => {
                const trader = copyTraders.find(t => t.id === sub.traderId);
                return (
                  <div key={sub.id} className="bg-[#151f33] border border-slate-700/80 rounded-xl p-5 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={trader?.avatar || '/assets/traders/alex-thompson.svg'}
                          alt={sub.traderName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-600 bg-slate-900"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-white">{sub.traderName}</h4>
                          <span className="text-[11px] text-slate-400">{sub.traderSpecialty}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#0d1424] p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Allocated Capital:</span>
                        <span className="font-bold text-white">${sub.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Current Return:</span>
                        <span className="font-bold text-emerald-400">+{sub.currentProfit.toFixed(2)} USD</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <button
                        onClick={() => pauseCopyingTrader(sub.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold flex items-center gap-1 transition"
                      >
                        {sub.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                        <span>{sub.status === 'active' ? 'Pause' : 'Resume'}</span>
                      </button>
                      <button
                        onClick={() => stopCopyingTrader(sub.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 text-red-300 font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 size={12} />
                        <span>Stop & Refund</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Directory Filter, Search & Sort Toolbar - Organized like primetrade.us */}
      <div ref={directoryRef} className="bg-[#11192b] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800/80">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Experts ({totalTradersCount})
          </button>
          <button
            onClick={() => setActiveCategory('forex')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeCategory === 'forex'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Forex Experts
          </button>
          <button
            onClick={() => setActiveCategory('crypto')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeCategory === 'crypto'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Crypto & USDT Scalpers
          </button>
          <button
            onClick={() => setActiveCategory('hft')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeCategory === 'hft'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            HFT & Algorithmic
          </button>
          <button
            onClick={() => setActiveCategory('pro')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeCategory === 'pro'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            High Capital PROs
          </button>
          <button
            onClick={() => setActiveCategory('commodities')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeCategory === 'commodities'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Commodities & Metals
          </button>
        </div>

        {/* Search, Sort, View Toggle, & Add Random Person Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box matching screenshot */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search 250+ experts by name, specialty, pair..."
              className="w-full bg-[#0a1120] border border-slate-700/80 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center bg-[#0a1120] border border-slate-700/80 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs transition ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Cards Grid View"
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Institutional Table View"
              >
                <List size={14} />
              </button>
            </div>

            {/* Results Counter text */}
            <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
              {filteredTraders.length} expert{filteredTraders.length === 1 ? '' : 's'}
            </span>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#0a1120] border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="return" className="bg-slate-900 text-white">Highest Total Return</option>
                <option value="winrate" className="bg-slate-900 text-white">Highest Win Rate</option>
                <option value="followers" className="bg-slate-900 text-white">Most Followers</option>
                <option value="equity" className="bg-slate-900 text-white">Total Equity</option>
                <option value="minInvestment" className="bg-slate-900 text-white">Lowest Minimum</option>
                <option value="risk" className="bg-slate-900 text-white">Lowest Risk Score</option>
              </select>
            </div>

            {/* Page Size Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#0a1120] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs">
              <span className="text-slate-400">Show:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value={12} className="bg-slate-900 text-white">12 / page</option>
                <option value={18} className="bg-slate-900 text-white">18 / page</option>
                <option value={24} className="bg-slate-900 text-white">24 / page</option>
                <option value={48} className="bg-slate-900 text-white">48 / page</option>
                <option value={96} className="bg-slate-900 text-white">96 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTraders.length === 0 && (
        <div className="text-center py-16 px-4 bg-[#11192b] border border-slate-800 rounded-2xl">
          <Search size={44} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">No Expert Traders Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No traders match your current search criteria. Try modifying your filter or clear the search.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
            <button
              onClick={handleAddNewRandomTrader}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Sparkles size={13} /> Add Random Trader
            </button>
          </div>
        </div>
      )}

      {/* View Mode: Cards Grid View */}
      {viewMode === 'grid' && filteredTraders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTraders.map(trader => {
            const inputAmount = getTraderInputAmount(trader);
            const activeSub = getSubscription(trader.id);
            const isCurrentlyCopying = !!activeSub;
            const isHighlighted = highlightedTraderId === trader.id;

            return (
              <div
                key={trader.id}
                className={`bg-[#131d31] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl ${
                  isHighlighted
                    ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-[1.02]'
                    : isCurrentlyCopying
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'border-slate-800/90 hover:border-slate-700 hover:shadow-2xl'
                }`}
              >
                {/* Card Top Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    {/* Active Badge matching exact green badge from screenshot */}
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>

                    {isCurrentlyCopying ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        <Check size={11} /> Copying Active
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Risk {trader.riskScore}/10
                      </span>
                    )}
                  </div>

                  {/* Avatar matching authentic screenshot */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <img
                        src={trader.avatar}
                        alt={trader.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-700 shadow-md bg-[#0a1120]"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#131d31] flex items-center justify-center">
                        <Check size={10} className="text-white stroke-[3]" />
                      </div>
                    </div>

                    {/* Trader Name & Specialty matching screenshot */}
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-1">
                      {trader.name}
                    </h3>
                    <div className="text-xs font-medium text-slate-400 mb-2">
                      {trader.specialty}
                    </div>

                    {/* Rating Stars matching screenshot */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.floor(trader.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">
                        ({trader.reviewCount})
                      </span>
                    </div>

                    {/* Followers count matching screenshot */}
                    <div className="text-xs text-slate-400 font-medium">
                      {trader.followers.toLocaleString()} followers
                    </div>
                  </div>

                  {/* 2x2 Performance Grid matching exact screenshot layout */}
                  <div className="grid grid-cols-2 gap-2.5 mt-5">
                    {/* Top Left: Win Rate */}
                    <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-white">
                        {trader.winRate}%
                      </div>
                      <div className="text-[11px] text-slate-400 mb-1.5">
                        Win Rate
                      </div>
                      {/* Green progress bar beneath win rate */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${trader.winRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Top Right: Total Return */}
                    <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-3 text-center flex flex-col justify-center">
                      <div className="text-xl font-extrabold text-emerald-400 truncate">
                        +{trader.totalReturn.toLocaleString()}%
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Total Return
                      </div>
                    </div>

                    {/* Bottom Left: Equity */}
                    <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-3 text-center">
                      <div className="text-base font-bold text-white truncate">
                        ${trader.equity.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Equity
                      </div>
                    </div>

                    {/* Bottom Right: Total Trades */}
                    <div className="bg-[#0b1222] border border-slate-800/80 rounded-xl p-3 text-center">
                      <div className="text-base font-bold text-white">
                        {trader.totalTrades.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Total Trades
                      </div>
                    </div>
                  </div>

                  {/* Bio text matching screenshot */}
                  <div className="mt-4 text-xs text-slate-300 leading-relaxed min-h-[38px] line-clamp-2">
                    {trader.description}
                  </div>

                  {/* Preferred asset badge */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
                    <span>Focus Asset:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[170px]" title={trader.preferredAsset}>
                      {trader.preferredAsset}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Controls matching exact screenshot */}
                <div className="p-6 pt-0 space-y-3">
                  {/* Minimum Investment Display Box matching screenshot */}
                  <div className="bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Minimum Investment</span>
                    <span className="text-sm font-bold text-white">
                      ${trader.minInvestment.toFixed(2)}
                    </span>
                  </div>

                  {/* Investment Amount ($) input with Helper Text matching screenshot */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Investment Amount ($)</span>
                      <span className="text-[11px] text-slate-500">
                        Bal: ${availableBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={trader.minInvestment}
                        step="10"
                        value={inputAmount || ''}
                        onChange={e => setTraderInputAmount(trader.id, Number(e.target.value))}
                        placeholder={`Min: $${trader.minInvestment.toFixed(2)}`}
                        className="w-full bg-[#0a1120] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner font-mono"
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Minimum: ${trader.minInvestment.toFixed(2)}
                    </div>
                  </div>

                  {/* Start Copying Button matching screenshot exactly */}
                  {isCurrentlyCopying ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenCopyModal(trader)}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Briefcase size={16} />
                        Adjust Allocation
                      </button>
                      <button
                        onClick={() => activeSub && stopCopyingTrader(activeSub.id)}
                        className="py-3 px-3 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 text-red-300 transition cursor-pointer"
                        title="Stop copying trader"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenCopyModal(trader)}
                      disabled={loadingTraderId === trader.id}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      {/* Copy icon matching screenshot */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      <span>Start Copying</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode: Institutional Table View */}
      {viewMode === 'table' && filteredTraders.length > 0 && (
        <div className="bg-[#11192b] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0d1424] text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Expert Trader</th>
                  <th className="py-3.5 px-4">Specialty & Asset</th>
                  <th className="py-3.5 px-4 text-center">Win Rate</th>
                  <th className="py-3.5 px-4 text-right">Total Return</th>
                  <th className="py-3.5 px-4 text-right">Equity</th>
                  <th className="py-3.5 px-4 text-center">Followers</th>
                  <th className="py-3.5 px-4 text-center">Risk</th>
                  <th className="py-3.5 px-4 text-right">Min Invest</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {paginatedTraders.map(trader => {
                  const activeSub = getSubscription(trader.id);
                  const isCurrentlyCopying = !!activeSub;

                  return (
                    <tr
                      key={trader.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isCurrentlyCopying ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={trader.avatar}
                            alt={trader.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-900"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{trader.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-amber-400">
                              <Star size={10} className="fill-amber-400" />
                              <span>{trader.rating}</span>
                              <span className="text-slate-500">({trader.reviewCount})</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{trader.specialty}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{trader.preferredAsset}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-white">{trader.winRate}%</span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-400">
                        +{trader.totalReturn.toLocaleString()}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                        ${trader.equity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        {trader.followers.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          trader.riskScore <= 3
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : trader.riskScore <= 5
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {trader.riskScore}/10
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                        ${trader.minInvestment.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCurrentlyCopying ? (
                          <button
                            onClick={() => handleOpenCopyModal(trader)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-900/50 transition cursor-pointer"
                          >
                            Active
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenCopyModal(trader)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-sm cursor-pointer"
                          >
                            Copy
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls - Organized, Professional and Clean */}
      {filteredTraders.length > 0 && (
        <div className="bg-[#11192b] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-white">{(currentPage - 1) * pageSize + 1}</span>–
            <span className="font-semibold text-white">{Math.min(currentPage * pageSize, filteredTraders.length)}</span> of{' '}
            <span className="font-semibold text-white">{filteredTraders.length}</span> expert traders
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft size={14} />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Numbered Page Buttons with Ellipses */}
            <div className="flex items-center gap-1">
              {renderPaginationButtons().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 text-xs text-slate-500">
                      ...
                    </span>
                  );
                }
                const pageNum = p as number;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>

            {/* Last Page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Last Page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation & Risk Disclosure Modal */}
      {selectedTraderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#10182b] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTraderForModal.avatar}
                  alt={selectedTraderForModal.name}
                  className="w-11 h-11 rounded-full border border-slate-600 object-cover bg-slate-900"
                />
                <div>
                  <h3 className="text-base font-bold text-white">Copy {selectedTraderForModal.name}</h3>
                  <p className="text-xs text-slate-400">{selectedTraderForModal.specialty}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTraderForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 bg-[#090f1d] p-3 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Historical Win Rate:</span>
                <span className="font-bold text-white">{selectedTraderForModal.winRate}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Return:</span>
                <span className="font-bold text-emerald-400">+{selectedTraderForModal.totalReturn.toLocaleString()}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Profit Share Fee:</span>
                <span className="font-bold text-white">{selectedTraderForModal.profitShared}% on profits only</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Trades Audited:</span>
                <span className="font-bold text-white">{selectedTraderForModal.totalTrades.toLocaleString()}</span>
              </div>
            </div>

            {/* Allocation Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Allocated Capital Amount ($)</span>
                <span className="text-[11px] text-slate-400">
                  Available: ${availableBalance.toFixed(2)}
                </span>
              </label>
              <input
                type="number"
                min={selectedTraderForModal.minInvestment}
                step="25"
                value={modalAmount}
                onChange={e => setModalAmount(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center justify-between mt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalAmount(selectedTraderForModal.minInvestment)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white font-medium cursor-pointer"
                >
                  Min (${selectedTraderForModal.minInvestment})
                </button>
                <button
                  type="button"
                  onClick={() => setModalAmount(Math.max(selectedTraderForModal.minInvestment, Math.round(availableBalance * 0.25)))}
                  className="px-2.5 py-1 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white font-medium cursor-pointer"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => setModalAmount(Math.max(selectedTraderForModal.minInvestment, Math.round(availableBalance * 0.5)))}
                  className="px-2.5 py-1 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white font-medium cursor-pointer"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setModalAmount(Math.max(selectedTraderForModal.minInvestment, Math.round(availableBalance)))}
                  className="px-2.5 py-1 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white font-medium cursor-pointer"
                >
                  Max (${availableBalance.toFixed(0)})
                </button>
              </div>
            </div>

            {/* Risk Notice */}
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-blue-200">
                <Shield size={13} /> Automated Mirroring Protocol
              </div>
              <p className="text-[11px] text-slate-400">
                Trades are automatically executed at identical entry points and leverage. You retain 100% control and can stop copying anytime with full capital release.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTraderForModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCopy}
                disabled={loadingTraderId === selectedTraderForModal.id}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                {loadingTraderId === selectedTraderForModal.id ? (
                  <span>Executing...</span>
                ) : (
                  <>
                    <Sparkles size={14} /> Confirm & Start Copying
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CopyTradingView;
