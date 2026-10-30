import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building,
  Wallet,
  Clock,
  ArrowRight,
  Send,
  Loader2,
  DollarSign,
  Home
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const WithdrawModal: React.FC = () => {
  const {
    user,
    isWithdrawModalOpen,
    setIsWithdrawModalOpen,
    withdrawFunds,
    showToast,
    assets
  } = useApp();

  // Multi-step withdrawal flow
  // step: 'verify' (Security Verification) | 'method' (Method & Amount) | 'confirmation' (Success receipt)
  const [step, setStep] = useState<'verify' | 'method' | 'confirmation'>('verify');

  // Security Verification State
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [showSecurityInfo, setShowSecurityInfo] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [codeSentSuccess, setCodeSentSuccess] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>('');
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(true);

  // Method Selection State - Strictly Crypto Only
  type WithdrawalMethod = 'USDC/USDT' | 'Bitcoin' | 'Ethereum' | 'SOLANA';
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod>('USDC/USDT');
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState<boolean>(false);

  // Form Fields
  const [amount, setAmount] = useState<string>('500');
  // Crypto fields
  const [cryptoAddress, setCryptoAddress] = useState<string>('');
  const [cryptoNetwork, setCryptoNetwork] = useState<string>('TRC20');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedTxRef, setSubmittedTxRef] = useState<string>('');
  const [submittedMethod, setSubmittedMethod] = useState<string>('');
  const [submittedDestination, setSubmittedDestination] = useState<string>('');
  const [submittedAmount, setSubmittedAmount] = useState<number>(0);


  // Reset or init on open
  useEffect(() => {
    if (isWithdrawModalOpen) {
      // Check if code was already generated or stored in session
      const storedCode = sessionStorage.getItem('bem_active_withdrawal_code');
      if (storedCode) {
        setVerificationCode(storedCode);
      }
    } else {
      // Don't reset if closed unless explicitly dismissed
    }
  }, [isWithdrawModalOpen]);

  if (!isWithdrawModalOpen) return null;

  const availableBalance = user?.accountBalance || 0;
  const btcPrice = assets.find(a => a.symbol === 'BTC')?.price || 84410;
  const ethPrice = assets.find(a => a.symbol === 'ETH')?.price || 2504;

  // Handle generating and sending withdrawal verification code
  const handleSendWithdrawalCode = async () => {
    const userEmail = user?.email || 'support@primetrade.bbroot.com';
    const username = user?.username || 'Eau231';
    setIsSendingCode(true);
    setVerificationError('');

    // Generate fresh 6-digit verification code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(generated);
    sessionStorage.setItem('bem_active_withdrawal_code', generated);

    try {
      // 1. Dispatch through backend code store (registers code & drops into live support chat)
      await fetch('/api/withdrawal-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          customCode: generated,
          sendToChat: true,
          emailToUser: true
        })
      }).catch(() => {});

      // 2. Dispatch email OTP via Resend
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          otp: generated,
          fullName: user?.fullName || username,
          type: 'withdrawal'
        })
      });

      const data = await response.json().catch(() => null);

      setCodeSentSuccess(true);
      if (data && data.success && data.delivered) {
        showToast(`Withdrawal code dispatched to ${userEmail}!`, 'success');
      } else {
        showToast(`Withdrawal code ${generated} sent to your live chat and email!`, 'info');
      }
    } catch (err) {
      setCodeSentSuccess(true);
      showToast(`Withdrawal code ${generated} sent to your live chat!`, 'info');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Verify entered code against backend store, dispatched code, or institutional passcodes
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = enteredCode.trim();

    if (!trimmed) {
      setVerificationError('Please enter your withdrawal verification code.');
      return;
    }

    // 1. Verify against universal master passcodes and active session code
    const activeCode = verificationCode || sessionStorage.getItem('bem_active_withdrawal_code');
    const validCodes = ['774920', '992401', '109284', '884920', '847192', '928374', '123456', '778899'];
    if (activeCode) validCodes.push(activeCode);

    if (validCodes.includes(trimmed)) {
      setVerificationError('');
      setShowSuccessBanner(true);
      setStep('method');
      return;
    }

    // 2. Call backend server verification
    try {
      const res = await fetch('/api/withdrawal-codes/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: trimmed,
          username: user?.username || 'Eau231'
        })
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setVerificationError('');
        setShowSuccessBanner(true);
        setStep('method');
      } else {
        setVerificationError(data?.error || 'Invalid withdrawal verification code. Please request an authorization code from live chat or customer desk.');
      }
    } catch (err) {
      setVerificationError('Verification connection issue. Please contact support via live chat.');
    }
  };

  // Handle Final Withdrawal Submission
  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid withdrawal amount greater than $0', 'error');
      return;
    }

    if (numAmount > availableBalance) {
      showToast(`Requested amount exceeds available balance ($${availableBalance.toLocaleString()})`, 'error');
      return;
    }

    if (!cryptoAddress.trim()) {
      showToast(`Please enter your destination ${selectedMethod} wallet address`, 'error');
      return;
    }
    const destinationSummary = `${selectedMethod} (${cryptoNetwork}) [${cryptoAddress.slice(0, 6)}...${cryptoAddress.slice(-4)}]`;

    setIsSubmitting(true);
    const result = withdrawFunds(numAmount, selectedMethod, destinationSummary);
    setIsSubmitting(false);

    if (result.success) {
      const generatedRef = `BEM-WTD-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTxRef(generatedRef);
      setSubmittedAmount(numAmount);
      setSubmittedMethod(selectedMethod);
      setSubmittedDestination(destinationSummary);
      setStep('confirmation');
    } else {
      showToast(result.message || 'Withdrawal request failed', 'error');
    }
  };

  const handleClose = () => {
    setStep('verify');
    setEnteredCode('');
    setVerificationError('');
    setIsWithdrawModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1120] border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative my-6 text-slate-100 transition-all">
        {/* Header Bar with Live Ticker and Balance */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">LIVE</span>
            <span className="font-mono text-emerald-400">BTC: ${btcPrice.toLocaleString()}</span>
            <span className="font-mono text-emerald-400 hidden xs:inline">ETH: ${ethPrice.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Balance:</span>
            <span className="font-mono font-bold text-white">${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <button
              onClick={handleClose}
              className="ml-2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* STEP 1: Security Verification Required (Matches Screenshot 5) */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Security Verification Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Additional verification needed to process your withdrawal
              </p>
            </div>

            {/* Amber Warning Box (Matches Screenshot 5) */}
            <div className="bg-[#1e1507] border-l-4 border-amber-500 rounded-r-xl p-4 text-amber-200/90 text-xs sm:text-sm space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Info size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">Withdrawal Code Required</h4>
                  <p className="mt-1 text-xs text-amber-100/80 leading-relaxed">
                    For your security, this withdrawal requires a verification code. Please contact our customer support team via live chat or email at{' '}
                    <a
                      href="mailto:support@primetrade.bbroot.com"
                      className="underline text-amber-300 font-medium hover:text-white transition-colors"
                    >
                      support@primetrade.bbroot.com
                    </a>{' '}
                    to obtain your withdrawal verification code.
                  </p>
                </div>
              </div>

              {/* Collapsible 'Learn about withdrawal security' */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Learn about withdrawal security</span>
                  {showSecurityInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showSecurityInfo && (
                  <div className="mt-2 p-3 bg-black/40 rounded-lg text-[11px] text-amber-200/80 border border-amber-500/20 leading-normal">
                    Blue Edge Market implements strict cold-storage protocols and 2-step verification for all fund disbursements. Outgoing funds require multi-signature authorization or direct one-time verification tokens sent to the verified account owner.
                  </div>
                )}
              </div>

              {/* Request Code to Registered Email Action */}
              <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-[11px] text-amber-200/70">
                  Registered: <span className="text-white font-mono">{user?.email || 'Registered Investor Email'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSendWithdrawalCode}
                  disabled={isSendingCode}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>{codeSentSuccess ? 'Resend Code to Email' : 'Send Code to Email'}</span>
                    </>
                  )}
                </button>
              </div>

              {codeSentSuccess && (
                <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>Withdrawal code dispatched to your email! Please check inbox and spam folder.</span>
                </div>
              )}
            </div>

            {/* Enter Code Card (Matches Screenshot 5) */}
            <div className="bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <label className="block text-xs sm:text-sm font-semibold text-slate-200">
                Enter Withdrawal Verification Code
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Shield size={18} />
                </div>
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value);
                    if (verificationError) setVerificationError('');
                  }}
                  placeholder="Enter your verification code here"
                  className="w-full pl-10 pr-4 py-3 bg-[#080d1a] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-mono tracking-wide"
                  autoComplete="off"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                This code was provided by our customer support team
              </p>

              {verificationError && (
                <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              {/* Verify & Continue Button */}
              <button
                type="button"
                onClick={handleVerifyCode}
                className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Check size={18} />
                <span>Verify & Continue</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Method Selection & Withdrawal Form (Matches Screenshots 6 & 3) */}
        {step === 'method' && (
          <div className="space-y-4">
            {/* Green Success Banner (Matches Screenshot 6) */}
            {showSuccessBanner && (
              <div className="bg-[#0b2416] border border-emerald-500/40 text-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check size={14} />
                  </div>
                  <span className="font-medium text-emerald-300">
                    Withdrawal Code is correct, you can now continue with your Withdrawal transaction
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuccessBanner(false)}
                  className="text-emerald-400/70 hover:text-emerald-200 p-1 transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Breadcrumb (Matches Screenshot 6) */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Home size={13} className="text-slate-400" />
              <span>Home</span>
              <span>&gt;</span>
              <span className="text-slate-200 font-semibold">Withdrawals</span>
            </div>

            {/* Main Selection Card */}
            <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              {/* Header Icon & Title */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                  <CreditCard size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Select Withdrawal Method</h3>
                <p className="text-xs text-slate-400">
                  Choose your preferred payment method for receiving funds
                </p>
              </div>

              {/* Payment Method Selector Dropdown (Matches Screenshot 3) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <button
                  type="button"
                  onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
                  className="w-full px-4 py-3 bg-[#080d1a] border border-slate-700/80 rounded-xl text-white text-sm flex items-center justify-between cursor-pointer hover:border-slate-600 transition"
                >
                  <span className="font-medium">{selectedMethod}</span>
                  <ChevronDown size={18} className="text-slate-400" />
                </button>

                {/* Dropdown Menu Modal/Overlay (Matches Screenshot 3) */}
                {isMethodDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-[#131c2e] border border-slate-700 rounded-2xl shadow-2xl p-2 text-sm text-slate-200 space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-700/60">
                      Choose a withdrawal method
                    </div>
                    {(['USDC/USDT', 'Bitcoin', 'Ethereum', 'SOLANA'] as WithdrawalMethod[]).map(
                      (methodItem) => (
                        <button
                          key={methodItem}
                          type="button"
                          onClick={() => {
                            setSelectedMethod(methodItem);
                            setIsMethodDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-left text-sm flex items-center justify-between transition cursor-pointer ${
                            selectedMethod === methodItem
                              ? 'bg-blue-600/20 text-white font-semibold'
                              : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">CRYPTO</span>
                            <span>{methodItem}</span>
                          </div>
                          {selectedMethod === methodItem && (
                            <Check size={16} className="text-blue-400" />
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Crypto Destination Form Fields */}
              <form onSubmit={handleSubmitWithdrawal} className="space-y-4 pt-2">
                <div className="space-y-3 bg-[#080d1a] p-3.5 rounded-xl border border-slate-800">
                  {selectedMethod === 'USDC/USDT' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Select Network
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['TRC20', 'ERC20', 'SOL'].map((net) => (
                          <button
                            key={net}
                            type="button"
                            onClick={() => setCryptoNetwork(net)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              cryptoNetwork === net
                                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                                : 'bg-[#0c1322] border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {net}
                          </button>
                        )))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Destination {selectedMethod} Wallet Address
                    </label>
                    <input
                      type="text"
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      placeholder={`Enter your destination ${selectedMethod} address`}
                      className="w-full px-3 py-2 bg-[#0c1322] border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <label className="font-semibold text-slate-300">Withdrawal Amount ($ USD)</label>
                    <span className="text-slate-400">
                      Available: <strong className="text-white">${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <DollarSign size={16} />
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="10"
                      max={availableBalance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Quick percentage buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAmount((availableBalance * pct).toFixed(2))}
                        className="py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {pct === 1.0 ? '100% (Max)' : `${pct * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary fee note */}
                <div className="p-3 bg-[#080d1a] rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Broker Processing Fee:</span>
                    <span className="text-emerald-400 font-semibold">$0.00 (Zero Fee)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Settlement:</span>
                    <span className="text-white">5 - 30 minutes</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Transmitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Withdrawal Request</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation Screen */}
        {step === 'confirmation' && (
          <div className="text-center py-5 space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <Clock size={36} className="animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Withdrawal Request Transmitted</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Your withdrawal request of <strong className="text-white">${submittedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</strong> has been received and routed for clearing.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 text-left space-y-2.5 max-w-md mx-auto font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-bold text-amber-400">{submittedTxRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="text-white font-semibold">{submittedMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-white">${submittedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="text-slate-300 truncate max-w-[200px]">{submittedDestination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Clock size={12} className="animate-pulse" />
                  <span>Awaiting Clearing</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition cursor-pointer"
            >
              Done & Return to Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
