import React, { useState } from 'react';
import { Target, CheckCircle2, Shield, ArrowRight, Calculator, Sparkles, DollarSign } from 'lucide-react';
import { useApp, BROKER_INVESTMENT_TIERS, BrokerInvestmentTier } from '../../context/AppContext';

export const InvestmentPlansView: React.FC = () => {
  const { tiers, investInTier, user, setIsDepositModalOpen } = useApp();
  const [calculatorTier, setCalculatorTier] = useState<BrokerInvestmentTier>(tiers[1]);
  const [calcAmount, setCalcAmount] = useState<number>(5000);
  const [calcDays, setCalcDays] = useState<number>(60);

  // Dynamic calculations
  const dailyRate = (calculatorTier.expectedApy / 100) / 365;
  const estimatedProfit = calcAmount * dailyRate * calcDays;
  const totalReturn = calcAmount + estimatedProfit;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24 md:pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
          Managed Brokerage Portfolios
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-1">
          Regulated Investment Tiers
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Fixed-income and algorithmic multi-asset strategies backed by institutional custody and transparent daily compounding.
        </p>
      </div>

      {/* Interactive Yield Calculator */}
      <div className="bg-gradient-to-r from-[#0d162b] to-[#0a1122] border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <Calculator size={18} className="text-blue-400" />
            <span>Interactive Return Estimator</span>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>+55% Institutional Profit Boost Applied</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Strategy
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tiers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setCalculatorTier(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition text-left cursor-pointer border ${
                      calculatorTier.id === t.id
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="truncate">{t.title.split(' ')[0]}</div>
                    <div className="text-[10px] opacity-80">{t.expectedApy}% APY</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                  <span>Investment Capital ($)</span>
                  <span className="text-blue-400 font-mono font-bold">${calcAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={calculatorTier.minDeposit}
                  max={calculatorTier.maxDeposit}
                  step="500"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                  <span>Holding Period</span>
                  <span className="text-blue-400 font-mono font-bold">{calcDays} Days</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="365"
                  step="15"
                  value={calcDays}
                  onChange={(e) => setCalcDays(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-5 text-center flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Projected Payout
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono my-2">
              +${estimatedProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-300 font-mono mb-4">
              Total Matured Return: <strong>${totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <button
              onClick={() => investInTier(calculatorTier.id, calcAmount)}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Invest ${calcAmount.toLocaleString()} Now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map(tier => {
          return (
            <div
              key={tier.id}
              className="bg-[#0a1020] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all hover:scale-101"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      tier.riskLevel === 'Low'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : tier.riskLevel === 'Moderate'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {tier.riskLevel} Risk
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{tier.durationDays} Days</span>
                </div>

                <h3 className="text-base font-extrabold text-white mb-1">{tier.title}</h3>
                <p className="text-[11px] text-slate-400 mb-4">{tier.subtitle}</p>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 mb-4 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Target Yield</div>
                  <div className="text-2xl font-extrabold text-blue-400 font-mono">
                    {tier.expectedApy}% <span className="text-xs font-normal text-slate-400">APY</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 mb-6">
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] leading-tight text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 text-center mb-2 font-mono">
                  Min: ${tier.minDeposit.toLocaleString()} • Max: ${tier.maxDeposit.toLocaleString()}
                </div>
                <button
                  onClick={() => investInTier(tier.id, tier.minDeposit)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Subscribe Plan</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
