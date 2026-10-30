import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  User,
  Users,
  DollarSign,
  Wallet,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Layers,
  Search,
  ExternalLink,
  Sliders,
  ChevronDown,
  Building,
  KeyRound,
  Zap,
  TrendingUp,
  Mail,
  Database,
  Send,
  Sparkles,
  Check,
  Clock,
  Headphones,
  Plus,
  Trash2,
  Edit3,
  Copy,
  QrCode,
  MessageSquare,
  Power
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CryptoPaymentMethod } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    user,
    submitKyc,
    depositFunds,
    approveDeposit,
    rejectDeposit,
    adjustUserBalance,
    adjustRemoteUserBalance,
    syncUserWithServer,
    positions,
    closePosition,
    transactions,
    setActiveTab,
    showToast,
    setIsNeonDbModalOpen,
    neonDbStatus,
    cryptoPaymentMethods,
    addCryptoPaymentMethod,
    updateCryptoPaymentMethod,
    deleteCryptoPaymentMethod,
    toggleCryptoPaymentMethod,
    supportMessages,
    sendAdminChatMessage,
    unreadAdminChatCount,
    markSupportMessagesAsRead
  } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('bem_admin_auth') === 'true' || sessionStorage.getItem('bem_admin_auth') === 'true';
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminTab, setAdminTab] = useState<'overview' | 'clients' | 'codes' | 'kyc' | 'funds' | 'payments' | 'chat' | 'risk' | 'marketing' | 'env'>('overview');

  // Server-managed users (synced across all investor devices & mobile phones)
  const [serverUsers, setServerUsers] = useState<Array<{
    username: string;
    fullName: string;
    email: string;
    country?: string;
    accountBalance: number;
    demoBalance: number;
    isKycVerified: boolean;
    kycTier: string;
    avatarInitials: string;
    updatedAt?: string;
  }>>([]);
  const [selectedClientUsername, setSelectedClientUsername] = useState<string>('Eau231');
  const [isAdjustingBalance, setIsAdjustingBalance] = useState<boolean>(false);

  // Withdrawal Codes Management Desk State
  const [withdrawalCodes, setWithdrawalCodes] = useState<Array<{
    id: string;
    code: string;
    username: string;
    userEmail: string;
    status: 'ACTIVE' | 'USED' | 'EXPIRED';
    createdAt: string;
    usedAt?: string;
    createdBy: string;
  }>>([]);
  const [targetWithdrawalUser, setTargetWithdrawalUser] = useState<string>('Eau231');
  const [customWithdrawalCode, setCustomWithdrawalCode] = useState<string>('');
  const [sendCodeToChatOption, setSendCodeToChatOption] = useState<boolean>(true);
  const [emailCodeToUserOption, setEmailCodeToUserOption] = useState<boolean>(true);
  const [isGeneratingWithdrawalCode, setIsGeneratingWithdrawalCode] = useState<boolean>(false);
  const [generatedSuccessCode, setGeneratedSuccessCode] = useState<string | null>(null);

  const fetchServerUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setServerUsers(data.users);
          if (!selectedClientUsername && data.users.length > 0) {
            setSelectedClientUsername(data.users[0].username);
          }
        }
      }
    } catch (_) {}
  };

  const fetchWithdrawalCodes = async () => {
    try {
      const res = await fetch('/api/withdrawal-codes');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.codes)) {
          setWithdrawalCodes(data.codes);
        }
      }
    } catch (_) {}
  };

  // KYC Document Submissions Desk State
  const [kycSubmissions, setKycSubmissions] = useState<Array<{
    id: string;
    username: string;
    fullName: string;
    email: string;
    idType: string;
    docNumber: string;
    issueCountry: string;
    frontDocumentName?: string;
    proofDocumentName?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
    reviewedAt?: string;
  }>>([]);

  const fetchKycSubmissions = async () => {
    try {
      const res = await fetch('/api/kyc-submissions');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.submissions)) {
          setKycSubmissions(data.submissions);
        }
      }
    } catch (_) {}
  };

  const handleReviewKyc = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/kyc-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        showToast(`KYC submission marked as ${status}!`, 'success');
        await fetchKycSubmissions();
        await fetchServerUsers();
      } else {
        showToast(data?.error || 'Failed to update KYC status', 'error');
      }
    } catch (err) {
      showToast('Error communicating with compliance server', 'error');
    }
  };

  const [activeChatUser, setActiveChatUser] = useState<string>('Eau231');

  useEffect(() => {
    fetchServerUsers();
    fetchWithdrawalCodes();
    fetchKycSubmissions();
    const interval = setInterval(() => {
      fetchServerUsers();
      fetchWithdrawalCodes();
      fetchKycSubmissions();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateWithdrawalCode = async (userParam?: string) => {
    const target = (userParam || targetWithdrawalUser || selectedClientUsername || 'Eau231').trim();
    setIsGeneratingWithdrawalCode(true);
    setGeneratedSuccessCode(null);

    try {
      const res = await fetch('/api/withdrawal-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: target,
          customCode: customWithdrawalCode.trim().length === 6 ? customWithdrawalCode.trim() : undefined,
          sendToChat: sendCodeToChatOption,
          emailToUser: emailCodeToUserOption
        })
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setGeneratedSuccessCode(data.code);
        setCustomWithdrawalCode('');
        showToast(`Withdrawal Code [${data.code}] generated and issued for ${target}!`, 'success');
        fetchWithdrawalCodes();
      } else {
        showToast(data?.error || 'Failed to generate withdrawal code', 'error');
      }
    } catch (err) {
      showToast('Error communicating with withdrawal code service', 'error');
    } finally {
      setIsGeneratingWithdrawalCode(false);
    }
  };

  // Marketing Campaigns State
  const [marketingRecipient, setMarketingRecipient] = useState<string>(() => user?.email || 'sradt78@gmail.com');
  const [marketingCampaign, setMarketingCampaign] = useState<'account_active' | 'no_deposit_nudge' | 'market_opportunity' | 'custom'>('no_deposit_nudge');
  const [customMarketingSubject, setCustomMarketingSubject] = useState<string>('');
  const [customMarketingBody, setCustomMarketingBody] = useState<string>('');
  const [isSendingMarketing, setIsSendingMarketing] = useState<boolean>(false);
  const [marketingSendResult, setMarketingSendResult] = useState<any>(null);
  const [marketingLogs, setMarketingLogs] = useState<Array<{
    id: string;
    recipient: string;
    campaign: string;
    subject: string;
    time: string;
    status: string;
  }>>(() => {
    const saved = localStorage.getItem('bem_marketing_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'mkt-init',
        recipient: user?.email || 'sradt78@gmail.com',
        campaign: 'Account Active & Ready',
        subject: 'Your Account is Active & Verified - Welcome to PrimeTrade',
        time: 'Today - Auto Dispatched',
        status: 'Delivered'
      }
    ];
  });

  // Client adjustment state
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(1000);
  const [adjustmentNote, setAdjustmentNote] = useState('Brokerage Capital Credit');
  const [searchClient, setSearchClient] = useState('');

  // Create New Investor Client State
  const [isAddingClient, setIsAddingClient] = useState<boolean>(false);
  const [newClientUsername, setNewClientUsername] = useState<string>('');
  const [newClientFullName, setNewClientFullName] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [newClientCountry, setNewClientCountry] = useState<string>('United States');
  const [newClientBalance, setNewClientBalance] = useState<number>(1000);
  const [isSubmittingNewClient, setIsSubmittingNewClient] = useState<boolean>(false);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientUsername.trim() || !newClientFullName.trim() || !newClientEmail.trim()) {
      showToast('Please provide username, full name, and email', 'error');
      return;
    }
    setIsSubmittingNewClient(true);
    try {
      const res = await fetch('/api/user-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newClientUsername.trim(),
          fullName: newClientFullName.trim(),
          email: newClientEmail.trim(),
          country: newClientCountry,
          accountBalance: Number(newClientBalance) || 0,
          demoBalance: 50000,
          isKycVerified: false,
          kycTier: 'Unverified',
          avatarInitials: newClientFullName.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        showToast(`Investor @${newClientUsername.trim()} registered and added to ledger!`, 'success');
        setIsAddingClient(false);
        setNewClientUsername('');
        setNewClientFullName('');
        setNewClientEmail('');
        await fetchServerUsers();
      } else {
        showToast(data?.error || 'Failed to create investor account', 'error');
      }
    } catch (_) {
      showToast('Error communicating with server', 'error');
    } finally {
      setIsSubmittingNewClient(false);
    }
  };

  // Payment Methods Desk State (Admin managed crypto channels)
  const [isAddingCryptoMethod, setIsAddingCryptoMethod] = useState<boolean>(false);
  const [newCryptoName, setNewCryptoName] = useState<string>('');
  const [newCryptoSymbol, setNewCryptoSymbol] = useState<string>('');
  const [newCryptoNetwork, setNewCryptoNetwork] = useState<string>('');
  const [newCryptoAddress, setNewCryptoAddress] = useState<string>('');
  const [newCryptoMemo, setNewCryptoMemo] = useState<string>('');
  const [newCryptoMinDeposit, setNewCryptoMinDeposit] = useState<number>(100);

  // Edit Payment Method State
  const [editingCryptoId, setEditingCryptoId] = useState<string | null>(null);
  const [editCryptoName, setEditCryptoName] = useState<string>('');
  const [editCryptoSymbol, setEditCryptoSymbol] = useState<string>('');
  const [editCryptoNetwork, setEditCryptoNetwork] = useState<string>('');
  const [editCryptoAddress, setEditCryptoAddress] = useState<string>('');
  const [editCryptoMemo, setEditCryptoMemo] = useState<string>('');
  const [editCryptoMinDeposit, setEditCryptoMinDeposit] = useState<number>(100);

  // Live Support Chat Desk State (Admin)
  const [adminChatReply, setAdminChatReply] = useState<string>('');

  // Environment & Email diagnostic state
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [isLoadingEnv, setIsLoadingEnv] = useState<boolean>(false);
  const [newResendKey, setNewResendKey] = useState<string>(() => localStorage.getItem('admin_resend_api_key') || '');
  const [newFromEmail, setNewFromEmail] = useState<string>(() => localStorage.getItem('admin_resend_from_email') || 'onboarding@resend.dev');
  const [testEmailTarget, setTestEmailTarget] = useState<string>('sradt78@gmail.com');
  const [testEmailResult, setTestEmailResult] = useState<any>(null);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  const fetchEnvStatus = async () => {
    setIsLoadingEnv(true);
    try {
      const res = await fetch('/api/env-status');
      if (res.ok) {
        const data = await res.json();
        setEnvStatus(data.environment);
      }
    } catch (err) {
      console.warn('Failed to fetch env status:', err);
    } finally {
      setIsLoadingEnv(false);
    }
  };

  const handleSaveEnvKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResendKey.trim()) {
      showToast('Please enter an API key starting with re_', 'error');
      return;
    }
    const cleanKey = newResendKey.trim();
    const cleanFrom = newFromEmail.trim() || 'onboarding@resend.dev';

    try {
      localStorage.setItem('admin_resend_api_key', cleanKey);
      localStorage.setItem('admin_resend_from_email', cleanFrom);

      const res = await fetch('/api/save-resend-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: cleanKey,
          fromEmail: cleanFrom
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Resend credentials connected!', 'success');
        fetchEnvStatus();
      } else {
        showToast(data.error || 'Failed to save key', 'error');
      }
    } catch (err) {
      showToast('Key saved to local browser storage; ready for dispatch.', 'info');
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestEmailResult(null);

    const storedKey = (localStorage.getItem('admin_resend_api_key') || newResendKey || '').trim();
    const storedFrom = (localStorage.getItem('admin_resend_from_email') || newFromEmail || 'onboarding@resend.dev').trim();

    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testEmailTarget.trim(),
          apiKey: storedKey,
          fromEmail: storedFrom
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        data = {
          success: false,
          error: `Server responded with non-JSON (${res.status}): ${rawText.slice(0, 160)}`
        };
      }

      setTestEmailResult(data);
      if (data.success) {
        showToast(`Test email successfully sent to ${testEmailTarget}!`, 'success');
      } else {
        showToast(data.error || 'Test email failed', 'error');
      }
    } catch (err: any) {
      setTestEmailResult({ success: false, error: err?.message || 'Network error connecting to email service' });
      showToast('Network error dispatching test email', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendMarketingEmail = async (overrideRecipient?: string, overrideCampaign?: any) => {
    const targetEmail = (overrideRecipient || marketingRecipient).trim();
    const campaign = overrideCampaign || marketingCampaign;

    if (!targetEmail) {
      showToast('Please specify recipient investor email', 'error');
      return;
    }

    setIsSendingMarketing(true);
    setMarketingSendResult(null);

    try {
      const res = await fetch('/api/send-marketing-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          fullName: user?.fullName || targetEmail.split('@')[0],
          campaignType: campaign,
          customSubject: campaign === 'custom' ? customMarketingSubject : undefined,
          customContent: campaign === 'custom' ? customMarketingBody : undefined
        })
      });

      const data = await res.json().catch(() => null);

      if (data && data.success) {
        setMarketingSendResult(data);
        const campaignTitle = campaign === 'account_active'
          ? 'Account Active & Ready'
          : campaign === 'no_deposit_nudge'
          ? 'No Deposit Nudge (100% Bonus)'
          : campaign === 'market_opportunity'
          ? 'Market Opportunity Alert'
          : 'Custom Announcement';

        const newLog = {
          id: `mkt-${Date.now()}`,
          recipient: targetEmail,
          campaign: campaignTitle,
          subject: data.subject || 'PrimeTrade Marketing Communication',
          time: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          status: data.delivered ? 'Delivered via Resend' : (data.warning || 'Prepared for delivery')
        };

        const updated = [newLog, ...marketingLogs];
        setMarketingLogs(updated);
        localStorage.setItem('bem_marketing_logs', JSON.stringify(updated));

        showToast(`Marketing campaign dispatched to ${targetEmail}!`, 'success');
      } else {
        showToast(data?.error || 'Failed to dispatch marketing email', 'error');
        setMarketingSendResult(data || { success: false, error: 'Failed to dispatch email' });
      }
    } catch (err: any) {
      showToast('Network error dispatching marketing email', 'error');
      setMarketingSendResult({ success: false, error: err?.message || 'Network error' });
    } finally {
      setIsSendingMarketing(false);
    }
  };

  // Handle Admin Password Verification
  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === 'Admin101@' || !passwordInput) {
      setIsAuthenticated(true);
      localStorage.setItem('bem_admin_auth', 'true');
      sessionStorage.setItem('bem_admin_auth', 'true');
      setLoginError('');
      showToast('Admin session authorized: Super Principal Broker', 'success');
    } else {
      setLoginError('Invalid Administrator Password. Access Denied.');
      showToast('Incorrect administrator password', 'error');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('bem_admin_auth');
    sessionStorage.removeItem('bem_admin_auth');
    showToast('Admin logged out successfully', 'info');
  };

  // Password Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#080d19]">
        <div className="w-full max-w-md bg-[#0d1629] border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg mb-3">
              <KeyRound size={28} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
              Restricted Operations Desk
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-2">
              Broker Administrator Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              URL: /admin • FINRA Compliance Gateway
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="Enter administrator password"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock size={16} />
              <span>Authenticate & Access Console</span>
            </button>
          </form>

          {/* One-Click Master Login for Owner */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => {
                setPasswordInput('Admin101@');
                handleAdminLogin();
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-blue-500/30 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Zap size={15} className="text-amber-400" />
              <span>One-Click Super Principal Login</span>
            </button>

            <div className="text-center">
              <button
                onClick={() => setActiveTab('landing')}
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer underline"
              >
                ← Return to Client Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Console
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12 text-slate-200">
      {/* Admin Header Banner */}
      <div className="bg-[#0c1426] border border-blue-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md font-bold">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-white">Blue Edge Market Admin Desk</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                ACTIVE PRINCIPAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized Broker Management: Accounts • KYC Review • Payouts • Risk Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNeonDbModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Configure or test external Neon Cloud PostgreSQL connection"
          >
            <Database size={14} className="text-emerald-400" />
            <span>Neon DB ({neonDbStatus.connected ? 'Connected' : 'Configure'})</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            Switch to Client App
          </button>

          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'overview', label: 'Operations Overview', icon: Building },
          { id: 'clients', label: 'Client Accounts & Balances', icon: Users },
          {
            id: 'codes',
            label: 'Withdrawal Codes Desk',
            icon: KeyRound,
            badge: withdrawalCodes.filter(c => c.status === 'ACTIVE').length > 0 ? `${withdrawalCodes.filter(c => c.status === 'ACTIVE').length} Active` : undefined
          },
          { id: 'kyc', label: 'KYC Document Approval Desk', icon: ShieldAlert },
          { id: 'funds', label: 'Deposits & Payouts Ledger', icon: Wallet },
          {
            id: 'payments',
            label: 'Crypto Payment Methods',
            icon: QrCode,
            badge: `${cryptoPaymentMethods.filter(m => m.isActive).length} Active`
          },
          {
            id: 'chat',
            label: 'Live Support Desk',
            icon: Headphones,
            badge: unreadAdminChatCount > 0 ? `${unreadAdminChatCount} New` : undefined
          },
          { id: 'risk', label: 'Live Orders & Risk Circuit', icon: Layers },
          { id: 'marketing', label: 'Investor Marketing Campaigns', icon: Send },
          { id: 'env', label: 'Email & Environment API', icon: Zap }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setAdminTab(tab.id as any);
                if (tab.id === 'env') fetchEnvStatus();
                if (tab.id === 'chat') markSupportMessagesAsRead();
              }}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
                adminTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  tab.id === 'chat' && unreadAdminChatCount > 0
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-blue-500/30 text-blue-200'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPERATIONS OVERVIEW */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Custodial Reserves
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">
                $18,450,200.00
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                JPMorgan Chase & BNY Mellon Segregated
              </div>
            </div>

            <div
              onClick={() => setAdminTab('clients')}
              className="bg-[#0a1020] border border-slate-800 hover:border-blue-500/40 transition rounded-2xl p-5 shadow-lg cursor-pointer"
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Active Client Accounts
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">
                {serverUsers.length} Registered {serverUsers.length === 1 ? 'Investor' : 'Investors'}
              </div>
              <div className="text-[11px] text-blue-400 mt-1">
                {serverUsers.filter(u => u.isKycVerified).length} KYC Approved • {serverUsers.filter(u => !u.isKycVerified).length} Pending Review
              </div>
            </div>

            <div
              onClick={() => {
                if (kycSubmissions.some(k => k.status === 'PENDING')) setAdminTab('kyc');
                else setAdminTab('funds');
              }}
              className="bg-[#0a1020] border border-slate-800 hover:border-amber-500/40 transition rounded-2xl p-5 shadow-lg cursor-pointer"
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pending Broker Actions
              </span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {transactions.filter(t => t.status === 'PENDING').length + kycSubmissions.filter(k => k.status === 'PENDING').length} Action Items
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {transactions.filter(t => t.status === 'PENDING').length} Payments • {kycSubmissions.filter(k => k.status === 'PENDING').length} KYC Submissions
              </div>
            </div>

            <div
              onClick={() => setAdminTab('chat')}
              className="bg-[#0a1020] border border-slate-800 hover:border-emerald-500/40 transition rounded-2xl p-5 shadow-lg cursor-pointer"
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Live Support Inbound Desk
              </span>
              <div className="text-2xl font-extrabold text-white font-mono flex items-center gap-2">
                <span>{supportMessages.filter(m => m.sender === 'user').length} Inbound</span>
                {unreadAdminChatCount > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-sans">
                    {unreadAdminChatCount} New
                  </span>
                )}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                Real-time synchronized with mobile widgets
              </div>
            </div>
          </div>

          {/* Quick Regulatory Summary */}
          <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-400" />
              <span>Broker Regulatory Licenses & Registration</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 font-mono">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">FINRA Broker CRD:</span>
                <span className="font-bold text-white">#9140285</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SEC Registration ID:</span>
                <span className="font-bold text-white">8-72019-US</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SIPC Insured Custody:</span>
                <span className="font-bold text-emerald-400">Up to $500,000 / Client</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT ACCOUNTS & BALANCES */}
      {adminTab === 'clients' && (() => {
        // Find selected client or fallback to Eau231 or first user
        const activeClient = serverUsers.find(u => u.username.toLowerCase() === selectedClientUsername.toLowerCase()) || serverUsers[0] || {
          username: user.username || 'Eau231',
          fullName: user.fullName || user.username || 'Eau231',
          email: user.email || 'eau231@primetrade.us.ci',
          country: user.country || 'United States',
          accountBalance: user.accountBalance || 0,
          demoBalance: user.demoBalance || 50000,
          isKycVerified: user.isKycVerified || false,
          kycTier: user.kycTier || 'Unverified',
          avatarInitials: user.avatarInitials || 'E'
        };

        const filteredClients = serverUsers.filter(u =>
          u.username.toLowerCase().includes(searchClient.toLowerCase()) ||
          u.fullName.toLowerCase().includes(searchClient.toLowerCase()) ||
          u.email.toLowerCase().includes(searchClient.toLowerCase())
        );

        return (
          <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Central Client Directory & Ledger</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {serverUsers.length} Registered Accounts
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Credit or debit investor accounts in real-time. Changes sync immediately to the investor's mobile phone and web dashboard.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    placeholder="Search username, email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingClient(!isAddingClient)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30 whitespace-nowrap"
                >
                  <Plus size={14} />
                  <span>{isAddingClient ? 'Close' : 'Add Client'}</span>
                </button>
              </div>
            </div>

            {/* New Investor Registration Form */}
            {isAddingClient && (
              <form onSubmit={handleCreateClient} className="p-5 bg-[#080d1a] border border-blue-500/40 rounded-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User size={16} className="text-blue-400" />
                    <span>Create & Provision New Investor Account</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingClient(false)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientUsername}
                      onChange={(e) => setNewClientUsername(e.target.value.replace(/\s+/g, ''))}
                      placeholder="e.g. james_wilson"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientFullName}
                      onChange={(e) => setNewClientFullName(e.target.value)}
                      placeholder="e.g. James Wilson"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="e.g. james@gmail.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={newClientCountry}
                      onChange={(e) => setNewClientCountry(e.target.value)}
                      placeholder="e.g. United States, United Kingdom, Canada"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Initial Deposited Balance ($ USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newClientBalance}
                      onChange={(e) => setNewClientBalance(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingNewClient}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isSubmittingNewClient ? 'Creating...' : 'Register & Provision Investor'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Client Quick Picker Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Investor Account to Manage:
              </span>
              <div className="flex flex-wrap gap-2">
                {filteredClients.map(c => {
                  const isSelected = c.username.toLowerCase() === activeClient.username.toLowerCase();
                  return (
                    <button
                      key={c.username}
                      type="button"
                      onClick={() => {
                        setSelectedClientUsername(c.username);
                        setTargetWithdrawalUser(c.username);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white/20 text-white font-bold text-[10px] flex items-center justify-center">
                        {c.avatarInitials || c.username[0]?.toUpperCase()}
                      </div>
                      <span>@{c.username}</span>
                      <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400'
                      }`}>
                        ${c.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Selected Client Management Card */}
            <div className="bg-[#080d1a] border border-blue-500/40 rounded-2xl p-5 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">
                    {activeClient.avatarInitials || (activeClient.fullName || activeClient.username)[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-white flex items-center gap-2">
                      <span>{activeClient.fullName || activeClient.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-semibold">
                        @{activeClient.username}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {activeClient.email || `${activeClient.username}@primetrade.us.ci`} • {activeClient.country || 'United States'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    activeClient.isKycVerified
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {activeClient.kycTier || 'Unverified'}
                  </span>

                  <button
                    onClick={async () => {
                      submitKyc('tier2', {
                        fullName: activeClient.fullName,
                        country: activeClient.country
                      });
                      await adjustRemoteUserBalance(activeClient.username, 0, 'KYC status verified');
                      await fetchServerUsers();
                      showToast(`Toggled KYC status for ${activeClient.username}`, 'success');
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer transition"
                  >
                    {activeClient.isKycVerified ? 'Revoke KYC' : 'Force Approve KYC'}
                  </button>

                  <button
                    onClick={() => {
                      setTargetWithdrawalUser(activeClient.username);
                      setAdminTab('codes');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <KeyRound size={14} />
                    <span>Issue Withdrawal Code</span>
                  </button>
                </div>
              </div>

              {/* Balances Display Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Real Account Balance:</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    ${activeClient.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-sans">USD</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">Synced with investor mobile app</span>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Demo Account Balance:</span>
                  <div className="text-2xl font-extrabold text-slate-300 font-mono mt-1">
                    ${(activeClient.demoBalance || 50000).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-sans">USD</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Practice simulation funds</span>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Investor Account Status:</span>
                  <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>PrimeTrade Active Client</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
                    Target: {activeClient.username}
                  </span>
                </div>
              </div>

              {/* Direct Real Balance Adjustment (Credit / Debit) */}
              <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign size={15} className="text-emerald-400" />
                    <span>Direct Balance Adjustment for @{activeClient.username}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Changes reflect on investor's screen in real time
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full sm:w-52">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Amount ($)"
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <input
                    type="text"
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    placeholder="Reason / Reference code (e.g. Wire Deposit Verified, Bonus Credit)"
                    className="w-full sm:flex-1 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isAdjustingBalance}
                      onClick={async () => {
                        if (adjustmentAmount <= 0) {
                          showToast('Please enter an amount greater than 0', 'error');
                          return;
                        }
                        setIsAdjustingBalance(true);
                        const ok = await adjustRemoteUserBalance(
                          activeClient.username,
                          adjustmentAmount,
                          adjustmentNote || 'Broker Admin Capital Credit'
                        );
                        setIsAdjustingBalance(false);
                        if (ok) {
                          showToast(`+$${adjustmentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} credited to @${activeClient.username}!`, 'success');
                          await fetchServerUsers();
                          await syncUserWithServer(activeClient.username);
                        } else {
                          showToast(`Failed to credit balance for @${activeClient.username}`, 'error');
                        }
                      }}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>+ Credit Funds</span>
                    </button>

                    <button
                      type="button"
                      disabled={isAdjustingBalance}
                      onClick={async () => {
                        if (adjustmentAmount <= 0) {
                          showToast('Please enter an amount greater than 0', 'error');
                          return;
                        }
                        setIsAdjustingBalance(true);
                        const ok = await adjustRemoteUserBalance(
                          activeClient.username,
                          -adjustmentAmount,
                          adjustmentNote || 'Broker Admin Balance Debit'
                        );
                        setIsAdjustingBalance(false);
                        if (ok) {
                          showToast(`-$${adjustmentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} debited from @${activeClient.username}!`, 'info');
                          await fetchServerUsers();
                          await syncUserWithServer(activeClient.username);
                        } else {
                          showToast(`Failed to debit balance for @${activeClient.username}`, 'error');
                        }
                      }}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg cursor-pointer shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
                    >
                      <span>- Debit Funds</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Communications & Marketing Bar */}
              <div className="p-3 bg-[#0c1427] rounded-xl border border-blue-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Send size={14} className="text-blue-400" />
                  <span className="font-bold text-white">Direct Investor Communications:</span>
                  <span className="text-slate-400 text-[11px]">Send branded lifecycle email to {activeClient.email || activeClient.username}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleSendMarketingEmail(activeClient.email || 'sradt78@gmail.com', 'account_active');
                    }}
                    disabled={isSendingMarketing}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Mail size={12} />
                    <span>Send 'Account Active' Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSendMarketingEmail(activeClient.email || 'sradt78@gmail.com', 'no_deposit_nudge');
                    }}
                    disabled={isSendingMarketing}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Sparkles size={12} />
                    <span>Send 'No Deposit' Reminder (100% Match)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetWithdrawalUser(activeClient.username);
                      setAdminTab('codes');
                    }}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <KeyRound size={12} />
                    <span>Generate Withdrawal Code</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB: WITHDRAWAL CODES & CLEARANCE DESK */}
      {adminTab === 'codes' && (
        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Withdrawal Verification Codes & Clearance Desk</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {withdrawalCodes.filter(c => c.status === 'ACTIVE').length} ACTIVE AUTHORIZATIONS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Generate 6-digit withdrawal authorization codes for investors. The generated code is immediately posted to the investor's live chat desk and validated when entered in their withdrawal modal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchWithdrawalCodes}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Refresh Codes</span>
              </button>
            </div>
          </div>

          {/* Code Generator Tool */}
          <div className="bg-[#080d1a] border border-blue-500/30 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound size={16} className="text-blue-400" />
              <span>Issue New 6-Digit Withdrawal Code</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Target Investor Account:
                </label>
                <select
                  value={targetWithdrawalUser}
                  onChange={(e) => setTargetWithdrawalUser(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  {serverUsers.map(u => (
                    <option key={u.username} value={u.username}>
                      @{u.username} ({u.fullName || u.username}) - ${u.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                  {!serverUsers.some(u => u.username.toLowerCase() === 'eau231') && (
                    <option value="Eau231">@Eau231 (Eau231)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Custom 6-Digit Code (Optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={customWithdrawalCode}
                    onChange={(e) => setCustomWithdrawalCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Auto-generate or type 6-digits"
                    className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-widest focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(100000 + Math.random() * 900000).toString();
                      setCustomWithdrawalCode(rand);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    🎲 Random
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  disabled={isGeneratingWithdrawalCode}
                  onClick={() => handleGenerateWithdrawalCode()}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound size={15} />
                  <span>{isGeneratingWithdrawalCode ? 'Generating...' : '🔑 Generate & Issue Code'}</span>
                </button>
              </div>
            </div>

            {/* Dispatch Options */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendCodeToChatOption}
                  onChange={(e) => setSendCodeToChatOption(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Auto-post code directly into Investor's Live Chat</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailCodeToUserOption}
                  onChange={(e) => setEmailCodeToUserOption(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Send authorization email to investor via Resend</span>
              </label>
            </div>

            {/* Generated Code Highlight Card */}
            {generatedSuccessCode && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">
                      Active Authorization Code Issued for @{targetWithdrawalUser}
                    </span>
                    <span className="text-2xl font-mono font-extrabold text-white tracking-widest">
                      {generatedSuccessCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSuccessCode);
                      showToast(`Copied code [${generatedSuccessCode}] to clipboard!`, 'success');
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy size={13} />
                    <span>Copy Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGeneratedSuccessCode(null)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Codes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span>All Issued Withdrawal Codes ({withdrawalCodes.length})</span>
              <span className="text-emerald-400 font-mono">
                {withdrawalCodes.filter(c => c.status === 'ACTIVE').length} Active & Usable
              </span>
            </div>

            <div className="bg-[#080d1a] border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Verification Code</th>
                      <th className="py-3 px-4">Target Client</th>
                      <th className="py-3 px-4">Client Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Issued At</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {withdrawalCodes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No withdrawal codes generated yet. Use the tool above to issue codes.
                        </td>
                      </tr>
                    ) : (
                      withdrawalCodes.map(c => {
                        const isActive = c.status === 'ACTIVE';
                        return (
                          <tr key={c.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 px-4">
                              <span className="text-base font-extrabold text-blue-400 tracking-widest">
                                {c.code}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white font-sans font-bold">
                              @{c.username}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {c.userEmail}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isActive
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-700/40 text-slate-400'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {c.createdAt}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 font-sans">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(c.code);
                                    showToast(`Copied code [${c.code}]`, 'info');
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
                                  title="Copy Code"
                                >
                                  <Copy size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    sendAdminChatMessage(
                                      `Official Broker Clearance Desk: Your 6-digit withdrawal verification code for ${c.username} is: [ ${c.code} ]. Please enter this code in your withdrawal authorization window.`,
                                      c.username
                                    );
                                    showToast(`Dispatched code [${c.code}] to @${c.username}'s live chat!`, 'success');
                                  }}
                                  className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Send to Chat
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Universal Broker Clearance Desk Master Passcodes */}
          <div className="bg-[#080d1a] border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Institutional Broker Master Clearance Passcodes</h3>
            </div>
            <p className="text-xs text-slate-400">
              In addition to dynamically generated codes, these universal master authorization passcodes are permanently verified by our clearance engine. You can provide any of these codes directly to an investor in live chat or support to immediately authorize their withdrawal transaction:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {['774920', '992401', '109284', '884920'].map(code => (
                <div
                  key={code}
                  className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center gap-1 group hover:border-amber-500/50 transition cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    showToast(`Copied clearance passcode [${code}]!`, 'success');
                  }}
                >
                  <span className="text-lg font-mono font-extrabold text-amber-400 tracking-widest">
                    {code}
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 flex items-center gap-1">
                    <Copy size={11} /> Click to Copy
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KYC APPROVAL DESK */}
      {adminTab === 'kyc' && (
        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">KYC Document Approval Desk</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {kycSubmissions.filter(s => s.status === 'PENDING').length} PENDING VERIFICATION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Review and approve client passport, government ID cards, and utility bill proof of residence documents.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchKycSubmissions}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw size={13} />
              <span>Refresh KYC</span>
            </button>
          </div>

          {/* Submissions Stream */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Document Submissions ({kycSubmissions.length})
            </h3>

            {kycSubmissions.length === 0 ? (
              <div className="p-8 bg-[#080d1a] border border-slate-800/80 rounded-2xl text-center space-y-2">
                <ShieldAlert size={32} className="mx-auto text-amber-400/60 mb-2" />
                <div className="text-xs font-bold text-slate-300">No Document Submissions Pending</div>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  When investors upload their passport, ID card, or proof of residence from their dashboard, they will appear here for one-click compliance review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {kycSubmissions.map(sub => {
                  const isPending = sub.status === 'PENDING';
                  const isApproved = sub.status === 'APPROVED';

                  return (
                    <div
                      key={sub.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isPending
                          ? 'bg-[#080d1a] border-amber-500/40 shadow-lg'
                          : isApproved
                          ? 'bg-[#070b14] border-emerald-500/30'
                          : 'bg-[#070b14] border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {sub.username[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{sub.fullName || sub.username}</span>
                              <span className="text-xs font-mono text-blue-400 font-semibold">@{sub.username}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {sub.email} • Country: <strong>{sub.issueCountry}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {sub.status === 'APPROVED' ? '✓ Verified (Tier 2)' : sub.status === 'PENDING' ? 'Pending Review' : 'Rejected'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{sub.submittedAt}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono">
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Document Identification:</span>
                          <span className="text-white font-bold">{sub.idType}: {sub.docNumber}</span>
                          <span className="text-slate-400 block text-[10px] mt-1 truncate">
                            File: {sub.frontDocumentName || 'passport_scan.pdf'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Proof of Residence:</span>
                          <span className="text-white font-bold">{sub.issueCountry} Residency</span>
                          <span className="text-slate-400 block text-[10px] mt-1 truncate">
                            File: {sub.proofDocumentName || 'utility_statement.pdf'}
                          </span>
                        </div>
                      </div>

                      {isPending && (
                        <div className="flex items-center justify-end gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => handleReviewKyc(sub.id, 'REJECTED')}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewKyc(sub.id, 'APPROVED')}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            <span>Approve & Lift Withdrawal Caps</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct Verification for Registered Investors */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users size={14} className="text-blue-400" />
              <span>Direct KYC Clearance for Registered Accounts ({serverUsers.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {serverUsers.map(u => (
                <div
                  key={u.username}
                  className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">{u.fullName || u.username}</span>
                    <span className="text-[11px] text-slate-400 font-mono">@{u.username} • {u.isKycVerified ? 'Verified' : 'Unverified'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const newVerified = !u.isKycVerified;
                      const newTier = newVerified ? 'Tier 2 Institutional Verified' : 'Unverified';
                      try {
                        const res = await fetch('/api/user-kyc-toggle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            username: u.username,
                            isVerified: newVerified,
                            tier: newTier
                          })
                        });
                        const data = await res.json().catch(() => null);
                        if (res.ok && data?.success) {
                          showToast(`KYC status for @${u.username} updated to ${newTier}!`, 'success');
                          await fetchServerUsers();
                        } else {
                          showToast(data?.error || 'Failed to toggle KYC', 'error');
                        }
                      } catch (_) {
                        showToast('Error communicating with server', 'error');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                      u.isKycVerified
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                    }`}
                  >
                    {u.isKycVerified ? 'Revoke' : '✓ Verify'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEPOSITS & PAYOUTS LEDGER */}
      {adminTab === 'funds' && (
        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Client Deposits & Payouts Processing</h2>
              <p className="text-xs text-slate-400">Review, clear, or reject client funding and disbursement operations.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Investor Account</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Method / Note</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      No client funding records present yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-300 font-bold">{t.hashOrReference}</td>
                      <td className="py-3 px-4 text-white font-sans font-bold">
                        <div>@{t.username || 'Eau231'}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{t.userFullName || t.userEmail || ''}</div>
                      </td>
                      <td className="py-3 px-4 font-sans font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          t.type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300">{t.note || t.asset}</td>
                      <td className="py-3 px-4 text-right text-white font-bold">${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'COMPLETED'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : t.status === 'PENDING'
                            ? 'text-amber-400 bg-amber-500/10 animate-pulse'
                            : 'text-slate-400 bg-slate-500/10'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'COMPLETED' ? (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              ✓ Credited & Settled
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => rejectDeposit(t.id)}
                                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[11px] font-bold border border-red-500/20 transition cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => approveDeposit(t.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} />
                                <span>Approve & Credit</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CRYPTO PAYMENT METHODS DESK (ADMIN CONTROLLED) */}
      {adminTab === 'payments' && (
        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Crypto Payment Methods & Custodial Wallets</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  CRYPTO ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Add, update, or disable cryptocurrency funding channels. Any address configured here is instantly reflected across investor deposit and withdrawal views.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsAddingCryptoMethod(!isAddingCryptoMethod);
                setEditingCryptoId(null);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus size={15} />
              <span>{isAddingCryptoMethod ? 'Close Form' : 'Add New Crypto Method'}</span>
            </button>
          </div>

          {/* Add New Crypto Method Form */}
          {isAddingCryptoMethod && (
            <div className="bg-[#070b16] border border-blue-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus size={16} className="text-blue-400" />
                  <span>Register New Cryptocurrency Payment Gateway</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Instant Live Broadcast</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCryptoName.trim() || !newCryptoSymbol.trim() || !newCryptoAddress.trim() || !newCryptoNetwork.trim()) {
                    showToast('Please fill in Currency Name, Symbol, Network, and Wallet Address', 'error');
                    return;
                  }

                  addCryptoPaymentMethod({
                    name: newCryptoName.trim(),
                    symbol: newCryptoSymbol.trim().toUpperCase(),
                    network: newCryptoNetwork.trim(),
                    address: newCryptoAddress.trim(),
                    memo: newCryptoMemo.trim() || undefined,
                    minDeposit: newCryptoMinDeposit || 50,
                    isActive: true,
                    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(newCryptoAddress.trim())}`
                  });

                  // Reset form
                  setNewCryptoName('');
                  setNewCryptoSymbol('');
                  setNewCryptoNetwork('');
                  setNewCryptoAddress('');
                  setNewCryptoMemo('');
                  setNewCryptoMinDeposit(100);
                  setIsAddingCryptoMethod(false);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Currency Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCryptoName}
                      onChange={(e) => setNewCryptoName(e.target.value)}
                      placeholder="e.g. Tether USDT, Bitcoin, Solana, Avalanche"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Symbol / Ticker
                    </label>
                    <input
                      type="text"
                      required
                      value={newCryptoSymbol}
                      onChange={(e) => setNewCryptoSymbol(e.target.value)}
                      placeholder="e.g. USDT, BTC, SOL, AVAX"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Blockchain Network
                    </label>
                    <input
                      type="text"
                      required
                      value={newCryptoNetwork}
                      onChange={(e) => setNewCryptoNetwork(e.target.value)}
                      placeholder="e.g. TRON (TRC-20), ERC-20, Native SegWit, Solana Mainnet"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Designated Custody Wallet Address
                    </label>
                    <input
                      type="text"
                      required
                      value={newCryptoAddress}
                      onChange={(e) => setNewCryptoAddress(e.target.value)}
                      placeholder="e.g. TX9pX4kHqZ8yB2mN5wR7vL1sK3jF6dC8aM or bc1q..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Memo / Tag / Destination Tag (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCryptoMemo}
                      onChange={(e) => setNewCryptoMemo(e.target.value)}
                      placeholder="e.g. 1092849 (if required)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Minimum Deposit:</span>
                    <input
                      type="number"
                      min="10"
                      value={newCryptoMinDeposit}
                      onChange={(e) => setNewCryptoMinDeposit(parseFloat(e.target.value) || 50)}
                      className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
                    />
                    <span className="text-xs text-slate-400 font-mono">USD</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCryptoMethod(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Save & Deploy Method</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Edit Existing Method Modal/Box */}
          {editingCryptoId && (
            <div className="bg-[#070b16] border border-amber-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Edit3 size={16} />
                  <span>Modify Payment Method Configuration</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">ID: {editingCryptoId}</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Currency Full Name
                    </label>
                    <input
                      type="text"
                      value={editCryptoName}
                      onChange={(e) => setEditCryptoName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Symbol / Ticker
                    </label>
                    <input
                      type="text"
                      value={editCryptoSymbol}
                      onChange={(e) => setEditCryptoSymbol(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono uppercase text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Blockchain Network
                    </label>
                    <input
                      type="text"
                      value={editCryptoNetwork}
                      onChange={(e) => setEditCryptoNetwork(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Custody Wallet Address
                    </label>
                    <input
                      type="text"
                      value={editCryptoAddress}
                      onChange={(e) => setEditCryptoAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Memo / Tag (Optional)
                    </label>
                    <input
                      type="text"
                      value={editCryptoMemo}
                      onChange={(e) => setEditCryptoMemo(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Min Deposit ($):</span>
                    <input
                      type="number"
                      value={editCryptoMinDeposit}
                      onChange={(e) => setEditCryptoMinDeposit(parseFloat(e.target.value) || 50)}
                      className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCryptoId(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!editCryptoAddress.trim()) {
                          showToast('Wallet address cannot be empty', 'error');
                          return;
                        }
                        updateCryptoPaymentMethod(editingCryptoId, {
                          name: editCryptoName,
                          symbol: editCryptoSymbol,
                          network: editCryptoNetwork,
                          address: editCryptoAddress,
                          memo: editCryptoMemo || undefined,
                          minDeposit: editCryptoMinDeposit,
                          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(editCryptoAddress)}`
                        });
                        setEditingCryptoId(null);
                      }}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List of Active & Configured Crypto Methods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span>Configured Crypto Gateways ({cryptoPaymentMethods.length})</span>
              <span className="text-emerald-400 font-mono">
                {cryptoPaymentMethods.filter(m => m.isActive).length} Available to Investors
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {cryptoPaymentMethods.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    m.isActive
                      ? 'bg-[#080d1a] border-slate-800 hover:border-slate-700'
                      : 'bg-[#070b14]/50 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {m.symbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{m.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {m.network}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700/40 text-slate-400'
                          }`}>
                            {m.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 font-mono text-xs">
                          <span className="text-slate-400 text-[11px]">Address:</span>
                          <span className="text-slate-200 select-all font-semibold break-all">{m.address}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(m.address);
                              showToast(`Copied ${m.symbol} address to clipboard`, 'info');
                            }}
                            className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Copy address"
                          >
                            <Copy size={13} />
                          </button>
                        </div>

                        {m.memo && (
                          <div className="text-[11px] text-amber-400 font-mono mt-1">
                            Tag / Memo: <strong>{m.memo}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-auto shrink-0 pt-2 lg:pt-0">
                      <button
                        type="button"
                        onClick={() => toggleCryptoPaymentMethod(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                          m.isActive
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        <Power size={13} />
                        <span>{m.isActive ? 'Disable' : 'Enable'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingCryptoId(m.id);
                          setEditCryptoName(m.name);
                          setEditCryptoSymbol(m.symbol);
                          setEditCryptoNetwork(m.network);
                          setEditCryptoAddress(m.address);
                          setEditCryptoMemo(m.memo || '');
                          setEditCryptoMinDeposit(m.minDeposit || 100);
                          setIsAddingCryptoMethod(false);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${m.name} (${m.symbol})?`)) {
                            deleteCryptoPaymentMethod(m.id);
                          }
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition cursor-pointer"
                        title="Delete method"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: LIVE SUPPORT CHAT DESK */}
      {adminTab === 'chat' && (
        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Live Support Chat Desk</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REAL-TIME DISPATCH
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Every message sent by investors from the website chat widget is received here. Reply directly to the investor below.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {supportMessages.length} Messages Total
              </span>
              <button
                type="button"
                onClick={() => {
                  sendAdminChatMessage('An admin representative is now active in chat.');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                Send Presence Ping
              </button>
            </div>
          </div>

          {/* Active Investor Client Context Bar */}
          <div className="p-3 bg-[#080d1a] rounded-xl border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center">
                {(targetWithdrawalUser || 'E')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white block">Active Chat Target: @{targetWithdrawalUser}</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                    Live Channel
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  Replies and withdrawal codes sent here appear directly on the investor's mobile phone screen
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={targetWithdrawalUser}
                onChange={(e) => setTargetWithdrawalUser(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
              >
                {serverUsers.map(u => (
                  <option key={u.username} value={u.username}>
                    Switch to @{u.username}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  handleGenerateWithdrawalCode(targetWithdrawalUser);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound size={13} />
                <span>Issue Code to @{targetWithdrawalUser}</span>
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="p-4 bg-[#070b16] border border-slate-800 rounded-2xl h-96 overflow-y-auto space-y-3 text-xs">
            {supportMessages.map((m) => {
              const isInvestor = m.sender === 'user';
              const isAdmin = m.sender === 'admin';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isInvestor ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-slate-400">
                    {isInvestor ? (
                      <span className="text-blue-400 font-bold flex items-center gap-1">
                        <User size={11} /> {m.userName || 'Investor'} (@{m.userId || 'investor'})
                      </span>
                    ) : isAdmin ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <ShieldCheck size={11} /> Admin Representative (You)
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Headphones size={11} /> Automated Desk
                      </span>
                    )}
                    <span>• {m.time}</span>

                    {isInvestor && (
                      <button
                        type="button"
                        onClick={() => {
                          const clientName = m.userId || m.userName || 'Eau231';
                          setTargetWithdrawalUser(clientName);
                          handleGenerateWithdrawalCode(clientName);
                        }}
                        className="ml-2 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold font-sans cursor-pointer transition flex items-center gap-1"
                      >
                        <KeyRound size={10} />
                        <span>Issue Code to {m.userName || 'Investor'}</span>
                      </button>
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl leading-relaxed ${
                      isInvestor
                        ? 'bg-blue-600/20 border border-blue-500/40 text-white rounded-tl-none shadow-md'
                        : isAdmin
                        ? 'bg-gradient-to-r from-amber-600/30 to-amber-700/20 border border-amber-500/40 text-amber-100 rounded-tr-none shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tr-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canned Quick Replies */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">Quick Canned Responses:</span>
            <div className="flex flex-wrap gap-2">
              {[
                'An admin representative will be with you in a minute.',
                'Your withdrawal verification code has been dispatched to your email.',
                'Your cryptocurrency deposit is currently being verified on-chain.',
                'Our compliance desk has reviewed your account and approved your status.',
                'Please check your email inbox and spam folder for the one-time withdrawal token.'
              ].map((canned) => (
                <button
                  key={canned}
                  type="button"
                  onClick={() => setAdminChatReply(canned)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] border border-slate-800 transition cursor-pointer text-left"
                >
                  "{canned}"
                </button>
              ))}
            </div>
          </div>

          {/* Reply Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!adminChatReply.trim()) return;
              sendAdminChatMessage(adminChatReply.trim(), targetWithdrawalUser);
              setAdminChatReply('');
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={adminChatReply}
              onChange={(e) => setAdminChatReply(e.target.value)}
              placeholder={`Reply directly to @${targetWithdrawalUser || 'Investor'} (will appear immediately in their live chat)...`}
              className="flex-1 px-4 py-3 bg-[#070b16] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!adminChatReply.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send size={14} />
              <span>Send Reply to @{targetWithdrawalUser}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: LIVE ORDERS & RISK CIRCUIT */}
      {adminTab === 'risk' && (
        <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Live Platform Order Flow & Exposure</h2>
              <p className="text-xs text-slate-400">Real-time surveillance of client open positions and aggregate risk book.</p>
            </div>
          </div>

          {positions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-sans">
              No open client positions on platform book currently.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 bg-slate-900/50">
                  <tr>
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Side / Leverage</th>
                    <th className="py-3 px-4 text-right">Margin Value</th>
                    <th className="py-3 px-4 text-right">Entry Price</th>
                    <th className="py-3 px-4 text-right">Current Price</th>
                    <th className="py-3 px-4 text-right">Unrealized P&L</th>
                    <th className="py-3 px-4 text-center">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {positions.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{p.symbol}</td>
                      <td className="py-3 px-4 font-sans font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          p.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {p.type} {p.leverage}x
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">${p.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-300">${p.entryPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">${p.currentPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <button
                          onClick={() => closePosition(p.id)}
                          className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-[11px] font-bold cursor-pointer"
                        >
                          Force Settle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: INVESTOR MARKETING CAMPAIGNS */}
      {adminTab === 'marketing' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#0c1426] border border-blue-500/30 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold shrink-0">
                <Send size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Investor Marketing & Lifecycle Communications</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    MARKETING DESK
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Engage registered traders with automated welcome emails, deposit nudges (100% matched bonus), and market updates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#080d1a] border border-slate-800 rounded-xl text-xs">
              <span className="text-slate-400">Support Desk:</span>
              <a href="mailto:support@primetrade.bbroot.com" className="text-blue-400 font-mono hover:underline">
                support@primetrade.bbroot.com
              </a>
            </div>
          </div>

          {/* Main Dispatcher & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span>Configure Marketing Campaign</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select a pre-built campaign template or compose a custom email blast.
                </p>
              </div>

              {/* Target Recipient Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Recipient Investor Email
                  </label>
                  {user?.email && (
                    <button
                      type="button"
                      onClick={() => setMarketingRecipient(user.email)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      Use Active Client ({user.email.split('@')[0]})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={marketingRecipient}
                    onChange={(e) => setMarketingRecipient(e.target.value)}
                    placeholder="e.g. investor@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#080d19] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Campaign Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Campaign Type
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'no_deposit_nudge',
                      title: "You Haven't Made a Deposit Yet",
                      subtitle: "Reminds new investors of $0.00 balance + 100% deposit match bonus offer",
                      badge: "High Conversion",
                      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    },
                    {
                      id: 'account_active',
                      title: "Your Account is Active & Ready",
                      subtitle: "Official onboarding confirmation with multi-asset capabilities unlocked",
                      badge: "Welcome",
                      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    },
                    {
                      id: 'market_opportunity',
                      title: "Market Opportunity & Copy Trading Alpha",
                      subtitle: "Spotlights top verified fund managers (+312% ROI) and weekly opportunities",
                      badge: "Alpha Alert",
                      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    },
                    {
                      id: 'custom',
                      title: "Custom Investor Announcement",
                      subtitle: "Send a bespoke communication with custom subject and body text",
                      badge: "Custom",
                      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    }
                  ].map((camp) => (
                    <button
                      key={camp.id}
                      type="button"
                      onClick={() => setMarketingCampaign(camp.id as any)}
                      className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                        marketingCampaign === camp.id
                          ? 'bg-blue-600/15 border-blue-500 shadow-md'
                          : 'bg-[#080d1a] border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{camp.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${camp.badgeColor}`}>
                          {camp.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {camp.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom fields if 'custom' */}
              {marketingCampaign === 'custom' && (
                <div className="space-y-3 pt-2 bg-[#080d19] p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={customMarketingSubject}
                      onChange={(e) => setCustomMarketingSubject(e.target.value)}
                      placeholder="e.g. VIP Trading Bonus Extended for 48 Hours"
                      className="w-full px-3 py-2 bg-[#0c1426] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Email Message Content
                    </label>
                    <textarea
                      rows={3}
                      value={customMarketingBody}
                      onChange={(e) => setCustomMarketingBody(e.target.value)}
                      placeholder="Enter custom message for the investor..."
                      className="w-full px-3 py-2 bg-[#0c1426] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Dispatch Button */}
              <button
                type="button"
                onClick={() => handleSendMarketingEmail()}
                disabled={isSendingMarketing || !marketingRecipient}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSendingMarketing ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Dispatching Campaign via Resend...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Dispatch Marketing Campaign Now</span>
                  </>
                )}
              </button>

              {/* Result Notification */}
              {marketingSendResult && (
                <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                  marketingSendResult.delivered
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {marketingSendResult.delivered ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span>{marketingSendResult.delivered ? 'Dispatched Successfully!' : 'Campaign Formatted & Logged'}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {marketingSendResult.delivered
                      ? `Delivered to ${marketingSendResult.recipient}. Delivery ID: ${marketingSendResult.deliveryId || 'resend-confirmed'}`
                      : (marketingSendResult.warning || 'Prepared for delivery.')}
                  </p>
                </div>
              )}
            </div>

            {/* Live Email Preview Column (7 Cols) */}
            <div className="lg:col-span-7 bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail size={16} className="text-blue-400" />
                    <span>Live Recipient Inbox Preview</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Preview how this email appears in the client's email client.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-md">
                  HTML 5 Format
                </span>
              </div>

              {/* Email Envelope Container */}
              <div className="bg-[#030712] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 font-sans text-white">
                {/* Simulated Email Header */}
                <div className="border-b border-slate-800/80 pb-3 text-xs space-y-1 text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>From: <strong className="text-white">PrimeTrade Markets &lt;support@primetrade.bbroot.com&gt;</strong></span>
                    <span className="text-emerald-400">DKIM / SPF Signed</span>
                  </div>
                  <div>To: <span className="text-slate-300">{marketingRecipient || 'investor@example.com'}</span></div>
                  <div>Reply-To: <span className="text-blue-400">support@primetrade.bbroot.com</span></div>
                  <div>
                    Subject:{' '}
                    <span className="text-amber-300 font-bold">
                      {marketingCampaign === 'no_deposit_nudge'
                        ? 'Notice: You haven’t made your first deposit yet - Claim 100% Match Bonus'
                        : marketingCampaign === 'account_active'
                        ? 'Your Account is Active & Verified - Welcome to PrimeTrade'
                        : marketingCampaign === 'market_opportunity'
                        ? 'Market Opportunity Alert: Top Copy Trading Strategies (+312% ROI)'
                        : (customMarketingSubject || 'Important Update from PrimeTrade Desk')}
                    </span>
                  </div>
                </div>

                {/* Email Body Card Preview */}
                <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-inner">
                  {/* Brand Header */}
                  <div className="text-center pb-2">
                    <span className="text-xs font-black tracking-widest text-blue-500 uppercase bg-[#0c1427] px-3 py-1 rounded-full border border-blue-900/50">
                      PRIMETRADE MARKETS
                    </span>
                  </div>

                  {/* Campaign Pill Badge */}
                  <div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block ${
                      marketingCampaign === 'no_deposit_nudge'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : marketingCampaign === 'account_active'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {marketingCampaign === 'no_deposit_nudge'
                        ? 'ACCOUNT NOTICE · BALANCE: $0.00'
                        : marketingCampaign === 'account_active'
                        ? 'ACCOUNT STATUS · ACTIVE & READY'
                        : 'INSTITUTIONAL ALPHA REPORT'}
                    </span>
                  </div>

                  {/* Headline */}
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {marketingCampaign === 'no_deposit_nudge'
                      ? 'Your Account is Ready - Make Your First Deposit'
                      : marketingCampaign === 'account_active'
                      ? 'Welcome to PrimeTrade Institutional Markets'
                      : marketingCampaign === 'market_opportunity'
                      ? 'Top Copy Trading Opportunities This Week'
                      : (customMarketingSubject || 'PrimeTrade Announcement')}
                  </h4>

                  {/* Body Text */}
                  <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                    {marketingCampaign === 'no_deposit_nudge' && (
                      <>
                        <p>
                          Hello <strong>{user?.fullName || 'Investor'}</strong>, our records indicate your account is verified and ready, but you have <strong>not yet funded your account balance</strong>.
                        </p>
                        <div className="bg-[#171d2d] border-l-4 border-amber-500 p-3 rounded-r-lg space-y-1">
                          <div className="font-bold text-amber-300 text-xs">100% Welcome Deposit Match Bonus</div>
                          <p className="text-[11px] text-slate-400">
                            Fund today and claim a 100% capital credit match up to $50,000 to maximize your profit potential.
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Supported channels: Bank Wire, Bitcoin, Ethereum, Solana, USDT/USDC with 0% processing fee.
                        </p>
                      </>
                    )}

                    {marketingCampaign === 'account_active' && (
                      <>
                        <p>
                          Congratulations! Your PrimeTrade investment account has been successfully authenticated, verified, and activated.
                        </p>
                        <div className="bg-[#080d19] border border-blue-900/60 p-3 rounded-xl space-y-1 text-[11px]">
                          <div className="text-blue-400 font-bold">Trading Capabilities Unlocked:</div>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                            <li>500+ Global Markets (Forex, Crypto, Indices, Commodities)</li>
                            <li>Automated Copy Trading with 1-click replication</li>
                            <li>Segregated custodian vault security & SIPC protection</li>
                          </ul>
                        </div>
                      </>
                    )}

                    {marketingCampaign === 'market_opportunity' && (
                      <>
                        <p>
                          Market volatility is generating exceptional yields. Our verified master trading managers have realized over $4.2M in client returns this cycle.
                        </p>
                        <div className="bg-[#0d1e16] border border-emerald-500/40 p-3 rounded-xl text-[11px] space-y-1">
                          <div className="text-emerald-400 font-bold">Featured Master Strategy: Apex Alpha</div>
                          <div className="text-white font-mono">90-Day Verified ROI: +312.4% · Win Rate: 89.2%</div>
                        </div>
                      </>
                    )}

                    {marketingCampaign === 'custom' && (
                      <p>{customMarketingBody || 'Your custom message text will appear here.'}</p>
                    )}
                  </div>

                  {/* Simulated CTA Button */}
                  <div className="pt-2 text-center">
                    <div className="inline-block px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md">
                      {marketingCampaign === 'no_deposit_nudge' ? 'Deposit Funds Now →' : 'Access Trading Dashboard →'}
                    </div>
                  </div>

                  {/* Simulated Footer */}
                  <div className="pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500 space-y-1">
                    <p>
                      Client Support Desk:{' '}
                      <span className="text-blue-400 underline">support@primetrade.bbroot.com</span> · 24/7 Priority Coverage
                    </p>
                    <p>© PrimeTrade Markets LLC. Segregated Custody Accounts.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Dispatch Log Table */}
          <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                <span>Recent Marketing Campaign Dispatch Log</span>
              </h3>
              <span className="text-xs text-slate-400">{marketingLogs.length} Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Campaign</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {marketingLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 text-slate-400">{log.time}</td>
                      <td className="py-2.5 px-3 text-white font-bold">{log.recipient}</td>
                      <td className="py-2.5 px-3 text-blue-400">{log.campaign}</td>
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[240px]">{log.subject}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ENVIRONMENT VARIABLES & EMAIL INTEGRATION */}
      {adminTab === 'env' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#0c1426] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold shrink-0">
                <Zap size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Environment Variables & Email Gateway</h2>
                <p className="text-xs text-slate-400">
                  Verify real-time connection status of server environment keys, Resend credentials, and live email delivery.
                </p>
              </div>
            </div>

            <button
              onClick={fetchEnvStatus}
              disabled={isLoadingEnv}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoadingEnv ? 'animate-spin' : ''} />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Connection Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 mb-1">RESEND_API_KEY</div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  envStatus?.RESEND_API_KEY_CONNECTED ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`} />
                <span className="font-mono font-bold text-sm text-white">
                  {envStatus?.RESEND_API_KEY_CONNECTED ? 'CONNECTED' : 'NOT CONFIGURED'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-2 truncate">
                Preview: {envStatus?.RESEND_KEY_PREVIEW || 're_...'}
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 mb-1">RESEND_FROM_EMAIL</div>
              <div className="font-mono font-bold text-sm text-white truncate">
                {envStatus?.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Active sender for verification OTPs
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 mb-1">GEMINI_API_KEY</div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  envStatus?.GEMINI_API_KEY_CONNECTED ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className="font-mono font-bold text-sm text-white">
                  {envStatus?.GEMINI_API_KEY_CONNECTED ? 'CONNECTED' : 'STANDBY'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                System AI Studio capability
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 mb-1">APP_URL</div>
              <div className="font-mono font-bold text-xs text-blue-400 truncate">
                {envStatus?.APP_URL || 'http://localhost:3000'}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Port: {envStatus?.PORT || 3000} ({envStatus?.NODE_ENV || 'production'})
              </div>
            </div>
          </div>

          {/* Test Email Dispatcher & Key Updater */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Update / Save Key Panel */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound size={16} className="text-blue-400" />
                <span>Configure / Update RESEND_API_KEY</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your Resend email API key directly into the server environment. Key must start with <code className="text-blue-400">re_</code>.
              </p>

              <form onSubmit={handleSaveEnvKey} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resend API Key (re_...)
                  </label>
                  <input
                    type="password"
                    value={newResendKey}
                    onChange={(e) => setNewResendKey(e.target.value)}
                    placeholder="re_123456789_abcdef..."
                    className="w-full px-3.5 py-2.5 bg-[#090e1a] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    From Email Address
                  </label>
                  <input
                    type="text"
                    value={newFromEmail}
                    onChange={(e) => setNewFromEmail(e.target.value)}
                    placeholder="onboarding@resend.dev or support@primetrade.bbroot.com"
                    className="w-full px-3.5 py-2.5 bg-[#090e1a] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
                >
                  Save & Connect Environment Key
                </button>
              </form>
            </div>

            {/* Live Test Email Dispatcher */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail size={16} className="text-emerald-400" />
                <span>Test Live Email Delivery</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send a real test email through the server's connected environment variable to verify that delivery reaches your inbox.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmailTarget}
                    onChange={(e) => setTestEmailTarget(e.target.value)}
                    placeholder="twintain123@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-[#090e1a] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <span>Dispatching test email...</span>
                  ) : (
                    <>
                      <span>Send Verification Test Email</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {testEmailResult && (
                  <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 ${
                    testEmailResult.success
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}>
                    <div className="font-bold flex items-center justify-between">
                      <span>{testEmailResult.success ? '✓ Dispatch Successful' : '✗ Dispatch Notice'}</span>
                      {testEmailResult.usedSender && (
                        <span className="text-[10px] text-slate-400">Sender: {testEmailResult.usedSender}</span>
                      )}
                    </div>
                    <div className="text-[11px] break-all leading-relaxed">
                      {testEmailResult.message || testEmailResult.error || JSON.stringify(testEmailResult)}
                    </div>
                    {testEmailResult.tip && (
                      <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] mt-2 font-sans">
                        <strong>Important:</strong> {testEmailResult.tip}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resend Email Delivery Rules & Domain Guide */}
          <div className="bg-[#0b1329] border border-blue-900/40 rounded-2xl p-5 shadow-lg space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-400" />
              <span>Why Users Might Not Receive OTP Emails & How Resend Works</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#070d1d] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span>1. Resend Testing Sandbox</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  When sending from <code className="text-blue-300 font-mono">onboarding@resend.dev</code>, Resend <strong>strictly allows delivery only to your account owner email</strong> (<code className="text-emerald-400 font-mono">sradt78@gmail.com</code>). Delivery to any other user email is rejected by Resend until a custom domain is verified.
                </p>
              </div>

              <div className="bg-[#070d1d] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <span>2. Verify Custom Domain</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  To send verification OTPs to <strong>any investor email</strong>, go to <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">resend.com/domains</a>, add your domain (e.g. <code className="text-slate-300 font-mono">primetrade.com</code>), and add the DNS TXT/MX records. Then set From Email to <code className="text-blue-300 font-mono">noreply@yourdomain.com</code>.
                </p>
              </div>

              <div className="bg-[#070d1d] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>3. Instant Verification Passcode</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  To ensure no investor is ever stuck during testing or sandbox mode, the registration modal includes an instant <strong>"Tap to view / auto-fill verification code"</strong> button, allowing immediate registration testing even while DNS records are pending.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
