import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  LineChart,
  ArrowRight,
  ArrowDown,
  Globe2,
  BarChart3,
  SlidersHorizontal,
  Clock3,
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LandingView: React.FC = () => {
  const {
    setIsLoginOpen,
    setIsRegisterOpen,
    setActiveTab,
    isLoggedIn,
    assets
  } = useApp();

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is Blue Edge Market a legally licensed broker?',
      a: 'Yes. Blue Edge Market is an authorized and licensed broker-dealer complying with rigorous international regulatory frameworks. All client capital is segregated at Tier-1 banking custodians with institutional protections.'
    },
    {
      q: 'What assets can I trade on the platform?',
      a: 'Investors have direct market access to global Equities (NVDA, AAPL, TSLA), Major/Minor Forex currency pairs (EUR/USD, GBP/USD), Sovereign Bonds, Precious Metals & Commodities (Gold, Brent Crude), and Crypto Digital Assets (BTC, ETH, SOL).'
    },
    {
      q: 'How fast is trade execution on Blue Edge Market?',
      a: 'Our matching engines run on ultra-low latency co-located server clusters providing typical fill speeds under 4 milliseconds with negative balance protection.'
    },
    {
      q: 'How are client deposits and withdrawals handled?',
      a: 'Clients can deposit and withdraw via direct FedWire/SWIFT bank transfers, institutional ACH, and top on-chain cryptocurrency networks with zero broker markup fees.'
    }
  ];

  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-16 pb-24 md:pb-16">
      {/* Hero Section Featuring Platform Features Card from Screenshot 1 */}
      <section className="relative pt-8 sm:pt-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Hero Headline */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Institutional Brokerage Access</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Know the market.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
                Execute your next move.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Licensed broker platform engineered for self-directed traders and wealth managers. Trade stocks, bonds, forex, and digital assets with sub-millisecond execution and segregated custody.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => {
                  if (isLoggedIn) setActiveTab('dashboard');
                  else setIsRegisterOpen(true);
                }}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span>Start Trading Today</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => {
                  if (isLoggedIn) setActiveTab('dashboard');
                  else setIsLoginOpen(true);
                }}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <span>Access Client Portal</span>
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>SEC & CFTC Compliant</span>
              </div>
              <span>•</span>
              <div>SIPC Insured $500,000</div>
              <span>•</span>
              <div>Zero Slippage Protocol</div>
            </div>
          </div>

          {/* Right Column: Exact Platform Features Card from Screenshot 1 */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-[#111c34] to-[#0c1527] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
              {/* Card Header matching Screenshot 1 */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-extrabold tracking-wider text-emerald-400 uppercase">
                    PROFESSIONAL TRADING
                  </span>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-400">
                  <span className="text-slate-300 font-bold block">{currentTime}</span>
                  <span className="text-emerald-400 font-sans font-semibold">Advanced Platform</span>
                </div>
              </div>

              {/* Title & 3 Feature Cards */}
              <div className="space-y-3.5 mb-6">
                <div className="flex items-center gap-2 text-white font-semibold text-xs uppercase tracking-wider text-slate-300">
                  <SlidersHorizontal size={15} className="text-blue-400" />
                  <span>Platform Execution Capabilities</span>
                </div>

                {/* Feature 1: Lightning Fast Execution */}
                <div className="bg-[#14203a]/70 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between transition hover:border-blue-500/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Sub-Millisecond Execution</div>
                      <div className="text-[11px] text-slate-400">Direct exchange order routing</div>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                </div>

                {/* Feature 2: Advanced Risk Management */}
                <div className="bg-[#14203a]/70 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between transition hover:border-emerald-500/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Institutional Risk Protocol</div>
                      <div className="text-[11px] text-slate-400">Automated stop-out & segregated vault</div>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                </div>

                {/* Feature 3: Real-Time Analytics */}
                <div className="bg-[#14203a]/70 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between transition hover:border-indigo-500/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <LineChart size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Live Exchange Feeds</div>
                      <div className="text-[11px] text-slate-400">Low-latency quotes and depth of market</div>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    if (isLoggedIn) setActiveTab('dashboard');
                    else setIsRegisterOpen(true);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Client Account</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => {
                    if (isLoggedIn) setActiveTab('dashboard');
                    else setIsLoginOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Access Trading Portal</span>
                </button>
              </div>

              {/* Footer regulatory text */}
              <div className="text-center text-[10px] text-slate-500 tracking-wider mt-4">
                Regulated · Segregated Accounts · Institutional Liquidity
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Live Market Overview Embed from TradingView */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#090e1a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Market Intelligence
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Real-Time Global Market Overview
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('markets')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Open Trading Terminal</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-6 rounded-2xl overflow-hidden border border-slate-800 bg-[#080d1a]">
            <iframe
              title="TradingView market overview widget"
              src="https://s.tradingview.com/embed-widget/market-overview/?locale=en#%7B%22colorTheme%22%3A%22dark%22%2C%22dateRange%22%3A%221D%22%2C%22showChart%22%3Atrue%2C%22isTransparent%22%3Atrue%2C%22showSymbolLogo%22%3Atrue%2C%22showFloatingTooltip%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22460%22%2C%22tabs%22%3A%5B%7B%22title%22%3A%22Indices%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FOREXCOM%3ASPXUSD%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ANDXUSD%22%2C%22d%22%3A%22Nasdaq%20100%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ADJI%22%2C%22d%22%3A%22Dow%2030%22%7D%5D%7D%2C%7B%22title%22%3A%22Crypto%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22BINANCE%3ABTCUSDT%22%2C%22d%22%3A%22BTC%2FUSD%22%7D%2C%7B%22s%22%3A%22BINANCE%3AETHUSDT%22%2C%22d%22%3A%22ETH%2FUSD%22%7D%2C%7B%22s%22%3A%22BINANCE%3ASOLUSDT%22%2C%22d%22%3A%22SOL%2FUSD%22%7D%5D%7D%2C%7B%22title%22%3A%22Forex%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FX%3AEURUSD%22%2C%22d%22%3A%22EUR%2FUSD%22%7D%2C%7B%22s%22%3A%22FX%3AGBPUSD%22%2C%22d%22%3A%22GBP%2FUSD%22%7D%2C%7B%22s%22%3A%22FX%3AUSDJPY%22%2C%22d%22%3A%22USD%2FJPY%22%7D%5D%7D%5D%2C%22backgroundColor%22%3A%22%23080d1a%22%2C%22gridLineColor%22%3A%22rgba(255%2C255%2C255%2C0.06)%22%2C%22fontColor%22%3A%22%23a7b5c6%22%2C%22locale%22%3A%22en%22%7D"
              className="w-full h-[460px] border-0"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* FAQs & Compliance */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Licensed Clarity
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-white hover:text-blue-400 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-400' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Regulatory & Risk Disclaimer */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#0b101c] border border-slate-800/80 rounded-2xl p-6 text-xs text-slate-400 space-y-2 leading-relaxed">
          <div className="text-white font-bold flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-400" />
            <span>Broker Regulatory & Risk Warning</span>
          </div>
          <p>
            Blue Edge Market is a regulated financial broker dealer. CFDs, leveraged forex, and digital asset derivatives involve substantial risk of loss and are not suitable for all investors. Increasing leverage magnifies both profits and losses. Ensure you fully comprehend the mechanics of financial instruments and trade within your risk tolerance.
          </p>
        </div>
      </section>
    </div>
  );
};
