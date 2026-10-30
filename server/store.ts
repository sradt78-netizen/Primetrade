import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '..', 'data', 'app_state.json');

export interface StoredUser {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  accountBalance: number;
  demoBalance: number;
  isKycVerified: boolean;
  kycTier: string;
  avatarInitials: string;
  updatedAt: string;
}

export interface StoredSupportMessage {
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

export interface StoredWithdrawalCode {
  id: string;
  code: string;
  username: string;
  userEmail: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  createdAt: string;
  usedAt?: string;
  createdBy: 'admin' | 'investor_request';
}

export interface StoredCryptoPaymentMethod {
  id: string;
  name: string;
  symbol: string;
  network: string;
  address: string;
  memo?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  minDeposit: number;
}

export interface StoredTransaction {
  id: string;
  username: string;
  userFullName?: string;
  userEmail?: string;
  type: string;
  amount: number;
  asset: string;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'REJECTED';
  date: string;
  hashOrReference: string;
  note?: string;
  proofUrl?: string;
}

export interface StoredKycSubmission {
  id: string;
  username: string;
  fullName: string;
  email: string;
  idType: string;
  docNumber: string;
  issueCountry: string;
  frontDocName?: string;
  proofDocName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
}

export interface AppStoreData {
  users: Record<string, StoredUser>;
  supportMessages: StoredSupportMessage[];
  withdrawalCodes: StoredWithdrawalCode[];
  cryptoPaymentMethods: StoredCryptoPaymentMethod[];
  transactions: StoredTransaction[];
  kycSubmissions: StoredKycSubmission[];
}

const DEFAULT_CRYPTO_METHODS: StoredCryptoPaymentMethod[] = [
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

function getInitialStore(): AppStoreData {
  return {
    users: {
      'eau231': {
        username: 'Eau231',
        fullName: 'Eau231',
        email: 'eau231@primetrade.us.ci',
        country: 'United States',
        accountBalance: 0.00,
        demoBalance: 50000.00,
        isKycVerified: false,
        kycTier: 'Unverified',
        avatarInitials: 'E',
        updatedAt: new Date().toISOString()
      }
    },
    supportMessages: [
      {
        id: 'msg-welcome',
        sender: 'broker',
        text: 'Welcome to PrimeTrade Support. How can an admin representative assist with your trading, crypto funding, or withdrawal verification code today?',
        time: 'Desk Online',
        timestamp: Date.now() - 3600000,
        isReadByAdmin: true
      }
    ],
    withdrawalCodes: [
      {
        id: 'wcode-default-1',
        code: '774920',
        username: 'Eau231',
        userEmail: 'eau231@primetrade.us.ci',
        status: 'ACTIVE',
        createdAt: new Date().toLocaleString(),
        createdBy: 'admin'
      }
    ],
    cryptoPaymentMethods: DEFAULT_CRYPTO_METHODS,
    transactions: [],
    kycSubmissions: []
  };
}

let storeMemory: AppStoreData | null = null;

export function loadStore(): AppStoreData {
  if (storeMemory) return storeMemory;

  try {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      storeMemory = JSON.parse(content);
      if (storeMemory) {
        // Ensure required keys exist
        if (!storeMemory.users) storeMemory.users = {};
        if (!storeMemory.supportMessages) storeMemory.supportMessages = [];
        if (!storeMemory.withdrawalCodes) storeMemory.withdrawalCodes = [];
        if (!storeMemory.cryptoPaymentMethods || storeMemory.cryptoPaymentMethods.length === 0) {
          storeMemory.cryptoPaymentMethods = DEFAULT_CRYPTO_METHODS;
        }
        if (!storeMemory.transactions) storeMemory.transactions = [];
        if (!storeMemory.kycSubmissions) storeMemory.kycSubmissions = [];

        // Ensure eau231 is accessible
        if (!storeMemory.users['eau231']) {
          storeMemory.users['eau231'] = {
            username: 'Eau231',
            fullName: 'Eau231',
            email: 'eau231@primetrade.us.ci',
            country: 'United States',
            accountBalance: 0.00,
            demoBalance: 50000.00,
            isKycVerified: false,
            kycTier: 'Unverified',
            avatarInitials: 'E',
            updatedAt: new Date().toISOString()
          };
        }

        return storeMemory;
      }
    }
  } catch (err) {
    console.warn('[Store] Error loading data file, using fresh store:', err);
  }

  storeMemory = getInitialStore();
  saveStore(storeMemory);
  return storeMemory;
}

export function saveStore(data: AppStoreData): void {
  storeMemory = data;
  try {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Error saving data file:', err);
  }
}

// User Helpers
export function getStoredUser(usernameOrEmail: string): StoredUser | null {
  const store = loadStore();
  const key = usernameOrEmail.toLowerCase().trim();

  // Try direct key
  if (store.users[key]) return store.users[key];

  // Try searching
  const found = Object.values(store.users).find(
    u => u.username.toLowerCase() === key || u.email.toLowerCase() === key
  );
  return found || null;
}

export function syncOrUpdateUser(profile: Partial<StoredUser> & { username?: string; email?: string }): StoredUser {
  const store = loadStore();
  const rawKey = (profile.username || profile.email || 'investor').toLowerCase().trim();
  const existing = getStoredUser(rawKey);

  const updated: StoredUser = {
    username: profile.username || existing?.username || rawKey,
    fullName: profile.fullName || existing?.fullName || profile.username || 'Valued Trader',
    email: profile.email || existing?.email || `${rawKey}@primetrade.us.ci`,
    phone: profile.phone || existing?.phone || '',
    country: profile.country || existing?.country || 'United States',
    accountBalance: typeof profile.accountBalance === 'number' ? profile.accountBalance : (existing?.accountBalance || 0),
    demoBalance: typeof profile.demoBalance === 'number' ? profile.demoBalance : (existing?.demoBalance || 50000),
    isKycVerified: typeof profile.isKycVerified === 'boolean' ? profile.isKycVerified : (existing?.isKycVerified || false),
    kycTier: profile.kycTier || existing?.kycTier || 'Unverified',
    avatarInitials: profile.avatarInitials || existing?.avatarInitials || (profile.fullName || profile.username || 'U')[0].toUpperCase(),
    updatedAt: new Date().toISOString()
  };

  store.users[updated.username.toLowerCase()] = updated;
  saveStore(store);
  return updated;
}

export function adjustUserBalanceInStore(username: string, delta: number, note?: string): StoredUser | null {
  const store = loadStore();
  const user = getStoredUser(username);
  if (!user) return null;

  const current = Number(user.accountBalance) || 0;
  const newBalance = Math.max(0, current + delta);
  user.accountBalance = Number(newBalance.toFixed(2));
  user.updatedAt = new Date().toISOString();

  // Record completed transaction
  const isCredit = delta > 0;
  const absAmt = Math.abs(delta);
  store.transactions.unshift({
    id: `tx-${Date.now()}`,
    username: user.username,
    type: isCredit ? 'DEPOSIT' : 'WITHDRAWAL',
    amount: absAmt,
    asset: isCredit ? 'Admin Balance Credit' : 'Admin Balance Debit',
    status: 'COMPLETED',
    date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    hashOrReference: `BEM-${isCredit ? 'CR' : 'DR'}-${Math.floor(100000 + Math.random() * 900000)}`,
    note: note || `Admin Adjustment: ${isCredit ? '+' : '-'}$${absAmt.toFixed(2)}`
  });

  store.users[user.username.toLowerCase()] = user;
  saveStore(store);
  return user;
}

export function getAllStoredUsers(): StoredUser[] {
  const store = loadStore();
  return Object.values(store.users);
}

export function deleteStoredUser(username: string): boolean {
  const store = loadStore();
  const key = username.toLowerCase().trim();
  if (store.users[key]) {
    delete store.users[key];
    saveStore(store);
    return true;
  }
  return false;
}

export function updateUserKyc(username: string, isVerified: boolean, tier?: string): StoredUser | null {
  const store = loadStore();
  const user = getStoredUser(username);
  if (!user) return null;

  user.isKycVerified = isVerified;
  user.kycTier = tier || (isVerified ? 'Tier 2 Institutional Verified' : 'Unverified');
  user.updatedAt = new Date().toISOString();

  store.users[user.username.toLowerCase()] = user;
  saveStore(store);
  return user;
}

// Transaction Helpers
export function addTransaction(tx: Omit<StoredTransaction, 'id' | 'date'> & { id?: string; date?: string }): StoredTransaction {
  const store = loadStore();
  const newTx: StoredTransaction = {
    id: tx.id || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    username: tx.username,
    userFullName: tx.userFullName,
    userEmail: tx.userEmail,
    type: tx.type,
    amount: tx.amount,
    asset: tx.asset,
    status: tx.status,
    date: tx.date || new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    hashOrReference: tx.hashOrReference || `BEM-TX-${Math.floor(100000 + Math.random() * 900000)}`,
    note: tx.note,
    proofUrl: tx.proofUrl
  };

  store.transactions.unshift(newTx);
  saveStore(store);
  return newTx;
}

export function updateTransactionStatus(
  idOrRef: string,
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'REJECTED',
  note?: string
): StoredTransaction | null {
  const store = loadStore();
  const match = store.transactions.find(t => t.id === idOrRef || t.hashOrReference === idOrRef);
  if (!match) return null;

  match.status = status;
  if (note) match.note = note;

  // If approved and was a deposit, credit the user balance
  if (status === 'COMPLETED' && match.type === 'DEPOSIT') {
    const user = getStoredUser(match.username);
    if (user) {
      user.accountBalance = Number(((Number(user.accountBalance) || 0) + Number(match.amount)).toFixed(2));
      user.updatedAt = new Date().toISOString();
      store.users[user.username.toLowerCase()] = user;
    }
  }

  saveStore(store);
  return match;
}

export function getAllTransactions(username?: string): StoredTransaction[] {
  const store = loadStore();
  if (!username) return store.transactions;
  const target = username.toLowerCase().trim();
  return store.transactions.filter(t => t.username.toLowerCase() === target);
}

// KYC Helpers
export function addKycSubmission(sub: Omit<StoredKycSubmission, 'id' | 'submittedAt' | 'status'>): StoredKycSubmission {
  const store = loadStore();
  const newSub: StoredKycSubmission = {
    id: `kyc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    username: sub.username,
    fullName: sub.fullName,
    email: sub.email,
    idType: sub.idType,
    docNumber: sub.docNumber,
    issueCountry: sub.issueCountry,
    frontDocName: sub.frontDocName,
    proofDocName: sub.proofDocName,
    status: 'PENDING',
    submittedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
  };

  // Update user status to Pending Verification
  const user = getStoredUser(sub.username);
  if (user) {
    user.kycTier = 'Pending Verification';
    user.updatedAt = new Date().toISOString();
    store.users[user.username.toLowerCase()] = user;
  }

  store.kycSubmissions.unshift(newSub);
  saveStore(store);
  return newSub;
}

export function getAllKycSubmissions(): StoredKycSubmission[] {
  const store = loadStore();
  return store.kycSubmissions;
}

export function reviewKycSubmission(id: string, status: 'APPROVED' | 'REJECTED'): StoredKycSubmission | null {
  const store = loadStore();
  const sub = store.kycSubmissions.find(s => s.id === id);
  if (!sub) return null;

  sub.status = status;
  sub.reviewedAt = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

  const user = getStoredUser(sub.username);
  if (user) {
    if (status === 'APPROVED') {
      user.isKycVerified = true;
      user.kycTier = 'Tier 2 Institutional Verified';
    } else {
      user.isKycVerified = false;
      user.kycTier = 'Verification Rejected';
    }
    user.updatedAt = new Date().toISOString();
    store.users[user.username.toLowerCase()] = user;
  }

  saveStore(store);
  return sub;
}
