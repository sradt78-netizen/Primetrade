export type AssetCategory = 'crypto' | 'stocks' | 'forex' | 'commodities' | 'bonds';

export interface MarketAsset {
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number; // percentage
  high24h: number;
  low24h: number;
  volume: string;
  sparkline: number[];
  marketCap?: string;
  leverageMax?: number;
}

export interface Position {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  amount: number; // in USD
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  openedAt: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface InvestmentPlan {
  id: string;
  title: string;
  subtitle: string;
  minDeposit: number;
  maxDeposit: number;
  expectedApy: number; // e.g. 14.5%
  durationDays: number;
  riskLevel: 'Low' | 'Moderate' | 'Aggressive';
  description: string;
  features: string[];
  investedCount: number;
  totalAum: string;
}

export interface CopyTrader {
  id: string;
  name: string;
  avatar: string;
  badge: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  followers: number;
  winRate: number;
  totalReturn: number;
  equity: number;
  totalTrades: number;
  minInvestment: number;
  description: string;
  riskScore: number; // 1-10
  profitShared: number; // % fee e.g. 10%
  preferredAsset: string;
  roi30d?: number;
}

export interface CopySubscription {
  id: string;
  traderId: string;
  traderName: string;
  traderSpecialty: string;
  amount: number;
  copiedAt: string;
  status: 'active' | 'paused' | 'stopped';
  currentProfit: number;
  profitPercentage: number;
}

export interface NeonDbStatus {
  connected: boolean;
  type: 'neon_postgres' | 'local_fallback';
  databaseUrlConfigured: boolean;
  host?: string;
  database?: string;
  latencyMs?: number;
  tablesInitialized?: boolean;
  counts?: {
    users: number;
    traders: number;
    subscriptions: number;
  };
  error?: string;
}


export interface TradingBot {
  id: string;
  name: string;
  type: 'Grid Trading' | 'DCA Bot' | 'Momentum Trend' | 'Arbitrage Scalper';
  description: string;
  roi30d: number;
  winRate: number;
  runtimeDays: number;
  status: 'active' | 'paused';
  recommendedCapital: number;
  allocatedAmount: number;
  totalProfit: number;
}

export interface TradeSignal {
  id: string;
  asset: string;
  action: 'BUY' | 'SELL';
  entryRange: string;
  target1: number;
  target2: number;
  stopLoss: number;
  timeframe: string;
  confidence: number; // %
  timestamp: string;
  status: 'ACTIVE' | 'HIT TP1' | 'HIT TP2' | 'CLOSED';
  analysis: string;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE' | 'TRANSFER' | 'YIELD_PAYOUT' | 'REFERRAL_BONUS';
  amount: number;
  asset: string;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING';
  date: string;
  hashOrReference: string;
  note?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'price' | 'trade' | 'security' | 'system' | 'wallet';
  timestamp: string;
  read: boolean;
}

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  accountType: 'Live Trader' | 'Institutional Prime';
  isKycVerified: boolean;
  kycTier: 'Unverified' | 'Tier 1 Basic' | 'Tier 2 Institutional Verified';
  accountBalance: number;
  demoBalance: number;
  isDemoMode: boolean;
  connectedWalletAddress: string | null;
  twoFactorEnabled: boolean;
  referralCode: string;
  totalReferralEarnings: number;
  avatarInitials: string;
}

export interface CryptoPaymentMethod {
  id: string;
  name: string;
  symbol: string;
  network: string;
  address: string;
  memo?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  minDeposit?: number;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'broker' | 'admin';
  text: string;
  time: string;
  timestamp: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  isReadByAdmin?: boolean;
}
