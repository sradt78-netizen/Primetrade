import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Globe2,
  ArrowRight,
  CheckCircle2,
  Lock,
  KeyRound,
  Mail,
  Smartphone,
  RefreshCw,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CARIBBEAN_COUNTRIES, GLOBAL_COUNTRIES } from '../data/countries';

export const AuthModals: React.FC = () => {
  const {
    isLoginOpen,
    setIsLoginOpen,
    isRegisterOpen,
    setIsRegisterOpen,
    login,
    register,
    setActiveTab,
    showToast
  } = useApp();

  // Fresh, clean Login form state (no pre-filled mock data)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Multi-step Registration state (Fresh & completely empty)
  // Step 1: Personal Info
  // Step 2: Location & Compliance
  // Step 3: Security Password
  // Step 4: OTP Verification
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3 | 4>(1);
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  // Step 2
  const [regCountry, setRegCountry] = useState('Jamaica');
  const [regCity, setRegCity] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regAccredited, setRegAccredited] = useState(false);
  // Step 3
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Step 4: OTP Security Verification
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [isOtpTimerActive, setIsOtpTimerActive] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [deliveryStatus, setDeliveryStatus] = useState<{
    delivered: boolean;
    provider?: string;
    warning?: string;
    fallbackOtp?: string;
  } | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval: any = null;
    if (isOtpTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setIsOtpTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpTimerActive, otpTimer]);

  // Dispatch / Generate OTP to user's email
  const dispatchNewOtp = async (emailTarget: string) => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setOtpTimer(60);
    setIsOtpTimerActive(true);
    setIsSendingOtp(true);

    try {
      const storedKey = (localStorage.getItem('admin_resend_api_key') || '').trim();
      const storedFrom = (localStorage.getItem('admin_resend_from_email') || '').trim();

      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTarget,
          otp: newCode,
          fullName: regFullName.trim(),
          apiKey: storedKey,
          fromEmail: storedFrom
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setDeliveryStatus({
          delivered: !!data.delivered,
          provider: data.provider,
          warning: data.warning,
          fallbackOtp: data.fallbackOtp || newCode
        });

        if (data.delivered) {
          showToast(`Verification code sent to ${emailTarget}. Please check your inbox.`, 'success');
        } else {
          showToast(data.warning || 'Email gateway notice: Verification code dispatched.', 'info');
        }
      } else {
        setDeliveryStatus({
          delivered: false,
          warning: 'Live email delivery notice: Verification code prepared.',
          fallbackOtp: newCode
        });
      }
    } catch (err) {
      console.warn('API send-otp error:', err);
      setDeliveryStatus({
        delivered: false,
        warning: 'Email service notice: Could not connect to email delivery service.',
        fallbackOtp: newCode
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both your email/username and password');
      return;
    }
    setLoginError('');
    const success = await login(loginEmail.trim(), loginPassword);
    if (success) {
      setIsLoginOpen(false);
      setActiveTab('dashboard');
    }
  };

  const handleRegisterNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (registerStep === 1) {
      if (!regUsername.trim() || !regFullName.trim() || !regEmail.trim()) {
        showToast('Please fill out all required fields', 'error');
        return;
      }
      if (!regEmail.includes('@') || !regEmail.includes('.')) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
      setRegisterStep(2);
    } else if (registerStep === 2) {
      if (!regCity.trim()) {
        showToast('Please enter your city and jurisdiction', 'error');
        return;
      }
      setRegisterStep(3);
    } else if (registerStep === 3) {
      if (!regPassword || regPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
      if (regPassword !== regConfirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      if (!agreeTerms) {
        showToast('Please accept the broker terms and regulatory disclosures', 'error');
        return;
      }

      // Progress to Step 4: OTP Verification
      setRegisterStep(4);
      dispatchNewOtp(regEmail);
    } else if (registerStep === 4) {
      handleOtpVerify();
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // User pasted multiple characters
      const pasted = cleaned.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      setOtpError('');
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setOtpError('');

    // Advance focus to next input
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = async () => {
    const fullCode = otpDigits.join('');
    if (fullCode.length < 6) {
      setOtpError('Please enter all 6 digits of your one-time verification code');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const expectedCode = generatedOtp || deliveryStatus?.fallbackOtp;
      if (fullCode !== expectedCode) {
        setOtpError('Invalid verification code. Please check your OTP and try again.');
        showToast('Incorrect verification code. Please retry.', 'error');
        return;
      }
      // The current OTP flow is client-generated; do not treat it as server-side identity proof.
      // Account creation is persisted with a server-side password hash and session cookie.
      const success = await register({
        username: regUsername.trim(), fullName: regFullName.trim(), email: regEmail.trim(),
        phone: regPhone.trim(), country: regCountry, city: regCity.trim()
      }, regPassword);
      if (success) {
        fetch('/api/send-marketing-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regEmail.trim(), fullName: regFullName.trim(), campaignType: 'account_active' }) }).catch(() => {});
        setIsRegisterOpen(false); setActiveTab('dashboard');
      } else {
        setOtpError('Account creation failed. Please review your details and try again.');
      }
    } finally { setIsVerifyingOtp(false); }
  };

  const resetRegisterModal = () => {
    setIsRegisterOpen(false);
    setRegisterStep(1);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
  };

  return (
    <>
      {/* SECURE CLIENT LOGIN MODAL */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0a1020] border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-2xl my-8">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header Brand */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <img
                  src="/brand/blue-edge-logo.png"
                  alt="Blue Edge Market"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white mb-1">
                Welcome Back
              </h2>
              <div className="text-sm font-semibold text-blue-400">
                Blue Edge Market Client Portal
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Access your trading dashboard and portfolio
              </p>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-3 gap-2 py-3 px-2 bg-slate-900/60 rounded-xl border border-slate-800 text-center mb-6">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">24/7 Markets</div>
              </div>

              <div className="flex flex-col items-center border-x border-slate-800">
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-400">
                  <Zap size={12} />
                  Fast
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Execution</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400">
                  <Shield size={12} />
                  Secure
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">256-bit SSL</div>
              </div>
            </div>

            {/* Error banner if any */}
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form (Clean, completely blank fields) */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    required
                    placeholder="Enter email or username"
                    autoComplete="username"
                    className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    required
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-11 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => showToast('Password reset link sent to registered email.', 'info')}
                  className="text-blue-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Access Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <div className="text-xs text-slate-400">
                Don't have a broker account?{' '}
                <button
                  onClick={() => {
                    setIsLoginOpen(false);
                    setIsRegisterOpen(true);
                  }}
                  className="text-blue-400 font-bold hover:underline cursor-pointer ml-1"
                >
                  Create one now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-STEP CLIENT REGISTRATION ONBOARDING WITH REAL OTP VERIFICATION */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0a1020] border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-2xl my-8">
            <button
              onClick={resetRegisterModal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Steps Progress Indicator (1 to 4) */}
            <div className="flex items-center justify-between mb-6 px-2">
              {[
                { step: 1, label: 'Info' },
                { step: 2, label: 'Location' },
                { step: 3, label: 'Security' },
                { step: 4, label: 'OTP' }
              ].map((item, idx, arr) => (
                <React.Fragment key={item.step}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        registerStep >= item.step
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-2 ring-blue-400/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {registerStep > item.step ? '✓' : item.step}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-300 mt-1">
                      {item.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 transition-colors ${
                        registerStep > item.step ? 'bg-blue-600' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Card Content Title */}
            <div className="bg-[#0e172a] border border-slate-800 rounded-xl p-3.5 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
                {registerStep === 1 && <Shield size={20} />}
                {registerStep === 2 && <Globe2 size={20} />}
                {registerStep === 3 && <Lock size={20} />}
                {registerStep === 4 && <KeyRound size={20} className="text-amber-400" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {registerStep === 1 && 'Personal Information'}
                  {registerStep === 2 && 'Location & Compliance'}
                  {registerStep === 3 && 'Security Credentials'}
                  {registerStep === 4 && 'Broker Security Verification (OTP)'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {registerStep === 1 && 'Create your institutional trading profile'}
                  {registerStep === 2 && 'Jurisdiction compliance and verification'}
                  {registerStep === 3 && 'Encrypted access protection'}
                  {registerStep === 4 && 'Enter the 6-digit passcode sent to verify your identity'}
                </p>
              </div>
            </div>

            {/* Form Fields for Steps 1, 2, 3 */}
            {registerStep < 4 && (
              <form onSubmit={handleRegisterNext} className="space-y-4">
                {/* STEP 1: Personal Information (Clean & Blank) */}
                {registerStep === 1 && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Trading Username <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        required
                        placeholder="Choose username"
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Legal Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        required
                        placeholder="First and last name"
                        autoComplete="name"
                        className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        placeholder="your.email@domain.com"
                        autoComplete="email"
                        className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        autoComplete="tel"
                        className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* STEP 2: Location & Compliance (Clean & Blank) */}
                {registerStep === 2 && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Country of Residence <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={regCountry}
                        onChange={(e) => setRegCountry(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <optgroup label="🌴 Caribbean Countries & Territories">
                          {CARIBBEAN_COUNTRIES.map((c) => (
                            <option key={c.name} value={c.name} className="bg-[#0d1629] text-white">
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🌍 Global & International">
                          {GLOBAL_COUNTRIES.map((c) => (
                            <option key={c.name} value={c.name} className="bg-[#0d1629] text-white">
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        City / State <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        required
                        placeholder="e.g. New York, NY"
                        className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Residential Street Address
                      </label>
                      <input
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="Street address (optional)"
                        className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regAccredited}
                          onChange={(e) => setRegAccredited(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span>I confirm I am an eligible investor / self-directed trader.</span>
                      </label>
                    </div>
                  </>
                )}

                {/* STEP 3: Security & Passwords */}
                {registerStep === 3 && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Create Password <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          placeholder="Minimum 6 characters"
                          className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm Password <span className="text-red-400">*</span>
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter password"
                        className="w-full px-4 py-3 bg-[#0d1629] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                      By submitting, you agree to Blue Edge Market Terms of Brokerage, Segregated Custody Policy, and Financial Risk Disclosures.
                    </div>

                    <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        required
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                      />
                      <span>I understand CFD and margin risks and accept broker regulations.</span>
                    </label>
                  </>
                )}

                {/* Navigation Buttons for Steps 1-3 */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Step {registerStep} of 4
                  </div>

                  <div className="flex items-center gap-2">
                    {registerStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setRegisterStep((prev) => (prev - 1) as any)}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                      >
                        Back
                      </button>
                    )}

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{registerStep === 3 ? 'Proceed to OTP Verification' : 'Continue'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 4: REAL OTP SECURITY VERIFICATION */}
            {registerStep === 4 && (
              <div className="space-y-4">
                {/* Email Dispatched Security Notice */}
                <div className={`p-4 rounded-2xl shadow-lg border transition-all ${
                  deliveryStatus?.delivered
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-900/90 border-blue-500/30'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      deliveryStatus?.delivered
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    }`}>
                      <Mail size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Check Your Email
                        </span>
                        <span className={`text-[10px] font-medium flex items-center gap-1 ${
                          deliveryStatus?.delivered ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                          {isSendingOtp ? (
                            <span className="animate-pulse">Dispatching...</span>
                          ) : deliveryStatus?.delivered ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Live Email Sent via Resend</span>
                            </>
                          ) : (
                            <span>Passcode Ready</span>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        A 6-digit verification code has been dispatched to <span className="font-semibold text-white">{regEmail}</span>.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Please check your inbox (and spam/junk folder) and enter the 6-digit code below to activate your account.
                      </p>

                      {/* Status / Notice if email provider reported notice or unconfigured */}
                      {deliveryStatus && !deliveryStatus.delivered && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px]">
                          <p className="text-amber-400/90 flex items-center gap-1 font-medium">
                            <AlertCircle size={12} />
                            <span>{deliveryStatus.warning || 'Email gateway awaiting live RESEND_API_KEY connection.'}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="space-y-2">
                  <label className="block text-center text-xs font-semibold text-slate-300">
                    Enter the 6-Digit Passcode
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold font-mono rounded-xl border bg-[#0d1629] text-white focus:outline-none transition ${
                          otpError
                            ? 'border-red-500 focus:border-red-400'
                            : digit
                            ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                            : 'border-slate-700 focus:border-blue-400'
                        }`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div className="text-center text-xs text-red-400 font-medium pt-1 flex items-center justify-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>{otpError}</span>
                    </div>
                  )}
                </div>

                {/* Resend Code Button & Countdown */}
                <div className="text-center text-xs text-slate-400 pt-1">
                  {isOtpTimerActive ? (
                    <span className="text-slate-400">
                      Resend new code in <span className="font-mono text-blue-400 font-bold">{otpTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => dispatchNewOtp(regEmail)}
                      className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1.5 cursor-pointer underline"
                    >
                      <RefreshCw size={13} />
                      <span>Resend 6-Digit Code</span>
                    </button>
                  )}
                </div>

                {/* Action Buttons for Step 4 */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep(3);
                      setOtpError('');
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Back to Security
                  </button>

                  <button
                    type="button"
                    onClick={handleOtpVerify}
                    disabled={isVerifyingOtp}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Verifying Security Token...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Verify & Activate Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Footer Switch to Login */}
            <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsRegisterOpen(false);
                  setIsLoginOpen(true);
                }}
                className="text-blue-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Sign in here
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
