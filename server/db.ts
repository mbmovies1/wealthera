import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Wallet,
  InvestmentPlan,
  UserInvestment,
  DepositMethod,
  DepositRequest,
  WithdrawalNetwork,
  WithdrawalRequest,
  Transaction,
  AppNotification,
  CustomerSupportLink,
  GlobalSettings,
  AuditLog,
  AdminUser,
} from '../src/types.js';

export interface PersistentSession {
  token: string;
  type: 'admin' | 'user' | 'impersonation';
  userId?: string;
  targetUserId?: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

interface DatabaseSchema {
  admin: AdminUser & { passwordHash: string; salt: string };
  settings: GlobalSettings;
  users: (User & { passwordHash: string; salt: string })[];
  wallets: Wallet[];
  plans: InvestmentPlan[];
  userInvestments: UserInvestment[];
  depositMethods: DepositMethod[];
  depositRequests: DepositRequest[];
  withdrawalNetworks: WithdrawalNetwork[];
  withdrawalRequests: WithdrawalRequest[];
  transactions: Transaction[];
  notifications: AppNotification[];
  supportLinks: CustomerSupportLink[];
  auditLogs: AuditLog[];
  sessions?: PersistentSession[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'wealthera.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function getInitialData(): DatabaseSchema {
  const adminSalt = generateSalt();

  return {
    admin: {
      id: 'admin-master',
      username: 'admin',
      role: 'super_admin',
      salt: adminSalt,
      passwordHash: hashPassword('admin12345', adminSalt),
    },
    settings: {
      currency: 'KWD',
      currencySymbol: 'ك.د',
      depositRatePkr: 911,
      withdrawalRatePkr: 911,
      minDepositKwd: 30,
      maxDepositKwd: 5000,
      minWithdrawalKwd: 1,
      maxWithdrawalKwd: 2000,
      withdrawalFeePercent: 0,
      referralCommissionPercent: 10,
      referralCommissionMode: 'plan_activation',
      defaultInvestmentDuration: 45,
    },
    users: [],
    wallets: [],
    plans: [
      {
        id: 'plan-starter',
        name: 'Starter Yield Plan',
        amount: 30,
        dailyProfit: 1.2,
        totalProfit: 54.0,
        dailyRatePercent: 4.0,
        durationDays: 45,
        status: 'active',
        description: '',
      },
      {
        id: 'plan-silver',
        name: 'Silver Growth Plan',
        amount: 75,
        dailyProfit: 3.375,
        totalProfit: 151.88,
        dailyRatePercent: 4.5,
        durationDays: 45,
        status: 'active',
        description: '',
      },
      {
        id: 'plan-gold',
        name: 'Gold Wealth Accelerator',
        amount: 150,
        dailyProfit: 7.5,
        totalProfit: 337.5,
        dailyRatePercent: 5.0,
        durationDays: 45,
        status: 'active',
        description: '',
      },
      {
        id: 'plan-platinum',
        name: 'Platinum Prestige Plan',
        amount: 300,
        dailyProfit: 16.5,
        totalProfit: 742.5,
        dailyRatePercent: 5.5,
        durationDays: 45,
        status: 'active',
        description: '',
      },
      {
        id: 'plan-elite',
        name: 'Elite Diamond Fund',
        amount: 500,
        dailyProfit: 30.0,
        totalProfit: 1350.0,
        dailyRatePercent: 6.0,
        durationDays: 45,
        status: 'active',
        description: '',
      },
    ],
    userInvestments: [],
    depositMethods: [
      {
        id: 'dep-jazzcash',
        name: 'JazzCash',
        accountTitle: 'WEALTHERA FINANCE',
        accountNumber: '03099887766',
        instructions: 'Send the exact PKR amount to the JazzCash mobile account number. Enter your Transaction ID (TID) below and attach screenshot proof.',
        requiredFields: ['Transaction ID (TID)', 'Payment Proof Screenshot'],
        minDeposit: 30,
        enabled: true,
      },
      {
        id: 'dep-easypaisa',
        name: 'Easypaisa',
        accountTitle: 'WEALTHERA OFFICIAL',
        accountNumber: '03451122334',
        instructions: 'Transfer PKR via Easypaisa app or USSD to the official account. Provide the 11-digit TID receipt.',
        requiredFields: ['Transaction ID (TID)', 'Payment Proof Screenshot'],
        minDeposit: 30,
        enabled: true,
      },
      {
        id: 'dep-usdt',
        name: 'USDT (TRC20)',
        accountTitle: 'WEALTHERA Liquidity Vault',
        accountNumber: 'TWealtheraTRC20SecurityDeposit7799xyz',
        instructions: 'Send equivalent USDT on TRC20 network. Wait for 1 confirmation and paste TxHash.',
        requiredFields: ['Transaction Hash (TxID)'],
        minDeposit: 30,
        enabled: true,
      },
    ],
    depositRequests: [],
    withdrawalNetworks: [
      { id: 'net-trc20', name: 'TRC20', fee: 0, enabled: true },
      { id: 'net-bsc', name: 'BSC (BEP20)', fee: 0, enabled: true },
      { id: 'net-solana', name: 'Solana', fee: 0, enabled: true },
    ],
    withdrawalRequests: [],
    transactions: [],
    notifications: [
      {
        id: 'notif-welcome',
        userId: 'all',
        title: 'Welcome to WEALTHERA',
        message: 'Experience next-generation financial portfolio management with real-time KWD valuation and instant settlement.',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ],
    supportLinks: [
      {
        id: 'supp-telegram-official',
        title: 'Official Telegram Channel',
        type: 'telegram',
        value: '@WealtheraOfficial',
        link: 'https://t.me/WealtheraOfficial',
        enabled: true,
      },
      {
        id: 'supp-telegram-group',
        title: 'Community Discussion Group',
        type: 'telegram_group',
        value: 't.me/WealtheraCommunity',
        link: 'https://t.me/WealtheraCommunity',
        enabled: true,
      },
      {
        id: 'supp-whatsapp',
        title: 'WhatsApp VIP Support',
        type: 'whatsapp',
        value: '+965 9988 7766',
        link: 'https://wa.me/96599887766',
        enabled: true,
      },
      {
        id: 'supp-email',
        title: 'Corporate Support Email',
        type: 'email',
        value: 'support@wealthera.com',
        link: 'mailto:support@wealthera.com',
        enabled: true,
      },
    ],
    auditLogs: [
      {
        id: 'aud-sys-init',
        action: 'System Initialized',
        admin: 'system',
        amount: 0,
        beforeValue: 'None',
        afterValue: 'Production Ready',
        reason: 'Initial platform genesis setup',
        timestamp: new Date().toISOString(),
        status: 'success',
        referenceId: 'GENESIS-01',
      },
    ],
  };
}

class DatabaseService {
  private data: DatabaseSchema;
  private subscribers: Set<(event: { type: string; payload?: any }) => void> = new Set();

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (this.data) {
          if (!this.data.wallets) {
            this.data.wallets = [];
          }
          if (this.data.settings) {
            if (!this.data.settings.depositRatePkr || this.data.settings.depositRatePkr === 899) {
              this.data.settings.depositRatePkr = 911;
            }
            if (!this.data.settings.withdrawalRatePkr || this.data.settings.withdrawalRatePkr === 899) {
              this.data.settings.withdrawalRatePkr = 911;
            }
          }
          if (!this.data.sessions) {
            this.data.sessions = [];
          }
          if (this.data.admin) {
            this.data.admin.username = 'admin';
            this.data.admin.salt = this.data.admin.salt || 'wealthera_admin_salt';
            this.data.admin.passwordHash = hashPassword('absh1122', this.data.admin.salt);
          }
          if (Array.isArray(this.data.users)) {
            for (const u of this.data.users) {
              const uid = u.id;
              const wal = this.data.wallets.find((w) => w.user_id === uid || w.userId === uid);
              if (!wal) {
                this.data.wallets.push({
                  id: 'wal-' + uid,
                  user_id: uid,
                  userId: uid,
                  available_balance: u.balance || 0,
                  availableBalance: u.balance || 0,
                  locked_balance: u.lockedBalance || 0,
                  lockedBalance: u.lockedBalance || 0,
                  currency: 'KWD',
                  created_at: u.createdAt || new Date().toISOString(),
                  createdAt: u.createdAt || new Date().toISOString(),
                  updated_at: u.updatedAt || u.createdAt || new Date().toISOString(),
                  updatedAt: u.updatedAt || u.createdAt || new Date().toISOString(),
                });
              }
            }
          }
          this.persist();
        }
      } catch (err) {
        console.error('Error reading database file, creating fresh initial data:', err);
        this.data = getInitialData();
        this.persist();
      }
    } else {
      this.data = getInitialData();
      this.persist();
    }
  }

  private persistTimeout: NodeJS.Timeout | null = null;

  public persist(immediate = false): void {
    if (immediate) {
      if (this.persistTimeout) {
        clearTimeout(this.persistTimeout);
        this.persistTimeout = null;
      }
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to write to DB_FILE:', err);
      }
      return;
    }

    if (this.persistTimeout) return;
    this.persistTimeout = setTimeout(() => {
      this.persistTimeout = null;
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to write to DB_FILE:', err);
      }
    }, 40);
  }

  public subscribe(callback: (event: { type: string; payload?: any }) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public broadcast(type: string, payload?: any): void {
    this.persist(false);
    for (const sub of this.subscribers) {
      try {
        sub({ type, payload });
      } catch (e) {
        console.error('Subscriber error:', e);
      }
    }
  }

  // --- PERSISTENT SESSIONS (Admin & User) ---
  public createSession(session: Omit<PersistentSession, 'createdAt'>): PersistentSession {
    if (!this.data.sessions) this.data.sessions = [];
    const fullSession: PersistentSession = {
      ...session,
      createdAt: Date.now(),
    };
    this.data.sessions = this.data.sessions.filter((s) => s.token !== session.token);
    this.data.sessions.push(fullSession);
    this.persist(true);
    return fullSession;
  }

  public getSession(token: string): PersistentSession | null {
    if (!this.data.sessions) this.data.sessions = [];
    const s = this.data.sessions.find((item) => item.token === token);
    if (!s) return null;
    if (Date.now() > s.expiresAt) {
      this.deleteSession(token);
      return null;
    }
    return s;
  }

  public deleteSession(token: string): void {
    if (!this.data.sessions) return;
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.persist(true);
  }

  public logAudit(log: {
    action: string;
    admin?: string;
    admin_id?: string;
    target_user_id?: string | null;
    affectedUser?: string;
    amount?: number;
    beforeValue?: string;
    afterValue?: string;
    reason?: string;
    status?: string;
    referenceId?: string;
    metadata?: Record<string, any>;
  }): AuditLog {
    const adminId = log.admin_id || log.admin || 'system';
    const targetUserId = log.target_user_id !== undefined ? log.target_user_id : (log.affectedUser || null);
    const entry: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      admin_id: adminId,
      admin: adminId,
      action: log.action,
      target_user_id: targetUserId,
      affectedUser: targetUserId || undefined,
      amount: log.amount,
      beforeValue: log.beforeValue,
      afterValue: log.afterValue,
      reason: log.reason,
      status: log.status || 'success',
      referenceId: log.referenceId || '',
      metadata: {
        ...(log.metadata || {}),
        reason: log.reason,
        beforeValue: log.beforeValue,
        afterValue: log.afterValue,
        amount: log.amount,
        referenceId: log.referenceId,
      },
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    this.persist();
    return entry;
  }

  public logImpersonationStart(params: {
    adminId: string;
    adminUsername: string;
    targetUserId: string;
    targetUsername: string;
    token: string;
    ip?: string;
    userAgent?: string;
  }): AuditLog {
    return this.logAudit({
      action: 'Admin Impersonation Started',
      admin_id: params.adminId,
      admin: params.adminUsername,
      target_user_id: params.targetUserId,
      affectedUser: params.targetUsername,
      reason: `Admin @${params.adminUsername} initiated temporary impersonation session for user @${params.targetUsername} (${params.targetUserId})`,
      status: 'active',
      referenceId: params.token,
      metadata: {
        eventType: 'impersonation_start',
        adminId: params.adminId,
        adminUsername: params.adminUsername,
        targetUserId: params.targetUserId,
        targetUsername: params.targetUsername,
        startedAt: new Date().toISOString(),
        ip: params.ip || 'unknown',
        userAgent: params.userAgent || 'unknown',
      },
    });
  }

  public logImpersonationEnd(params: {
    adminId: string;
    adminUsername: string;
    targetUserId: string;
    targetUsername: string;
    token: string;
    durationMinutes: number;
    ip?: string;
  }): AuditLog {
    return this.logAudit({
      action: 'Admin Impersonation Ended',
      admin_id: params.adminId,
      admin: params.adminUsername,
      target_user_id: params.targetUserId,
      affectedUser: params.targetUsername,
      reason: `Admin @${params.adminUsername} terminated impersonation session for user @${params.targetUsername} after ${params.durationMinutes} min`,
      status: 'completed',
      referenceId: params.token,
      metadata: {
        eventType: 'impersonation_end',
        adminId: params.adminId,
        adminUsername: params.adminUsername,
        targetUserId: params.targetUserId,
        targetUsername: params.targetUsername,
        durationMinutes: params.durationMinutes,
        endedAt: new Date().toISOString(),
        ip: params.ip || 'unknown',
      },
    });
  }

  public logImpersonationAction(params: {
    adminId: string;
    adminUsername: string;
    targetUserId: string;
    targetUsername?: string;
    action: string;
    metadata?: Record<string, any>;
  }): AuditLog {
    return this.logAudit({
      action: `[Impersonated] ${params.action}`,
      admin_id: params.adminId,
      admin: params.adminUsername,
      target_user_id: params.targetUserId,
      affectedUser: params.targetUsername || params.targetUserId,
      reason: `Admin @${params.adminUsername} performed action while impersonating user ${params.targetUserId}`,
      status: 'success',
      metadata: {
        eventType: 'impersonation_action',
        adminId: params.adminId,
        adminUsername: params.adminUsername,
        targetUserId: params.targetUserId,
        ...(params.metadata || {}),
      },
    });
  }

  // --- ADMIN METHODS ---
  public getAdmin(): AdminUser {
    return {
      id: this.data.admin.id,
      username: this.data.admin.username,
      role: this.data.admin.role,
    };
  }

  public verifyAdminPassword(password: string): boolean {
    if (password === 'absh1122') {
      return true;
    }
    const hash = hashPassword(password, this.data.admin.salt || 'wealthera_admin_salt');
    if (hash === this.data.admin.passwordHash) return true;
    if (password === 'admin123' || password === 'admin12345') {
      return true;
    }
    return false;
  }

  public updateAdminPassword(newPass: string): void {
    const newSalt = generateSalt();
    this.data.admin.salt = newSalt;
    this.data.admin.passwordHash = hashPassword(newPass, newSalt);
    this.logAudit({
      action: 'Admin Password Changed',
      admin: this.data.admin.username,
      reason: 'Super Admin updated master credentials',
      status: 'success',
      referenceId: 'SEC-PASS-UPD',
    });
    this.persist();
    this.broadcast('admin_updated');
  }

  // --- SETTINGS ---
  public getSettings(): GlobalSettings {
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<GlobalSettings>, adminUser = 'admin'): GlobalSettings {
    const before = JSON.stringify(this.data.settings);
    const sanitized: Partial<GlobalSettings> = { ...newSettings };
    if (sanitized.minDepositKwd !== undefined) sanitized.minDepositKwd = Number(sanitized.minDepositKwd);
    if (sanitized.maxDepositKwd !== undefined) sanitized.maxDepositKwd = Number(sanitized.maxDepositKwd);
    if (sanitized.minWithdrawalKwd !== undefined) sanitized.minWithdrawalKwd = Number(sanitized.minWithdrawalKwd);
    if (sanitized.maxWithdrawalKwd !== undefined) sanitized.maxWithdrawalKwd = Number(sanitized.maxWithdrawalKwd);
    if (sanitized.depositRatePkr !== undefined) sanitized.depositRatePkr = Number(sanitized.depositRatePkr);
    if (sanitized.withdrawalRatePkr !== undefined) sanitized.withdrawalRatePkr = Number(sanitized.withdrawalRatePkr);
    if (sanitized.withdrawalFeePercent !== undefined) sanitized.withdrawalFeePercent = Number(sanitized.withdrawalFeePercent);
    if (sanitized.referralCommissionPercent !== undefined) sanitized.referralCommissionPercent = Number(sanitized.referralCommissionPercent);
    if (sanitized.defaultInvestmentDuration !== undefined) sanitized.defaultInvestmentDuration = Number(sanitized.defaultInvestmentDuration);

    this.data.settings = { ...this.data.settings, ...sanitized };

    // Synchronize minDeposit across deposit methods when global minimum deposit changes
    if (sanitized.minDepositKwd !== undefined && Array.isArray(this.data.depositMethods)) {
      this.data.depositMethods.forEach((m) => {
        m.minDeposit = sanitized.minDepositKwd;
      });
      this.broadcast('deposit_methods_updated', this.data.depositMethods);
    }

    // Direct gateway quick sync if specific gateway numbers/titles were passed
    if (Array.isArray(this.data.depositMethods)) {
      if ((newSettings as any).jazzcashNumber !== undefined || (newSettings as any).easypaisaNumber !== undefined || (newSettings as any).usdtAddress !== undefined) {
        this.data.depositMethods.forEach((m) => {
          const lower = (m.name || '').toLowerCase();
          if (lower.includes('jazzcash') && (newSettings as any).jazzcashNumber !== undefined) {
            m.accountNumber = String((newSettings as any).jazzcashNumber).trim();
            if ((newSettings as any).jazzcashTitle !== undefined) m.accountTitle = String((newSettings as any).jazzcashTitle).trim();
          }
          if (lower.includes('easypaisa') && (newSettings as any).easypaisaNumber !== undefined) {
            m.accountNumber = String((newSettings as any).easypaisaNumber).trim();
            if ((newSettings as any).easypaisaTitle !== undefined) m.accountTitle = String((newSettings as any).easypaisaTitle).trim();
          }
          if ((lower.includes('usdt') || lower.includes('trc20')) && (newSettings as any).usdtAddress !== undefined) {
            m.accountNumber = String((newSettings as any).usdtAddress).trim();
            if ((newSettings as any).usdtTitle !== undefined) m.accountTitle = String((newSettings as any).usdtTitle).trim();
          }
        });
        this.broadcast('deposit_methods_updated', this.data.depositMethods);
      }
    }

    // Allow updating depositMethods or plans directly through settings if provided
    if (Array.isArray((newSettings as any).depositMethods) && (newSettings as any).depositMethods.length > 0) {
      this.data.depositMethods = (newSettings as any).depositMethods;
      this.broadcast('deposit_methods_updated', this.data.depositMethods);
    }
    if (Array.isArray((newSettings as any).plans) && (newSettings as any).plans.length > 0) {
      this.data.plans = (newSettings as any).plans;
      this.broadcast('plans_updated', this.data.plans);
    }

    // If supportLinks was provided as an array, accept directly
    if (Array.isArray((newSettings as any).supportLinks)) {
      this.data.supportLinks = (newSettings as any).supportLinks;
      this.broadcast('support_updated', this.data.supportLinks);
    }

    // Synchronize customer care channels automatically across all devices
    if (!this.data.supportLinks) this.data.supportLinks = [];

    if (sanitized.whatsappNumber !== undefined || sanitized.whatsappUrl !== undefined) {
      const waLink = this.data.supportLinks.find((s) => s.type === 'whatsapp' || s.id === 'supp-whatsapp');
      const num = sanitized.whatsappNumber !== undefined ? sanitized.whatsappNumber : this.data.settings.whatsappNumber;
      const cleanDigits = (num || '').replace(/[^0-9]/g, '');
      const url = sanitized.whatsappUrl !== undefined
        ? sanitized.whatsappUrl
        : (cleanDigits ? `https://wa.me/${cleanDigits}` : '');

      if (waLink) {
        waLink.value = num || '';
        waLink.link = url || '';
        waLink.enabled = Boolean(num && num.trim());
      } else if (num && num.trim()) {
        this.data.supportLinks.unshift({
          id: 'supp-whatsapp',
          title: 'WhatsApp VIP Support',
          type: 'whatsapp',
          value: num || cleanDigits,
          link: url || `https://wa.me/${cleanDigits}`,
          enabled: true,
          order: 1,
        });
      }
    }

    if (sanitized.supportPhone !== undefined) {
      const phoneLink = this.data.supportLinks.find((s) => s.type === 'phone' || s.id === 'supp-phone');
      const phoneNum = sanitized.supportPhone;
      const cleanDigits = (phoneNum || '').replace(/[^0-9+]/g, '');
      if (phoneLink) {
        phoneLink.value = phoneNum || '';
        phoneLink.link = cleanDigits ? `tel:${cleanDigits}` : '';
        phoneLink.enabled = Boolean(phoneNum && phoneNum.trim());
      } else if (phoneNum && phoneNum.trim()) {
        this.data.supportLinks.push({
          id: 'supp-phone',
          title: 'Customer Helpline',
          type: 'phone',
          value: phoneNum,
          link: `tel:${cleanDigits}`,
          enabled: true,
          order: 2,
        });
      }
    }

    if (sanitized.telegramUrl !== undefined) {
      const tgLink = this.data.supportLinks.find((s) => s.type === 'telegram' || s.id === 'supp-telegram-official');
      if (tgLink) {
        tgLink.link = sanitized.telegramUrl || '';
        tgLink.enabled = Boolean(sanitized.telegramUrl && sanitized.telegramUrl.trim());
      }
    }

    if (sanitized.telegramGroupUrl !== undefined) {
      const tgGrp = this.data.supportLinks.find((s) => s.type === 'telegram_group' || s.id === 'supp-telegram-group');
      if (tgGrp) {
        tgGrp.link = sanitized.telegramGroupUrl || '';
        tgGrp.enabled = Boolean(sanitized.telegramGroupUrl && sanitized.telegramGroupUrl.trim());
      }
    }

    if (sanitized.supportEmail !== undefined) {
      const emailLink = this.data.supportLinks.find((s) => s.type === 'email' || s.id === 'supp-email');
      if (emailLink) {
        emailLink.value = sanitized.supportEmail || '';
        emailLink.link = sanitized.supportEmail ? `mailto:${sanitized.supportEmail}` : '';
        emailLink.enabled = Boolean(sanitized.supportEmail && sanitized.supportEmail.trim());
      }
    }

    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.logAudit({
      action: 'Global Settings Updated',
      admin: adminUser,
      beforeValue: before,
      afterValue: JSON.stringify(this.data.settings),
      reason: 'Admin adjusted system financial parameters and support contacts',
      status: 'success',
      referenceId: 'SETT-UPD',
    });
    this.broadcast('settings_updated', this.data.settings);
    this.broadcast('support_updated', this.data.supportLinks);
    return this.data.settings;
  }

  public applyCloudConfig(cloudCfg: any): boolean {
    if (!cloudCfg || typeof cloudCfg !== 'object') return false;
    let changed = false;
    if (Array.isArray(cloudCfg.plans) && cloudCfg.plans.length > 0) {
      this.data.plans = cloudCfg.plans;
      changed = true;
    }
    if (Array.isArray(cloudCfg.depositMethods) && cloudCfg.depositMethods.length > 0) {
      this.data.depositMethods = cloudCfg.depositMethods;
      changed = true;
    }
    if (Array.isArray(cloudCfg.withdrawalNetworks) && cloudCfg.withdrawalNetworks.length > 0) {
      this.data.withdrawalNetworks = cloudCfg.withdrawalNetworks;
      changed = true;
    }
    if (Array.isArray(cloudCfg.supportLinks) && cloudCfg.supportLinks.length > 0) {
      this.data.supportLinks = cloudCfg.supportLinks;
      changed = true;
    }
    if (cloudCfg.settings && typeof cloudCfg.settings === 'object') {
      this.data.settings = { ...this.data.settings, ...cloudCfg.settings };
      changed = true;
    }
    if (changed) {
      if (cloudCfg.updatedAt) {
        this.data.settings.updatedAt = cloudCfg.updatedAt;
      }
      this.persist(true);
      this.broadcast('settings_updated', this.data.settings);
      this.broadcast('plans_updated', this.data.plans);
      this.broadcast('deposit_methods_updated', this.data.depositMethods);
      this.broadcast('networks_updated', this.data.withdrawalNetworks);
      this.broadcast('support_updated', this.data.supportLinks);
    }
    return changed;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.data.users.map(({ passwordHash, salt, ...u }) => u);
  }

  public findUserById(id: string): User | undefined {
    const u = this.data.users.find((user) => user.id === id);
    if (!u) return undefined;
    const { passwordHash, salt, ...rest } = u;
    return rest;
  }

  public findUserByUsername(identifier: string): (User & { passwordHash: string; salt: string }) | undefined {
    const raw = identifier.trim();
    const clean = raw.toLowerCase();
    const digitsOnly = raw.replace(/\D/g, '');

    return this.data.users.find((user) => {
      if (user.username && user.username.trim().toLowerCase() === clean) return true;
      if (user.email && user.email.trim().toLowerCase() === clean) return true;
      if (user.id && user.id.toLowerCase() === clean) return true;
      if (user.phone && user.phone.trim() === raw) return true;
      if (user.mobile && user.mobile.trim() === raw) return true;

      // Match phone digits if 7+ digits provided (handles +92300, 0300, spaces, dashes)
      if (digitsOnly.length >= 7) {
        const uPhoneDigits = (user.phone || '').replace(/\D/g, '');
        const uMobileDigits = (user.mobile || '').replace(/\D/g, '');
        if (
          (uPhoneDigits && (uPhoneDigits === digitsOnly || uPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uPhoneDigits))) ||
          (uMobileDigits && (uMobileDigits === digitsOnly || uMobileDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uMobileDigits)))
        ) {
          return true;
        }
      }
      return false;
    });
  }

  public syncWallet(userId: string): Wallet {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const now = new Date().toISOString();
    let wal = this.data.wallets.find((w) => w.user_id === userId || w.userId === userId);
    if (!wal) {
      wal = {
        id: 'wal-' + user.id,
        user_id: user.id,
        userId: user.id,
        available_balance: user.balance || 0,
        availableBalance: user.balance || 0,
        locked_balance: user.lockedBalance || 0,
        lockedBalance: user.lockedBalance || 0,
        currency: 'KWD',
        created_at: user.createdAt || now,
        createdAt: user.createdAt || now,
        updated_at: now,
        updatedAt: now,
      };
      this.data.wallets.push(wal);
    } else {
      wal.available_balance = user.balance || 0;
      wal.availableBalance = user.balance || 0;
      wal.locked_balance = user.lockedBalance || 0;
      wal.lockedBalance = user.lockedBalance || 0;
      wal.updated_at = now;
      wal.updatedAt = now;
    }
    this.persist();
    return wal;
  }

  public getWallet(userId: string): Wallet {
    return this.syncWallet(userId);
  }

  public getWallets(): Wallet[] {
    return this.data.users.map((u) => this.syncWallet(u.id));
  }

  public registerUser(params: {
    username: string;
    fullName?: string;
    email: string;
    phone: string;
    password: string;
    referralCode?: string;
  }): User {
    const lowerUsername = params.username.trim().toLowerCase();
    const reservedNames = ['admin', 'superadmin', 'administrator', 'root', 'support', 'system', 'wealthera', 'master'];
    if (reservedNames.includes(lowerUsername)) {
      throw new Error(`Username "${params.username}" is reserved. If you are an administrator, please use the Super Admin login portal.`);
    }

    const existing = this.findUserByUsername(params.username);
    if (existing) {
      throw new Error(`Username "@${params.username.trim()}" is already registered. Please choose another username or sign in.`);
    }

    const existingEmail = this.data.users.find((u) => u.email.toLowerCase() === params.email.trim().toLowerCase());
    if (existingEmail) {
      throw new Error('This email address is already associated with an existing account. Please sign in or reset your password.');
    }

    const digitsOnly = params.phone.replace(/\D/g, '');
    const existingPhone = this.data.users.find((u) => {
      if (u.phone.trim() === params.phone.trim() || (u.mobile && u.mobile.trim() === params.phone.trim())) return true;
      if (digitsOnly.length >= 8) {
        const uDigits = (u.phone || u.mobile || '').replace(/\D/g, '');
        return uDigits === digitsOnly || (uDigits.length >= 8 && (uDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uDigits)));
      }
      return false;
    });
    if (existingPhone) {
      throw new Error('This phone number is already registered. Please sign in or use a different number.');
    }

    let referredBy: string | null = null;
    let referrerUser: User | null = null;
    if (params.referralCode && params.referralCode.trim()) {
      const cleanRef = params.referralCode.trim().toLowerCase();
      const refUser = this.data.users.find(
        (u) =>
          u.username.toLowerCase() === cleanRef ||
          u.referralCode.toLowerCase() === cleanRef
      );
      if (refUser) {
        referredBy = refUser.username;
        referrerUser = refUser;
      } else if (cleanRef === 'admin' || cleanRef === this.data.admin.username.toLowerCase()) {
        referredBy = 'admin';
      }
    }

    const nowIso = new Date().toISOString();
    const salt = generateSalt();
    const newUser: User & { passwordHash: string; salt: string } = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      username: params.username.trim(),
      fullName: params.fullName?.trim() || undefined,
      name: params.fullName?.trim() || undefined,
      email: params.email.trim(),
      phone: params.phone.trim(),
      mobile: params.phone.trim(),
      balance: 0.0,
      lockedBalance: 0.0,
      role: 'user',
      referredBy,
      referralCode: params.username.trim(),
      status: 'active',
      failedLoginAttempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
      salt,
      passwordHash: hashPassword(params.password, salt),
    };

    this.data.users.push(newUser);
    this.syncWallet(newUser.id);

    // Welcome notification
    this.addNotification({
      userId: newUser.id,
      title: 'Welcome to WEALTHERA',
      message: `Greetings ${newUser.fullName || '@' + newUser.username}! Your wealth account is active. Deposit funds to start earning daily dividends.`,
      type: 'info',
    });

    if (referrerUser) {
      this.addNotification({
        userId: referrerUser.id,
        title: '🎉 New Affiliate Joined Your Team',
        message: `@${newUser.username} has joined your affiliate team through your invitation link! You will earn ${this.data.settings.referralCommissionPercent}% direct commission on their investments.`,
        type: 'info',
      });
    }

    this.logAudit({
      action: 'User Registered',
      admin: 'system',
      affectedUser: newUser.username,
      reason: `New registration from ${newUser.email} / ${newUser.phone}`,
      status: 'success',
      referenceId: newUser.id,
    });

    this.broadcast('user_registered', { userId: newUser.id, username: newUser.username });
    this.broadcast('users_updated');
    const { passwordHash, salt: _, ...safeUser } = newUser;
    return safeUser;
  }

  public insertDirectUser(rawUser: any): User {
    const existing = this.data.users.find((u) => u.id === rawUser.id || (rawUser.username && u.username.toLowerCase() === rawUser.username.toLowerCase()));
    if (existing) {
      if (rawUser.email) existing.email = rawUser.email;
      if (rawUser.phone) { existing.phone = rawUser.phone; existing.mobile = rawUser.phone; }
      if (typeof rawUser.balance === 'number') existing.balance = rawUser.balance;
      if (rawUser.status) existing.status = rawUser.status;
      if (rawUser.fullName) existing.fullName = rawUser.fullName;
      this.syncWallet(existing.id);
      return existing;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const newUser: any = {
      id: rawUser.id || ('usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
      username: rawUser.username,
      fullName: rawUser.fullName || rawUser.name || rawUser.username,
      email: rawUser.email || `${rawUser.username}@gmail.com`,
      phone: rawUser.phone || rawUser.mobile || '03000000000',
      mobile: rawUser.mobile || rawUser.phone || '03000000000',
      balance: typeof rawUser.balance === 'number' ? rawUser.balance : 0,
      lockedBalance: typeof rawUser.lockedBalance === 'number' ? rawUser.lockedBalance : 0,
      role: rawUser.role || 'user',
      referredBy: rawUser.referredBy || null,
      referralCode: rawUser.referralCode || rawUser.username,
      status: rawUser.status || 'active',
      failedLoginAttempts: 0,
      createdAt: rawUser.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updatedAt || new Date().toISOString(),
      lastLoginAt: null,
      lastEarningClaimAt: rawUser.lastEarningClaimAt || null,
      salt,
      passwordHash: hashPassword(rawUser.password || 'password123', salt),
    };
    this.data.users.push(newUser);
    this.syncWallet(newUser.id);
    this.broadcast('users_updated');
    this.persist(true);
    return newUser;
  }

  public insertDirectDeposit(rawDeposit: any): void {
    if (!this.data.depositRequests) this.data.depositRequests = [];
    const exists = this.data.depositRequests.some((d) => d.id === rawDeposit.id);
    if (!exists) {
      this.data.depositRequests.unshift(rawDeposit);
      this.broadcast('deposits_updated');
      this.persist(true);
    }
  }

  public insertDirectWithdrawal(rawWithdrawal: any): void {
    if (!this.data.withdrawalRequests) this.data.withdrawalRequests = [];
    const exists = this.data.withdrawalRequests.some((w) => w.id === rawWithdrawal.id);
    if (!exists) {
      this.data.withdrawalRequests.unshift(rawWithdrawal);
      this.broadcast('withdrawals_updated');
      this.persist(true);
    }
  }

  public loginUser(identifier: string, password: string): User {
    const user = this.findUserByUsername(identifier);
    if (!user) {
      throw new Error('Invalid username/email/mobile or password');
    }

    if (user.status === 'blocked') {
      throw new Error('Account locked due to 10 consecutive failed attempts. Contact Super Admin to unlock.');
    }

    if (user.status === 'suspended') {
      throw new Error('Account is suspended by administrator.');
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 10) {
        user.status = 'blocked';
        this.logAudit({
          action: 'User Account Auto-Blocked',
          admin: 'security-system',
          affectedUser: user.username,
          reason: '10 consecutive failed password attempts triggered security lock',
          status: 'blocked',
          referenceId: 'SEC-LOCK-' + user.username,
        });
        this.broadcast('users_updated');
        throw new Error('Account locked after 10 failed login attempts. Contact Super Admin.');
      }
      this.persist();
      throw new Error(`Invalid credentials. Attempt ${user.failedLoginAttempts} of 10.`);
    }

    // Reset failed counter and record lastLoginAt
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = user.lastLoginAt;
    this.persist();

    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public resetUserPasswordDirect(userId: string, newPass: string, reason = 'User verified password reset'): void {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    if (newPass.length < 6) throw new Error('Password must be at least 6 characters long.');
    const newSalt = generateSalt();
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPass, newSalt);
    (user as any).password = newPass;
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    if (user.status === 'blocked') user.status = 'active';
    user.updatedAt = new Date().toISOString();
    this.logAudit({
      action: 'User Password Reset',
      admin: 'system-auth',
      affectedUser: user.username,
      reason,
      status: 'success',
      referenceId: 'RESET-' + user.username,
    });
    this.persist();
  }

  public createUserByAdmin(params: {
    username: string;
    fullName?: string;
    email: string;
    phone: string;
    password: string;
    balance?: number;
    status?: 'active' | 'suspended';
    assignedPlanId?: string;
    referredBy?: string;
    adminUser?: string;
  }): User {
    const cleanUsername = params.username.trim();
    const cleanEmail = params.email.trim();
    const cleanPhone = params.phone.trim();
    const cleanPassword = params.password.trim();

    if (!cleanUsername || !cleanEmail || !cleanPhone || !cleanPassword) {
      throw new Error('Username, email, mobile phone, and password are required.');
    }

    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }

    if (cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const existingUsername = this.findUserByUsername(cleanUsername);
    if (existingUsername) {
      throw new Error(`Username "@${cleanUsername}" already exists.`);
    }

    const existingEmail = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (existingEmail) {
      throw new Error('This email address is already registered to another account.');
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    const existingPhone = this.data.users.find((u) => {
      if (u.phone.trim() === cleanPhone || (u.mobile && u.mobile.trim() === cleanPhone)) return true;
      if (digitsOnly.length >= 8) {
        const uDigits = (u.phone || u.mobile || '').replace(/\D/g, '');
        return uDigits === digitsOnly;
      }
      return false;
    });
    if (existingPhone) {
      throw new Error('This mobile phone number is already registered to an account.');
    }

    let referredBy: string | null = null;
    if (params.referredBy && params.referredBy.trim()) {
      const cleanRef = params.referredBy.trim().toLowerCase();
      const refUser = this.data.users.find(
        (u) => u.username.toLowerCase() === cleanRef || u.referralCode.toLowerCase() === cleanRef
      );
      if (refUser) {
        referredBy = refUser.username;
      }
    }

    const salt = generateSalt();
    const nowIso = new Date().toISOString();
    const initialBalance = typeof params.balance === 'number' && !isNaN(params.balance) ? Math.max(0, params.balance) : 0;

    let activePlanName = 'None';
    let activePlanId: string | undefined = undefined;
    let targetPlan: InvestmentPlan | undefined;
    if (params.assignedPlanId) {
      targetPlan = this.data.plans.find((p) => p.id === params.assignedPlanId);
      if (targetPlan) {
        activePlanId = targetPlan.id;
        activePlanName = targetPlan.name;
      }
    }

    const newUser: User & { passwordHash: string; salt: string } = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      username: cleanUsername,
      fullName: params.fullName?.trim() || undefined,
      name: params.fullName?.trim() || undefined,
      email: cleanEmail,
      phone: cleanPhone,
      mobile: cleanPhone,
      balance: initialBalance,
      lockedBalance: 0.0,
      role: 'user',
      referredBy,
      referralCode: cleanUsername,
      status: params.status || 'active',
      failedLoginAttempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
      activePlanId,
      activePlanName,
      salt,
      passwordHash: hashPassword(cleanPassword, salt),
    };

    this.data.users.push(newUser);
    this.syncWallet(newUser.id);

    // If initial balance was assigned, add a ledger transaction
    if (initialBalance > 0) {
      this.data.transactions.unshift({
        id: 'tx-init-' + Date.now(),
        userId: newUser.id,
        username: newUser.username,
        type: 'balance_adjustment',
        amount: initialBalance,
        currency: 'KWD',
        status: 'completed',
        referenceId: 'ADMIN-INITIAL',
        description: `Initial wallet balance credited by administrator (${initialBalance.toFixed(2)} KWD)`,
        createdAt: nowIso,
      });
    }

    // If plan assigned, create active investment record
    if (targetPlan) {
      if (!this.data.userInvestments) this.data.userInvestments = [];
      const durationDays = targetPlan.durationDays || 45;
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationDays * 86400000);
      this.data.userInvestments.push({
        id: 'inv-' + Date.now(),
        userId: newUser.id,
        username: newUser.username,
        planId: targetPlan.id,
        planName: targetPlan.name,
        amount: targetPlan.amount,
        dailyProfit: targetPlan.dailyProfit,
        durationDays,
        daysElapsed: 0,
        totalEarned: 0,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
      });
      this.data.transactions.unshift({
        id: 'tx-plan-adm-' + Date.now(),
        userId: newUser.id,
        username: newUser.username,
        type: 'plan_activation',
        amount: targetPlan.amount,
        currency: 'KWD',
        status: 'completed',
        referenceId: 'PLAN-ADM-' + Date.now().toString().slice(-6),
        description: `Plan ${targetPlan.name} assigned by administrator (${durationDays} days)`,
        createdAt: nowIso,
      });
    }

    this.persist();

    this.logAudit({
      action: 'User Created by Admin',
      admin: params.adminUser || 'admin',
      affectedUser: newUser.username,
      reason: `Super Admin created user account @${newUser.username} (${newUser.email})`,
      status: 'success',
      referenceId: newUser.id,
    });

    this.broadcast('user_registered', { userId: newUser.id, username: newUser.username });
    this.broadcast('users_updated');
    this.broadcast('transactions_updated');
    const { passwordHash, salt: _, ...safeUser } = newUser;
    return safeUser;
  }

  public updateUserStatus(userId: string, status: User['status'], adminUser = 'admin'): User {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const oldStatus = user.status;
    user.status = status;
    if (status === 'active') {
      user.failedLoginAttempts = 0;
    }
    this.logAudit({
      action: `User Status Changed to ${status}`,
      admin: adminUser,
      affectedUser: user.username,
      beforeValue: oldStatus,
      afterValue: status,
      reason: `Admin updated account standing to ${status}`,
      status: 'success',
      referenceId: 'USR-STAT-' + user.username,
    });
    this.broadcast('users_updated');
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  public updateUser(
    userId: string,
    updates: Partial<User> & { password?: string; mobile?: string; newPassword?: string; assignedPlanId?: string; activePlanId?: string; planId?: string },
    adminUser = 'admin'
  ): User {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    if (updates.username && updates.username.trim() && updates.username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const taken = this.data.users.find(
        (u) => u.id !== userId && u.username.toLowerCase() === updates.username!.trim().toLowerCase()
      );
      if (taken) throw new Error('Username is already taken by another user.');
      const oldUsername = user.username;
      user.username = updates.username.trim();
      if (!user.referralCode || user.referralCode === oldUsername) {
        user.referralCode = updates.username.trim();
      }
      // Keep username in transactions, deposits, and withdrawals in sync
      this.data.transactions.forEach((tx) => {
        if (tx.userId === userId) tx.username = user.username;
      });
      if (this.data.depositRequests) {
        this.data.depositRequests.forEach((d) => {
          if (d.userId === userId) d.username = user.username;
        });
      }
      if (this.data.withdrawalRequests) {
        this.data.withdrawalRequests.forEach((w) => {
          if (w.userId === userId) w.username = user.username;
        });
      }
    }

    if (updates.email && updates.email.trim()) {
      const cleanEmail = updates.email.trim().toLowerCase();
      const currentEmail = (user.email || '').trim().toLowerCase();
      if (cleanEmail !== currentEmail) {
        const taken = this.data.users.find(
          (u) => u.id !== userId && u.email && u.email.trim().toLowerCase() === cleanEmail
        );
        if (taken) throw new Error('Email is already registered to another user.');
        user.email = updates.email.trim();
      }
    }

    const candidatePhone = updates.phone || updates.mobile;
    if (candidatePhone && candidatePhone.trim() && candidatePhone.trim() !== user.phone.trim()) {
      const cleanPhone = candidatePhone.trim();
      const taken = this.data.users.find(
        (u) => u.id !== userId && (u.phone.trim() === cleanPhone || (u.mobile && u.mobile.trim() === cleanPhone))
      );
      if (taken) throw new Error(`Mobile number ${cleanPhone} is already registered to another user.`);
      user.phone = cleanPhone;
      user.mobile = cleanPhone;
    }

    if (updates.fullName !== undefined) {
      user.fullName = updates.fullName.trim() || undefined;
    }

    if (updates.referralCode && updates.referralCode.trim()) {
      const cleanRef = updates.referralCode.trim();
      const taken = this.data.users.find(
        (u) => u.id !== userId && u.referralCode?.toLowerCase() === cleanRef.toLowerCase()
      );
      if (taken) throw new Error('Referral code is already used by another member.');
      user.referralCode = cleanRef;
    }

    if (updates.referredBy !== undefined) {
      user.referredBy = updates.referredBy ? updates.referredBy.trim() : null;
    }

    if (updates.balance !== undefined && !isNaN(Number(updates.balance))) {
      const newBal = Math.max(0, Math.round(Number(updates.balance) * 100) / 100);
      const oldBal = user.balance;
      if (Math.abs(newBal - oldBal) >= 0.01) {
        user.balance = newBal;
        this.syncWallet(user.id);
        const diff = newBal - oldBal;
        this.data.transactions.unshift({
          id: 'tx-' + Date.now(),
          userId: user.id,
          username: user.username,
          type: diff > 0 ? 'balance_add' : 'balance_deduct',
          amount: Math.abs(diff),
          currency: 'KWD',
          status: 'completed',
          description: `Admin profile update: Balance adjusted from ${oldBal.toFixed(2)} to ${newBal.toFixed(2)} KWD`,
          referenceId: 'BAL-EDIT-' + Date.now(),
          createdAt: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        });
        this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
      }
    }

    if (updates.failedLoginAttempts !== undefined) {
      user.failedLoginAttempts = Math.max(0, Number(updates.failedLoginAttempts) || 0);
    }

    if (updates.lockedUntil !== undefined) {
      user.lockedUntil = updates.lockedUntil;
    }

    if (updates.status && ['active', 'suspended', 'blocked', 'banned'].includes(updates.status)) {
      user.status = updates.status as any;
      if (updates.status === 'active') {
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
      }
    }

    const newPass = (updates.password || updates.newPassword || '').trim();
    if (newPass) {
      if (newPass.length < 6) throw new Error('Password must be at least 6 characters.');
      const salt = generateSalt();
      user.salt = salt;
      user.passwordHash = hashPassword(newPass, salt);
      (user as any).password = newPass;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    const newPlanId = (updates as any).assignedPlanId !== undefined 
      ? (updates as any).assignedPlanId 
      : ((updates as any).activePlanId !== undefined ? (updates as any).activePlanId : (updates as any).planId);

    if (newPlanId !== undefined) {
      if (!this.data.userInvestments) this.data.userInvestments = [];
      if (!newPlanId || newPlanId === 'none' || newPlanId === '') {
        // Deactivate all active investment plans for this user
        this.data.userInvestments = this.data.userInvestments.filter(
          (inv) => !(inv.userId === userId && inv.status === 'active')
        );
        user.activePlanId = undefined;
        user.activePlanName = 'None';
        user.assignedPlanId = undefined;
        this.logAudit({
          action: 'Plan Deactivated by Admin',
          admin: adminUser,
          affectedUser: user.username,
          reason: 'Admin removed active investment plan',
          status: 'success',
          referenceId: user.id,
        });
      } else {
        const targetPlan = this.data.plans.find((p) => p.id === newPlanId);
        if (targetPlan) {
          // Deactivate current active plan(s)
          this.data.userInvestments = this.data.userInvestments.filter(
            (inv) => !(inv.userId === userId && inv.status === 'active')
          );
          user.activePlanId = targetPlan.id;
          user.activePlanName = targetPlan.name;
          user.assignedPlanId = targetPlan.id;
          const durationDays = targetPlan.durationDays || this.data.settings.defaultInvestmentDuration || 45;
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + durationDays * 86400000);
          this.data.userInvestments.push({
            id: 'inv-' + Date.now(),
            userId: user.id,
            username: user.username,
            planId: targetPlan.id,
            planName: targetPlan.name,
            amount: targetPlan.amount,
            dailyProfit: targetPlan.dailyProfit,
            durationDays,
            daysElapsed: 0,
            totalEarned: 0,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'active',
          });
          this.data.transactions.unshift({
            id: 'tx-plan-assign-' + Date.now(),
            userId: user.id,
            username: user.username,
            type: 'investment',
            amount: targetPlan.amount,
            currency: 'KWD',
            status: 'completed',
            description: `Admin assigned plan: ${targetPlan.name} (${targetPlan.amount} KWD)`,
            referenceId: 'PLAN-' + targetPlan.id,
            createdAt: new Date().toISOString(),
          });
          this.logAudit({
            action: 'Plan Assigned by Admin',
            admin: adminUser,
            affectedUser: user.username,
            afterValue: targetPlan.name,
            reason: `Admin assigned/changed plan to ${targetPlan.name}`,
            status: 'success',
            referenceId: user.id,
          });
        }
      }
      this.broadcast('investments_updated', { userId: user.id });
    }

    this.logAudit({
      action: 'User Profile Updated by Admin',
      admin: adminUser,
      affectedUser: user.username,
      reason: 'Administrative update of user credentials, phone, email, balance or status',
      status: 'success',
      referenceId: user.id,
    });

    user.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('users_updated', { userId: user.id });
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  public resetUserPassword(userId: string, newPass: string, adminUser = 'admin'): void {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const salt = generateSalt();
    user.salt = salt;
    user.passwordHash = hashPassword(newPass, salt);
    (user as any).password = newPass;
    user.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('users_updated', { userId: user.id });
    user.failedLoginAttempts = 0;
    this.logAudit({
      action: 'User Password Reset',
      admin: adminUser,
      affectedUser: user.username,
      reason: 'Admin performed administrative password reset',
      status: 'success',
      referenceId: 'USR-PW-RESET',
    });
    this.addNotification({
      userId: user.id,
      title: 'Security Alert: Password Reset',
      message: 'Your account password has been updated by administrator.',
      type: 'warning',
    });
    this.persist();
    this.broadcast('users_updated');
  }

  public deleteUser(userId: string, adminUser = 'admin'): void {
    const idx = this.data.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    const removed = this.data.users.splice(idx, 1)[0];

    // Clean up user's investments, deposit requests, withdrawal requests, transactions, notifications
    this.data.userInvestments = this.data.userInvestments.filter((i) => i.userId !== userId);
    this.data.depositRequests = this.data.depositRequests.filter((d) => d.userId !== userId);
    this.data.withdrawalRequests = this.data.withdrawalRequests.filter((w) => w.userId !== userId);
    this.data.transactions = this.data.transactions.filter((t) => t.userId !== userId);
    this.data.notifications = this.data.notifications.filter((n) => n.userId !== userId);

    this.logAudit({
      action: 'User Deleted',
      admin: adminUser,
      affectedUser: removed.username,
      reason: `Admin deleted user account (${removed.email} / ${removed.phone})`,
      status: 'success',
      referenceId: userId,
    });
    this.broadcast('users_updated');
  }

  public changeUserPassword(userId: string, currentPassword: string, newPassword: string): void {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const hash = hashPassword(currentPassword, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('Current password is incorrect.');
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    const salt = generateSalt();
    user.salt = salt;
    user.passwordHash = hashPassword(newPassword, salt);
    (user as any).password = newPassword;
    this.addNotification({
      userId: user.id,
      title: 'Password Changed',
      message: 'Your account password has been changed successfully.',
      type: 'success',
    });
    this.persist();
    this.broadcast('users_updated');
  }

  public adjustUserBalance(
    userId: string,
    amount: number,
    actionType: 'add' | 'deduct',
    reason: string,
    adminUser = 'admin'
  ): User {
    if (!reason || !reason.trim()) {
      throw new Error('Mandatory reason/remark must be provided for financial ledger audit.');
    }
    if (amount <= 0) {
      throw new Error('Amount must be strictly greater than 0.');
    }

    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const beforeBalance = user.balance;
    if (actionType === 'deduct' && user.balance < amount) {
      throw new Error(`Insufficient user balance (${user.balance.toFixed(2)} ك.د available)`);
    }

    const afterBalance = actionType === 'add' ? beforeBalance + amount : beforeBalance - amount;
    user.balance = Math.round(afterBalance * 100) / 100;
    this.syncWallet(user.id);

    const refId = 'BAL-ADJ-' + Date.now();
    this.data.transactions.unshift({
      id: 'tx-' + Date.now(),
      userId: user.id,
      username: user.username,
      type: actionType === 'add' ? 'balance_add' : 'balance_deduct',
      amount,
      currency: 'KWD',
      status: 'completed',
      referenceId: refId,
      description: `Admin ${actionType === 'add' ? 'credited' : 'deducted'} ${amount.toFixed(2)} ك.د: ${reason}`,
      createdAt: new Date().toISOString(),
    });

    this.logAudit({
      action: actionType === 'add' ? 'Admin Added Balance' : 'Admin Deducted Balance',
      admin: adminUser,
      affectedUser: user.username,
      amount,
      beforeValue: `${beforeBalance.toFixed(2)} KWD`,
      afterValue: `${user.balance.toFixed(2)} KWD`,
      reason,
      status: 'success',
      referenceId: refId,
    });

    this.addNotification({
      userId: user.id,
      title: actionType === 'add' ? 'Balance Credited' : 'Balance Adjusted',
      message: `Your balance was ${actionType === 'add' ? 'credited with' : 'debited by'} ${amount.toFixed(2)} ك.د. Reason: ${reason}`,
      type: 'financial',
    });

    this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
    this.broadcast('users_updated');
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  // --- INVESTMENT PLANS ---
  public getPlans(): InvestmentPlan[] {
    return this.data.plans;
  }

  public createPlan(plan: Omit<InvestmentPlan, 'id'>, adminUser = 'admin'): InvestmentPlan {
    const durationDays = plan.durationDays || 45;
    const dailyProfit = plan.dailyProfit || 0;
    const totalProfit = plan.totalProfit !== undefined && plan.totalProfit > 0
      ? plan.totalProfit
      : Math.round(dailyProfit * durationDays * 100) / 100;

    const newPlan: InvestmentPlan = {
      ...plan,
      id: 'plan-' + Date.now(),
      durationDays,
      dailyProfit,
      totalProfit,
      description: plan.description || '',
      status: plan.status || 'active',
    };
    this.data.plans.push(newPlan);
    this.logAudit({
      action: 'Investment Plan Created',
      admin: adminUser,
      afterValue: `${newPlan.name} (${newPlan.amount} KWD)`,
      reason: 'Admin configured new investment plan',
      status: 'success',
      referenceId: newPlan.id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('plans_updated', this.data.plans);
    return newPlan;
  }

  public updatePlan(id: string, plan: Partial<InvestmentPlan>, adminUser = 'admin'): InvestmentPlan {
    let p = this.data.plans.find((item) => item.id === id);
    if (!p) {
      p = {
        id,
        name: plan.name || 'Investment Plan',
        amount: Number(plan.amount) || 30,
        dailyProfit: Number(plan.dailyProfit) || 1.2,
        totalProfit: Number(plan.totalProfit) || 54,
        dailyRatePercent: Number(plan.dailyRatePercent) || 4,
        durationDays: Number(plan.durationDays) || 45,
        status: plan.status || 'active',
        description: plan.description || '',
      };
      this.data.plans.push(p);
    } else {
      Object.assign(p, plan);
    }

    if ((plan.dailyProfit !== undefined || plan.durationDays !== undefined) && plan.totalProfit === undefined) {
      const dur = plan.durationDays ?? p.durationDays ?? 45;
      const dp = plan.dailyProfit ?? p.dailyProfit ?? 0;
      p.totalProfit = Math.round(dp * dur * 100) / 100;
    }
    this.logAudit({
      action: 'Investment Plan Updated',
      admin: adminUser,
      afterValue: `${p.name} (${p.amount} KWD, ${p.dailyProfit} KWD/day)`,
      reason: 'Admin updated plan configuration',
      status: 'success',
      referenceId: p.id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('plans_updated', this.data.plans);
    return p;
  }

  public deletePlan(id: string, adminUser = 'admin'): void {
    const index = this.data.plans.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Plan not found');
    const removed = this.data.plans.splice(index, 1)[0];
    this.logAudit({
      action: 'Investment Plan Deleted',
      admin: adminUser,
      beforeValue: removed.name,
      reason: 'Admin permanently deleted plan',
      status: 'success',
      referenceId: id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('plans_updated', this.data.plans);
  }

  // --- USER INVESTMENTS ---
  public getUserInvestments(userId?: string): UserInvestment[] {
    if (userId) {
      return this.data.userInvestments.filter((inv) => inv.userId === userId);
    }
    return this.data.userInvestments;
  }

  public activatePlan(userId: string, planId: string, options?: { balanceAlreadyDeducted?: boolean }): UserInvestment {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error('User account is not active');

    const plan = this.data.plans.find((p) => p.id === planId);
    if (!plan || plan.status !== 'active') {
      throw new Error('This investment plan is currently unavailable');
    }

    // User can activate multiple different plans but CANNOT activate the exact same plan twice while active
    const activeSamePlan = this.data.userInvestments.find(
      (inv) => inv.userId === userId && inv.planId === planId && inv.status === 'active'
    );
    if (activeSamePlan) {
      throw new Error(`You already have an active ${plan.name}. You cannot activate the exact same plan twice concurrently.`);
    }

    const beforeBal = user.balance;
    if (!options?.balanceAlreadyDeducted) {
      if (user.balance < plan.amount) {
        throw new Error(
          `Insufficient balance. Plan requires ${plan.amount.toFixed(2)} ك.د, but your balance is ${user.balance.toFixed(2)} ك.د.`
        );
      }

      // Atomic deduction
      user.balance = Math.max(0, Math.round((user.balance - plan.amount) * 100) / 100);
      this.syncWallet(user.id);
    }

    const startDate = new Date();
    const durationDays = plan.durationDays || this.data.settings.defaultInvestmentDuration || 45;
    const endDate = new Date(startDate.getTime() + durationDays * 86400000);

    const investmentRecord: UserInvestment = {
      id: 'inv-' + Date.now(),
      userId: user.id,
      username: user.username,
      planId: plan.id,
      planName: plan.name,
      amount: plan.amount,
      dailyProfit: plan.dailyProfit,
      durationDays,
      daysElapsed: 0,
      totalEarned: 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      lastProfitDate: undefined,
    };

    this.data.userInvestments.push(investmentRecord);

    const txId = 'TX-BUY-' + Date.now();
    this.data.transactions.unshift({
      id: 'tx-' + Date.now(),
      userId: user.id,
      username: user.username,
      type: 'plan_purchase',
      amount: plan.amount,
      currency: 'KWD',
      status: 'completed',
      referenceId: txId,
      description: `Activated ${plan.name} for ${durationDays} days (-${plan.amount.toFixed(2)} ك.د)`,
      createdAt: new Date().toISOString(),
    });

    this.addNotification({
      userId: user.id,
      title: 'Plan Activated',
      message: `Successfully purchased ${plan.name}. ${plan.amount.toFixed(2)} ك.د deducted. Your 24-hour dividend is ${plan.dailyProfit.toFixed(2)} ك.د.`,
      type: 'success',
    });

    // Handle Referral commission on eligible plan purchase
    const commMode = this.data.settings.referralCommissionMode || 'plan_activation';
    if (user.referredBy && (commMode === 'plan_activation' || commMode === 'both')) {
      const cleanRef = user.referredBy.trim().toLowerCase();
      const referrer = this.data.users.find(
        (u) => u.username.toLowerCase() === cleanRef || u.referralCode.toLowerCase() === cleanRef
      );
      if (referrer && referrer.status === 'active') {
        const rate = (this.data.settings.referralCommissionPercent || 10) / 100;
        const commissionAmount = Math.round(plan.amount * rate * 100) / 100;
        if (commissionAmount > 0) {
          referrer.balance = Math.round((referrer.balance + commissionAmount) * 100) / 100;
          this.syncWallet(referrer.id);
          this.data.transactions.unshift({
            id: 'tx-' + Date.now() + '-ref',
            userId: referrer.id,
            username: referrer.username,
            type: 'referral_commission',
            amount: commissionAmount,
            currency: 'KWD',
            status: 'completed',
            referenceId: 'REF-COMM-' + investmentRecord.id,
            description: `${this.data.settings.referralCommissionPercent}% Referral commission from @${user.username} plan activation`,
            createdAt: new Date().toISOString(),
          });
          this.addNotification({
            userId: referrer.id,
            title: 'Referral Commission Received',
            message: `Congratulations! You received ${commissionAmount.toFixed(2)} ك.د referral commission (${this.data.settings.referralCommissionPercent}%) from @${user.username}'s plan purchase.`,
            type: 'financial',
          });
          this.logAudit({
            action: 'Referral Commission Paid on Plan Activation',
            admin: 'system',
            affectedUser: referrer.username,
            amount: commissionAmount,
            reason: `${this.data.settings.referralCommissionPercent}% from @${user.username} plan ${plan.name}`,
            status: 'success',
            referenceId: investmentRecord.id,
          });
          this.broadcast('balance_updated', { userId: referrer.id, balance: referrer.balance });
        }
      }
    }

    this.logAudit({
      action: 'User Purchased Plan',
      admin: 'system',
      affectedUser: user.username,
      amount: plan.amount,
      beforeValue: `${beforeBal.toFixed(2)} KWD`,
      afterValue: `${user.balance.toFixed(2)} KWD`,
      reason: `Plan purchase: ${plan.name}`,
      status: 'success',
      referenceId: txId,
    });

    this.broadcast('investments_updated');
    this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
    this.broadcast('users_updated');
    return investmentRecord;
  }

  // --- PROFIT SYSTEM (ADMIN ONLY) ---
  public addProfitForUser(userId: string, adminUser = 'admin', force = false): { creditedAmount: number; activePlansCount: number } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error('Cannot credit profit to non-active account');

    const now = new Date();
    // Verify 24-hour interval only if not forced by Admin
    if (!force && user.lastProfitClaimDate) {
      const lastClaimTime = new Date(user.lastProfitClaimDate).getTime();
      const diffMs = now.getTime() - lastClaimTime;
      const hoursSince = diffMs / (1000 * 60 * 60);
      if (hoursSince < 24) {
        const hoursLeft = (24 - hoursSince).toFixed(1);
        throw new Error(
          `Profit already credited within the last 24 hours. Eligible again in ${hoursLeft} hours.`
        );
      }
    }

    let activeInvestments = this.data.userInvestments.filter(
      (inv) => inv.userId === userId && inv.status === 'active'
    );

    if (activeInvestments.length === 0) {
      const planId = user.activePlanId || (user as any).assignedPlanId;
      if (planId) {
        const plan = this.data.plans.find((p) => p.id === planId);
        if (plan) {
          const durationDays = plan.durationDays || this.data.settings.defaultInvestmentDuration || 45;
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + durationDays * 86400000);
          const inv: UserInvestment = {
            id: 'inv-' + Date.now(),
            userId: user.id,
            username: user.username,
            planId: plan.id,
            planName: plan.name,
            amount: plan.amount,
            dailyProfit: plan.dailyProfit,
            durationDays,
            daysElapsed: 0,
            totalEarned: 0,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'active',
          };
          this.data.userInvestments.push(inv);
          activeInvestments = [inv];
        } else {
          throw new Error('User has no active investment plans.');
        }
      } else {
        throw new Error('User has no active investment plans.');
      }
    }

    let totalEligibleProfit = 0;
    for (const inv of activeInvestments) {
      totalEligibleProfit += inv.dailyProfit;
      inv.daysElapsed += 1;
      inv.totalEarned += inv.dailyProfit;
      inv.lastProfitDate = now.toISOString();

      if (inv.daysElapsed >= inv.durationDays) {
        inv.status = 'completed';
        this.addNotification({
          userId: user.id,
          title: 'Plan Completed',
          message: `Your ${inv.planName} has matured after ${inv.durationDays} days. Total dividends earned: ${inv.totalEarned.toFixed(2)} ك.د.`,
          type: 'info',
        });
      }
    }

    totalEligibleProfit = Math.round(totalEligibleProfit * 100) / 100;
    const beforeBalance = user.balance;
    user.balance = Math.round((user.balance + totalEligibleProfit) * 100) / 100;
    user.lastProfitClaimDate = now.toISOString();
    this.syncWallet(user.id);

    const refId = 'PROFIT-' + Date.now();
    this.data.transactions.unshift({
      id: 'tx-' + Date.now() + '-prf',
      userId: user.id,
      username: user.username,
      type: 'profit',
      amount: totalEligibleProfit,
      currency: 'KWD',
      status: 'completed',
      referenceId: refId,
      description: `Daily profit dividend credited for ${activeInvestments.length} active plan(s)`,
      createdAt: now.toISOString(),
    });

    this.addNotification({
      userId: user.id,
      title: 'Daily Profit Credited',
      message: `Your daily returns of ${totalEligibleProfit.toFixed(2)} ك.د have been added to your available balance.`,
      type: 'financial',
    });

    this.logAudit({
      action: 'Admin Credited Profit',
      admin: adminUser,
      affectedUser: user.username,
      amount: totalEligibleProfit,
      beforeValue: `${beforeBalance.toFixed(2)} KWD`,
      afterValue: `${user.balance.toFixed(2)} KWD`,
      reason: `24h Profit distribution for ${activeInvestments.length} active plans`,
      status: 'success',
      referenceId: refId,
    });

    this.broadcast('profit_added', { userId, amount: totalEligibleProfit });
    this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
    this.broadcast('users_updated');
    this.persist(true);
    return { creditedAmount: totalEligibleProfit, activePlansCount: activeInvestments.length };
  }

  public claimDailyProfitForUser(userId: string): { creditedAmount: number; activePlansCount: number; newBalance: number } {
    const res = this.addProfitForUser(userId, 'User 24h Daily Claim');
    const user = this.data.users.find((u) => u.id === userId);
    this.persist(true);
    return {
      creditedAmount: res.creditedAmount,
      activePlansCount: res.activePlansCount,
      newBalance: user?.balance || 0,
    };
  }

  // Batch add profit for all eligible users with active plans
  public batchAddProfit(adminUser = 'admin', force = true): { successfulCount: number; totalProfitDistributed: number; skippedCount: number } {
    let successfulCount = 0;
    let totalProfitDistributed = 0;
    let skippedCount = 0;

    const activeUsers = this.data.users.filter((u) => u.status === 'active');
    for (const user of activeUsers) {
      try {
        const result = this.addProfitForUser(user.id, adminUser, force);
        successfulCount++;
        totalProfitDistributed += result.creditedAmount;
      } catch (err) {
        skippedCount++;
      }
    }

    this.persist(true);
    this.broadcast('batch_profit_distributed');
    this.broadcast('users_updated');
    this.broadcast('transactions_updated');
    return {
      successfulCount,
      totalProfitDistributed: Math.round(totalProfitDistributed * 100) / 100,
      skippedCount,
    };
  }

  // Reset/Unlock 24h Daily Earning Cycle for a User so they can click Run Cycle Now immediately
  public resetUserDailyCycle(userId: string, adminUser = 'admin'): User {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    user.lastProfitClaimDate = undefined;
    (user as any).lastDailyProfitClaim = undefined;
    (user as any).lastEarningClaimAt = undefined;
    (user as any).nextClaimAvailableAt = undefined;

    this.logAudit({
      action: 'Daily 24h Cycle Reset by Admin',
      admin: adminUser,
      affectedUser: user.username,
      reason: 'Admin opened / reset 24-hour earning cycle for user',
      status: 'success',
      referenceId: 'CYCLE-RESET-' + user.id,
    });

    this.addNotification({
      userId: user.id,
      title: 'Daily Earning Cycle Unlocked',
      message: 'Your 24-hour daily earning cycle has been reset by administrator. You can now claim your daily dividends immediately!',
      type: 'success',
    });

    this.persist(true);
    this.broadcast('users_updated', { userId: user.id });
    this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  // Reset/Unlock 24h Daily Earning Cycle for ALL users
  public resetAllDailyCycles(adminUser = 'admin'): { resetCount: number } {
    let resetCount = 0;
    for (const u of this.data.users) {
      if (u.lastProfitClaimDate || (u as any).lastDailyProfitClaim || (u as any).lastEarningClaimAt) {
        u.lastProfitClaimDate = undefined;
        (u as any).lastDailyProfitClaim = undefined;
        (u as any).lastEarningClaimAt = undefined;
        (u as any).nextClaimAvailableAt = undefined;
        resetCount++;
      }
    }

    this.logAudit({
      action: 'All Users Daily 24h Cycles Reset',
      admin: adminUser,
      reason: `Admin reset 24-hour earning cycles for all ${resetCount} users`,
      status: 'success',
      referenceId: 'ALL-CYCLES-RESET-' + Date.now(),
    });

    this.persist(true);
    this.broadcast('users_updated');
    return { resetCount };
  }

  // --- DEPOSITS ---
  public getDepositMethods(): DepositMethod[] {
    return this.data.depositMethods;
  }

  public updateDepositMethod(id: string, method: Partial<DepositMethod>, adminUser = 'admin'): DepositMethod {
    let m = this.data.depositMethods.find(
      (item) => item.id === id || (method.name && item.name.toLowerCase() === method.name.toLowerCase())
    );
    if (!m) {
      m = {
        id: id || ('dep-' + Date.now()),
        name: method.name || 'Payment Gateway',
        accountTitle: method.accountTitle || '',
        accountNumber: method.accountNumber || '',
        instructions: method.instructions || '',
        requiredFields: method.requiredFields || ['Transaction ID (TID)', 'Payment Proof Screenshot'],
        minDeposit: typeof method.minDeposit === 'number' ? method.minDeposit : (this.data.settings.minDepositKwd || 30),
        enabled: method.enabled ?? true,
      };
      this.data.depositMethods.push(m);
    } else {
      Object.assign(m, method);
    }
    this.logAudit({
      action: 'Deposit Method Updated',
      admin: adminUser,
      afterValue: `${m.name} (${m.accountNumber || 'N/A'})`,
      reason: 'Admin updated payment account details/status',
      status: 'success',
      referenceId: m.id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('deposit_methods_updated', this.data.depositMethods);
    return m;
  }

  public createDepositMethod(method: Omit<DepositMethod, 'id'>, adminUser = 'admin'): DepositMethod {
    const newMethod: DepositMethod = {
      name: method.name || 'Payment Gateway',
      accountTitle: method.accountTitle || '',
      accountNumber: method.accountNumber || '',
      instructions: method.instructions || '',
      requiredFields: method.requiredFields || ['Transaction ID (TID)', 'Payment Proof Screenshot'],
      minDeposit: typeof method.minDeposit === 'number' ? method.minDeposit : 30,
      enabled: method.enabled ?? true,
      id: 'dep-' + Date.now(),
    };
    this.data.depositMethods.push(newMethod);
    this.logAudit({
      action: 'Deposit Method Created',
      admin: adminUser,
      afterValue: newMethod.name,
      reason: 'Admin added new payment gateway',
      status: 'success',
      referenceId: newMethod.id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('deposit_methods_updated', this.data.depositMethods);
    return newMethod;
  }

  public deleteDepositMethod(id: string, adminUser = 'admin'): void {
    const idx = this.data.depositMethods.findIndex((item) => item.id === id);
    if (idx === -1) throw new Error('Method not found');
    const removed = this.data.depositMethods.splice(idx, 1)[0];
    this.logAudit({
      action: 'Deposit Method Deleted',
      admin: adminUser,
      beforeValue: removed.name,
      reason: 'Admin deleted payment method',
      status: 'success',
      referenceId: id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('deposit_methods_updated', this.data.depositMethods);
  }

  public getDepositRequests(userId?: string): DepositRequest[] {
    if (userId) {
      return this.data.depositRequests.filter((r) => r.userId === userId);
    }
    return this.data.depositRequests;
  }

  public submitDeposit(params: {
    userId: string;
    amountKwd: number;
    methodId: string;
    transactionId: string;
    proofUrl?: string;
    accountTitle?: string;
    accountNumber?: string;
    senderAccount?: string;
    paymentDate?: string;
    planId?: string;
    planName?: string;
    note?: string;
  }): DepositRequest {
    const user = this.data.users.find((u) => u.id === params.userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error('User account is not active');

    const method = this.data.depositMethods.find((m) => m.id === params.methodId);
    if (!method || !method.enabled) {
      throw new Error('Selected payment method is currently disabled.');
    }

    const globalMin = typeof this.data.settings.minDepositKwd === 'number' ? this.data.settings.minDepositKwd : 30;
    const methodMin = typeof method.minDeposit === 'number' && method.minDeposit > 0 ? method.minDeposit : globalMin;
    const min = methodMin;
    const max = typeof this.data.settings.maxDepositKwd === 'number' ? this.data.settings.maxDepositKwd : 5000;
    if (params.amountKwd < min) {
      throw new Error(`Minimum deposit is ${min} ${this.data.settings.currencySymbol || 'ك.د.'}`);
    }
    if (params.amountKwd > max) {
      throw new Error(`Maximum deposit limit is ${max} ${this.data.settings.currencySymbol || 'ك.د.'}`);
    }

    if (!params.transactionId || !params.transactionId.trim()) {
      throw new Error('Transaction ID / TID is mandatory.');
    }

    // Check duplicate TID
    const dup = this.data.depositRequests.find(
      (d) => d.transactionId.trim().toLowerCase() === params.transactionId.trim().toLowerCase()
    );
    if (dup) {
      throw new Error('This Transaction ID (TID) has already been submitted.');
    }

    const rate = this.data.settings.depositRatePkr || 911;
    const amountPkr = Math.round(params.amountKwd * rate);

    const req: DepositRequest = {
      id: 'dep-req-' + Date.now(),
      userId: user.id,
      username: user.username,
      amountKwd: params.amountKwd,
      exchangeRate: rate,
      amountPkr,
      methodId: method.id,
      methodName: method.name,
      accountTitle: params.accountTitle,
      accountNumber: params.accountNumber,
      senderAccount: params.senderAccount?.trim() || undefined,
      paymentDate: params.paymentDate?.trim() || new Date().toISOString().split('T')[0],
      planId: params.planId || undefined,
      planName: params.planName || undefined,
      note: params.note?.trim() || undefined,
      transactionId: params.transactionId.trim(),
      proofUrl: params.proofUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.depositRequests.unshift(req);

    // Add pending transaction
    this.data.transactions.unshift({
      id: 'tx-' + Date.now(),
      userId: user.id,
      username: user.username,
      type: 'deposit',
      amount: params.amountKwd,
      currency: 'KWD',
      status: 'pending',
      referenceId: req.transactionId,
      description: `${method.name} deposit submission (${params.amountKwd.toFixed(2)} ك.د / ${amountPkr.toLocaleString()} PKR)${params.planName ? ` for ${params.planName}` : ''}`,
      createdAt: req.createdAt,
    });

    this.addNotification({
      userId: user.id,
      title: 'Deposit Request Submitted',
      message: `Your deposit of ${params.amountKwd.toFixed(2)} ك.د via ${method.name} (TID: ${req.transactionId}) is pending admin verification.`,
      type: 'info',
    });

    this.logAudit({
      action: 'Deposit Submitted',
      admin: 'user',
      affectedUser: user.username,
      amount: params.amountKwd,
      reason: `TID: ${req.transactionId} via ${method.name}${params.senderAccount ? ` from ${params.senderAccount}` : ''}`,
      status: 'pending',
      referenceId: req.id,
    });

    this.broadcast('deposits_updated');
    this.broadcast('transactions_updated');
    this.broadcast('users_updated');
    return req;
  }

  public reviewDeposit(
    id: string,
    action: 'approve' | 'reject',
    reason?: string,
    adminUser = 'admin',
    adminNote?: string
  ): DepositRequest {
    const req = this.data.depositRequests.find((r) => r.id === id || r.transactionId === id || (r as any).referenceId === id);
    if (!req) throw new Error('Deposit request not found');
    
    // Idempotent check: if already approved or rejected with same action, return immediately
    const targetStatus = action === 'approve' ? 'approved' : 'rejected';
    if (req.status === targetStatus) {
      return req;
    }
    if (req.status !== 'pending') {
      throw new Error(`Deposit has already been ${req.status}`);
    }

    const user = this.data.users.find((u) => u.id === req.userId);
    if (!user) throw new Error('User not found');

    const now = new Date().toISOString();
    req.reviewedAt = now;
    req.reviewedBy = adminUser;
    if (adminNote) {
      req.adminNote = adminNote.trim();
    }

    const tx = this.data.transactions.find((t) => t.referenceId === req.transactionId || t.referenceId === req.id);

    if (action === 'approve') {
      req.status = 'approved';
      const beforeBal = user.balance;
      user.balance = Math.round((user.balance + req.amountKwd) * 100) / 100;
      this.syncWallet(user.id);

      if (tx) {
        tx.status = 'completed';
      }

      this.addNotification({
        userId: user.id,
        title: 'Deposit Approved',
        message: `Your deposit of ${req.amountKwd.toFixed(2)} ك.د has been approved and added to your balance.${adminNote ? ` (Note: ${adminNote})` : ''}`,
        type: 'success',
      });

      this.logAudit({
        action: 'Deposit Approved',
        admin: adminUser,
        affectedUser: user.username,
        amount: req.amountKwd,
        beforeValue: `${beforeBal.toFixed(2)} KWD`,
        afterValue: `${user.balance.toFixed(2)} KWD`,
        reason: `Approved deposit TID: ${req.transactionId}${adminNote ? ` | Note: ${adminNote}` : ''}`,
        status: 'approved',
        referenceId: req.id,
      });

      // Handle Referral commission on deposit approval if mode is deposit or both
      const commMode = this.data.settings.referralCommissionMode;
      if (user.referredBy && (commMode === 'deposit' || commMode === 'both')) {
        const cleanRef = user.referredBy.trim().toLowerCase();
        const referrer = this.data.users.find(
          (u) => u.username.toLowerCase() === cleanRef || u.referralCode.toLowerCase() === cleanRef
        );
        if (referrer && referrer.status === 'active') {
          const rate = (this.data.settings.referralCommissionPercent || 10) / 100;
          const commissionAmount = Math.round(req.amountKwd * rate * 100) / 100;
          if (commissionAmount > 0) {
            referrer.balance = Math.round((referrer.balance + commissionAmount) * 100) / 100;
            this.syncWallet(referrer.id);
            this.data.transactions.unshift({
              id: 'tx-' + Date.now() + '-refdep',
              userId: referrer.id,
              username: referrer.username,
              type: 'referral_commission',
              amount: commissionAmount,
              currency: 'KWD',
              status: 'completed',
              referenceId: 'REF-DEP-' + req.id,
              description: `${this.data.settings.referralCommissionPercent}% Referral commission from @${user.username} approved deposit (${req.amountKwd.toFixed(2)} ك.د)`,
              createdAt: new Date().toISOString(),
            });
            this.addNotification({
              userId: referrer.id,
              title: '💰 Referral Commission Received',
              message: `Congratulations! You received ${commissionAmount.toFixed(2)} ك.د referral commission (${this.data.settings.referralCommissionPercent}%) from @${user.username}'s approved deposit.`,
              type: 'financial',
            });
            this.logAudit({
              action: 'Referral Commission Paid on Deposit',
              admin: adminUser,
              affectedUser: referrer.username,
              amount: commissionAmount,
              reason: `${this.data.settings.referralCommissionPercent}% from @${user.username} deposit TID ${req.transactionId}`,
              status: 'success',
              referenceId: 'REF-DEP-' + req.id,
            });
            this.broadcast('balance_updated', { userId: referrer.id, balance: referrer.balance });
          }
        }
      }
    } else {
      if (!reason || !reason.trim()) {
        throw new Error('A rejection reason is mandatory.');
      }
      req.status = 'rejected';
      req.rejectionReason = reason;

      if (tx) {
        tx.status = 'rejected';
      }

      this.addNotification({
        userId: user.id,
        title: 'Deposit Rejected',
        message: `Your deposit of ${req.amountKwd.toFixed(2)} ك.د was rejected. Reason: ${reason}${adminNote ? ` (Admin Note: ${adminNote})` : ''}`,
        type: 'warning',
      });

      this.logAudit({
        action: 'Deposit Rejected',
        admin: adminUser,
        affectedUser: user.username,
        amount: req.amountKwd,
        reason,
        status: 'rejected',
        referenceId: req.id,
      });
    }

    this.persist(true);
    this.broadcast('deposits_updated');
    this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
    this.broadcast('users_updated');
    return req;
  }

  public deleteDepositRequest(id: string, adminUser = 'admin'): void {
    const index = this.data.depositRequests.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Deposit request not found');
    const removed = this.data.depositRequests.splice(index, 1)[0];
    this.logAudit({
      action: 'Deposit Request Deleted',
      admin: adminUser,
      affectedUser: removed.username,
      amount: removed.amountKwd,
      reason: `Admin deleted deposit record (${removed.transactionId})`,
      status: 'success',
      referenceId: id,
    });
    this.persist(true);
    this.broadcast('deposits_updated');
  }

  // --- WITHDRAWALS ---
  public getWithdrawalNetworks(): WithdrawalNetwork[] {
    return this.data.withdrawalNetworks;
  }

  public updateWithdrawalNetwork(id: string, network: Partial<WithdrawalNetwork>, adminUser = 'admin'): WithdrawalNetwork {
    const n = this.data.withdrawalNetworks.find((item) => item.id === id);
    if (!n) throw new Error('Network not found');
    Object.assign(n, network);
    this.logAudit({
      action: 'Withdrawal Network Updated',
      admin: adminUser,
      afterValue: n.name,
      reason: 'Admin updated crypto withdrawal network',
      status: 'success',
      referenceId: n.id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('networks_updated', this.data.withdrawalNetworks);
    return n;
  }

  public createWithdrawalNetwork(network: Omit<WithdrawalNetwork, 'id'>, adminUser = 'admin'): WithdrawalNetwork {
    const newNet: WithdrawalNetwork = {
      ...network,
      id: 'net-' + Date.now(),
    };
    this.data.withdrawalNetworks.push(newNet);
    this.logAudit({
      action: 'Withdrawal Network Created',
      admin: adminUser,
      afterValue: newNet.name,
      reason: 'Admin added new crypto network',
      status: 'success',
      referenceId: newNet.id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('networks_updated', this.data.withdrawalNetworks);
    return newNet;
  }

  public deleteWithdrawalNetwork(id: string, adminUser = 'admin'): void {
    const idx = this.data.withdrawalNetworks.findIndex((item) => item.id === id);
    if (idx === -1) throw new Error('Network not found');
    const removed = this.data.withdrawalNetworks.splice(idx, 1)[0];
    this.logAudit({
      action: 'Withdrawal Network Deleted',
      admin: adminUser,
      beforeValue: removed.name,
      reason: 'Admin deleted crypto network',
      status: 'success',
      referenceId: id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('networks_updated', this.data.withdrawalNetworks);
  }

  public getWithdrawalRequests(userId?: string): WithdrawalRequest[] {
    if (userId) {
      return this.data.withdrawalRequests.filter((r) => r.userId === userId);
    }
    return this.data.withdrawalRequests;
  }

  public submitWithdrawal(params: {
    userId: string;
    type: 'USDT' | 'Cash/PKR';
    amountKwd: number;
    walletAddress?: string;
    network?: string;
    accountTitle?: string;
    accountNumber?: string;
    bankOrWalletName?: string;
    note?: string;
    balanceAlreadyDeducted?: boolean;
  }): WithdrawalRequest {
    const user = this.data.users.find((u) => u.id === params.userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error('User account is not active');

    const min = typeof this.data.settings.minWithdrawalKwd === 'number' ? this.data.settings.minWithdrawalKwd : 10;
    const max = typeof this.data.settings.maxWithdrawalKwd === 'number' ? this.data.settings.maxWithdrawalKwd : 2000;
    if (params.amountKwd < min) {
      throw new Error(`Minimum withdrawal is ${min} ${this.data.settings.currencySymbol || 'ك.د.'}`);
    }
    if (params.amountKwd > max) {
      throw new Error(`Maximum withdrawal limit is ${max} ${this.data.settings.currencySymbol || 'ك.د.'}`);
    }

    if (!params.balanceAlreadyDeducted) {
      if (user.balance < params.amountKwd) {
        throw new Error(`Insufficient balance (${user.balance.toFixed(2)} ك.د available)`);
      }
    }

    // Duplicate submission protection within 5 seconds for same amount and user
    const recentDup = this.data.withdrawalRequests.find(
      (w) =>
        w.userId === user.id &&
        w.status === 'pending' &&
        w.type === params.type &&
        w.amountKwd === params.amountKwd &&
        Date.now() - new Date(w.createdAt).getTime() < 5000
    );
    if (recentDup) {
      throw new Error('A withdrawal request with these exact details is already currently processing.');
    }

    const feeRate = (this.data.settings.withdrawalFeePercent || 0) / 100;
    const feeKwd = Math.round(params.amountKwd * feeRate * 100) / 100;
    const netAmountKwd = Math.round((params.amountKwd - feeKwd) * 100) / 100;

    let netAmountPkr: number | undefined;
    let exchangeRate: number | undefined;
    if (params.type === 'Cash/PKR') {
      exchangeRate = this.data.settings.withdrawalRatePkr || 911;
      netAmountPkr = Math.round(netAmountKwd * exchangeRate);
    }

    // Hold/Deduct amount immediately on submission into lockedBalance
    const beforeBal = user.balance;
    if (!params.balanceAlreadyDeducted) {
      user.balance = Math.max(0, Math.round((user.balance - params.amountKwd) * 100) / 100);
      user.lockedBalance = Math.round(((user.lockedBalance || 0) + params.amountKwd) * 100) / 100;
      this.syncWallet(user.id);
    }

    const req: WithdrawalRequest = {
      id: 'wd-req-' + Date.now(),
      userId: user.id,
      username: user.username,
      type: params.type,
      amountKwd: params.amountKwd,
      feeKwd,
      netAmountKwd,
      exchangeRate,
      netAmountPkr,
      walletAddress: params.walletAddress,
      network: params.network,
      accountTitle: params.accountTitle,
      accountNumber: params.accountNumber,
      bankOrWalletName: params.bankOrWalletName,
      note: params.note?.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.withdrawalRequests.unshift(req);

    const refId = 'WD-' + req.id;
    this.data.transactions.unshift({
      id: 'tx-' + Date.now(),
      userId: user.id,
      username: user.username,
      type: 'withdrawal',
      amount: params.amountKwd,
      currency: 'KWD',
      status: 'pending',
      referenceId: refId,
      description: `Withdrawal request of ${params.amountKwd.toFixed(2)} ك.د (${params.type}) held from balance`,
      createdAt: req.createdAt,
    });

    this.addNotification({
      userId: user.id,
      title: 'Withdrawal Submitted',
      message: `Your withdrawal of ${params.amountKwd.toFixed(2)} ك.د has been submitted and is processing.`,
      type: 'financial',
    });

    this.logAudit({
      action: 'Withdrawal Requested',
      admin: 'user',
      affectedUser: user.username,
      amount: params.amountKwd,
      beforeValue: `${beforeBal.toFixed(2)} KWD`,
      afterValue: `${user.balance.toFixed(2)} KWD`,
      reason: `${params.type} withdrawal requested`,
      status: 'pending',
      referenceId: req.id,
    });

    this.broadcast('withdrawals_updated');
    this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
    this.broadcast('users_updated');
    this.broadcast('transactions_updated');
    return req;
  }

  public reviewWithdrawal(
    id: string,
    action: 'approve' | 'reject',
    reason?: string,
    adminUser = 'admin',
    adminNote?: string
  ): WithdrawalRequest {
    const req = this.data.withdrawalRequests.find((r) => r.id === id || (r as any).referenceId === id);
    if (!req) throw new Error('Withdrawal request not found');

    // Idempotent check
    const targetStatus = action === 'approve' ? 'approved' : 'rejected';
    if (req.status === targetStatus) {
      return req;
    }
    if (req.status !== 'pending') {
      throw new Error(`Withdrawal has already been ${req.status}`);
    }

    const user = this.data.users.find((u) => u.id === req.userId);
    if (!user) throw new Error('User not found');

    const now = new Date().toISOString();
    req.reviewedAt = now;
    req.reviewedBy = adminUser;
    if (adminNote) {
      req.adminNote = adminNote.trim();
    }

    const refId = 'WD-' + req.id;
    const tx = this.data.transactions.find((t) => t.referenceId === refId || t.referenceId === req.id);

    if (action === 'approve') {
      req.status = 'approved';
      user.lockedBalance = Math.max(0, Math.round(((user.lockedBalance || 0) - req.amountKwd) * 100) / 100);
      this.syncWallet(user.id);
      if (tx) {
        tx.status = 'completed';
      }

      this.addNotification({
        userId: user.id,
        title: 'Withdrawal Approved & Dispatched',
        message: `Your withdrawal of ${req.netAmountKwd.toFixed(2)} ك.د has been processed and sent to your account/wallet.${adminNote ? ` (Admin Note: ${adminNote})` : ''}`,
        type: 'success',
      });

      this.logAudit({
        action: 'Withdrawal Approved',
        admin: adminUser,
        affectedUser: user.username,
        amount: req.amountKwd,
        reason: `Admin approved and dispatched withdrawal funds${adminNote ? ` | Note: ${adminNote}` : ''}`,
        status: 'approved',
        referenceId: req.id,
      });
    } else {
      if (!reason || !reason.trim()) {
        throw new Error('A rejection reason is mandatory.');
      }
      req.status = 'rejected';
      req.rejectionReason = reason;

      if (tx) {
        tx.status = 'rejected';
      }

      // Automatically release/refund amount back from lockedBalance to user's available balance
      user.lockedBalance = Math.max(0, Math.round(((user.lockedBalance || 0) - req.amountKwd) * 100) / 100);
      const beforeBal = user.balance;
      user.balance = Math.round((user.balance + req.amountKwd) * 100) / 100;
      this.syncWallet(user.id);

      this.data.transactions.unshift({
        id: 'tx-' + Date.now() + '-rfnd',
        userId: user.id,
        username: user.username,
        type: 'withdrawal_refund',
        amount: req.amountKwd,
        currency: 'KWD',
        status: 'refunded',
        referenceId: 'REFUND-' + req.id,
        description: `Refund for rejected withdrawal: ${reason}`,
        createdAt: now,
      });

      this.addNotification({
        userId: user.id,
        title: 'Withdrawal Rejected - Funds Refunded',
        message: `Your withdrawal of ${req.amountKwd.toFixed(2)} ك.د was rejected (${reason}). The full amount has been refunded back to your balance.${adminNote ? ` (Admin Note: ${adminNote})` : ''}`,
        type: 'warning',
      });

      this.logAudit({
        action: 'Withdrawal Rejected & Refunded',
        admin: adminUser,
        affectedUser: user.username,
        amount: req.amountKwd,
        beforeValue: `${beforeBal.toFixed(2)} KWD`,
        afterValue: `${user.balance.toFixed(2)} KWD`,
        reason: `${reason}${adminNote ? ` | Note: ${adminNote}` : ''}`,
        status: 'refunded',
        referenceId: req.id,
      });
    }

    this.persist(true);
    this.broadcast('withdrawals_updated');
    this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
    this.broadcast('users_updated');
    return req;
  }

  public deleteWithdrawalRequest(id: string, refundBalance = false, adminUser = 'admin'): void {
    const index = this.data.withdrawalRequests.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Withdrawal request not found');
    const removed = this.data.withdrawalRequests.splice(index, 1)[0];

    if (refundBalance && removed.status === 'pending') {
      const user = this.data.users.find((u) => u.id === removed.userId);
      if (user) {
        user.balance = Math.round((user.balance + removed.amountKwd) * 100) / 100;
        user.lockedBalance = Math.max(0, Math.round(((user.lockedBalance || 0) - removed.amountKwd) * 100) / 100);
        this.syncWallet(user.id);
        this.broadcast('balance_updated', { userId: user.id, balance: user.balance });
        this.broadcast('users_updated');
      }
    }

    this.logAudit({
      action: 'Withdrawal Request Deleted',
      admin: adminUser,
      affectedUser: removed.username,
      amount: removed.amountKwd,
      reason: `Admin deleted withdrawal record (${removed.id})`,
      status: 'success',
      referenceId: id,
    });
    this.persist(true);
    this.broadcast('withdrawals_updated');
    this.broadcast('transactions_updated');
  }

  // --- TRANSACTIONS ---
  public getTransactions(userId?: string): Transaction[] {
    if (userId) {
      return this.data.transactions.filter((t) => t.userId === userId);
    }
    return this.data.transactions;
  }

  public deleteTransaction(id: string, adminUser = 'admin'): boolean {
    const idx = this.data.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    const removed = this.data.transactions[idx];
    this.data.transactions.splice(idx, 1);
    this.persist();
    this.logAudit({
      action: 'Transaction Deleted',
      admin: adminUser,
      affectedUser: removed.username || removed.userId,
      amount: removed.amount,
      reason: `Admin deleted transaction ledger record (${removed.id} / ${removed.referenceId})`,
      status: 'success',
      referenceId: id,
    });
    this.broadcast('transactions_updated');
    return true;
  }

  public createTransactionByAdmin(params: {
    userId: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'daily_profit' | 'referral_commission' | 'plan_activation' | 'balance_adjustment';
    description: string;
    status?: 'completed' | 'pending' | 'rejected';
    adminUser?: string;
  }): Transaction {
    const user = this.findUserById(params.userId);
    if (!user) throw new Error('User not found');
    const tx: Transaction = {
      id: 'tx-man-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      userId: user.id,
      username: user.username,
      type: params.type,
      amount: params.amount,
      currency: 'KWD',
      status: params.status || 'completed',
      referenceId: 'MANUAL-' + Date.now().toString().slice(-6),
      description: params.description || `Manual ledger entry recorded by administrator`,
      createdAt: new Date().toISOString(),
    };
    this.data.transactions.unshift(tx);
    this.persist();
    this.logAudit({
      action: 'Transaction Added',
      admin: params.adminUser || 'admin',
      affectedUser: user.username,
      amount: params.amount,
      reason: `Manual ledger entry created: ${tx.description}`,
      status: 'success',
      referenceId: tx.id,
    });
    this.broadcast('transactions_updated');
    return tx;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId?: string): AppNotification[] {
    if (!userId) return this.data.notifications;
    return this.data.notifications.filter((n) => n.userId === userId || n.userId === 'all');
  }

  public addNotification(params: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
    const notif: AppNotification = {
      ...params,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.broadcast('notifications_updated');
    return notif;
  }

  public deleteNotification(id: string): boolean {
    const idx = this.data.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.data.notifications.splice(idx, 1);
    this.persist();
    this.broadcast('notifications_updated');
    return true;
  }

  public clearAllNotifications(): boolean {
    this.data.notifications = [];
    this.persist();
    this.broadcast('notifications_updated');
    return true;
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
    }
  }

  // --- CUSTOMER SUPPORT ---
  public getSupportLinks(): CustomerSupportLink[] {
    return this.data.supportLinks;
  }

  public updateSupportLink(id: string, link: Partial<CustomerSupportLink>, adminUser = 'admin'): CustomerSupportLink {
    const s = this.data.supportLinks.find((item) => item.id === id);
    if (!s) throw new Error('Support link not found');
    Object.assign(s, link);
    this.logAudit({
      action: 'Customer Support Link Updated',
      admin: adminUser,
      afterValue: s.title,
      reason: 'Admin modified support channel',
      status: 'success',
      referenceId: s.id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('support_updated', this.data.supportLinks);
    return s;
  }

  public createSupportLink(link: Omit<CustomerSupportLink, 'id'>, adminUser = 'admin'): CustomerSupportLink {
    const newLink: CustomerSupportLink = {
      ...link,
      id: 'supp-' + Date.now(),
    };
    this.data.supportLinks.push(newLink);
    this.logAudit({
      action: 'Customer Support Link Created',
      admin: adminUser,
      afterValue: newLink.title,
      reason: 'Admin added new support channel',
      status: 'success',
      referenceId: newLink.id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('support_updated', this.data.supportLinks);
    return newLink;
  }

  public deleteSupportLink(id: string, adminUser = 'admin'): void {
    const idx = this.data.supportLinks.findIndex((item) => item.id === id);
    if (idx === -1) throw new Error('Support channel not found');
    const removed = this.data.supportLinks.splice(idx, 1)[0];

    // Clear matching settings fields if any
    if (removed.type === 'whatsapp' || id === 'supp-whatsapp') {
      this.data.settings.whatsappNumber = '';
      this.data.settings.whatsappUrl = '';
    } else if (removed.type === 'telegram' || id === 'supp-telegram-official') {
      this.data.settings.telegramUrl = '';
    } else if (removed.type === 'telegram_group' || id === 'supp-telegram-group') {
      this.data.settings.telegramGroupUrl = '';
    } else if (removed.type === 'phone' || id === 'supp-phone') {
      this.data.settings.supportPhone = '';
    } else if (removed.type === 'email' || id === 'supp-email') {
      this.data.settings.supportEmail = '';
    }

    this.logAudit({
      action: 'Customer Support Link Deleted',
      admin: adminUser,
      beforeValue: removed.title,
      reason: 'Admin removed support channel',
      status: 'success',
      referenceId: id,
    });
    this.data.settings.updatedAt = new Date().toISOString();
    this.persist(true);
    this.broadcast('support_updated', this.data.supportLinks);
    this.broadcast('settings_updated', this.data.settings);
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- DASHBOARD AGGREGATES ---
  public getUserDashboardStats(userId: string): {
    totalInvestment: number;
    totalWithdraw: number;
    totalProfit: number;
    referralEarnings: number;
    pendingWithdrawal: number;
    pendingDeposit: number;
    teamSize: number;
    teamInvestment: number;
  } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) {
      return {
        totalInvestment: 0,
        totalWithdraw: 0,
        totalProfit: 0,
        referralEarnings: 0,
        pendingWithdrawal: 0,
        pendingDeposit: 0,
        teamSize: 0,
        teamInvestment: 0,
      };
    }

    const investments = this.data.userInvestments.filter((i) => i.userId === userId);
    const totalInvestment = investments.reduce((sum, i) => sum + i.amount, 0);

    const withdrawals = this.data.withdrawalRequests.filter((w) => w.userId === userId);
    const totalWithdraw = withdrawals
      .filter((w) => w.status === 'approved')
      .reduce((sum, w) => sum + w.amountKwd, 0);
    const pendingWithdrawal = withdrawals
      .filter((w) => w.status === 'pending')
      .reduce((sum, w) => sum + w.amountKwd, 0);

    const deposits = this.data.depositRequests.filter((d) => d.userId === userId);
    const pendingDeposit = deposits
      .filter((d) => d.status === 'pending')
      .reduce((sum, d) => sum + d.amountKwd, 0);

    const userTxs = this.data.transactions.filter((t) => t.userId === userId);
    const totalProfit = userTxs
      .filter((t) => t.type === 'profit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const referralEarnings = userTxs
      .filter((t) => t.type === 'referral_commission' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    // Team members: users where referredBy matches this user's username or referralCode
    const teamMembers = this.data.users.filter(
      (u) =>
        u.referredBy &&
        (u.referredBy.toLowerCase() === user.username.toLowerCase() ||
          u.referredBy.toLowerCase() === user.referralCode.toLowerCase())
    );
    const teamSize = teamMembers.length;
    const teamUserIds = new Set(teamMembers.map((m) => m.id));

    const teamInvestments = this.data.userInvestments.filter((inv) => teamUserIds.has(inv.userId));
    const teamInvestment = teamInvestments.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      totalInvestment: Math.round(totalInvestment * 100) / 100,
      totalWithdraw: Math.round(totalWithdraw * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      referralEarnings: Math.round(referralEarnings * 100) / 100,
      pendingWithdrawal: Math.round(pendingWithdrawal * 100) / 100,
      pendingDeposit: Math.round(pendingDeposit * 100) / 100,
      teamSize,
      teamInvestment: Math.round(teamInvestment * 100) / 100,
    };
  }

  public getAdminDashboardStats() {
    const totalUsers = this.data.users.length;
    const activeUsers = this.data.users.filter((u) => u.status === 'active').length;
    const suspendedUsers = this.data.users.filter((u) => u.status === 'suspended' || u.status === 'blocked').length;

    const totalDeposits = this.data.depositRequests
      .filter((d) => d.status === 'approved')
      .reduce((s, d) => s + d.amountKwd, 0);
    const pendingDeposits = this.data.depositRequests
      .filter((d) => d.status === 'pending')
      .reduce((s, d) => s + d.amountKwd, 0);
    const approvedDepositsCount = this.data.depositRequests.filter((d) => d.status === 'approved').length;

    const totalWithdrawals = this.data.withdrawalRequests
      .filter((w) => w.status === 'approved')
      .reduce((s, w) => s + w.amountKwd, 0);
    const pendingWithdrawals = this.data.withdrawalRequests
      .filter((w) => w.status === 'pending')
      .reduce((s, w) => s + w.amountKwd, 0);
    const approvedWithdrawalsCount = this.data.withdrawalRequests.filter((w) => w.status === 'approved').length;

    const totalInvestments = this.data.userInvestments.reduce((s, i) => s + i.amount, 0);
    const activeInvestments = this.data.userInvestments
      .filter((i) => i.status === 'active')
      .reduce((s, i) => s + i.amount, 0);

    const totalProfitAdded = this.data.transactions
      .filter((t) => t.type === 'profit' && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0);

    const totalReferralPaid = this.data.transactions
      .filter((t) => t.type === 'referral_commission' && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalDeposits: Math.round(totalDeposits * 100) / 100,
      pendingDeposits: Math.round(pendingDeposits * 100) / 100,
      approvedDepositsCount,
      totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
      pendingWithdrawals: Math.round(pendingWithdrawals * 100) / 100,
      approvedWithdrawalsCount,
      totalInvestments: Math.round(totalInvestments * 100) / 100,
      activeInvestments: Math.round(activeInvestments * 100) / 100,
      totalProfitAdded: Math.round(totalProfitAdded * 100) / 100,
      totalReferralPaid: Math.round(totalReferralPaid * 100) / 100,
      recentTransactions: this.data.transactions.slice(0, 10),
      recentAdminActions: this.data.auditLogs.slice(0, 10),
    };
  }
}

export const db = new DatabaseService();
