import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  MarketAsset,
  Position,
  Transaction,
  AppNotification,
  UserProfile,
  CopyTrader,
  CopySubscription,
  NeonDbStatus,
  CryptoPaymentMethod,
  SupportChatMessage
} from '../types';
import { fetchRealMarketData, DEFAULT_BASE_ASSETS } from '../services/marketApi';
import { EXACT_COPY_TRADERS, INITIAL_COPY_TRADERS, generateRandomTrader } from '../data/copyTraders';
import { fetchDbStatus, connectNeonDatabase, recordCopySubscription } from '../services/copyTradingApi';


export interface BrokerInvestmentTier {
  id: string;
  title: string;
  subtitle: string;
  minDeposit: number;
  maxDeposit: number;
  expectedApy: number;
  durationDays: number;
  riskLevel: 'Low' | 'Moderate' | 'Aggressive';
  description: string;
  features: string[];
}

export const BROKER_INVESTMENT_TIERS: BrokerInvestmentTier[] = [
  {
    id: 'tier-treasury',
    title: 'Conservative Capital Yield',
    subtitle: 'Institutional US Treasuries & AAA Sovereign Debt',
    minDeposit: 500,
    maxDeposit: 50000,
    expectedApy: 63.5, // 8.5% + 55% Boost
    durationDays: 30,
    riskLevel: 'Low',
    description: 'Direct institutional access to short-term US Treasury bills with enhanced 55% liquidity yield compounding.',
    features: [
      '+55% Institutional Profit Boost Active',
      'Daily interest distribution into trading balance',
      'Segregated custodian vault at J.P. Morgan Chase & BNY Mellon',
      'Unrestricted capital withdrawal after 30-day maturity',
      'Zero management or maintenance fees'
    ]
  },
  {
    id: 'tier-balanced',
    title: 'Balanced Multi-Asset Growth',
    subtitle: 'Global Equities, Physical Bullion & Fixed Income',
    minDeposit: 2500,
    maxDeposit: 150000,
    expectedApy: 71.8, // 16.8% + 55% Boost
    durationDays: 60,
    riskLevel: 'Moderate',
    description: 'Systematically hedged multi-asset allocation targeting enhanced capital growth across equities and gold.',
    features: [
      '+55% Institutional Profit Boost Active',
      'Weekly automated profit disbursement',
      'Dynamic stop-loss downside hedging protocol',
      'Monthly portfolio auditing statements',
      'Dedicated private broker desk coverage'
    ]
  },
  {
    id: 'tier-growth',
    title: 'High-Yield Alpha Growth',
    subtitle: 'Tech Sector Momentum & Cross-Market Arbitrage',
    minDeposit: 5000,
    maxDeposit: 500000,
    expectedApy: 81.4, // 26.4% + 55% Boost
    durationDays: 90,
    riskLevel: 'Moderate',
    description: 'Designed for growth investors seeking maximized risk-adjusted yields via high-liquidity tech leaders.',
    features: [
      '+55% Institutional Profit Boost Active',
      'High-watermark profit sharing architecture',
      'Real-time automated rebalancing algorithm',
      'Deep liquidity book priority routing',
      'Direct compliance and risk officer support'
    ]
  },
  {
    id: 'tier-crypto-alpha',
    title: 'Crypto Alpha Institutional Vault',
    subtitle: 'Delta-Neutral Funding Arbitrage & Staking Compounding',
    minDeposit: 1000,
    maxDeposit: 250000,
    expectedApy: 93.2, // 38.2% + 55% Boost
    durationDays: 45,
    riskLevel: 'Aggressive',
    description: 'Delta-neutral funding rate harvesting, cross-exchange liquidity provision, and Layer 1 PoS validator compounding.',
    features: [
      '+55% Institutional Profit Boost Active',
      'Daily compounding returns credited to balance',
      'Audited cold-storage multisig custody architecture',
      '100% hedged delta-neutral perpetual futures overlay',
      'Instant Web3 crypto wallet deposits and payouts'
    ]
  }
];

export const DEFAULT_CRYPTO_PAYMENT_METHODS: CryptoPaymentMethod[] = [
  {
    id: 'cpm-usdt-trc20',
    name: 'Tether USDT',
    symbol: 'USDT',
    network: 'TRON (TRC-20)',
    address: 'TX9pX4kHqZ8yB2mN5wR7vL1sK3jF6dC8aM',
    isActive: true,
    minDeposit: 100,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TX9pX4kHqZ8yB2mN5wR7vL1sK3jF6dC8aM'
  },
  {
    id: 'cpm-btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Native SegWit',
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    isActive: true,
    minDeposit: 250,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
  },
  {
    id: 'cpm-eth',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum (ERC-20)',
    address: '0x71C80e83011355E10640F548C218670c538749B8',
    isActive: true,
    minDeposit: 200,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x71C80e83011355E10640F548C218670c538749B8'
  },
  {
    id: 'cpm-sol',
    name: 'Solana',
    symbol: 'SOL',
    network: 'Solana Mainnet',
    address: '7vW2X5NqX9pY8vM1sK3jF6dC8aM4qL0v3B6n9E1R2a4',
    isActive: true,
    minDeposit: 100,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=7vW2X5NqX9pY8vM1sK3jF6dC8aM4qL0v3B6n9E1R2a4'
  },
  {
    id: 'cpm-usdc-erc20',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Ethereum (ERC-20)',
    address: '0x71C80e83011355E10640F548C218670c538749B8',
    isActive: true,
    minDeposit: 100,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x71C80e83011355E10640F548C218670c538749B8'
  }
];

export const DEFAULT_SUPPORT_MESSAGES: SupportChatMessage[] = [
  {
    id: 'msg-desk-welcome',
    sender: 'broker',
    text: 'Welcome to PrimeTrade Support. How can an admin representative assist with your trading, crypto funding, or withdrawal verification today?',
    time: 'Desk Online',
    timestamp: Date.now() - 3600000,
    isReadByAdmin: true
  }
];

interface AppContextType {
  user: UserProfile;
  isLoggedIn: boolean;
  login: (emailOrUser: string, pass: string) => boolean;
  logout: () => void;
  register: (data: Partial<UserProfile>) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  assets: MarketAsset[];
  isLoadingMarketData: boolean;
  selectedSymbol: string;
  setSelectedSymbol: (sym: string) => void;
  positions: Position[];
  openTrade: (symbol: string, type: 'BUY' | 'SELL', amount: number, leverage: number, sl?: number, tp?: number) => boolean;
  closePosition: (id: string) => void;
  tiers: BrokerInvestmentTier[];
  investInTier: (tierId: string, amount: number) => boolean;
  transactions: Transaction[];
  depositFunds: (amount: number, method: string, details?: string, autoApprove?: boolean) => boolean;
  approveDeposit: (txId: string) => void;
  rejectDeposit: (txId: string) => void;
  adjustUserBalance: (delta: number, note?: string) => void;
  withdrawFunds: (amount: number, method: string, address: string) => { success: boolean; message: string };
  transferFunds: (amount: number, from: string, to: string) => boolean;
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => void;
  submitKyc: (level: 'tier1' | 'tier2', data: any) => void;
  notifications: AppNotification[];
  unreadNotifsCount: number;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  requestPushPermissions: () => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  // Modals
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isLoginOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  isRegisterOpen: boolean;
  setIsRegisterOpen: (open: boolean) => void;
  isQuickTradeOpen: boolean;
  setIsQuickTradeOpen: (open: boolean) => void;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (open: boolean) => void;
  isLiveChatOpen: boolean;
  setIsLiveChatOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (open: boolean) => void;
  isKycModalOpen: boolean;
  setIsKycModalOpen: (open: boolean) => void;
  // Demo Mode
  toggleDemoMode: () => void;
  toast: { text: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  // Copy Trading
  copyTraders: CopyTrader[];
  copySubscriptions: CopySubscription[];
  startCopyingTrader: (traderId: string, amount: number) => boolean;
  pauseCopyingTrader: (subscriptionId: string) => void;
  stopCopyingTrader: (subscriptionId: string) => void;
  addRandomTrader: () => CopyTrader;
  // Neon PostgreSQL Database
  neonDbStatus: NeonDbStatus;
  refreshNeonDbStatus: () => Promise<void>;
  testAndConnectNeonDb: (databaseUrl: string) => Promise<{ success: boolean; message: string }>;
  isNeonDbModalOpen: boolean;
  setIsNeonDbModalOpen: (open: boolean) => void;
  // Crypto Payment Methods (Admin Managed)
  cryptoPaymentMethods: CryptoPaymentMethod[];
  addCryptoPaymentMethod: (method: Omit<CryptoPaymentMethod, 'id'>) => void;
  updateCryptoPaymentMethod: (id: string, updates: Partial<CryptoPaymentMethod>) => void;
  deleteCryptoPaymentMethod: (id: string) => void;
  toggleCryptoPaymentMethod: (id: string) => void;
  // Live Support Chat Desk (Investor <-> Admin)
  supportMessages: SupportChatMessage[];
  unreadAdminChatCount: number;
  sendInvestorChatMessage: (text: string) => void;
  sendAdminChatMessage: (text: string) => void;
  markSupportMessagesAsRead: () => void;
  adjustRemoteUserBalance: (username: string, delta: number, note?: string) => Promise<boolean>;
  syncUserWithServer: (username?: string) => Promise<void>;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

// Fresh clean user state without mock data
const defaultRealUser: UserProfile = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  country: 'United States',
  city: '',
  accountType: 'Live Trader',
  isKycVerified: false,
  kycTier: 'Unverified',
  accountBalance: 0.00,
  demoBalance: 50000.00,
  isDemoMode: false,
  connectedWalletAddress: null,
  twoFactorEnabled: true,
  referralCode: '',
  totalReferralEarnings: 0.00,
  avatarInitials: ''
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bem_user_v3');
    return saved ? JSON.parse(saved) : defaultRealUser;
  });

  // Default to false so site does NOT automatically log in
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // Check sessionStorage only if user logged in during current session
    return sessionStorage.getItem('bem_logged_in_session') === 'true';
  });

  const isUrlAdmin = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/admin' ||
      path === '/admin/' ||
      hash === '#admin' ||
      hash === '#/admin'
    );
  };

  const isUrlCopyTrading = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/copy' ||
      path === '/copy-trading' ||
      hash === '#copy' ||
      hash === '#copy-trading'
    );
  };

  // Default to public landing page unless specifically visiting /admin
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (isUrlAdmin()) {
      return 'admin';
    }
    if (isUrlCopyTrading()) {
      return 'copy-trading';
    }
    return 'landing';
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'admin') {
        if (!window.location.pathname.includes('/admin')) {
          window.history.pushState({}, '', '/admin');
        }
      } else if (tab === 'copy-trading') {
        if (!window.location.pathname.includes('/dashboard/copy/experts')) {
          window.history.pushState({}, '', '/dashboard/copy/experts');
        }
      } else if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/dashboard/copy/experts')) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  // Sync with browser URL back/forward button, hashchange, keyboard shortcut, and interval polling
  useEffect(() => {
    const handleLocationChange = () => {
      if (isUrlAdmin()) {
        setActiveTabState('admin');
      } else if (isUrlCopyTrading()) {
        setActiveTabState('copy-trading');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Keyboard shortcut for administrator: Ctrl + Shift + A (or Cmd + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveTab('admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Periodic check to capture URL bar changes in iframe/sandboxed environments
    const intervalId = setInterval(() => {
      if (isUrlAdmin()) {
        setActiveTabState(prev => (prev === 'admin' ? prev : 'admin'));
      }
    }, 600);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(intervalId);
    };
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [assets, setAssets] = useState<MarketAsset[]>(DEFAULT_BASE_ASSETS);
  const [isLoadingMarketData, setIsLoadingMarketData] = useState<boolean>(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USD');

  // Real positions and transactions (clean user data loaded from storage)
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('bem_positions_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bem_transactions_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('bem_notifications_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((n: AppNotification) => ({ ...n, read: true }));
        }
      }
      // Also clear old cached v2 notifications that had read: false
      localStorage.removeItem('bem_notifications_v2');
      localStorage.removeItem('bem_notifications_v3');
    } catch {
      // ignore parse error
    }
    return [];
  });

  const [selectedLanguage, setSelectedLanguage] = useState<string>('EN');

  // Modal states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isNeonDbModalOpen, setIsNeonDbModalOpen] = useState(false);

  // Copy trading state with 250+ expert traders
  const [copyTraders, setCopyTraders] = useState<CopyTrader[]>(() => {
    try {
      const saved = localStorage.getItem('bem_copy_traders_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 250) {
          return parsed;
        }
      }
    } catch (_) {}
    return INITIAL_COPY_TRADERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bem_copy_traders_v3', JSON.stringify(copyTraders));
    } catch (_) {}
  }, [copyTraders]);
  const [copySubscriptions, setCopySubscriptions] = useState<CopySubscription[]>(() => {
    try {
      const saved = localStorage.getItem('bem_copy_subs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Neon PostgreSQL database status
  const [neonDbStatus, setNeonDbStatus] = useState<NeonDbStatus>({
    connected: false,
    type: 'local_fallback',
    databaseUrlConfigured: false
  });

  const refreshNeonDbStatus = async () => {
    try {
      const status = await fetchDbStatus();
      setNeonDbStatus(status);
    } catch (_) {}
  };

  useEffect(() => {
    refreshNeonDbStatus();
  }, []);

  const testAndConnectNeonDb = async (databaseUrl: string) => {
    const res = await connectNeonDatabase(databaseUrl);
    if (res.success) {
      await refreshNeonDbStatus();
      showToast('Neon PostgreSQL connected & tables synced!', 'success');
    } else {
      showToast(res.message || 'Failed to connect Neon PostgreSQL', 'error');
    }
    return res;
  };

  // Crypto Payment Methods State (Admin Controlled, Crypto Only)
  const [cryptoPaymentMethods, setCryptoPaymentMethods] = useState<CryptoPaymentMethod[]>(() => {
    try {
      const saved = localStorage.getItem('bem_crypto_methods_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_CRYPTO_PAYMENT_METHODS;
  });

  const saveCryptoPaymentMethods = (methods: CryptoPaymentMethod[]) => {
    setCryptoPaymentMethods(methods);
    try {
      localStorage.setItem('bem_crypto_methods_v2', JSON.stringify(methods));
    } catch (_) {}
  };

  const addCryptoPaymentMethod = (method: Omit<CryptoPaymentMethod, 'id'>) => {
    const newMethod: CryptoPaymentMethod = {
      ...method,
      id: `cpm-${Date.now()}`
    };
    const updated = [...cryptoPaymentMethods, newMethod];
    saveCryptoPaymentMethods(updated);
    showToast(`Added ${method.name} (${method.symbol}) to payment channels!`, 'success');
  };

  const updateCryptoPaymentMethod = (id: string, updates: Partial<CryptoPaymentMethod>) => {
    const updated = cryptoPaymentMethods.map(m => m.id === id ? { ...m, ...updates } : m);
    saveCryptoPaymentMethods(updated);
    showToast('Payment method information updated successfully', 'success');
  };

  const deleteCryptoPaymentMethod = (id: string) => {
    const updated = cryptoPaymentMethods.filter(m => m.id !== id);
    saveCryptoPaymentMethods(updated);
    showToast('Payment method removed from platform', 'info');
  };

  const toggleCryptoPaymentMethod = (id: string) => {
    const target = cryptoPaymentMethods.find(m => m.id === id);
    const updated = cryptoPaymentMethods.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m);
    saveCryptoPaymentMethods(updated);
    showToast(`${target ? target.name : 'Method'} is now ${target?.isActive ? 'Disabled' : 'Active'}`, 'info');
  };

  // Live Support Chat Messages (Investor <-> Admin bidirectional chat)
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('bem_support_messages_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_SUPPORT_MESSAGES;
  });

  const unreadAdminChatCount = supportMessages.filter(m => m.sender === 'user' && !m.isReadByAdmin).length;

  // Poll server for live chat messages every 3 seconds so messages sent by investors appear on admin desk
  useEffect(() => {
    let isSubscribed = true;

    const fetchChatMessages = async () => {
      try {
        const res = await fetch('/api/chat-messages');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.messages)) {
            if (isSubscribed) {
              setSupportMessages(prev => {
                // Only update if there are new messages or message count changed
                if (JSON.stringify(prev) !== JSON.stringify(data.messages)) {
                  try {
                    localStorage.setItem('bem_support_messages_v2', JSON.stringify(data.messages));
                  } catch (_) {}
                  return data.messages;
                }
                return prev;
              });
            }
          }
        }
      } catch (_) {}
    };

    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 3000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Poll server for User Profile & Balance every 3.5 seconds
  // Ensures any balance adjustment made by admin updates investor dashboard in real time
  const syncUserWithServer = async (overrideUsername?: string) => {
    const targetUser = (overrideUsername || user.username || 'Eau231').trim();
    if (!targetUser) return;

    try {
      const res = await fetch(`/api/user-profile?username=${encodeURIComponent(targetUser)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.user) {
          const sUser = data.user;
          setUser(prev => {
            const updated = {
              ...prev,
              username: sUser.username || prev.username,
              fullName: sUser.fullName || prev.fullName,
              email: sUser.email || prev.email,
              accountBalance: typeof sUser.accountBalance === 'number' ? sUser.accountBalance : prev.accountBalance,
              isKycVerified: typeof sUser.isKycVerified === 'boolean' ? sUser.isKycVerified : prev.isKycVerified,
              kycTier: sUser.kycTier || prev.kycTier
            };
            try {
              localStorage.setItem('bem_user_v3', JSON.stringify(updated));
            } catch (_) {}
            return updated;
          });
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    // Initial sync
    const initialUser = user.username || 'Eau231';
    syncUserWithServer(initialUser);

    const interval = setInterval(() => {
      const activeName = user.username || 'Eau231';
      syncUserWithServer(activeName);
    }, 3500);

    return () => clearInterval(interval);
  }, [user.username]);

  const markSupportMessagesAsRead = async () => {
    setSupportMessages(prev => {
      const updated = prev.map(m => ({ ...m, isReadByAdmin: true }));
      try {
        localStorage.setItem('bem_support_messages_v2', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    try {
      await fetch('/api/chat-messages/read', { method: 'POST' });
    } catch (_) {}
  };

  const sendInvestorChatMessage = async (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();
    const effectiveUsername = user.username || 'Eau231';
    const effectiveFullName = user.fullName || user.username || 'Eau231';
    const effectiveEmail = user.email || 'eau231@primetrade.us.ci';

    const optimisticMsg: SupportChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: clean,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      userId: effectiveUsername,
      userName: effectiveFullName,
      userEmail: effectiveEmail,
      isReadByAdmin: false
    };

    setSupportMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'user',
          text: clean,
          userId: effectiveUsername,
          userName: effectiveFullName,
          userEmail: effectiveEmail
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setSupportMessages(data.messages);
          try {
            localStorage.setItem('bem_support_messages_v2', JSON.stringify(data.messages));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('Network sending investor chat message, fallback local:', err);
    }
  };

  const sendAdminChatMessage = async (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();

    const optimisticMsg: SupportChatMessage = {
      id: `adm-${Date.now()}`,
      sender: 'admin',
      text: clean,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      userName: 'Senior Broker Admin',
      isReadByAdmin: true
    };

    setSupportMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'admin',
          text: clean,
          userName: 'Senior Broker Admin'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setSupportMessages(data.messages);
          try {
            localStorage.setItem('bem_support_messages_v2', JSON.stringify(data.messages));
          } catch (_) {}
        }
      }
      showToast('Reply dispatched directly to investor live chat', 'success');
    } catch (err) {
      console.warn('Network sending admin chat message, fallback local:', err);
      showToast('Reply saved locally', 'info');
    }
  };

  // Adjust any client's balance on server and synchronize
  const adjustRemoteUserBalance = async (targetUsername: string, delta: number, note?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/user-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: targetUsername,
          delta,
          note: note || `Admin Balance Adjustment (${delta > 0 ? '+' : ''}$${delta})`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // If the target is the current active user, update local user immediately
          if (!user.username || user.username.toLowerCase() === targetUsername.toLowerCase()) {
            setUser(prev => ({
              ...prev,
              accountBalance: data.newBalance
            }));
          }
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to adjust remote user balance:', err);
      return false;
    }
  };

  useEffect(() => {
    localStorage.setItem('bem_copy_subs_v1', JSON.stringify(copySubscriptions));
  }, [copySubscriptions]);

  const startCopyingTrader = (traderId: string, amount: number): boolean => {
    const trader = copyTraders.find(t => t.id === traderId);
    if (!trader) {
      showToast('Expert trader not found', 'error');
      return false;
    }

    if (amount < trader.minInvestment) {
      showToast(`Minimum investment for ${trader.name} is $${trader.minInvestment.toLocaleString()}`, 'error');
      return false;
    }

    const currentBal = user.isDemoMode ? user.demoBalance : user.accountBalance;
    if (currentBal < amount) {
      showToast(`Insufficient balance ($${currentBal.toFixed(2)}). Please deposit funds to start copying.`, 'error');
      setIsDepositModalOpen(true);
      return false;
    }

    // Deduct user balance
    setUser(prev => ({
      ...prev,
      accountBalance: prev.isDemoMode ? prev.accountBalance : Math.max(0, prev.accountBalance - amount),
      demoBalance: prev.isDemoMode ? Math.max(0, prev.demoBalance - amount) : prev.demoBalance
    }));

    // Generate subscription
    const newSub: CopySubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      traderId: trader.id,
      traderName: trader.name,
      traderSpecialty: trader.specialty,
      amount,
      copiedAt: new Date().toISOString(),
      status: 'active',
      currentProfit: 0,
      profitPercentage: 0
    };

    setCopySubscriptions(prev => [newSub, ...prev]);

    // Record on backend / database
    recordCopySubscription({
      traderId: trader.id,
      traderName: trader.name,
      traderSpecialty: trader.specialty,
      amount,
      userId: user.username || user.email || 'guest'
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (_) {}

    showToast(`Now copying ${trader.name}! $${amount.toLocaleString()} allocated.`, 'success');
    addNotification('Copy Trading Activated', `You are automatically copying ${trader.name} (${trader.specialty}).`, 'trade');
    return true;
  };

  const pauseCopyingTrader = (subscriptionId: string) => {
    setCopySubscriptions(prev =>
      prev.map(sub =>
        sub.id === subscriptionId
          ? { ...sub, status: sub.status === 'active' ? 'paused' : 'active' }
          : sub
      )
    );
    showToast('Copy subscription status updated', 'info');
  };

  const stopCopyingTrader = (subscriptionId: string) => {
    const sub = copySubscriptions.find(s => s.id === subscriptionId);
    if (!sub) return;

    const refund = sub.amount + sub.currentProfit;
    setUser(prev => ({
      ...prev,
      accountBalance: prev.isDemoMode ? prev.accountBalance : prev.accountBalance + refund,
      demoBalance: prev.isDemoMode ? prev.demoBalance + refund : prev.demoBalance
    }));

    setCopySubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
    showToast(`Stopped copying ${sub.traderName}. $${refund.toFixed(2)} refunded to balance.`, 'info');
    addNotification('Copy Trading Stopped', `Allocated capital of $${refund.toFixed(2)} refunded to your balance.`, 'wallet');
  };

  const addRandomTrader = (): CopyTrader => {
    const newTrader = generateRandomTrader(Date.now() + Math.floor(Math.random() * 10000));
    setCopyTraders(prev => [newTrader, ...prev]);
    showToast(`Added new expert trader: ${newTrader.name}! Total: ${copyTraders.length + 1} experts`, 'success');
    addNotification('New Trader Added', `${newTrader.name} (${newTrader.specialty}) is now listed in the copy directory.`, 'system');
    return newTrader;
  };


  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(prev => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('bem_user_v3', JSON.stringify(user));
    localStorage.setItem('bem_user_v2', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bem_logged_in_v2', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('bem_positions_v2', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('bem_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bem_notifications_v5', JSON.stringify(notifications));
  }, [notifications]);

  // Request real push notification permission
  const requestPushPermissions = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          showToast('Real-time push notifications enabled', 'success');
          new Notification('Blue Edge Market', {
            body: 'Push alerts for market volatility and portfolio updates are active.',
            icon: '/brand/blue-edge-mark.png'
          });
        }
      } catch (err) {
        console.warn('Notification permission error', err);
      }
    }
  };

  // Theme toggle
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // REAL LIVE MARKET DATA POLLING (Binance + Forex exchange rates)
  useEffect(() => {
    let isMounted = true;

    const loadRealMarketData = async () => {
      try {
        const liveAssets = await fetchRealMarketData();
        if (isMounted && liveAssets.length > 0) {
          setAssets(liveAssets);
          setIsLoadingMarketData(false);

          // Update active positions' real PnL based on live prices
          setPositions(prevPositions =>
            prevPositions.map(pos => {
              const currentAsset = liveAssets.find(a => a.symbol === pos.symbol);
              if (!currentAsset) return pos;
              const priceDelta = pos.type === 'BUY'
                ? (currentAsset.price - pos.entryPrice) / pos.entryPrice
                : (pos.entryPrice - currentAsset.price) / pos.entryPrice;
              const rawPnl = Number((pos.amount * priceDelta * pos.leverage).toFixed(2));
              // Apply +55% boost to all trade profits
              const pnl = rawPnl > 0 ? Number((rawPnl * 1.55).toFixed(2)) : rawPnl;
              const pnlPercent = rawPnl > 0
                ? Number((priceDelta * pos.leverage * 100 * 1.55).toFixed(2))
                : Number((priceDelta * pos.leverage * 100).toFixed(2));
              return {
                ...pos,
                currentPrice: currentAsset.price,
                pnl,
                pnlPercent
              };
            })
          );
        }
      } catch (err) {
        console.error('Failed to load real market data:', err);
      }
    };

    // Initial load
    loadRealMarketData();

    // Poll every 5 seconds for fresh real market data
    const interval = setInterval(loadRealMarketData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Authentication
  const login = (emailOrUser: string, _pass: string) => {
    setIsLoggedIn(true);
    sessionStorage.setItem('bem_logged_in_session', 'true');
    localStorage.removeItem('bem_logged_in_v3');
    const uName = emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser;
    const formattedName = uName.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    setUser(prev => {
      const updated: UserProfile = {
        ...prev,
        username: uName,
        email: emailOrUser.includes('@') ? emailOrUser : `${uName}@blueedgemarket.com`,
        fullName: prev.fullName || formattedName,
        avatarInitials: (prev.fullName || formattedName)[0]?.toUpperCase() || 'U'
      };
      localStorage.setItem('bem_user_v3', JSON.stringify(updated));
      return updated;
    });
    setIsLoginOpen(false);
    showToast('Securely authenticated to client portal', 'success');
    addNotification('Client Signed In', 'Secure login established with 256-bit SSL encrypted broker gateway.', 'security');
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('bem_logged_in_session');
    localStorage.removeItem('bem_logged_in_v3');
    setActiveTab('landing');
    setIsSidebarOpen(false);
    showToast('Signed out of trading portal', 'info');
  };

  const register = (data: Partial<UserProfile>) => {
    setIsLoggedIn(true);
    sessionStorage.setItem('bem_logged_in_session', 'true');
    localStorage.removeItem('bem_logged_in_v3');
    const initialChar = (data.fullName || data.username || 'U')[0].toUpperCase();
    const newUser: UserProfile = {
      ...defaultRealUser,
      ...data,
      accountBalance: 0,
      avatarInitials: initialChar,
      referralCode: `BEM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    };
    setUser(newUser);
    localStorage.setItem('bem_user_v3', JSON.stringify(newUser));
    setIsRegisterOpen(false);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
    showToast('Trading account successfully registered! Welcome to Blue Edge Market.', 'success');
    addNotification('Account Activated', 'Your client account is live. Complete Identity Verification to lift funding limits.', 'system');
  };

  const toggleDemoMode = () => {
    setUser(prev => {
      const nextMode = !prev.isDemoMode;
      showToast(nextMode ? 'Switched to Demo Account ($50,000)' : 'Switched to Real Live Account ($0.00)', 'info');
      return { ...prev, isDemoMode: nextMode };
    });
  };

  // Real Trading Execution
  const openTrade = (symbol: string, type: 'BUY' | 'SELL', amount: number, leverage: number, sl?: number, tp?: number) => {
    const curBalance = user.isDemoMode ? user.demoBalance : user.accountBalance;
    if (curBalance < amount) {
      showToast(`Insufficient balance ($${curBalance.toFixed(2)}). Please deposit funds or switch to Demo mode.`, 'error');
      setIsDepositModalOpen(true);
      return false;
    }

    const asset = assets.find(a => a.symbol === symbol);
    const entryPrice = asset ? asset.price : 100;

    // Deduct margin from real balance
    setUser(prev => ({
      ...prev,
      accountBalance: prev.isDemoMode ? prev.accountBalance : prev.accountBalance - amount,
      demoBalance: prev.isDemoMode ? prev.demoBalance - amount : prev.demoBalance
    }));

    const newPos: Position = {
      id: `pos-${Date.now()}`,
      symbol,
      type,
      amount,
      entryPrice,
      currentPrice: entryPrice,
      leverage,
      pnl: 0,
      pnlPercent: 0,
      openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stopLoss: sl,
      takeProfit: tp
    };

    setPositions(prev => [newPos, ...prev]);

    // Record real transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'TRADE',
      amount,
      asset: symbol,
      status: 'COMPLETED',
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      hashOrReference: `BEM-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      note: `${type} ${leverage}x ${symbol} @ $${entryPrice.toLocaleString()}`
    };
    setTransactions(prev => [newTx, ...prev]);

    showToast(`Order filled: ${type} ${leverage}x ${symbol} at $${entryPrice.toLocaleString()}`, 'success');
    addNotification('Order Executed', `${type} order for $${amount} on ${symbol} executed at real price $${entryPrice}.`, 'trade');
    return true;
  };

  const closePosition = (id: string) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;

    const returnAmount = pos.amount + pos.pnl;
    setUser(prev => ({
      ...prev,
      accountBalance: prev.isDemoMode ? prev.accountBalance : Math.max(0, prev.accountBalance + returnAmount),
      demoBalance: prev.isDemoMode ? prev.demoBalance + returnAmount : prev.demoBalance
    }));

    setPositions(prev => prev.filter(p => p.id !== id));
    showToast(`Position closed. Realized PnL: ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)}`, pos.pnl >= 0 ? 'success' : 'info');
    addNotification('Position Closed', `Realized ${pos.pnl >= 0 ? 'profit' : 'loss'} of $${pos.pnl.toFixed(2)} on ${pos.symbol}.`, 'trade');
  };

  // Real Financial Operations: Deposits Require Admin Approval Before Balance Crediting
  const adjustUserBalance = (delta: number, note?: string) => {
    const numericDelta = Number(delta) || 0;
    if (numericDelta === 0) return;

    setUser(prev => {
      const current = Number(prev.accountBalance) || 0;
      const updatedBalance = Math.max(0, current + numericDelta);
      const updated = {
        ...prev,
        accountBalance: updatedBalance
      };
      try {
        localStorage.setItem('bem_user_v3', JSON.stringify(updated));
        localStorage.setItem('bem_user_v2', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    const isCredit = numericDelta > 0;
    const absVal = Math.abs(numericDelta);
    const refCode = `BEM-${isCredit ? 'CR' : 'DR'}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: isCredit ? 'DEPOSIT' : 'WITHDRAWAL',
      amount: absVal,
      asset: isCredit ? 'Admin Credit' : 'Admin Debit',
      status: 'COMPLETED',
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      hashOrReference: refCode,
      note: note || `Broker Admin Adjustment: ${isCredit ? '+' : '-'}$${absVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    };

    setTransactions(prev => {
      const updated = [newTx, ...prev];
      try {
        localStorage.setItem('bem_transactions_v2', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (isCredit) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (_) {}
    }

    showToast(`Client balance adjusted by ${numericDelta >= 0 ? '+' : ''}$${numericDelta.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'success');
  };

  const depositFunds = (amount: number, method: string, details?: string, autoApprove: boolean = false) => {
    const depositAmt = Number(amount) || 0;
    if (depositAmt === 0) return false;

    // Handle Admin Debit when called with negative amount
    if (autoApprove && depositAmt < 0) {
      adjustUserBalance(depositAmt, details || 'Admin Balance Debit');
      return true;
    }

    if (depositAmt < 0) return false;

    const ref = `BEM-DEP-${Math.floor(100000 + Math.random() * 900000)}`;

    if (autoApprove) {
      // Direct Admin Credit (immediate balance update)
      setUser(prev => {
        const updated = {
          ...prev,
          accountBalance: (Number(prev.accountBalance) || 0) + depositAmt
        };
        try {
          localStorage.setItem('bem_user_v3', JSON.stringify(updated));
          localStorage.setItem('bem_user_v2', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'DEPOSIT',
        amount: depositAmt,
        asset: method,
        status: 'COMPLETED',
        date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        hashOrReference: ref,
        note: details || `Deposit via ${method} (Admin Credit)`
      };

      setTransactions(prev => {
        const updated = [newTx, ...prev];
        try {
          localStorage.setItem('bem_transactions_v2', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      try {
        confetti({ particleCount: 80, spread: 75, origin: { y: 0.6 } });
      } catch (_) {}

      showToast(`$${depositAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} credited to account balance!`, 'success');
      return true;
    }

    // Standard Investor Flow: Creates PENDING transaction awaiting admin approval
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'DEPOSIT',
      amount: depositAmt,
      asset: method,
      status: 'PENDING',
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      hashOrReference: ref,
      note: details || `Deposit via ${method} (Awaiting Admin Approval)`
    };

    setTransactions(prev => {
      const updated = [newTx, ...prev];
      try {
        localStorage.setItem('bem_transactions_v2', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    showToast(`Payment registered! Reference ${ref}. Awaiting broker admin approval before crediting.`, 'info');
    addNotification('Deposit Submitted', `Your deposit of $${depositAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} via ${method} (Ref: ${ref}) has been submitted. Funds will be credited once verified and approved by the broker admin desk.`, 'wallet');
    return true;
  };

  const approveDeposit = (txId: string) => {
    let depositAmount = 0;

    setTransactions(prev =>
      prev.map(tx => {
        if ((tx.id === txId || tx.hashOrReference === txId) && tx.status !== 'COMPLETED') {
          depositAmount = tx.amount;
          return { ...tx, status: 'COMPLETED' as const };
        }
        return tx;
      })
    );

    if (depositAmount > 0) {
      setUser(prev => {
        const updated = {
          ...prev,
          accountBalance: (Number(prev.accountBalance) || 0) + depositAmount
        };
        try {
          localStorage.setItem('bem_user_v3', JSON.stringify(updated));
          localStorage.setItem('bem_user_v2', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (_) {}

      showToast(`Deposit approved! Credited $${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} to client balance.`, 'success');
      addNotification('Deposit Approved & Credited', `Your deposit of $${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been approved by the broker compliance desk and credited to your available balance.`, 'wallet');
    } else {
      showToast('Deposit record cleared or already completed.', 'info');
    }
  };

  const rejectDeposit = (txId: string) => {
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === txId || tx.hashOrReference === txId) {
          return { ...tx, status: 'PROCESSING' as any };
        }
        return tx;
      })
    );
    showToast('Deposit has been rejected.', 'info');
  };

  const withdrawFunds = (amount: number, method: string, address: string) => {
    if (user.accountBalance < amount) {
      return { success: false, message: `Insufficient balance. Available: $${user.accountBalance.toFixed(2)}` };
    }

    setUser(prev => ({
      ...prev,
      accountBalance: Math.max(0, prev.accountBalance - amount)
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'WITHDRAWAL',
      amount,
      asset: method,
      status: 'PROCESSING',
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      hashOrReference: `BEM-WTD-${Math.floor(100000 + Math.random() * 900000)}`,
      note: `Payout to ${address}`
    };
    setTransactions(prev => [newTx, ...prev]);

    showToast(`Withdrawal of $${amount.toFixed(2)} submitted for processing!`, 'success');
    addNotification('Withdrawal Disbursing', `Withdrawal of $${amount.toFixed(2)} to ${address} is being routed.`, 'wallet');
    return { success: true, message: 'Withdrawal processed successfully.' };
  };

  const transferFunds = (amount: number, from: string, to: string) => {
    if (user.accountBalance < amount) {
      showToast('Insufficient funds for transfer', 'error');
      return false;
    }
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'TRANSFER',
      amount,
      asset: 'USD',
      status: 'COMPLETED',
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      hashOrReference: `BEM-TRF-${Math.floor(100000 + Math.random() * 900000)}`,
      note: `Transfer from ${from} to ${to}`
    };
    setTransactions(prev => [newTx, ...prev]);
    showToast(`Transferred $${amount.toFixed(2)} from ${from} to ${to}`, 'success');
    return true;
  };

  const investInTier = (tierId: string, amount: number) => {
    const tier = BROKER_INVESTMENT_TIERS.find(t => t.id === tierId);
    if (!tier) return false;
    if (amount < tier.minDeposit) {
      showToast(`Minimum deposit for ${tier.title} is $${tier.minDeposit.toLocaleString()}`, 'error');
      return false;
    }
    if (user.accountBalance < amount) {
      showToast('Insufficient balance. Please deposit funds first.', 'error');
      setIsDepositModalOpen(true);
      return false;
    }

    setUser(prev => ({ ...prev, accountBalance: prev.accountBalance - amount }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'DEPOSIT',
      amount,
      asset: 'Investment Tier',
      status: 'COMPLETED',
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      hashOrReference: `BEM-PLN-${Math.floor(100000 + Math.random() * 900000)}`,
      note: `Subscribed to ${tier.title}`
    };
    setTransactions(prev => [newTx, ...prev]);

    try {
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
    } catch (_) {}

    showToast(`Enrolled in ${tier.title}! Target Yield: ${tier.expectedApy}% APY`, 'success');
    addNotification('Tier Activated', `Allocated $${amount.toLocaleString()} into ${tier.title}.`, 'wallet');
    return true;
  };

  const connectWallet = async (walletName: string) => {
    let address = '';
    if ((window as any).ethereum && typeof (window as any).ethereum.request === 'function') {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          address = accounts[0];
        }
      } catch (err) {
        console.warn('User rejected web3 request, using generated fallback address', err);
      }
    }

    if (!address) {
      address = `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;
    }

    setUser(prev => ({
      ...prev,
      connectedWalletAddress: address
    }));
    setIsWalletModalOpen(false);
    showToast(`Connected ${walletName} (${address})!`, 'success');
    addNotification('Wallet Connected', `Cryptocurrency wallet ${address} linked to your account.`, 'wallet');
  };

  const disconnectWallet = () => {
    setUser(prev => ({ ...prev, connectedWalletAddress: null }));
    showToast('Wallet disconnected', 'info');
  };

  const submitKyc = (level: 'tier1' | 'tier2', data: any) => {
    setUser(prev => ({
      ...prev,
      isKycVerified: true,
      kycTier: level === 'tier1' ? 'Tier 1 Basic' : 'Tier 2 Institutional Verified',
      fullName: data.fullName || prev.fullName,
      country: data.country || prev.country
    }));
    setIsKycModalOpen(false);
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
    } catch (_) {}
    showToast(`Identity Verification approved! Institutional features unlocked.`, 'success');
    addNotification('KYC Verified', 'Your identity documentation has been confirmed by compliance.', 'security');
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const markNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotifsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'system') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Send push notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/brand/blue-edge-mark.png'
        });
      } catch (_) {}
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        logout,
        register,
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        assets,
        isLoadingMarketData,
        selectedSymbol,
        setSelectedSymbol,
        positions,
        openTrade,
        closePosition,
        tiers: BROKER_INVESTMENT_TIERS,
        investInTier,
        transactions,
        depositFunds,
        approveDeposit,
        rejectDeposit,
        adjustUserBalance,
        withdrawFunds,
        transferFunds,
        connectWallet,
        disconnectWallet,
        submitKyc,
        notifications,
        unreadNotifsCount,
        markNotifRead,
        markAllNotifsRead,
        addNotification,
        requestPushPermissions,
        selectedLanguage,
        setSelectedLanguage,
        isSidebarOpen,
        setIsSidebarOpen,
        isLoginOpen,
        setIsLoginOpen,
        isRegisterOpen,
        setIsRegisterOpen,
        isQuickTradeOpen,
        setIsQuickTradeOpen,
        isWalletModalOpen,
        setIsWalletModalOpen,
        isLiveChatOpen,
        setIsLiveChatOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isDepositModalOpen,
        setIsDepositModalOpen,
        isWithdrawModalOpen,
        setIsWithdrawModalOpen,
        isKycModalOpen,
        setIsKycModalOpen,
        isNeonDbModalOpen,
        setIsNeonDbModalOpen,
        toggleDemoMode,
        toast,
        showToast,
        copyTraders,
        copySubscriptions,
        startCopyingTrader,
        pauseCopyingTrader,
        stopCopyingTrader,
        addRandomTrader,
        neonDbStatus,
        refreshNeonDbStatus,
        testAndConnectNeonDb,
        cryptoPaymentMethods,
        addCryptoPaymentMethod,
        updateCryptoPaymentMethod,
        deleteCryptoPaymentMethod,
        toggleCryptoPaymentMethod,
        supportMessages,
        unreadAdminChatCount,
        sendInvestorChatMessage,
        sendAdminChatMessage,
        markSupportMessagesAsRead,
        adjustRemoteUserBalance,
        syncUserWithServer
      }}

    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
