import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  ArrowDownLeft,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  QrCode,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DepositModal: React.FC = () => {
  const {
    user,
    isDepositModalOpen,
    setIsDepositModalOpen,
    depositFunds,
    showToast,
    cryptoPaymentMethods
  } = useApp();

  const activeMethods = cryptoPaymentMethods.filter(m => m.isActive);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('1000');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Set default method when opened or when methods load
  useEffect(() => {
    if (activeMethods.length > 0) {
      if (!selectedMethodId || !activeMethods.some(m => m.id === selectedMethodId)) {
        setSelectedMethodId(activeMethods[0].id);
      }
    }
  }, [cryptoPaymentMethods, activeMethods, selectedMethodId]);

  if (!isDepositModalOpen) return null;

  const currentMethod = activeMethods.find(m => m.id === selectedMethodId) || activeMethods[0] || {
    id: 'cpm-default',
    name: 'Tether USDT',
    symbol: 'USDT',
    network: 'TRON (TRC-20)',
    address: 'TX9pX4kHqZ8yB2mN5wR7vL1sK3jF6dC8aM',
    isActive: true,
    minDeposit: 100
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Deposit address copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreset = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setCustomAmount(e.target.value);
    setAmount(val);
  };

  const handleMakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Please enter a valid deposit amount greater than $0', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      depositFunds(amount, `${currentMethod.name} (${currentMethod.network})`, `Crypto Deposit via ${currentMethod.symbol}`);
      const refCode = `BEM-DEP-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedRef(refCode);
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || 'Error registering deposit', 'error');
    }
  };

  const handleClose = () => {
    setSubmittedRef(null);
    setIsDepositModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0a1020] border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 text-slate-100">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {submittedRef ? (
          /* Confirmation Screen: Awaiting Admin Approval */
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <Clock size={36} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">Payment Submitted — Awaiting Admin Approval</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Your cryptocurrency deposit of <strong className="text-amber-400">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</strong> has been submitted. The broker admin desk will confirm the on-chain transfer and credit your account balance upon approval.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#070b16] border border-slate-800 text-left space-y-2.5 max-w-md mx-auto font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tracking Reference:</span>
                <span className="font-bold text-blue-400">{submittedRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit Amount:</span>
                <span className="font-bold text-white">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Crypto Channel:</span>
                <span className="text-emerald-400 font-sans font-bold">{currentMethod.name} ({currentMethod.network})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Broker Review Status:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1 font-sans">
                  <Clock size={13} />
                  <span>Awaiting Admin Approval</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          /* Deposit & Payment Form */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <ArrowDownLeft size={22} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Cryptocurrency Deposit</h3>
                <p className="text-xs text-slate-400">Official custodial wallet deposit with 0% broker fee</p>
              </div>
            </div>

            <form onSubmit={handleMakePayment} className="space-y-5">
              {/* Crypto Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Crypto Asset & Network
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        currentMethod.id === m.id
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                          : 'bg-[#070b16] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{m.symbol}</span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded font-mono">CRYPTO</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5">{m.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5 truncate">{m.network}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Deposit Amount ($ USD)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Current Balance: <strong className="text-emerald-400">${user?.accountBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</strong>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min={currentMethod.minDeposit || 50}
                    step="50"
                    value={customAmount}
                    onChange={handleAmountChange}
                    required
                    placeholder="1000"
                    className="w-full pl-8 pr-12 py-3 bg-[#070b16] border border-slate-700 rounded-xl text-base font-bold font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">USD</span>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[250, 500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePreset(preset)}
                      className="py-1.5 rounded-lg bg-[#070b16] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                    >
                      ${preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Custody Address / Instructions */}
              <div className="bg-[#070b16] border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Designated {currentMethod.name} Custody Wallet:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentMethod.address)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold transition cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-white break-all select-all flex items-center justify-between gap-2">
                  <span>{currentMethod.address}</span>
                </div>

                {currentMethod.memo && (
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Memo / Tag:</span>
                    <span className="text-amber-400 font-bold">{currentMethod.memo}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Network: <strong className="text-slate-200">{currentMethod.network}</strong></span>
                  <span className="text-emerald-400 font-medium">0% Broker Deposit Fee</span>
                </div>
              </div>

              {/* Make Payment Button */}
              <button
                type="submit"
                disabled={isSubmitting || amount <= 0}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Sparkles size={16} className="text-amber-300 animate-pulse" />
                <span>{isSubmitting ? 'Registering Payment...' : `I've Made Payment — Submit $${amount.toLocaleString()} USD`}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
