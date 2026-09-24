export type UserStatus = 'active' | 'suspended' | 'blocked';

export interface User {
  id: string; // immutable unique user ID (e.g. usr-...)
  name?: string;
  username: string; // compatibility alias
  fullName?: string; // compatibility alias
  email: string;
  mobile?: string;
  phone: string; // compatibility alias
  profile_photo?: string;
  profilePhoto?: string; // compatibility alias
  role?: 'user' | 'super_admin';
  status: UserStatus;
  created_at?: string;
  createdAt: string; // compatibility alias
  updated_at?: string;
  updatedAt?: string; // compatibility alias
  last_login_at?: string | null;
  lastLoginAt?: string | null; // compatibility alias

  // Wallet and affiliation relations
  balance: number; // available balance in KWD
  lockedBalance?: number; // held balance for pending withdrawals in KWD
  totalProfit?: number;
  totalReferralEarned?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  referredBy: string | null;
  referralCode: string;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  lastProfitClaimDate?: string;
  lastEarningClaimAt?: string;
  nextClaimAvailableAt?: string;
  activePlanId?: string;
  activePlanName?: string;
  assignedPlanId?: string;
}

export interface Wallet {
  id: string;
  user_id?: string;
  userId: string; // compatibility alias
  available_balance?: number;
  availableBalance: number; // compatibility alias
  locked_balance?: number;
  lockedBalance: number; // compatibility alias
  currency: 'KWD';
  created_at?: string;
  createdAt: string; // compatibility alias
  updated_at?: string;
  updatedAt: string; // compatibility alias
}

export interface ImpersonationSession {
  active: boolean;
  impersonationToken?: string;
  targetUserId?: string;
  targetUsername?: string;
  adminId?: string;
  adminUsername?: string;
  startedAt?: string;
  expiresAt?: number;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  amount: number; // in KWD
  minInvestment?: number;
  maxInvestment?: number;
  duration?: number; // days
  durationDays: number; // compatibility alias
  profit_rate?: number; // e.g. 4.0%
  dailyRatePercent?: number; // compatibility alias
  dailyProfitRate?: number;
  dailyProfit: number; // 24-hour earning in KWD
  totalProfit?: number; // total expected return in KWD
  totalReturnRate?: number;
  capitalReturn?: boolean;
  popular?: boolean;
  tier?: string;
  features?: string[];
  activeInvestors?: number;
  status: 'active' | 'disabled';
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  description?: string;
}

export interface UserInvestment {
  id: string;
  user_id?: string;
  userId: string;
  plan_id?: string;
  planId: string;
  amount: number; // in KWD
  start_date?: string;
  startDate: string;
  end_date?: string;
  endDate: string;
  status: 'active' | 'completed';
  created_at?: string;
  createdAt?: string;

  // Compatibility rich fields
  username?: string;
  planName?: string;
  dailyProfit?: number;
  durationDays?: number;
  daysElapsed?: number;
  totalEarned?: number;
  lastProfitDate?: string;
}

export type UserPlan = UserInvestment;

export interface DepositMethod {
  id: string;
  name: string;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
  requiredFields: string[];
  minDeposit: number;
  enabled: boolean;
}

export type DepositStatus = 'pending' | 'approved' | 'rejected';

export interface DepositRequest {
  id: string;
  user_id?: string;
  userId: string;
  amount?: number; // in KWD
  amountKwd: number; // compatibility alias
  payment_method?: string;
  methodName?: string; // compatibility alias
  reference_number?: string;
  transactionId?: string; // compatibility alias (TID)
  status: DepositStatus;
  created_at?: string;
  createdAt: string; // compatibility alias
  approved_at?: string | null;
  reviewedAt?: string | null; // compatibility alias
  approved_by?: string | null;
  reviewedBy?: string | null; // compatibility alias

  // Financial gateway metadata
  exchangeRate?: number;
  amountPkr?: number;
  methodId?: string;
  methodTitle?: string;
  accountTitle?: string;
  accountNumber?: string;
  senderAccount?: string;
  paymentDate?: string;
  planId?: string;
  planName?: string;
  note?: string;
  proofUrl?: string;
  rejectionReason?: string;
  adminNote?: string;
  username?: string;
}

export type Deposit = DepositRequest;

export interface WithdrawalNetwork {
  id: string;
  name: string;
  fee: number;
  enabled: boolean;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  user_id?: string;
  userId: string;
  amount?: number; // in KWD
  amountKwd: number; // compatibility alias
  payment_method?: string;
  type?: 'USDT' | 'Cash/PKR'; // compatibility alias
  account_details?: string;
  status: WithdrawalStatus;
  requested_at?: string;
  createdAt: string; // compatibility alias
  processed_at?: string | null;
  reviewedAt?: string | null; // compatibility alias
  processed_by?: string | null;
  reviewedBy?: string | null; // compatibility alias

  // Detailed withdrawal specs
  amountPkr?: number;
  feeKwd?: number;
  netKwd?: number;
  netAmountKwd?: number;
  exchangeRate?: number;
  netAmountPkr?: number;
  walletAddress?: string;
  network?: string;
  accountTitle?: string;
  accountNumber?: string;
  bankOrWalletName?: string;
  note?: string;
  adminNote?: string;
  rejectionReason?: string;
  username?: string;
}

export type Withdrawal = WithdrawalRequest;

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'plan_purchase'
  | 'investment'
  | 'plan_assignment'
  | 'plan_activation'
  | 'daily_profit'
  | 'profit'
  | 'balance_add'
  | 'balance_deduct'
  | 'balance_adjustment'
  | 'referral_commission'
  | 'withdrawal_refund';

export type TransactionStatus = 'completed' | 'pending' | 'rejected' | 'refunded';

export interface Transaction {
  id: string;
  user_id?: string;
  userId: string; // compatibility alias
  type: TransactionType;
  amount: number;
  currency: 'KWD';
  status: TransactionStatus;
  reference_id?: string;
  referenceId: string; // compatibility alias
  created_at?: string;
  createdAt: string; // compatibility alias
  processed_at?: string | null;

  // Rich metadata
  username?: string;
  description?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // user id or 'all'
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'financial';
  read: boolean;
  createdAt: string;
}

export interface CustomerSupportLink {
  id: string;
  title: string;
  type: 'telegram' | 'telegram_group' | 'whatsapp' | 'email' | 'phone' | 'other';
  value: string;
  link: string;
  enabled: boolean;
  description?: string;
  badge?: string;
  order?: number;
}

export interface GlobalSettings {
  currency: string;
  currencySymbol: string;
  depositRatePkr: number; // default: 911
  withdrawalRatePkr: number; // default: 911
  pkrRate?: number;
  minDepositKwd: number; // default: 30
  maxDepositKwd: number; // default: 5000
  minWithdrawalKwd: number; // default: 10
  maxWithdrawalKwd: number; // default: 2000
  withdrawalFeePercent: number; // default: 0
  referralCommissionPercent: number; // default: 10
  referralCommissionMode?: 'plan_activation' | 'deposit' | 'both'; // default: 'plan_activation'
  defaultInvestmentDuration: number; // default: 45
  telegramUrl?: string;
  telegramGroupUrl?: string;
  whatsappUrl?: string;
  whatsappNumber?: string;
  supportPhone?: string;
  supportEmail?: string;
  jazzcashNumber?: string;
  jazzcashTitle?: string;
  easypaisaNumber?: string;
  easypaisaTitle?: string;
  usdtAddress?: string;
  usdtTitle?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  admin_id?: string;
  admin: string; // compatibility alias
  action: string;
  target_user_id?: string | null;
  affectedUser?: string; // compatibility alias
  metadata?: Record<string, any>;
  timestamp: string;
  amount?: number;
  beforeValue?: string;
  afterValue?: string;
  reason?: string;
  status: string;
  referenceId?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'super_admin';
  permissions?: string[];
}

export interface DashboardStats {
  totalInvestment: number;
  totalWithdraw: number;
  totalProfit: number;
  referralEarnings: number;
  pendingWithdrawal: number;
  pendingDeposit: number;
  teamSize: number;
  teamInvestment: number;
}

export type DepositRecord = DepositRequest;
export type WithdrawalRecord = WithdrawalRequest;
export type DepositMethodConfig = DepositMethod;
export type WithdrawalNetworkConfig = WithdrawalNetwork;
export type PlatformSettings = GlobalSettings & {
  telegramUrl?: string;
  telegramGroupUrl?: string;
  whatsappUrl?: string;
  supportEmail?: string;
};

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  totalPlatformBalance: number;
  totalDeposits: number;
  pendingDepositsCount: number;
  pendingDepositsValue: number;
  totalWithdrawals: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsValue: number;
  totalActiveInvestments: number;
  totalInvestmentCapital: number;
  totalProfitsDistributed: number;
  totalReferralCommissions: number;
}
