import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  MinusCircle,
  ArrowLeftRight,
  Copy,
  Check,
  ShieldCheck,
  Building,
  CreditCard,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InvestorAuthGate } from './InvestorAuthGate';

export const WalletView: React.FC = () => {
  const {
    user,
    isLoggedIn,
    depositFunds,
    withdrawFunds,
    transferFunds,
    showToast,
    setIsKycModalOpen,
    cryptoPaymentMethods
  } = useApp();

  if (!isLoggedIn) {
    return (
      <InvestorAuthGate
        title="Custodial Wallet & Funds"
        description="Deposit methods, custodial balances, and withdrawal requests are secured behind authenticated client access."
      />
    );
  }

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');

  const activeCryptoMethods = cryptoPaymentMethods.filter(m => m.isActive);
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>(activeCryptoMethods[0]?.id || 'cpm-usdt-trc20');
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [copied, setCopied] = useState(false);

  // Withdraw state (Crypto Only)
  const [withdrawAsset, setWithdrawAsset] = useState<string>('USDT (TRC-20)');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');

  // Transfer state
  const [transferFrom, setTransferFrom] = useState('Main Balance');
  const [transferTo, setTransferTo] = useState('Spot Trading Desk');
  const [transferAmount, setTransferAmount] = useState<number>(500);

  const currentCrypto = activeCryptoMethods.find(m => m.id === selectedCryptoId) || activeCryptoMethods[0] || {
    id: 'default',
    name: 'Tether USDT',
    symbol: 'USDT',
    network: 'TRON (TRC-20)',
    address: 'TX9pX4kHqZ8yB2mN5wR7vL1sK3jF6dC8aM'
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Address copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    depositFunds(depositAmount, `${currentCrypto.name} (${currentCrypto.network})`, `Direct ${currentCrypto.symbol} crypto deposit`);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAddress) {
      showToast('Please provide a payout destination wallet address', 'error');
      return;
    }
    const res = withdrawFunds(withdrawAmount, withdrawAsset, withdrawAddress);
    if (!res.success) {
      showToast(res.message, 'error');
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    transferFunds(transferAmount, transferFrom, transferTo);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Wallet & Custodial Funds</h1>
        <p className="text-xs text-slate-400 mt-1">
          Secure multi-chain cryptocurrency deposits, verified crypto disbursements, and internal liquidity routing.
        </p>
      </div>

      {/* Balance Summary Header Bar */}
      <div className="bg-gradient-to-r from-[#0d162b] to-[#0a1122] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Available Broker Balance
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
            ${(user.isDemoMode ? user.demoBalance : user.accountBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deposit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle size={15} />
            <span>Deposit</span>
          </button>

          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'withdraw' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MinusCircle size={15} />
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => setActiveTab('transfer')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'transfer' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight size={15} />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Main Action Form Card */}
      <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* DEPOSIT TAB */}
        {activeTab === 'deposit' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <PlusCircle size={18} className="text-emerald-400" />
              <span>Select Cryptocurrency Deposit Method</span>
            </h2>

            {/* Method Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeCryptoMethods.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedCryptoId(m.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    currentCrypto.id === m.id
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{m.symbol}</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded font-mono">CRYPTO</span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate mt-0.5">{m.name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5 truncate">{m.network}</div>
                </button>
              ))}
            </div>

            {/* Crypto Address Box */}
            <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Official Broker Deposit Address ({currentCrypto.symbol} - {currentCrypto.network})</span>
                <span className="text-[11px] text-emerald-400 font-mono">Instant Confirmation</span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-xl border border-slate-700/80 font-mono text-xs text-white break-all">
                <span className="flex-1">{currentCrypto.address}</span>
                <button
                  onClick={() => handleCopy(currentCrypto.address)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>

              {currentCrypto.memo && (
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono flex justify-between">
                  <span className="text-slate-400">Required Tag / Memo:</span>
                  <span className="text-amber-400 font-bold">{currentCrypto.memo}</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 leading-relaxed">
                Send only {currentCrypto.symbol} via {currentCrypto.network} to this specific custody address. Zero broker deposit fee.
              </div>
            </div>

            {/* Deposit Amount Form */}
            <form onSubmit={handleDepositSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deposit Amount ($ USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={currentCrypto.minDeposit || 50}
                    step="50"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="absolute right-3 top-3 text-xs text-slate-400 font-mono">USD</div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                Submit Payment Request (${depositAmount.toLocaleString()})
              </button>
            </form>
          </div>
        )}

        {/* WITHDRAW TAB */}
        {activeTab === 'withdraw' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <MinusCircle size={18} className="text-amber-400" />
              <span>Request Cryptocurrency Withdrawal</span>
            </h2>

            {!user.isKycVerified && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <div className="font-bold">Identity Verification (KYC) Required</div>
                  <div>Under CFTC and FINRA broker compliance regulations, accounts must verify identity before external disbursements.</div>
                  <button
                    onClick={() => setIsKycModalOpen(true)}
                    className="mt-2 text-white font-bold bg-amber-600/80 hover:bg-amber-600 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Complete Identity Verification
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Payout Cryptocurrency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'USDT (TRC-20)', label: 'USDT (TRC-20)' },
                    { id: 'BTC (Native)', label: 'Bitcoin (BTC)' },
                    { id: 'ETH (ERC-20)', label: 'Ethereum (ETH)' },
                    { id: 'SOL (Solana)', label: 'Solana (SOL)' }
                  ].map((cur) => (
                    <button
                      key={cur.id}
                      type="button"
                      onClick={() => setWithdrawAsset(cur.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                        withdrawAsset === cur.id
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Withdrawal Amount ($ USD)
                </label>
                <input
                  type="number"
                  min="50"
                  max={user.accountBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination {withdrawAsset} Wallet Address
                </label>
                <input
                  type="text"
                  required
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Paste your recipient crypto wallet address"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Broker Processing Fee:</span>
                  <span className="text-emerald-400 font-bold">$0.00 (Zero Fee)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Net Payout Amount:</span>
                  <span className="text-white font-bold">${withdrawAmount.toLocaleString()} USD</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-amber-600/30 cursor-pointer"
              >
                Submit Withdrawal Request
              </button>
            </form>
          </div>
        )}

        {/* TRANSFER TAB */}
        {activeTab === 'transfer' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-blue-400" />
              <span>Internal Sub-Account Transfer</span>
            </h2>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transfer From
                  </label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Main Balance">Main Custody Balance</option>
                    <option value="Spot Trading Desk">Spot Trading Desk</option>
                    <option value="Yield Vault">Yield Vault</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transfer To
                  </label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Spot Trading Desk">Spot Trading Desk</option>
                    <option value="Main Balance">Main Custody Balance</option>
                    <option value="Yield Vault">Yield Vault</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  min="10"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
              >
                Transfer Funds Instantly
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
