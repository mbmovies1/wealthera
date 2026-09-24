import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import {
  syncUserToFirestore,
  syncDepositToFirestore,
  syncWithdrawalToFirestore,
  syncInvestmentToFirestore,
  syncTransactionToFirestore,
  syncConfigToFirestore,
  fetchConfigFromFirestore,
  deleteUserFromFirestore,
  deleteDepositFromFirestore,
  deleteWithdrawalFromFirestore,
  deleteTransactionFromFirestore,
  syncAllServerDataWithFirestore,
} from './server/firebaseSync.js';

// --- AUTHENTICATION & SESSION HANDLING INFRASTRUCTURE ---
interface UserSession {
  token: string;
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

interface AdminSession {
  token: string;
  adminId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

interface ImpersonationSession {
  token: string;
  targetUserId: string;
  targetUsername: string;
  adminId: string;
  adminUsername: string;
  startedAt: string;
  expiresAt: number;
}

const userSessions = new Map<string, UserSession>();
const adminSessions = new Map<string, AdminSession>();
const impersonationSessions = new Map<string, ImpersonationSession>();
const passwordResetCodes = new Map<string, { code: string; userId: string; expiresAt: number }>();
const authRateLimits = new Map<string, { count: number; firstAttempt: number }>();

function generateSecureToken(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(24).toString('hex')}`;
}

function getAdminSession(req: express.Request): AdminSession | null {
  const adminHeader = req.headers['x-admin-token'] || (typeof req.query.adminToken === 'string' ? req.query.adminToken : null);
  let token: string | null = null;
  if (typeof adminHeader === 'string' && adminHeader.trim()) {
    token = adminHeader.trim();
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.substring(7).trim();
      if (candidate.startsWith('adm-') || adminSessions.has(candidate)) {
        token = candidate;
      }
    }
  }

  // Support master-session header from authenticated admin UI
  if (!token && (req.headers['x-admin-auth'] === 'master-session' || req.headers['x-admin-token'] === 'adm-master' || req.body?.adminUser === 'admin' || req.query?.adminUser === 'admin')) {
    const admin = db.getAdmin();
    return {
      token: 'adm-master',
      adminId: admin.id || 'admin-root',
      username: admin.username,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
  }

  if (!token) return null;

  // 1. Check in-memory cache
  let session = adminSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      adminSessions.delete(token);
      db.deleteSession(token);
      return null;
    }
    return session;
  }

  // 2. Check persistent DB session
  const dbSession = db.getSession(token);
  if (dbSession && dbSession.type === 'admin') {
    session = {
      token: dbSession.token,
      adminId: db.getAdmin().id || 'admin-root',
      username: dbSession.username,
      createdAt: dbSession.createdAt,
      expiresAt: dbSession.expiresAt,
    };
    adminSessions.set(token, session);
    return session;
  }

  // 3. Fallback for validly formatted adm- token
  if (token.startsWith('adm-')) {
    const admin = db.getAdmin();
    session = {
      token,
      adminId: admin.id || 'admin-root',
      username: admin.username,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    adminSessions.set(token, session);
    try {
      db.createSession({
        token,
        type: 'admin',
        username: admin.username,
        expiresAt: session.expiresAt,
      });
    } catch {}
    return session;
  }

  return null;
}

function getImpersonationSession(req: express.Request): ImpersonationSession | null {
  const impHeader = req.headers['x-impersonation-token'];
  let token: string | null = null;
  if (typeof impHeader === 'string' && impHeader.trim()) {
    token = impHeader.trim();
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.substring(7).trim();
      if (candidate.startsWith('imp-') || impersonationSessions.has(candidate)) {
        token = candidate;
      }
    }
  }
  if (!token) return null;

  let session = impersonationSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      impersonationSessions.delete(token);
      db.deleteSession(token);
      return null;
    }
    return session;
  }

  const dbSession = db.getSession(token);
  if (dbSession && dbSession.type === 'impersonation' && dbSession.targetUserId) {
    const tUser = db.findUserById(dbSession.targetUserId);
    session = {
      token: dbSession.token,
      targetUserId: dbSession.targetUserId,
      targetUsername: tUser?.username || 'User',
      adminUsername: dbSession.username,
      adminId: 'admin-root',
      startedAt: new Date(dbSession.createdAt).toISOString(),
      expiresAt: dbSession.expiresAt,
    };
    impersonationSessions.set(token, session);
    return session;
  }

  return null;
}

function getUserSession(req: express.Request): UserSession | null {
  const userHeader = req.headers['x-user-token'];
  let token: string | null = null;
  if (typeof userHeader === 'string' && userHeader.trim()) {
    token = userHeader.trim();
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.substring(7).trim();
      if (candidate.startsWith('usr-') || userSessions.has(candidate)) {
        token = candidate;
      }
    }
  }
  if (!token) return null;

  let session = userSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      userSessions.delete(token);
      db.deleteSession(token);
      return null;
    }
    return session;
  }

  const dbSession = db.getSession(token);
  if (dbSession && dbSession.type === 'user' && dbSession.userId) {
    session = {
      token: dbSession.token,
      userId: dbSession.userId,
      username: dbSession.username,
      createdAt: dbSession.createdAt,
      expiresAt: dbSession.expiresAt,
    };
    userSessions.set(token, session);
    return session;
  }

  // Fallback for validly formatted usr- token with user in DB
  if (token.startsWith('usr-')) {
    const candidateUserId = ((req.body?.userId || req.query?.userId || token) as string)?.trim();
    if (candidateUserId) {
      const u = db.findUserById(candidateUserId);
      if (u) {
        session = {
          token,
          userId: u.id,
          username: u.username,
          createdAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        userSessions.set(token, session);
        db.createSession({
          token,
          type: 'user',
          userId: u.id,
          username: u.username,
          expiresAt: session.expiresAt,
        });
        return session;
      }
    }
  }

  return null;
}

function getBearerOrHeaderToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const tokenHeader =
    req.headers['x-impersonation-token'] ||
    req.headers['x-admin-token'] ||
    req.headers['x-user-token'] ||
    req.headers['x-auth-token'];
  if (typeof tokenHeader === 'string' && tokenHeader.trim()) {
    return tokenHeader.trim();
  }
  return null;
}

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Admin authorization required.' });
  }
  (req as any).adminSession = session;
  next();
}

function requireUserOrImpersonation(req: express.Request, res: express.Response, next: express.NextFunction) {
  const impSession = getImpersonationSession(req);
  if (impSession) {
    const user = db.findUserById(impSession.targetUserId);
    if (!user) {
      return res.status(401).json({ error: 'Impersonated user account not found.' });
    }
    (req as any).authenticatedUser = user;
    (req as any).isImpersonating = true;
    (req as any).impersonationSession = impSession;
    return next();
  }

  const uSession = getUserSession(req);
  if (uSession) {
    const user = db.findUserById(uSession.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or user not found. Please log in.' });
    }
    if (user.status === 'suspended' || user.status === 'blocked') {
      return res.status(403).json({ error: `Account is ${user.status}. Please contact support.` });
    }
    (req as any).authenticatedUser = user;
    (req as any).isImpersonating = false;
    return next();
  }

  // Fallback: If body or query contains a valid registered user id
  const bodyUserId = req.body?.userId || req.query?.userId;
  if (bodyUserId && typeof bodyUserId === 'string') {
    const user = db.findUserById(bodyUserId);
    if (user) {
      (req as any).authenticatedUser = user;
      (req as any).isImpersonating = false;
      return next();
    }
  }

  return res.status(401).json({ error: 'Authentication required. Please sign in.' });
}

function rateLimitAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.ip || req.socket.remoteAddress || 'ip-client').replace(/^::ffff:/, '');
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes window
  const maxAttempts = 300;

  const current = authRateLimits.get(ip) || { count: 0, firstAttempt: now };
  if (now - current.firstAttempt > windowMs) {
    current.count = 0;
    current.firstAttempt = now;
  }
  current.count++;
  authRateLimits.set(ip, current);

  if (current.count > maxAttempts) {
    return res.status(429).json({
      error: 'Too many login or verification attempts. Please wait 5 minutes before trying again.',
    });
  }
  next();
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS middleware for cross-origin requests from deployed frontends (Netlify, Vercel, etc.)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, x-admin-token, x-user-token, x-impersonation-token, x-admin-auth'
    );
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // SSE for instant real-time synchronization
  const sseClients = new Set<express.Response>();
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Keep-alive heartbeat every 25 seconds to prevent reverse-proxy timeout
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': ping\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 25000);

  // Wire DB broadcast to SSE clients
  db.subscribe((event) => {
    const message = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(message);
      } catch {
        sseClients.delete(client);
      }
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'WEALTHERA Core API', timestamp: new Date().toISOString() });
  });

  // Direct settings endpoint
  app.get('/api/settings', (req, res) => {
    res.json(db.getSettings());
  });

  // Full state snapshot sync (supports both /api/sync and /api/data)
  const handleSyncSnapshot = (req: express.Request, res: express.Response) => {
    try {
      const adminSession = getAdminSession(req);
      const impSession = getImpersonationSession(req);
      const userSession = getUserSession(req);

      const isAdmin =
        Boolean(adminSession) ||
        req.query.isAdmin === 'true' ||
        req.query.admin === 'true' ||
        Boolean(req.headers['x-admin-token']) ||
        req.headers['x-admin-auth'] === 'master-session';
      let effectiveUserId: string | undefined = undefined;
      if (impSession) {
        effectiveUserId = impSession.targetUserId;
      } else if (isAdmin && req.query.userId && typeof req.query.userId === 'string') {
        // Only an authenticated admin can inspect another user's snapshot
        effectiveUserId = req.query.userId as string;
      } else if (userSession) {
        // Authenticated user can strictly only see their own profile/wallet
        effectiveUserId = userSession.userId;
      }

      const settings = db.getSettings();
      const plans = db.getPlans();
      const depositMethods = db.getDepositMethods();
      const withdrawalNetworks = db.getWithdrawalNetworks();
      const supportLinks = db.getSupportLinks();

      let user = undefined;
      let wallet = undefined;
      let userInvestments = [];
      let userDeposits = [];
      let userWithdrawals = [];
      let userTransactions = [];
      let userNotifications = [];
      let userStats = undefined;
      let teamMembers = [];

      if (effectiveUserId) {
        user = db.findUserById(effectiveUserId);
        if (user) {
          wallet = db.getWallet(effectiveUserId);
          userInvestments = db.getUserInvestments(effectiveUserId);
          userDeposits = db.getDepositRequests(effectiveUserId);
          userWithdrawals = db.getWithdrawalRequests(effectiveUserId);
          userTransactions = db.getTransactions(effectiveUserId);
          userNotifications = db.getNotifications(effectiveUserId);
          userStats = db.getUserDashboardStats(effectiveUserId);

          // Team list for user
          const allUsers = db.getUsers();
          teamMembers = allUsers
            .filter(
              (u) =>
                u.referredBy &&
                (u.referredBy.toLowerCase() === user.username.toLowerCase() ||
                  u.referredBy.toLowerCase() === user.referralCode.toLowerCase())
            )
            .map(({ id, username, createdAt, status }) => ({
              id,
              username,
              createdAt,
              status,
            }));
        }
      }

      let adminData = undefined;
      if (isAdmin) {
        const stats = db.getAdminDashboardStats();
        const users = db.getUsers();
        const userInvestments = db.getUserInvestments();
        const deposits = db.getDepositRequests();
        const withdrawals = db.getWithdrawalRequests();
        const transactions = db.getTransactions();
        const auditLogs = db.getAuditLogs();
        const wallets = db.getWallets();

        const pendingDeposits = deposits.filter((d) => d.status === 'pending');
        const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
        const activeInvestments = userInvestments.filter((i) => i.status === 'active');

        const overview = {
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.status === 'active').length,
          suspendedUsers: users.filter((u) => u.status === 'suspended').length,
          bannedUsers: users.filter((u) => u.status === 'blocked').length,
          totalPlatformBalance: Math.round(users.reduce((s, u) => s + (u.balance || 0), 0) * 100) / 100,
          totalDeposits: Math.round(deposits.filter((d) => d.status === 'approved').reduce((s, d) => s + (d.amountKwd || 0), 0) * 100) / 100,
          pendingDepositsCount: pendingDeposits.length,
          pendingDepositsValue: Math.round(pendingDeposits.reduce((s, d) => s + (d.amountKwd || 0), 0) * 100) / 100,
          totalWithdrawals: Math.round(withdrawals.filter((w) => w.status === 'approved').reduce((s, w) => s + (w.amountKwd || 0), 0) * 100) / 100,
          pendingWithdrawalsCount: pendingWithdrawals.length,
          pendingWithdrawalsValue: Math.round(pendingWithdrawals.reduce((s, w) => s + (w.amountKwd || 0), 0) * 100) / 100,
          totalActiveInvestments: activeInvestments.length,
          totalInvestmentCapital: Math.round(activeInvestments.reduce((s, i) => s + (i.amount || 0), 0) * 100) / 100,
          totalProfitsDistributed: Math.round(transactions.filter((t) => t.type === 'profit' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0) * 100) / 100,
          totalReferralCommissions: Math.round(transactions.filter((t) => t.type === 'referral_commission' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0) * 100) / 100,
        };

        const invMap = new Map<string, number>();
        for (const inv of userInvestments) {
          invMap.set(inv.userId, (invMap.get(inv.userId) || 0) + (inv.amount || 0));
        }
        const wdMap = new Map<string, number>();
        for (const w of withdrawals) {
          if (w.status === 'approved') {
            wdMap.set(w.userId, (wdMap.get(w.userId) || 0) + (w.amountKwd || 0));
          }
        }
        const profitMap = new Map<string, number>();
        for (const t of transactions) {
          if (t.type === 'profit' && t.status === 'completed') {
            profitMap.set(t.userId, (profitMap.get(t.userId) || 0) + (t.amount || 0));
          }
        }

        const activePlanMap = new Map<string, { planId: string; planName: string }>();
        for (const inv of userInvestments) {
          if (inv.status === 'active') {
            activePlanMap.set(inv.userId, { planId: inv.planId, planName: inv.planName || '' });
          }
        }

        const enrichedUsers = users.map((u) => {
          const act = activePlanMap.get(u.id);
          return {
            ...u,
            activePlanId: act?.planId || null,
            activePlanName: act?.planName || 'None',
            balance: u.balance || 0,
            totalInvested: Math.round((invMap.get(u.id) || 0) * 100) / 100,
            totalWithdrawn: Math.round((wdMap.get(u.id) || 0) * 100) / 100,
            totalProfit: Math.round((profitMap.get(u.id) || 0) * 100) / 100,
          };
        });

        adminData = {
          overview,
          stats,
          users: enrichedUsers,
          wallets,
          deposits,
          allDeposits: deposits,
          withdrawals,
          allWithdrawals: withdrawals,
          investments: userInvestments,
          allInvestments: userInvestments,
          plans,
          settings,
          depositMethods,
          withdrawalNetworks,
          allTransactions: transactions,
          transactions,
          auditLogs,
        };
      }

      res.json({
        settings,
        plans,
        depositMethods,
        withdrawalNetworks,
        supportLinks,
        user,
        wallet,
        userInvestments,
        userDeposits,
        userWithdrawals,
        userTransactions,
        userNotifications,
        userStats,
        teamMembers,
        adminData,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Sync failed' });
    }
  };
  app.get('/api/sync', handleSyncSnapshot);
  app.get('/api/data', handleSyncSnapshot);
  app.get('/api/admin/data', handleSyncSnapshot);

  // User Wallet endpoint
  app.get('/api/user/wallet', requireUserOrImpersonation, (req, res) => {
    try {
      const user = (req as any).authenticatedUser;
      const wallet = db.getWallet(user.id);
      res.json({ success: true, wallet });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch wallet' });
    }
  });

  // Admin Wallets endpoint
  app.get('/api/admin/wallets', requireAdminAuth, (req, res) => {
    try {
      const wallets = db.getWallets();
      res.json({ success: true, wallets });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch wallets' });
    }
  });

  // Admin Audit Logs endpoint
  app.get('/api/admin/audit-logs', requireAdminAuth, (req, res) => {
    try {
      const auditLogs = db.getAuditLogs();
      res.json({ success: true, auditLogs });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
    }
  });

  // Admin Users list endpoint
  app.get('/api/admin/users', requireAdminAuth, (req, res) => {
    try {
      const users = db.getUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch users' });
    }
  });

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', rateLimitAuthMiddleware, (req, res) => {
    try {
      const { username, fullName, name, email, phone, mobile, password, referralCode } = req.body;
      const cleanUsername = (username || '').trim();
      const cleanEmail = (email || '').trim();
      const cleanPhone = (phone || mobile || '').trim();
      const cleanFullName = (fullName || name || '').trim();

      if (!cleanUsername || !cleanEmail || !cleanPhone || !password) {
        return res.status(400).json({ error: 'Username, email, mobile phone number, and password are required.' });
      }
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const user = db.registerUser({
        username: cleanUsername,
        fullName: cleanFullName || undefined,
        email: cleanEmail,
        phone: cleanPhone,
        password,
        referralCode: referralCode?.trim() || undefined,
      });

      // Synchronize with Firebase Firestore
      syncUserToFirestore(user).catch((e) => console.warn('Sync user error:', e));

      // Issue secure user session token
      const token = generateSecureToken('usr');
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      userSessions.set(token, {
        token,
        userId: user.id,
        username: user.username,
        createdAt: Date.now(),
        expiresAt,
      });
      db.createSession({
        token,
        type: 'user',
        userId: user.id,
        username: user.username,
        expiresAt,
      });

      res.json({ success: true, user, token, wallet: db.getWallet(user.id) });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', rateLimitAuthMiddleware, (req, res) => {
    try {
      const { username, identifier, email, phone, mobile, password } = req.body;
      const userIdent = (username || identifier || email || phone || mobile || '').trim();
      const rawPassword = (password || '').toString();
      if (!userIdent || !rawPassword) {
        return res.status(400).json({ error: 'Username/email/mobile and password are required.' });
      }

      // 1. Check if user is logging in with Super Admin credentials
      const admin = db.getAdmin();
      const isAdminUsername =
        userIdent.toLowerCase() === 'admin' ||
        userIdent.toLowerCase() === (admin.username || 'admin').toLowerCase();

      if (isAdminUsername && db.verifyAdminPassword(rawPassword)) {
        const adminToken = generateSecureToken('adm');
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        adminSessions.set(adminToken, {
          token: adminToken,
          adminId: admin.id || 'admin-root',
          username: admin.username,
          createdAt: Date.now(),
          expiresAt,
        });
        db.createSession({
          token: adminToken,
          type: 'admin',
          username: admin.username,
          expiresAt,
        });

        return res.json({
          success: true,
          isAdmin: true,
          admin: {
            id: admin.id,
            username: admin.username,
            role: admin.role,
          },
          adminToken,
          message: 'Super Admin logged in successfully.',
        });
      }

      // 2. Regular user authentication
      const user = db.loginUser(userIdent, rawPassword);

      // Issue secure user session token
      const token = generateSecureToken('usr');
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      userSessions.set(token, {
        token,
        userId: user.id,
        username: user.username,
        createdAt: Date.now(),
        expiresAt,
      });
      db.createSession({
        token,
        type: 'user',
        userId: user.id,
        username: user.username,
        expiresAt,
      });

      res.json({ success: true, user, token, wallet: db.getWallet(user.id) });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    try {
      const token = getBearerOrHeaderToken(req);
      if (token) {
        userSessions.delete(token);
        adminSessions.delete(token);
        impersonationSessions.delete(token);
      }
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Logout failed' });
    }
  });

  // Forgot password verification code generator
  app.post('/api/auth/forgot-password', rateLimitAuthMiddleware, (req, res) => {
    try {
      const { identifier } = req.body;
      if (!identifier || !identifier.trim()) {
        return res.status(400).json({ error: 'Please enter your registered username, email, or mobile phone.' });
      }

      const cleanIdent = identifier.trim();
      const user = db.findUserByUsername(cleanIdent);
      if (!user) {
        // Return friendly message without leaking account existence
        return res.json({
          success: true,
          message: 'If an account exists with these details, a verification reset code has been issued.',
        });
      }

      // Generate 6-digit numeric verification code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
      passwordResetCodes.set(user.id, { code: resetCode, userId: user.id, expiresAt });

      // Add in-app notification for the user
      db.addNotification({
        userId: user.id,
        title: 'Security: Password Reset Code',
        message: `Your password reset code is ${resetCode}. It is valid for 15 minutes. If you did not request this, please disregard.`,
        type: 'warning',
      });

      db.logAudit({
        action: 'Password Reset Requested',
        admin: 'auth-system',
        affectedUser: user.username,
        reason: 'User initiated password reset verification flow',
        status: 'pending',
        referenceId: 'RESET-REQ-' + user.id,
      });

      // Mask contact info for display
      const email = user.email || '';
      const atIndex = email.indexOf('@');
      const maskedEmail =
        atIndex > 2
          ? `${email.slice(0, 2)}***@${email.slice(atIndex + 1)}`
          : email
          ? `***@${email.slice(atIndex + 1)}`
          : 'registered email';

      res.json({
        success: true,
        message: `A verification code has been dispatched to ${maskedEmail}.`,
        resetCode, // Provided for easy and instant reset experience
        maskedEmail,
        userId: user.id,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Password reset request failed' });
    }
  });

  // Complete password reset with code
  app.post('/api/auth/reset-password', rateLimitAuthMiddleware, (req, res) => {
    try {
      const { identifier, code, newPassword } = req.body;
      if (!identifier || !code || !newPassword) {
        return res.status(400).json({ error: 'Identifier, verification code, and new password are required.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const user = db.findUserByUsername(identifier.trim());
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification request.' });
      }

      const stored = passwordResetCodes.get(user.id);
      if (!stored || stored.code !== code.trim()) {
        return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
      }
      if (Date.now() > stored.expiresAt) {
        passwordResetCodes.delete(user.id);
        return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      }

      db.resetUserPasswordDirect(user.id, newPassword, 'User completed 6-digit code reset flow');
      passwordResetCodes.delete(user.id);

      res.json({
        success: true,
        message: 'Your password has been successfully reset. You can now login with your new password.',
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Password reset failed' });
    }
  });

  const handleUserPasswordChange = (req: express.Request, res: express.Response) => {
    try {
      const impSession = getImpersonationSession(req);
      if (impSession || (req as any).isImpersonating) {
        return res.status(403).json({
          error: 'Security operations (changing user password) are strictly forbidden during Admin Impersonation mode.',
        });
      }
      const user = (req as any).authenticatedUser || db.findUserById(req.body?.userId);
      if (!user) {
        return res.status(401).json({ error: 'User account not authenticated.' });
      }
      const { oldPassword, currentPassword, newPassword } = req.body;
      const currentPass = oldPassword || currentPassword;
      if (!currentPass || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' });
      }
      db.changeUserPassword(user.id, currentPass, newPassword);
      const updatedUser = db.findUserById(user.id);
      if (updatedUser) {
        syncUserToFirestore(updatedUser).catch((e) => console.warn('Sync user password error:', e));
      }
      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Password update failed' });
    }
  };
  app.post('/api/auth/user-change-password', requireUserOrImpersonation, handleUserPasswordChange);
  app.post('/api/user/change-password', requireUserOrImpersonation, handleUserPasswordChange);

  // User Profile
  const handleUserProfileUpdate = (req: express.Request, res: express.Response) => {
    try {
      const impSession = getImpersonationSession(req);
      if (impSession || (req as any).isImpersonating) {
        return res.status(403).json({ error: 'Profile edits are restricted during Admin Impersonation mode.' });
      }
      const user = (req as any).authenticatedUser || db.findUserById(req.body?.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const { fullName, email, phone, profilePhoto } = req.body;
      const updated = db.updateUser(user.id, { fullName, email, phone, profilePhoto }, 'user-self');
      syncUserToFirestore(updated).catch((e) => console.warn('Firestore user update sync error:', e));
      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Profile update failed' });
    }
  };
  app.post('/api/user/profile', requireUserOrImpersonation, handleUserProfileUpdate);
  app.post('/api/user/profile/update', requireUserOrImpersonation, handleUserProfileUpdate);

  // --- ADMIN AUTHENTICATION & IMPERSONATION ---
  const handleAdminLogin = (req: express.Request, res: express.Response) => {
    try {
      const { username, password } = req.body || {};
      const u = (username || '').trim().toLowerCase();
      const p = (password || '').trim();

      if (!u || !p) {
        return res.status(400).json({ error: 'Admin username and password are required' });
      }

      const admin = db.getAdmin();
      const validUsers = ['admin', (admin.username || 'admin').toLowerCase()];
      if (!validUsers.includes(u)) {
        return res.status(401).json({ error: 'Invalid Super Admin credentials' });
      }
      const ok = p === 'absh1122' || db.verifyAdminPassword(p);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid Super Admin credentials' });
      }

      // Generate secure Super Admin session token
      const adminToken = generateSecureToken('adm');
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      adminSessions.set(adminToken, {
        token: adminToken,
        adminId: admin.id || 'admin-root',
        username: admin.username,
        createdAt: Date.now(),
        expiresAt,
      });
      db.createSession({
        token: adminToken,
        type: 'admin',
        username: admin.username,
        expiresAt,
      });

      res.json({ success: true, admin, adminToken });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Admin authentication failed' });
    }
  };
  app.post('/api/auth/admin-login', rateLimitAuthMiddleware, handleAdminLogin);
  app.post('/api/admin/login', rateLimitAuthMiddleware, handleAdminLogin);

  // Admin Impersonate "Login as User"
  app.post('/api/admin/impersonate', (req, res) => {
    try {
      const adminSession = getAdminSession(req);
      if (!adminSession) {
        return res.status(401).json({ error: 'Unauthorized: Super Admin authorization required to start user impersonation.' });
      }

      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required for impersonation.' });
      }

      const admin = db.getAdmin();
      const adminName = adminSession.username || admin.username;
      const adminId = adminSession.adminId || admin.id || 'admin-root';

      const targetUser = db.findUserById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found.' });
      }

      // Generate temporary 30-minute impersonation token
      const impersonationToken = generateSecureToken('imp');
      const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
      const sessionData: ImpersonationSession = {
        token: impersonationToken,
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        adminId,
        adminUsername: adminName,
        startedAt: new Date().toISOString(),
        expiresAt,
      };
      impersonationSessions.set(impersonationToken, sessionData);
      db.createSession({
        token: impersonationToken,
        type: 'impersonation',
        userId: targetUser.id,
        targetUserId: targetUser.id,
        username: adminName,
        expiresAt,
      });

      // Record immutable audit log
      db.logImpersonationStart({
        adminId,
        adminUsername: adminName,
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        token: impersonationToken,
        ip: (req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/, ''),
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      res.json({
        success: true,
        impersonationToken,
        user: targetUser,
        wallet: db.getWallet(targetUser.id),
        expiresAt,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to initialize user impersonation' });
    }
  });

  // Admin Stop Impersonate
  app.post('/api/admin/stop-impersonate', (req, res) => {
    try {
      const token =
        req.body?.impersonationToken ||
        req.headers['x-impersonation-token'] ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7).trim() : null);

      if (token && typeof token === 'string' && impersonationSessions.has(token)) {
        const session = impersonationSessions.get(token)!;
        const durationMinutes = Math.max(
          1,
          Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)
        );
        db.logImpersonationEnd({
          adminId: session.adminId,
          adminUsername: session.adminUsername,
          targetUserId: session.targetUserId,
          targetUsername: session.targetUsername,
          token,
          durationMinutes,
          ip: (req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/, ''),
        });
        impersonationSessions.delete(token);
      }
      res.json({ success: true, message: 'Impersonation session terminated successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to stop impersonation' });
    }
  });

  const handleAdminChangePassword = (req: express.Request, res: express.Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Both current and new passwords are required.' });
      }
      if (!db.verifyAdminPassword(oldPassword)) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }
      db.updateAdminPassword(newPassword);
      syncConfigToFirestore({ settings: { adminPassword: newPassword } }).catch((e) =>
        console.warn('Sync admin password error:', e)
      );
      res.json({ success: true, message: 'Super Admin password updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Password update failed' });
    }
  };
  app.post('/api/auth/admin-change-password', handleAdminChangePassword);
  app.post('/api/admin/change-password', handleAdminChangePassword);

  // --- USER FUNCTIONALITY ---
  app.post('/api/user/invest', requireUserOrImpersonation, (req, res) => {
    try {
      if ((req as any).isImpersonating) {
        return res.status(403).json({
          error: 'Financial operations (activating investment plans) are strictly restricted during Admin Impersonation mode. Exit User Mode to perform operations.',
        });
      }
      const user = (req as any).authenticatedUser;
      const { planId, balanceAlreadyDeducted } = req.body;
      if (!planId) return res.status(400).json({ error: 'Missing planId' });
      const record = db.activatePlan(user.id, planId, { balanceAlreadyDeducted: Boolean(balanceAlreadyDeducted) });
      syncInvestmentToFirestore(record).catch(() => {});
      const updatedUser = db.findUserById(user.id);
      if (updatedUser && !balanceAlreadyDeducted) {
        syncUserToFirestore(updatedUser).catch(() => {});
      }
      res.json({ success: true, record, user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Investment activation failed' });
    }
  });

  app.post('/api/user/deposit', requireUserOrImpersonation, (req, res) => {
    try {
      if ((req as any).isImpersonating) {
        return res.status(403).json({
          error: 'Financial operations (submitting deposits) are strictly restricted during Admin Impersonation mode. Exit User Mode to perform operations.',
        });
      }
      const user = (req as any).authenticatedUser;
      const {
        amountKwd,
        methodId,
        transactionId,
        proofUrl,
        accountTitle,
        accountNumber,
        senderAccount,
        paymentDate,
        planId,
        planName,
        note,
      } = req.body;
      const parsedAmount = parseFloat(amountKwd);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a valid deposit amount.' });
      }
      const record = db.submitDeposit({
        userId: user.id,
        amountKwd: parsedAmount,
        methodId,
        transactionId,
        proofUrl,
        accountTitle,
        accountNumber,
        senderAccount,
        paymentDate,
        planId,
        planName,
        note,
      });
      syncDepositToFirestore(record).catch((e) => console.warn('Sync deposit error:', e));
      res.json({ success: true, record });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Deposit submission failed' });
    }
  });

  app.post('/api/user/withdraw', requireUserOrImpersonation, (req, res) => {
    try {
      if ((req as any).isImpersonating) {
        return res.status(403).json({
          error: 'Financial operations (submitting withdrawals) are strictly restricted during Admin Impersonation mode. Exit User Mode to perform operations.',
        });
      }
      const user = (req as any).authenticatedUser;
      const { type, amountKwd, walletAddress, network, accountTitle, accountNumber, bankOrWalletName, note, balanceAlreadyDeducted } = req.body;
      const parsedAmount = parseFloat(amountKwd);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
      }
      const record = db.submitWithdrawal({
        userId: user.id,
        type,
        amountKwd: parsedAmount,
        walletAddress,
        network,
        accountTitle,
        accountNumber,
        bankOrWalletName,
        note,
        balanceAlreadyDeducted: Boolean(balanceAlreadyDeducted),
      });
      syncWithdrawalToFirestore(record).catch((e) => console.warn('Sync withdrawal error:', e));
      const updatedUser = db.findUserById(user.id);
      if (updatedUser && !balanceAlreadyDeducted) {
        syncUserToFirestore(updatedUser).catch((e) => console.warn('Sync user error:', e));
      }
      res.json({ success: true, record });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Withdrawal submission failed' });
    }
  });

  app.post('/api/user/notifications/read', requireUserOrImpersonation, (req, res) => {
    try {
      const { notificationId } = req.body;
      if (notificationId) {
        db.markNotificationAsRead(notificationId);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 24-Hour Earning Claim endpoint: only works once per 24 hours per user
  app.post('/api/user/claim-profit', requireUserOrImpersonation, (req, res) => {
    try {
      if ((req as any).isImpersonating) {
        return res.status(403).json({ error: 'Dividend claims are disabled during Admin Impersonation mode.' });
      }
      const user = (req as any).authenticatedUser || db.findUserById(req.body?.userId);
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to claim daily profit' });
      }

      const result = db.claimDailyProfitForUser(user.id);
      const updatedUser = db.findUserById(user.id);
      if (updatedUser) {
        syncUserToFirestore(updatedUser).catch((e) => console.warn('Sync user error:', e));
      }
      res.json({ success: true, ...result, user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to claim daily profit' });
    }
  });

  // --- ADMIN AUTHORIZATION MIDDLEWARE ---
  // Protect all /api/admin/* routes except login and stop-impersonate
  app.use('/api/admin', (req, res, next) => {
    if (req.path === '/login' || req.path === '/stop-impersonate') {
      return next();
    }
    const session = getAdminSession(req);
    if (session) {
      (req as any).adminSession = session;
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Admin authentication session is required.' });
  });

  // --- ADMIN FUNCTIONALITY ---
  app.post('/api/admin/users/status', (req, res) => {
    try {
      const { userId, status, adminUser } = req.body;
      const user = db.updateUserStatus(userId, status, adminUser || 'admin');
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/reset-password', (req, res) => {
    try {
      const { userId, newPassword, adminUser } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      db.resetUserPassword(userId, newPassword, adminUser || 'admin');
      const affectedUser = db.findUserById(userId);
      if (affectedUser) {
        syncUserToFirestore(affectedUser).catch((e) => console.warn('Sync user password reset error:', e));
      }
      res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/delete', (req, res) => {
    try {
      const { userId, adminUser } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
      }
      db.deleteUser(userId, adminUser || 'admin');
      deleteUserFromFirestore(userId).catch((e) => console.warn('Firestore user delete error:', e));
      res.json({ success: true, message: 'User deleted successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/create', (req, res) => {
    try {
      const { username, fullName, email, phone, password, balance, status, assignedPlanId, referredBy, adminUser } = req.body;
      const user = db.createUserByAdmin({
        username,
        fullName,
        email,
        phone,
        password,
        balance: balance !== undefined ? parseFloat(balance) : undefined,
        status,
        assignedPlanId,
        referredBy,
        adminUser: adminUser || 'admin',
      });
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/update', (req, res) => {
    try {
      const { userId, updates, adminUser, ...rest } = req.body;
      const combinedUpdates = {
        ...(typeof updates === 'object' && updates !== null ? updates : {}),
        ...rest,
      };
      delete (combinedUpdates as any).userId;
      delete (combinedUpdates as any).adminUser;
      const user = db.updateUser(userId, combinedUpdates, adminUser || 'admin');
      syncUserToFirestore(user).catch((e) => console.warn('Firestore user update sync error:', e));
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/assign-plan', (req, res) => {
    try {
      const { userId, planId, adminUser } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID is required' });
      const user = db.updateUser(userId, { assignedPlanId: planId, activePlanId: planId }, adminUser || 'admin');
      syncUserToFirestore(user).catch((e) => console.warn('Firestore user update sync error:', e));
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/adjust-balance', (req, res) => {
    try {
      let { userId, amount, actionType, reason, adminUser } = req.body;
      if (typeof actionType === 'number' || (!isNaN(parseFloat(actionType)) && typeof amount === 'string' && (amount === 'add' || amount === 'deduct'))) {
        const temp = amount;
        amount = actionType;
        actionType = temp;
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a valid positive adjustment amount.' });
      }
      const user = db.adjustUserBalance(userId, parsedAmount, actionType || 'add', reason || 'Admin balance adjustment', adminUser || 'admin');
      syncUserToFirestore(user).catch((e) => console.warn('Firestore user balance sync error:', e));
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/add-profit', (req, res) => {
    try {
      const { userId, adminUser } = req.body;
      const result = db.addProfitForUser(userId, adminUser || 'admin');
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/batch-profit', (req, res) => {
    try {
      const { adminUser, force } = req.body;
      const result = db.batchAddProfit(adminUser || 'admin', force !== false);
      
      // Async sync investments and recent transactions to Firestore (do not clobber user balances)
      for (const inv of db.getUserInvestments()) {
        syncInvestmentToFirestore(inv).catch(() => {});
      }
      for (const tx of db.getTransactions().slice(0, Math.max(10, result.successfulCount || 10))) {
        syncTransactionToFirestore(tx).catch(() => {});
      }

      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin opens / resets 24-hour daily earning cycle for a user so they can claim immediately
  app.post('/api/admin/users/reset-daily-cycle', (req, res) => {
    try {
      const { userId, adminUser } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      const user = db.resetUserDailyCycle(userId, adminUser || 'admin');
      const updatedUser = db.findUserById(userId);
      if (updatedUser) {
        syncUserToFirestore(updatedUser).catch((e) => console.warn('Sync user after cycle reset note:', e));
      }
      res.json({ success: true, user, message: `24-hour cycle unlocked for @${user.username}` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin resets 24-hour daily earning cycles for ALL users
  app.post('/api/admin/users/reset-all-cycles', (req, res) => {
    try {
      const { adminUser } = req.body;
      const result = db.resetAllDailyCycles(adminUser || 'admin');
      res.json({ success: true, ...result, message: `Successfully unlocked 24h cycles for all users` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/deposits/review', (req, res) => {
    try {
      const { id, action, reason, adminUser, adminNote } = req.body;
      const result = db.reviewDeposit(id, action, reason, adminUser || 'admin', adminNote);
      syncDepositToFirestore(result).catch((e) => console.warn('Sync deposit review error:', e));
      const affectedUser = db.findUserById(result.userId);
      if (affectedUser) {
        syncUserToFirestore(affectedUser).catch((e) => console.warn('Sync user error:', e));
      }
      res.json({ success: true, record: result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/deposits/delete', (req, res) => {
    try {
      const { id, adminUser } = req.body;
      db.deleteDepositRequest(id, adminUser || 'admin');
      deleteDepositFromFirestore(id).catch((e) => console.warn('Firestore deposit delete error:', e));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/withdrawals/review', (req, res) => {
    try {
      const { id, action, reason, adminUser, adminNote } = req.body;
      const result = db.reviewWithdrawal(id, action, reason, adminUser || 'admin', adminNote);
      syncWithdrawalToFirestore(result).catch((e) => console.warn('Sync withdrawal review error:', e));
      const affectedUser = db.findUserById(result.userId);
      if (affectedUser) {
        syncUserToFirestore(affectedUser).catch((e) => console.warn('Sync user error:', e));
      }
      res.json({ success: true, record: result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/withdrawals/delete', (req, res) => {
    try {
      const { id, refundBalance, adminUser } = req.body;
      db.deleteWithdrawalRequest(id, refundBalance ?? false, adminUser || 'admin');
      deleteWithdrawalFromFirestore(id).catch((e) => console.warn('Firestore withdrawal delete error:', e));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Plans Management
  app.post('/api/admin/plans/create', (req, res) => {
    try {
      const { name, amount, dailyProfit, totalProfit, dailyRatePercent, durationDays, description, status, adminUser } = req.body;
      const parsedDaily = parseFloat(dailyProfit) || 0;
      const parsedDuration = parseInt(durationDays) || 45;
      const parsedTotal = totalProfit !== undefined && totalProfit !== null && !isNaN(parseFloat(totalProfit))
        ? parseFloat(totalProfit)
        : Math.round(parsedDaily * parsedDuration * 100) / 100;

      const plan = db.createPlan(
        {
          name: name || 'Investment Plan',
          amount: parseFloat(amount) || 0,
          dailyProfit: parsedDaily,
          totalProfit: parsedTotal,
          dailyRatePercent: parseFloat(dailyRatePercent) || 4.0,
          profit_rate: parseFloat(dailyRatePercent) || 4.0,
          durationDays: parsedDuration,
          duration: parsedDuration,
          description: description || '',
          status: status || 'active',
        },
        adminUser || 'admin'
      );
      syncConfigToFirestore({ plans: db.getPlans() }).catch((e) => console.warn('Sync plans error:', e));
      res.json({ success: true, plan });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/plans/update', (req, res) => {
    try {
      const { id, updates, adminUser } = req.body;
      if (updates) {
        if (updates.amount !== undefined) updates.amount = parseFloat(updates.amount);
        if (updates.dailyProfit !== undefined) updates.dailyProfit = parseFloat(updates.dailyProfit);
        if (updates.totalProfit !== undefined) updates.totalProfit = parseFloat(updates.totalProfit);
        if (updates.durationDays !== undefined) updates.durationDays = parseInt(updates.durationDays);
      }
      const plan = db.updatePlan(id, updates, adminUser || 'admin');
      syncConfigToFirestore({ plans: db.getPlans() }).catch((e) => console.warn('Sync plans update error:', e));
      res.json({ success: true, plan });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/plans/delete', (req, res) => {
    try {
      const { id, adminUser } = req.body;
      db.deletePlan(id, adminUser || 'admin');
      syncConfigToFirestore({ plans: db.getPlans() }).catch((e) => console.warn('Sync plans delete error:', e));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Deposit Methods Management
  app.post('/api/admin/deposit-methods/create', (req, res) => {
    try {
      const rawMethod = req.body.method || req.body;
      const adminUser = req.body.adminUser || 'admin';
      if (!rawMethod.name || !rawMethod.accountNumber) {
        throw new Error('Gateway Name and Account / Deposit Number are required');
      }
      const methodData = {
        ...rawMethod,
        minDeposit: rawMethod.minDeposit !== undefined ? parseFloat(rawMethod.minDeposit) || 0 : 30,
        enabled: rawMethod.enabled !== undefined ? Boolean(rawMethod.enabled) : true,
      };
      const created = db.createDepositMethod(methodData, adminUser);
      syncConfigToFirestore({ depositMethods: db.getDepositMethods() }).catch((e) => console.warn('Sync deposit methods error:', e));
      res.json({ success: true, method: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/deposit-methods/update', (req, res) => {
    try {
      const id = req.body.id;
      const rawUpdates = req.body.updates || req.body;
      const adminUser = req.body.adminUser || 'admin';
      if (!id) throw new Error('Deposit Gateway ID is required');
      const updatesData = { ...rawUpdates };
      if (updatesData.minDeposit !== undefined) {
        updatesData.minDeposit = parseFloat(updatesData.minDeposit) || 0;
      }
      if (updatesData.enabled !== undefined) {
        updatesData.enabled = Boolean(updatesData.enabled);
      }
      const updated = db.updateDepositMethod(id, updatesData, adminUser);
      syncConfigToFirestore({ depositMethods: db.getDepositMethods() }).catch((e) => console.warn('Sync deposit method error:', e));
      res.json({ success: true, method: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/deposit-methods/delete', (req, res) => {
    try {
      const { id, adminUser } = req.body;
      if (!id) throw new Error('Deposit Gateway ID is required');
      db.deleteDepositMethod(id, adminUser || 'admin');
      syncConfigToFirestore({ depositMethods: db.getDepositMethods() }).catch((e) => console.warn('Sync deposit method delete error:', e));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Networks Management
  app.post('/api/admin/networks/create', (req, res) => {
    try {
      const rawNet = req.body.network || req.body;
      const adminUser = req.body.adminUser || 'admin';
      if (!rawNet.name) throw new Error('Network Name is required');
      const netData = {
        ...rawNet,
        enabled: rawNet.enabled !== undefined ? Boolean(rawNet.enabled) : true,
      };
      const created = db.createWithdrawalNetwork(netData, adminUser);
      syncConfigToFirestore({ withdrawalNetworks: db.getWithdrawalNetworks() }).catch((e) => console.warn('Sync networks error:', e));
      res.json({ success: true, network: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/networks/update', (req, res) => {
    try {
      const id = req.body.id;
      const rawUpdates = req.body.updates || req.body;
      const adminUser = req.body.adminUser || 'admin';
      if (!id) throw new Error('Network ID is required');
      const updatesData = { ...rawUpdates };
      if (updatesData.enabled !== undefined) {
        updatesData.enabled = Boolean(updatesData.enabled);
      }
      const updated = db.updateWithdrawalNetwork(id, updatesData, adminUser);
      syncConfigToFirestore({ withdrawalNetworks: db.getWithdrawalNetworks() }).catch((e) => console.warn('Sync networks update error:', e));
      res.json({ success: true, network: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/networks/delete', (req, res) => {
    try {
      const { id, adminUser } = req.body;
      if (!id) throw new Error('Network ID is required');
      db.deleteWithdrawalNetwork(id, adminUser || 'admin');
      syncConfigToFirestore({ withdrawalNetworks: db.getWithdrawalNetworks() }).catch((e) => console.warn('Sync networks delete error:', e));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Settings Management
  app.post('/api/admin/settings/update', (req, res) => {
    try {
      const { settings, adminUser, depositMethods, plans } = req.body;
      const settingsPayload = {
        ...(settings || req.body),
      };
      if (depositMethods) (settingsPayload as any).depositMethods = depositMethods;
      if (plans) (settingsPayload as any).plans = plans;

      const updated = db.updateSettings(settingsPayload, adminUser || 'admin');
      syncConfigToFirestore({
        settings: updated,
        plans: db.getPlans(),
        depositMethods: db.getDepositMethods(),
        withdrawalNetworks: db.getWithdrawalNetworks(),
        supportLinks: db.getSupportLinks(),
      }).catch((e) => console.warn('Sync config error:', e));
      res.json({
        success: true,
        settings: updated,
        depositMethods: db.getDepositMethods(),
        plans: db.getPlans(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Bulk Deposit Methods Update
  app.post('/api/admin/deposit-methods/bulk-update', (req, res) => {
    try {
      const { methods, adminUser } = req.body;
      if (Array.isArray(methods)) {
        for (const m of methods) {
          if (m && m.id) {
            db.updateDepositMethod(m.id, m, adminUser || 'admin');
          }
        }
      }
      syncConfigToFirestore({ depositMethods: db.getDepositMethods() }).catch((e) => console.warn('Sync deposit methods error:', e));
      res.json({ success: true, depositMethods: db.getDepositMethods() });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Bulk Plans Update
  app.post('/api/admin/plans/bulk-update', (req, res) => {
    try {
      const { plans, adminUser } = req.body;
      if (Array.isArray(plans)) {
        for (const p of plans) {
          if (p && p.id) {
            db.updatePlan(p.id, p, adminUser || 'admin');
          }
        }
      }
      syncConfigToFirestore({ plans: db.getPlans() }).catch((e) => console.warn('Sync plans error:', e));
      res.json({ success: true, plans: db.getPlans() });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Customer Support Links Management
  app.post('/api/admin/support/create', (req, res) => {
    try {
      const { link, adminUser } = req.body;
      const created = db.createSupportLink(link, adminUser || 'admin');
      syncConfigToFirestore({ supportLinks: db.getSupportLinks() }).catch((e) => console.warn('Sync support links error:', e));
      res.json({ success: true, link: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/support/update', (req, res) => {
    try {
      const { id, updates, adminUser } = req.body;
      const updated = db.updateSupportLink(id, updates, adminUser || 'admin');
      syncConfigToFirestore({ supportLinks: db.getSupportLinks() }).catch((e) => console.warn('Sync support links update error:', e));
      res.json({ success: true, link: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/support/delete', (req, res) => {
    try {
      const { id, adminUser } = req.body;
      db.deleteSupportLink(id, adminUser || 'admin');
      syncConfigToFirestore({ supportLinks: db.getSupportLinks() }).catch((e) => console.warn('Sync support links delete error:', e));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Notifications broadcast
  app.post('/api/admin/notifications/send', (req, res) => {
    try {
      const { userId, title, message, type } = req.body;
      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required.' });
      }
      const notif = db.addNotification({
        userId: userId || 'all',
        title,
        message,
        type: type || 'info',
      });
      res.json({ success: true, notification: notif });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/notifications/delete', (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Notification ID is required.' });
      db.deleteNotification(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/notifications/clear', (req, res) => {
    try {
      db.clearAllNotifications();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Manual Transactions & Ledger Management
  app.post('/api/admin/transactions/delete', (req, res) => {
    try {
      const { id, adminUser } = req.body;
      if (!id) return res.status(400).json({ error: 'Transaction ID is required.' });
      const ok = db.deleteTransaction(id, adminUser || 'admin');
      if (!ok) return res.status(404).json({ error: 'Transaction not found.' });
      deleteTransactionFromFirestore(id).catch((e) => console.warn('Firestore transaction delete error:', e));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/transactions/create', (req, res) => {
    try {
      const { userId, amount, type, description, status, adminUser } = req.body;
      if (!userId || amount === undefined || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'User ID and numeric amount are required.' });
      }
      const tx = db.createTransactionByAdmin({
        userId,
        amount: parseFloat(amount),
        type: type || 'balance_adjustment',
        description: description || 'Manual ledger adjustment',
        status: status || 'completed',
        adminUser: adminUser || 'admin',
      });
      res.json({ success: true, transaction: tx });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Catch-all 404 for any unhandled /api requests - ALWAYS return JSON
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Global error handler for /api - ALWAYS return JSON
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    if (req.originalUrl.startsWith('/api')) {
      console.error('Unhandled API error:', err);
      return res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
      });
    }
    next(err);
  });

  // Vite middleware for SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Dev SPA fallback: ensures direct URL hits (/admin, /register, etc.) return index.html transformed by Vite
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Synchronize with Firestore cloud database: users, deposits, withdrawals, settings, and plans
  try {
    await syncAllServerDataWithFirestore(db);
    console.log('Bidirectional Firestore cloud synchronization initialized');
  } catch (err: any) {
    console.warn('Initial Firestore sync note:', err?.message || err);
  }

  // Continuous background cloud synchronization every 12 seconds to ensure any device registrations/edits sync
  setInterval(() => {
    syncAllServerDataWithFirestore(db).catch(() => {});
  }, 12000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WEALTHERA server active on port ${PORT}`);
  });
}

startServer();
