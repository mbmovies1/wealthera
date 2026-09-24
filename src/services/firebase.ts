import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  deleteField,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { User, InvestmentPlan, UserInvestment, Transaction, AppNotification } from '../types.js';
import { defaultPlans } from '../data/initialData.js';
import appletConfig from '../../firebase-applet-config.json';

// Suppress internal gRPC idle stream disconnection noise
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Silence benign idle stream disconnection console messages from Firestore Web SDK
const origError = console.error;
const origWarn = console.warn;

function isBenignFirestoreLog(...args: any[]): boolean {
  try {
    const combined = args
      .map((a) => {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return `${a.name}: ${a.message} \n ${a.stack || ''}`;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ');

    return (
      combined.includes('Disconnecting idle stream') ||
      combined.includes('Timed out waiting for new targets') ||
      combined.includes('GrpcConnection RPC') ||
      combined.includes('RPC \'Listen\' stream') ||
      (combined.includes('CANCELLED') && combined.includes('firestore')) ||
      combined.includes('Code: 1 Message: 1 CANCELLED')
    );
  } catch {
    return false;
  }
}

console.error = (...args: any[]) => {
  if (isBenignFirestoreLog(...args)) return;
  origError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (isBenignFirestoreLog(...args)) return;
  origWarn.apply(console, args);
};

// Firebase Project Configuration loaded directly from active firebase-applet-config.json
export const firebaseConfig = {
  projectId: appletConfig.projectId,
  appId: appletConfig.appId,
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || '(default)',
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  oAuthClientId: appletConfig.oAuthClientId,
};

// Singleton Firebase initialization
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    firebaseApp,
    {
      experimentalAutoDetectLongPolling: true,
      experimentalForceLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || '(default)'
  );
} catch {
  try {
    firestoreInstance = initializeFirestore(
      firebaseApp,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId || '(default)'
    );
  } catch {
    firestoreInstance = getFirestore(
      firebaseApp,
      firebaseConfig.firestoreDatabaseId || '(default)'
    );
  }
}

export const firestoreDb = firestoreInstance;

// Helper to filter out benign gRPC idle disconnect errors
function handleListenerError(name: string, err: any) {
  if (
    err?.message?.includes('idle stream') ||
    err?.message?.includes('CANCELLED') ||
    err?.code === 'cancelled' ||
    err?.code === 1
  ) {
    return;
  }
  console.warn(`Firebase ${name} listener error:`, err?.message || err);
}

// --- REAL-TIME LISTENERS ---

/**
 * Subscribes to global app settings (plans, payment numbers, rates)
 * Updates instantly on all users & admin screens when modified on ANY device.
 */
export function subscribeToAppSettings(callback: (data: any) => void): Unsubscribe {
  const configRef = doc(firestoreDb, 'app_settings', 'config');
  return onSnapshot(
    configRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    },
    (err) => {
      handleListenerError('app_settings', err);
    }
  );
}

/**
 * Subscribes to single user document (balance, status, claim date, plan)
 * Whenever admin approves deposit or changes balance, user's screen reflects it instantly.
 */
export function subscribeToUserData(userId: string, callback: (user: User | null) => void, username?: string): Unsubscribe {
  const userRef = doc(firestoreDb, 'users', userId);
  let unsubFallback: (() => void) | null = null;
  const unsubDoc = onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...(snapshot.data() as any) } as User);
      } else if (username) {
        if (!unsubFallback) {
          const qUser = query(collection(firestoreDb, 'users'), where('username', '==', username));
          unsubFallback = onSnapshot(qUser, (snap) => {
            if (!snap.empty) {
              callback({ id: snap.docs[0].id, ...(snap.docs[0].data() as any) } as User);
            }
          });
        }
      } else {
        callback(null);
      }
    },
    (err) => {
      handleListenerError('user', err);
    }
  );
  return () => {
    unsubDoc();
    if (unsubFallback) unsubFallback();
  };
}

/**
 * Subscribes to all users in Firestore (Admin View)
 * Displays any newly registered user across all admin devices without refresh.
 */
export function subscribeToAllUsers(callback: (users: User[]) => void): Unsubscribe {
  const usersRef = collection(firestoreDb, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((d) => {
        users.push({ id: d.id, ...(d.data() as any) } as User);
      });
      callback(users);
    },
    (err) => {
      handleListenerError('all users', err);
    }
  );
}

/**
 * Subscribes to all deposit requests (Admin View & User status)
 */
export function subscribeToAllDeposits(callback: (deposits: any[]) => void): Unsubscribe {
  const depositsRef = collection(firestoreDb, 'deposits');
  return onSnapshot(
    depositsRef,
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleListenerError('deposits', err);
    }
  );
}

/**
 * Subscribes to all withdrawal requests (Admin View & User status)
 */
export function subscribeToAllWithdrawals(callback: (withdrawals: any[]) => void): Unsubscribe {
  const withdrawalsRef = collection(firestoreDb, 'withdrawals');
  return onSnapshot(
    withdrawalsRef,
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleListenerError('withdrawals', err);
    }
  );
}

/**
 * Subscribes to user active & completed investments
 */
export function subscribeToUserInvestments(userId: string, callback: (investments: UserInvestment[]) => void): Unsubscribe {
  const invRef = collection(firestoreDb, 'investments');
  const q = query(invRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: UserInvestment[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UserInvestment);
      });
      list.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
      callback(list);
    },
    (err) => {
      handleListenerError('investments', err);
    }
  );
}

/**
 * Subscribes to user financial transactions ledger
 */
export function subscribeToUserTransactions(userId: string, callback: (txs: Transaction[]) => void): Unsubscribe {
  const txRef = collection(firestoreDb, 'transactions');
  const q = query(txRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Transaction);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleListenerError('transactions', err);
    }
  );
}

/**
 * Subscribes to all investments across the platform (Admin View)
 */
export function subscribeToAllInvestments(callback: (investments: UserInvestment[]) => void): Unsubscribe {
  const invRef = collection(firestoreDb, 'investments');
  return onSnapshot(
    invRef,
    (snapshot) => {
      const list: UserInvestment[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UserInvestment);
      });
      list.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
      callback(list);
    },
    (err) => {
      handleListenerError('all investments', err);
    }
  );
}

/**
 * Subscribes to all financial transactions ledger across the platform (Admin View)
 */
export function subscribeToAllTransactions(callback: (txs: Transaction[]) => void): Unsubscribe {
  const txRef = collection(firestoreDb, 'transactions');
  return onSnapshot(
    txRef,
    (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Transaction);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleListenerError('all transactions', err);
    }
  );
}

/**
 * Subscribes to individual user deposit requests (Real-time pending/approved/rejected status)
 */
export function subscribeToUserDeposits(userId: string, callback: (deposits: any[]) => void, username?: string): Unsubscribe {
  const depRef = collection(firestoreDb, 'deposits');
  const q = query(depRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    async (snapshot) => {
      const list: any[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((d) => {
        const data = d.data();
        const depId = data.id || d.id;
        seenIds.add(depId);
        seenIds.add(d.id);
        list.push({ ...data, id: depId, _docId: d.id });
      });

      // Also query by username if provided to ensure all deposits are caught
      if (username) {
        try {
          const qUser = query(depRef, where('username', '==', username));
          const snapUser = await getDocs(qUser);
          snapUser.forEach((d) => {
            const data = d.data();
            const depId = data.id || d.id;
            if (!seenIds.has(depId) && !seenIds.has(d.id)) {
              seenIds.add(depId);
              seenIds.add(d.id);
              list.push({ ...data, id: depId, _docId: d.id });
            }
          });
        } catch {}
      }

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleListenerError('user deposits', err);
    }
  );
}

/**
 * Subscribes to individual user withdrawal requests (Real-time pending/approved/rejected status)
 */
export function subscribeToUserWithdrawals(userId: string, callback: (withdrawals: any[]) => void, username?: string): Unsubscribe {
  const wdRef = collection(firestoreDb, 'withdrawals');
  const q = query(wdRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    async (snapshot) => {
      const list: any[] = [];
      const seenIds = new Set<string>();
      snapshot.forEach((d) => {
        const data = d.data();
        const wdId = data.id || d.id;
        seenIds.add(wdId);
        seenIds.add(d.id);
        list.push({ ...data, id: wdId, _docId: d.id });
      });

      // Also query by username if provided
      if (username) {
        try {
          const qUser = query(wdRef, where('username', '==', username));
          const snapUser = await getDocs(qUser);
          snapUser.forEach((d) => {
            const data = d.data();
            const wdId = data.id || d.id;
            if (!seenIds.has(wdId) && !seenIds.has(d.id)) {
              seenIds.add(wdId);
              seenIds.add(d.id);
              list.push({ ...data, id: wdId, _docId: d.id });
            }
          });
        } catch {}
      }

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (err) => {
      handleListenerError('user withdrawals', err);
    }
  );
}

// --- DIRECT FIRESTORE MUTATIONS ---

/**
 * Direct Firebase User Registration
 * Stores user directly in cloud database and attaches referral data
 */
export async function firebaseRegisterUser(userData: {
  id?: string;
  username: string;
  fullName?: string;
  email: string;
  phone: string;
  password?: string;
  referralCode?: string;
}): Promise<User> {
  const cleanUsername = userData.username.trim();
  const cleanEmail = userData.email.trim();
  const cleanPhone = userData.phone.trim();
  const nowIso = new Date().toISOString();

  // Check if username or email already exists in Firestore
  const usersRef = collection(firestoreDb, 'users');
  const qUser = query(usersRef, where('username', '==', cleanUsername));
  const userSnap = await getDocs(qUser);
  if (!userSnap.empty) {
    const existingDoc = userSnap.docs[0];
    const existing = existingDoc.data() as User;
    if (
      (userData.id && (existing.id === userData.id || existingDoc.id === userData.id)) ||
      (existing.username && existing.username.toLowerCase() === cleanUsername.toLowerCase())
    ) {
      const docId = userData.id || existing.id || existingDoc.id;
      await setDoc(doc(firestoreDb, 'users', docId), { ...existing, ...userData, id: docId, updatedAt: nowIso }, { merge: true });
      return { id: docId, ...existing, ...userData } as User;
    }
    throw new Error(`Username @${cleanUsername} is already registered. Please choose another.`);
  }

  // Find referrer if provided
  let referredBy: string | null = null;
  if (userData.referralCode && userData.referralCode.trim()) {
    const refCode = userData.referralCode.trim().toLowerCase();
    const allUsersSnap = await getDocs(usersRef);
    allUsersSnap.forEach((docSnap) => {
      const u = docSnap.data() as User;
      if (
        (u.username && u.username.toLowerCase() === refCode) ||
        (u.referralCode && u.referralCode.toLowerCase() === refCode)
      ) {
        referredBy = u.username;
      }
    });
    if (!referredBy && refCode === 'admin') {
      referredBy = 'admin';
    }
  }

  const userId = userData.id || ('usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
  const newUser: User = {
    id: userId,
    username: cleanUsername,
    fullName: userData.fullName?.trim() || cleanUsername,
    name: userData.fullName?.trim() || cleanUsername,
    email: cleanEmail,
    phone: cleanPhone,
    mobile: cleanPhone,
    balance: 0.0,
    lockedBalance: 0.0,
    role: 'user',
    referredBy,
    referralCode: cleanUsername,
    status: 'active',
    failedLoginAttempts: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const docData = {
    ...newUser,
    password: userData.password,
  };

  await setDoc(doc(firestoreDb, 'users', userId), docData, { merge: true });

  // Send welcome notification
  const notifId = 'notif-' + Date.now();
  await setDoc(doc(firestoreDb, 'notifications', notifId), {
    id: notifId,
    userId,
    title: 'Welcome to WEALTHERA',
    message: `Account created successfully. Your referral code is @${cleanUsername}. Deposit funds to start earning daily returns.`,
    type: 'info',
    createdAt: nowIso,
    read: false,
  });

  return newUser;
}

/**
 * Direct Firebase Deposit Submission
 */
export async function firebaseSubmitDeposit(deposit: {
  userId: string;
  username: string;
  methodId: string;
  methodTitle: string;
  amountKwd: number;
  amountPkr: number;
  transactionId: string;
  senderAccount: string;
  id?: string;
  status?: string;
}): Promise<any> {
  const depId = deposit.id || ('dep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
  const nowIso = new Date().toISOString();

  const newDeposit = {
    id: depId,
    userId: deposit.userId,
    username: deposit.username,
    methodId: deposit.methodId,
    methodTitle: deposit.methodTitle,
    amountKwd: deposit.amountKwd,
    amountPkr: deposit.amountPkr,
    amount: deposit.amountKwd,
    transactionId: deposit.transactionId,
    senderAccount: deposit.senderAccount,
    status: deposit.status || 'pending',
    createdAt: (deposit as any).createdAt || nowIso,
    updatedAt: nowIso,
  };

  await setDoc(doc(firestoreDb, 'deposits', depId), newDeposit, { merge: true });

  // Also create a ledger transaction
  const txId = 'tx-' + Date.now() + '-dep';
  await setDoc(doc(firestoreDb, 'transactions', txId), {
    id: txId,
    userId: deposit.userId,
    username: deposit.username,
    type: 'deposit',
    amount: deposit.amountKwd,
    currency: 'KWD',
    status: 'pending',
    referenceId: depId,
    description: `Deposit request of ${deposit.amountKwd} KWD (${deposit.amountPkr} PKR) via ${deposit.methodTitle}`,
    createdAt: nowIso,
  });

  return newDeposit;
}

/**
 * Direct Firebase Withdrawal Submission
 */
export async function firebaseSubmitWithdrawal(withdrawal: {
  userId: string;
  username?: string;
  amountKwd: number;
  amountPkr?: number;
  feeKwd?: number;
  netKwd?: number;
  type?: string;
  bankOrWalletName?: string;
  accountTitle?: string;
  accountNumber?: string;
  walletAddress?: string;
  network?: string;
  id?: string;
  status?: string;
  balanceAlreadyDeducted?: boolean;
}): Promise<any> {
  const userDocRef = doc(firestoreDb, 'users', withdrawal.userId);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    const userData = userSnap.data() as User;
    const userBal = Number(userData.balance) || 0;
    const withdrawAmt = Number(withdrawal.amountKwd) || 0;

    if (!withdrawal.balanceAlreadyDeducted) {
      if (userBal < withdrawAmt) {
        throw new Error(`Insufficient balance. You have ${userBal.toFixed(2)} KWD available.`);
      }

      // Deduct balance and add locked balance
      const newBalance = Math.round((userBal - withdrawAmt) * 100) / 100;
      const newLocked = Math.round(((Number(userData.lockedBalance) || 0) + withdrawAmt) * 100) / 100;

      await updateDoc(userDocRef, {
        balance: newBalance,
        lockedBalance: newLocked,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const wId = withdrawal.id || ('wth-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
  const nowIso = new Date().toISOString();

  const newWithdrawal = {
    id: wId,
    userId: withdrawal.userId,
    username: withdrawal.username,
    amountKwd: withdrawal.amountKwd,
    amountPkr: withdrawal.amountPkr || 0,
    amount: withdrawal.amountKwd,
    feeKwd: withdrawal.feeKwd || 0,
    netKwd: withdrawal.netKwd || withdrawal.amountKwd,
    type: withdrawal.type,
    bankOrWalletName: withdrawal.bankOrWalletName || '',
    accountTitle: withdrawal.accountTitle || '',
    accountNumber: withdrawal.accountNumber || '',
    walletAddress: withdrawal.walletAddress || '',
    network: withdrawal.network || '',
    status: withdrawal.status || 'pending',
    createdAt: (withdrawal as any).createdAt || nowIso,
    updatedAt: nowIso,
  };

  await setDoc(doc(firestoreDb, 'withdrawals', wId), newWithdrawal, { merge: true });

  // Add ledger transaction
  const txId = 'tx-' + Date.now() + '-wth';
  await setDoc(doc(firestoreDb, 'transactions', txId), {
    id: txId,
    userId: withdrawal.userId,
    username: withdrawal.username,
    type: 'withdrawal',
    amount: withdrawal.amountKwd,
    currency: 'KWD',
    status: 'pending',
    referenceId: wId,
    description: `Withdrawal request of ${withdrawal.amountKwd} KWD to ${withdrawal.bankOrWalletName || withdrawal.network || 'Account'} (${withdrawal.accountNumber || withdrawal.walletAddress || ''})`,
    createdAt: nowIso,
  });

  return newWithdrawal;
}

/**
 * Direct Firebase Deposit Approval (by Admin)
 * Immediately reflects on user's device in real-time.
 */
export async function firebaseApproveDeposit(depositId: string, adminUsername = 'admin'): Promise<void> {
  if (!depositId) return;
  let depRef = doc(firestoreDb, 'deposits', depositId);
  let depSnap = await getDoc(depRef);

  if (!depSnap.exists()) {
    // 1. Search by 'id' field
    const q1 = query(collection(firestoreDb, 'deposits'), where('id', '==', depositId));
    const q1Snap = await getDocs(q1);
    if (!q1Snap.empty) {
      depRef = doc(firestoreDb, 'deposits', q1Snap.docs[0].id);
      depSnap = q1Snap.docs[0];
    } else {
      // 2. Search by 'transactionId' field
      const q2 = query(collection(firestoreDb, 'deposits'), where('transactionId', '==', depositId));
      const q2Snap = await getDocs(q2);
      if (!q2Snap.empty) {
        depRef = doc(firestoreDb, 'deposits', q2Snap.docs[0].id);
        depSnap = q2Snap.docs[0];
      } else {
        // 3. Fallback scan all deposits
        const allDepsSnap = await getDocs(collection(firestoreDb, 'deposits'));
        const matched = allDepsSnap.docs.find(
          (d) => d.id === depositId || d.data().id === depositId || d.data().transactionId === depositId
        );
        if (matched) {
          depRef = doc(firestoreDb, 'deposits', matched.id);
          depSnap = matched;
        } else {
          console.warn(`Deposit ${depositId} not found in Firestore for approval`);
          return;
        }
      }
    }
  }

  const deposit = depSnap.data();
  if (deposit.status === 'approved') {
    return;
  }

  const nowIso = new Date().toISOString();
  await setDoc(
    depRef,
    {
      status: 'approved',
      approvedBy: adminUsername,
      approvedAt: nowIso,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  // Credit user balance
  const depositAmt = Number(deposit.amountKwd) || Number(deposit.amount) || 0;
  let userRef = doc(firestoreDb, 'users', deposit.userId);
  let userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const qU1 = query(collection(firestoreDb, 'users'), where('id', '==', deposit.userId));
    const qU1Snap = await getDocs(qU1);
    if (!qU1Snap.empty) {
      userRef = doc(firestoreDb, 'users', qU1Snap.docs[0].id);
      userSnap = qU1Snap.docs[0];
    } else if (deposit.username) {
      const qU2 = query(collection(firestoreDb, 'users'), where('username', '==', deposit.username));
      const qU2Snap = await getDocs(qU2);
      if (!qU2Snap.empty) {
        userRef = doc(firestoreDb, 'users', qU2Snap.docs[0].id);
        userSnap = qU2Snap.docs[0];
      }
    }
  }

  if (userSnap.exists()) {
    const u = userSnap.data() as User;
    const newBal = Math.round(((Number(u.balance) || 0) + depositAmt) * 100) / 100;
    await setDoc(
      userRef,
      {
        balance: newBal,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    // Check if user was referred by someone and if commission is due
    if (u.referredBy) {
      const allUsers = await getDocs(collection(firestoreDb, 'users'));
      let referrer: User | null = null;
      allUsers.forEach((docS) => {
        const candidate = docS.data() as User;
        if (candidate.username.toLowerCase() === u.referredBy?.toLowerCase()) {
          referrer = candidate;
        }
      });

      if (referrer) {
        // 10% referral commission on deposit
        const commissionAmount = Math.round(depositAmt * 0.1 * 100) / 100;
        if (commissionAmount > 0) {
          const refUserDoc = doc(firestoreDb, 'users', (referrer as User).id);
          const refNewBal = Math.round((((referrer as User).balance || 0) + commissionAmount) * 100) / 100;
          await setDoc(
            refUserDoc,
            {
              balance: refNewBal,
              updatedAt: nowIso,
            },
            { merge: true }
          );

          // Commission transaction
          const commTxId = 'tx-' + Date.now() + '-comm';
          await setDoc(doc(firestoreDb, 'transactions', commTxId), {
            id: commTxId,
            userId: (referrer as User).id,
            username: (referrer as User).username,
            type: 'commission',
            amount: commissionAmount,
            currency: 'KWD',
            status: 'completed',
            referenceId: deposit.id || depositId,
            description: `10% referral commission earned from @${u.username}'s deposit of ${depositAmt} KWD`,
            createdAt: nowIso,
          });
        }
      }
    }
  }

  // Update transaction status
  const txQuery = query(collection(firestoreDb, 'transactions'), where('referenceId', '==', deposit.id || depositId));
  const txSnap = await getDocs(txQuery);
  for (const t of txSnap.docs) {
    await setDoc(doc(firestoreDb, 'transactions', t.id), { status: 'completed', updatedAt: nowIso }, { merge: true });
  }

  // Also check by transactionId
  if (deposit.transactionId) {
    const txQuery2 = query(collection(firestoreDb, 'transactions'), where('referenceId', '==', deposit.transactionId));
    const txSnap2 = await getDocs(txQuery2);
    for (const t of txSnap2.docs) {
      await setDoc(doc(firestoreDb, 'transactions', t.id), { status: 'completed', updatedAt: nowIso }, { merge: true });
    }
  }

  // Send notification to user
  const notifId = 'notif-' + Date.now();
  await setDoc(doc(firestoreDb, 'notifications', notifId), {
    id: notifId,
    userId: deposit.userId,
    title: 'Deposit Approved',
    message: `Your deposit of ${depositAmt} KWD has been approved and credited to your available balance.`,
    type: 'financial',
    createdAt: nowIso,
    read: false,
  });
}

/**
 * Direct Firebase Deposit Rejection (by Admin)
 */
export async function firebaseRejectDeposit(depositId: string, reason: string, adminUsername = 'admin'): Promise<void> {
  if (!depositId) return;
  let depRef = doc(firestoreDb, 'deposits', depositId);
  let depSnap = await getDoc(depRef);

  if (!depSnap.exists()) {
    const q1 = query(collection(firestoreDb, 'deposits'), where('id', '==', depositId));
    const q1Snap = await getDocs(q1);
    if (!q1Snap.empty) {
      depRef = doc(firestoreDb, 'deposits', q1Snap.docs[0].id);
      depSnap = q1Snap.docs[0];
    } else {
      const q2 = query(collection(firestoreDb, 'deposits'), where('transactionId', '==', depositId));
      const q2Snap = await getDocs(q2);
      if (!q2Snap.empty) {
        depRef = doc(firestoreDb, 'deposits', q2Snap.docs[0].id);
        depSnap = q2Snap.docs[0];
      } else {
        const allDepsSnap = await getDocs(collection(firestoreDb, 'deposits'));
        const matched = allDepsSnap.docs.find(
          (d) => d.id === depositId || d.data().id === depositId || d.data().transactionId === depositId
        );
        if (matched) {
          depRef = doc(firestoreDb, 'deposits', matched.id);
          depSnap = matched;
        } else {
          console.warn(`Deposit ${depositId} not found in Firestore for rejection`);
          return;
        }
      }
    }
  }

  const deposit = depSnap.data();
  if (deposit.status === 'rejected') {
    return;
  }

  const nowIso = new Date().toISOString();
  const finalReason = reason || 'Invalid transaction receipt or unverified sender';
  await setDoc(
    depRef,
    {
      status: 'rejected',
      rejectionReason: finalReason,
      rejectedBy: adminUsername,
      rejectedAt: nowIso,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  // Update transaction status
  const txQuery = query(collection(firestoreDb, 'transactions'), where('referenceId', '==', deposit.id || depositId));
  const txSnap = await getDocs(txQuery);
  for (const t of txSnap.docs) {
    await setDoc(doc(firestoreDb, 'transactions', t.id), { status: 'rejected', updatedAt: nowIso }, { merge: true });
  }

  if (deposit.transactionId) {
    const txQuery2 = query(collection(firestoreDb, 'transactions'), where('referenceId', '==', deposit.transactionId));
    const txSnap2 = await getDocs(txQuery2);
    for (const t of txSnap2.docs) {
      await setDoc(doc(firestoreDb, 'transactions', t.id), { status: 'rejected', updatedAt: nowIso }, { merge: true });
    }
  }

  // Send notification to user
  const depositAmt = Number(deposit.amountKwd) || Number(deposit.amount) || 0;
  const notifId = 'notif-' + Date.now();
  await setDoc(doc(firestoreDb, 'notifications', notifId), {
    id: notifId,
    userId: deposit.userId,
    title: 'Deposit Rejected',
    message: `Your deposit of ${depositAmt} KWD was rejected. Reason: ${finalReason}`,
    type: 'financial',
    createdAt: nowIso,
    read: false,
  });
}

/**
 * Direct Firebase Withdrawal Approval (by Admin)
 */
export async function firebaseApproveWithdrawal(withdrawalId: string, adminUsername = 'admin'): Promise<void> {
  if (!withdrawalId) return;
  let wthRef = doc(firestoreDb, 'withdrawals', withdrawalId);
  let wthSnap = await getDoc(wthRef);

  if (!wthSnap.exists()) {
    const q1 = query(collection(firestoreDb, 'withdrawals'), where('id', '==', withdrawalId));
    const q1Snap = await getDocs(q1);
    if (!q1Snap.empty) {
      wthRef = doc(firestoreDb, 'withdrawals', q1Snap.docs[0].id);
      wthSnap = q1Snap.docs[0];
    } else {
      const allWd = await getDocs(collection(firestoreDb, 'withdrawals'));
      const matched = allWd.docs.find((d) => d.id === withdrawalId || d.data().id === withdrawalId);
      if (matched) {
        wthRef = doc(firestoreDb, 'withdrawals', matched.id);
        wthSnap = matched;
      } else {
        console.warn(`Withdrawal ${withdrawalId} not found in Firestore for approval`);
        return;
      }
    }
  }

  const withdrawal = wthSnap.data();
  if (withdrawal.status === 'approved') {
    return;
  }

  const nowIso = new Date().toISOString();
  await setDoc(
    wthRef,
    {
      status: 'approved',
      approvedBy: adminUsername,
      approvedAt: nowIso,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  const withdrawAmt = Number(withdrawal.amountKwd) || Number(withdrawal.amount) || 0;

  // Deduct from locked balance
  let userRef = doc(firestoreDb, 'users', withdrawal.userId);
  let userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    const qU1 = query(collection(firestoreDb, 'users'), where('id', '==', withdrawal.userId));
    const qU1Snap = await getDocs(qU1);
    if (!qU1Snap.empty) {
      userRef = doc(firestoreDb, 'users', qU1Snap.docs[0].id);
      userSnap = qU1Snap.docs[0];
    } else if (withdrawal.username) {
      const qU2 = query(collection(firestoreDb, 'users'), where('username', '==', withdrawal.username));
      const qU2Snap = await getDocs(qU2);
      if (!qU2Snap.empty) {
        userRef = doc(firestoreDb, 'users', qU2Snap.docs[0].id);
        userSnap = qU2Snap.docs[0];
      }
    }
  }

  if (userSnap.exists()) {
    const u = userSnap.data() as User;
    const newLocked = Math.max(0, Math.round(((Number(u.lockedBalance) || 0) - withdrawAmt) * 100) / 100);
    await setDoc(
      userRef,
      {
        lockedBalance: newLocked,
        updatedAt: nowIso,
      },
      { merge: true }
    );
  }

  // Update transaction
  const txQuery = query(collection(firestoreDb, 'transactions'), where('referenceId', '==', withdrawal.id || withdrawalId));
  const txSnap = await getDocs(txQuery);
  for (const t of txSnap.docs) {
    await setDoc(doc(firestoreDb, 'transactions', t.id), { status: 'completed', updatedAt: nowIso }, { merge: true });
  }

  // Send notification
  const notifId = 'notif-' + Date.now();
  await setDoc(doc(firestoreDb, 'notifications', notifId), {
    id: notifId,
    userId: withdrawal.userId,
    title: 'Withdrawal Dispatched',
    message: `Your withdrawal of ${withdrawAmt} KWD (${withdrawal.amountPkr || ''} PKR) has been approved and dispatched to your ${withdrawal.bankOrWalletName || 'account'}.`,
    type: 'financial',
    createdAt: nowIso,
    read: false,
  });
}

/**
 * Direct Firebase Withdrawal Rejection (by Admin)
 * Restores user's balance and removes locked amount in real-time.
 */
export async function firebaseRejectWithdrawal(withdrawalId: string, reason: string, adminUsername = 'admin'): Promise<void> {
  if (!withdrawalId) return;
  let wthRef = doc(firestoreDb, 'withdrawals', withdrawalId);
  let wthSnap = await getDoc(wthRef);

  if (!wthSnap.exists()) {
    const q1 = query(collection(firestoreDb, 'withdrawals'), where('id', '==', withdrawalId));
    const q1Snap = await getDocs(q1);
    if (!q1Snap.empty) {
      wthRef = doc(firestoreDb, 'withdrawals', q1Snap.docs[0].id);
      wthSnap = q1Snap.docs[0];
    } else {
      const allWd = await getDocs(collection(firestoreDb, 'withdrawals'));
      const matched = allWd.docs.find((d) => d.id === withdrawalId || d.data().id === withdrawalId);
      if (matched) {
        wthRef = doc(firestoreDb, 'withdrawals', matched.id);
        wthSnap = matched;
      } else {
        console.warn(`Withdrawal ${withdrawalId} not found in Firestore for rejection`);
        return;
      }
    }
  }

  const withdrawal = wthSnap.data();
  if (withdrawal.status === 'rejected') {
    return;
  }

  const nowIso = new Date().toISOString();
  const finalReason = reason || 'Incorrect account details or compliance verification failure';
  await setDoc(
    wthRef,
    {
      status: 'rejected',
      rejectionReason: finalReason,
      rejectedBy: adminUsername,
      rejectedAt: nowIso,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  const withdrawAmt = Number(withdrawal.amountKwd) || Number(withdrawal.amount) || 0;

  // Refund available balance
  let userRef = doc(firestoreDb, 'users', withdrawal.userId);
  let userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    const qU1 = query(collection(firestoreDb, 'users'), where('id', '==', withdrawal.userId));
    const qU1Snap = await getDocs(qU1);
    if (!qU1Snap.empty) {
      userRef = doc(firestoreDb, 'users', qU1Snap.docs[0].id);
      userSnap = qU1Snap.docs[0];
    } else if (withdrawal.username) {
      const qU2 = query(collection(firestoreDb, 'users'), where('username', '==', withdrawal.username));
      const qU2Snap = await getDocs(qU2);
      if (!qU2Snap.empty) {
        userRef = doc(firestoreDb, 'users', qU2Snap.docs[0].id);
        userSnap = qU2Snap.docs[0];
      }
    }
  }

  if (userSnap.exists()) {
    const u = userSnap.data() as User;
    const restoredBal = Math.round(((Number(u.balance) || 0) + withdrawAmt) * 100) / 100;
    const newLocked = Math.max(0, Math.round(((Number(u.lockedBalance) || 0) - withdrawAmt) * 100) / 100);
    await setDoc(
      userRef,
      {
        balance: restoredBal,
        lockedBalance: newLocked,
        updatedAt: nowIso,
      },
      { merge: true }
    );
  }

  // Update transaction
  const txQuery = query(collection(firestoreDb, 'transactions'), where('referenceId', '==', withdrawal.id || withdrawalId));
  const txSnap = await getDocs(txQuery);
  for (const t of txSnap.docs) {
    await setDoc(doc(firestoreDb, 'transactions', t.id), { status: 'rejected', updatedAt: nowIso }, { merge: true });
  }

  // Send notification
  const notifId = 'notif-' + Date.now();
  await setDoc(doc(firestoreDb, 'notifications', notifId), {
    id: notifId,
    userId: withdrawal.userId,
    title: 'Withdrawal Rejected',
    message: `Your withdrawal of ${withdrawAmt} KWD was rejected. Funds restored to your balance. Reason: ${finalReason}`,
    type: 'financial',
    createdAt: nowIso,
    read: false,
  });
}

/**
 * 24-HOUR DAILY EARNING CLAIM
 * User clicks the earning button once every 24 hours.
 * Directly calculates dividends across all active plans, adds to balance,
 * records transaction, and locks button for next 24 hours.
 */
export async function firebaseClaimDailyEarning(userId: string): Promise<{
  creditedAmount: number;
  activePlansCount: number;
  newBalance: number;
  nextClaimAvailableAt: string;
}> {
  const userDocRef = doc(firestoreDb, 'users', userId);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) {
    throw new Error('User record not found');
  }

  const userData = userSnap.data() as User;
  if (userData.status !== 'active') {
    throw new Error('Your account is currently not active.');
  }

  const now = new Date();
  const nowMs = now.getTime();

  // Enforce strict 24-hour limit
  const lastClaimStr = userData.lastProfitClaimDate || (userData as any).lastEarningClaimAt;
  if (lastClaimStr) {
    const lastClaimMs = new Date(lastClaimStr).getTime();
    const diffMs = nowMs - lastClaimMs;
    const msIn24Hours = 24 * 60 * 60 * 1000;

    if (diffMs < msIn24Hours) {
      const msLeft = msIn24Hours - diffMs;
      const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((msLeft % (1000 * 60)) / 1000);
      throw new Error(
        `Daily earning can only be claimed once in 24 hours. Next claim available in ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s.`
      );
    }
  }

  // Fetch active plans for this user from investments collection
  const invQuery = query(
    collection(firestoreDb, 'investments'),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  let invSnap = await getDocs(invQuery);

  if (invSnap.empty) {
    const planId = userData.activePlanId || (userData as any).assignedPlanId;
    if (planId) {
      const planDoc = await getDoc(doc(firestoreDb, 'plans', planId));
      let planData: any = planDoc.exists() ? planDoc.data() : null;
      if (!planData) {
        // Look up in fallback plans array
        planData = defaultPlans.find((p) => p.id === planId);
      }
      if (planData) {
        const durationDays = planData.durationDays || 45;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + durationDays * 86400000);
        const invId = 'inv-' + Date.now();
        const newInv: UserInvestment = {
          id: invId,
          userId: userData.id,
          username: userData.username,
          planId: planData.id,
          planName: planData.name,
          amount: planData.amount,
          dailyProfit: planData.dailyProfit,
          durationDays,
          daysElapsed: 0,
          totalEarned: 0,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'active',
        };
        await setDoc(doc(firestoreDb, 'investments', invId), newInv);
        invSnap = await getDocs(invQuery);
      } else {
        throw new Error('You do not have any active investment plan. Please activate a plan from the Plans section first.');
      }
    } else {
      throw new Error('You do not have any active investment plan. Please activate a plan from the Plans section first.');
    }
  }

  let totalProfit = 0;
  const nowIso = now.toISOString();

  // Update each active investment
  const updatePromises = invSnap.docs.map(async (docSnap) => {
    const inv = docSnap.data() as UserInvestment;
    const daily = inv.dailyProfit || 0;
    totalProfit += daily;

    const newDaysElapsed = (inv.daysElapsed || 0) + 1;
    const newTotalEarned = Math.round(((inv.totalEarned || 0) + daily) * 100) / 100;
    const isCompleted = newDaysElapsed >= (inv.durationDays || 30);

    await updateDoc(doc(firestoreDb, 'investments', inv.id), {
      daysElapsed: newDaysElapsed,
      totalEarned: newTotalEarned,
      lastProfitDate: nowIso,
      status: isCompleted ? 'completed' : 'active',
      updatedAt: nowIso,
    });
  });

  await Promise.all(updatePromises);

  totalProfit = Math.round(totalProfit * 100) / 100;
  const newBalance = Math.round(((userData.balance || 0) + totalProfit) * 100) / 100;
  const nextClaimTime = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();

  // Update user document
  await updateDoc(userDocRef, {
    balance: newBalance,
    lastProfitClaimDate: nowIso,
    lastEarningClaimAt: nowIso,
    nextClaimAvailableAt: nextClaimTime,
    updatedAt: nowIso,
  });

  // Record transaction
  const txId = 'tx-' + Date.now() + '-earn';
  await setDoc(doc(firestoreDb, 'transactions', txId), {
    id: txId,
    userId: userData.id,
    username: userData.username,
    type: 'profit',
    amount: totalProfit,
    currency: 'KWD',
    status: 'completed',
    referenceId: 'CLAIM-' + Date.now(),
    description: `Daily profit claimed for ${invSnap.size} active plan(s)`,
    createdAt: nowIso,
  });

  // Send congratulatory notification
  const notifId = 'notif-' + Date.now();
  await setDoc(doc(firestoreDb, 'notifications', notifId), {
    id: notifId,
    userId: userData.id,
    title: 'Daily Earning Claimed!',
    message: `+${totalProfit.toFixed(2)} KWD daily dividend successfully added to your available balance. Next claim available in 24 hours.`,
    type: 'financial',
    createdAt: nowIso,
    read: false,
  });

  return {
    creditedAmount: totalProfit,
    activePlansCount: invSnap.size,
    newBalance,
    nextClaimAvailableAt: nextClaimTime,
  };
}

/**
 * Reset / Unlock 24-Hour Daily Earning Cycle for User in Firebase
 * Admin can trigger this so the user can claim "Run Cycle Now" immediately.
 */
export async function firebaseResetUserDailyCycle(userId: string): Promise<void> {
  const userDocRef = doc(firestoreDb, 'users', userId);
  await updateDoc(userDocRef, {
    lastProfitClaimDate: deleteField(),
    lastEarningClaimAt: deleteField(),
    nextClaimAvailableAt: deleteField(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Reset / Unlock 24-Hour Daily Earning Cycle for ALL users in Firebase
 */
export async function firebaseResetAllDailyCycles(): Promise<void> {
  const usersSnap = await getDocs(collection(firestoreDb, 'users'));
  const nowIso = new Date().toISOString();
  const promises = usersSnap.docs.map(async (docSnap) => {
    const data = docSnap.data();
    if (data.lastProfitClaimDate || data.lastEarningClaimAt || data.nextClaimAvailableAt) {
      await updateDoc(docSnap.ref, {
        lastProfitClaimDate: deleteField(),
        lastEarningClaimAt: deleteField(),
        nextClaimAvailableAt: deleteField(),
        updatedAt: nowIso,
      });
    }
  });
  await Promise.all(promises);
}

/**
 * Direct Admin Batch Profit / Earnings Distribution in Firebase
 * Triggered when Admin clicks "Run Daily Profit Cycle Now" (Run button).
 * Iterates through all users with active plans and adds daily profit according to each user's active plan(s).
 */
export async function firebaseDistributeEarnings(adminUsername = 'admin'): Promise<{
  successfulCount: number;
  totalProfitDistributed: number;
  skippedCount: number;
  details: { username: string; profit: number; planName: string }[];
}> {
  const now = new Date();
  const nowIso = now.toISOString();

  // Load latest plans from Firestore config if available
  let allPlans = defaultPlans;
  try {
    const cfgSnap = await getDoc(doc(firestoreDb, 'app_settings', 'config'));
    if (cfgSnap.exists() && Array.isArray(cfgSnap.data()?.plans) && cfgSnap.data().plans.length > 0) {
      allPlans = cfgSnap.data().plans;
    }
  } catch (cfgErr) {
    console.warn('Could not load dynamic plans, using default plans:', cfgErr);
  }

  // Fetch all users from Firestore
  const usersSnap = await getDocs(collection(firestoreDb, 'users'));
  // Fetch all investments from Firestore
  const invSnap = await getDocs(collection(firestoreDb, 'investments'));

  // Group active investments by userId
  const userInvestmentsMap = new Map<string, any[]>();
  invSnap.docs.forEach((docSnap) => {
    const inv = docSnap.data();
    const isActive = inv.status === 'active' || (!inv.status && !inv.completedAt);
    if (isActive && inv.userId) {
      const list = userInvestmentsMap.get(inv.userId) || [];
      list.push({ ...inv, _docId: docSnap.id });
      userInvestmentsMap.set(inv.userId, list);
    }
  });

  let successfulCount = 0;
  let totalProfitDistributed = 0;
  let skippedCount = 0;
  const details: { username: string; profit: number; planName: string }[] = [];

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data() as User;
    if (user.status !== 'active') {
      skippedCount++;
      continue;
    }

    let activeInvs = userInvestmentsMap.get(user.id) || [];

    // Fallback: If user has assignedPlanId or activePlanId but no investment record in 'investments' collection
    if (activeInvs.length === 0 && (user.activePlanId || (user as any).assignedPlanId)) {
      const planId = user.activePlanId || (user as any).assignedPlanId;
      const matchedPlan = allPlans.find((p) => p.id === planId) || defaultPlans.find((p) => p.id === planId);
      if (matchedPlan) {
        const duration = matchedPlan.durationDays || 45;
        const endDate = new Date(now.getTime() + duration * 86400000);
        const invId = 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const newInv = {
          id: invId,
          userId: user.id,
          username: user.username,
          planId: matchedPlan.id,
          planName: matchedPlan.name,
          amount: matchedPlan.amount,
          dailyProfit: matchedPlan.dailyProfit,
          durationDays: duration,
          daysElapsed: 0,
          totalEarned: 0,
          startDate: nowIso,
          endDate: endDate.toISOString(),
          status: 'active',
          createdAt: nowIso,
        };
        await setDoc(doc(firestoreDb, 'investments', invId), newInv);
        activeInvs = [{ ...newInv, _docId: invId }];
      }
    }

    if (activeInvs.length === 0) {
      skippedCount++;
      continue;
    }

    // Calculate total daily profit for this user based on their active plan(s)
    let userProfit = 0;
    const planNames: string[] = [];
    for (const inv of activeInvs) {
      let daily = Number(inv.dailyProfit) || 0;
      if (daily <= 0 && inv.planId) {
        const p = allPlans.find((x) => x.id === inv.planId) || defaultPlans.find((x) => x.id === inv.planId);
        if (p) daily = Number(p.dailyProfit) || 0;
      }

      if (daily > 0) {
        userProfit += daily;
        planNames.push(inv.planName || 'Plan');
        // Update investment doc in Firestore
        const invDocRef = doc(firestoreDb, 'investments', inv._docId || inv.id);
        const newDaysElapsed = (Number(inv.daysElapsed) || 0) + 1;
        const newTotalEarned = Math.round(((Number(inv.totalEarned) || 0) + daily) * 100) / 100;
        const durationDays = Number(inv.durationDays) || 45;
        const isMatured = newDaysElapsed >= durationDays;

        await setDoc(
          invDocRef,
          {
            daysElapsed: newDaysElapsed,
            totalEarned: newTotalEarned,
            lastProfitDate: nowIso,
            status: isMatured ? 'completed' : 'active',
            updatedAt: nowIso,
          },
          { merge: true }
        );
      }
    }

    userProfit = Math.round(userProfit * 100) / 100;
    if (userProfit > 0) {
      const currentBal = Number(user.balance) || 0;
      const newBal = Math.round((currentBal + userProfit) * 100) / 100;
      const currentTotalProfit = Number(user.totalProfit) || 0;
      const newTotalProfit = Math.round((currentTotalProfit + userProfit) * 100) / 100;

      // Update user doc with new balance and claim date
      await setDoc(
        userDoc.ref,
        {
          balance: newBal,
          totalProfit: newTotalProfit,
          lastProfitClaimDate: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      // Add transaction to Firestore ledger
      const txId = 'tx-prf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      await setDoc(doc(firestoreDb, 'transactions', txId), {
        id: txId,
        userId: user.id,
        username: user.username,
        type: 'profit',
        amount: userProfit,
        currency: 'KWD',
        status: 'completed',
        referenceId: 'RUN-' + Date.now(),
        description: `Daily profit dividend credited by Admin for ${activeInvs.length} active plan(s) (${planNames.join(', ')})`,
        createdAt: nowIso,
      });

      // Add notification to member
      const notifId = 'notif-prf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      await setDoc(doc(firestoreDb, 'notifications', notifId), {
        id: notifId,
        userId: user.id,
        title: 'Daily Earning Credited! ⚡',
        message: `+${userProfit.toFixed(2)} KWD daily dividend from your active investment plan (${planNames.join(', ')}) has been credited to your available balance.`,
        type: 'financial',
        createdAt: nowIso,
        read: false,
      });

      successfulCount++;
      totalProfitDistributed += userProfit;
      details.push({
        username: user.username,
        profit: userProfit,
        planName: planNames.join(', '),
      });
    } else {
      skippedCount++;
    }
  }

  totalProfitDistributed = Math.round(totalProfitDistributed * 100) / 100;
  return {
    successfulCount,
    totalProfitDistributed,
    skippedCount,
    details,
  };
}

/**
 * Direct Firebase Investment Plan Activation (Buy Plan)
 */
export async function firebaseActivatePlan(userId: string, plan: InvestmentPlan): Promise<UserInvestment> {
  const userDocRef = doc(firestoreDb, 'users', userId);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) throw new Error('User not found');

  const user = userSnap.data() as User;
  const currentBalance = Number(user.balance) || 0;
  const planAmount = Number(plan.amount) || 0;

  if (currentBalance < planAmount) {
    const diff = (planAmount - currentBalance).toFixed(2);
    throw new Error(`Insufficient balance! Plan requires ${planAmount.toFixed(2)} KWD, but your balance is ${currentBalance.toFixed(2)} KWD. You need ${diff} KWD more. Please deposit capital.`);
  }

  // Check if this exact plan is already active for this user
  const invQuery = query(
    collection(firestoreDb, 'investments'),
    where('userId', '==', userId),
    where('planId', '==', plan.id),
    where('status', '==', 'active')
  );
  const existingSnap = await getDocs(invQuery);
  if (!existingSnap.empty) {
    throw new Error(`You already have an active ${plan.name}. You cannot activate the exact same plan twice concurrently.`);
  }

  const now = new Date();
  const duration = plan.durationDays || plan.duration || 45;
  const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();

  // Deduct plan cost from balance
  const newBalance = Math.max(0, Math.round((currentBalance - planAmount) * 100) / 100);
  await updateDoc(userDocRef, {
    balance: newBalance,
    activePlanId: plan.id,
    activePlanName: plan.name,
    updatedAt: nowIso,
  });

  const invId = 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const newInvestment: UserInvestment = {
    id: invId,
    userId: user.id,
    username: user.username,
    planId: plan.id,
    planName: plan.name,
    amount: planAmount,
    dailyProfit: Number(plan.dailyProfit) || 0,
    durationDays: duration,
    daysElapsed: 0,
    totalEarned: 0,
    startDate: nowIso,
    endDate: endDate.toISOString(),
    status: 'active',
    createdAt: nowIso,
  };

  await setDoc(doc(firestoreDb, 'investments', invId), newInvestment);

  // Add ledger transaction
  const txId = 'tx-' + Date.now() + '-plan';
  await setDoc(doc(firestoreDb, 'transactions', txId), {
    id: txId,
    userId: user.id,
    username: user.username,
    type: 'plan_purchase',
    amount: planAmount,
    currency: 'KWD',
    status: 'completed',
    referenceId: invId,
    description: `Activated ${plan.name} for ${planAmount} KWD (${duration} days duration)`,
    createdAt: nowIso,
  });

  // Credit referral commission if user was referred
  if (user.referredBy) {
    try {
      const qRef = query(collection(firestoreDb, 'users'), where('username', '==', user.referredBy));
      const refSnap = await getDocs(qRef);
      if (!refSnap.empty) {
        const refDoc = refSnap.docs[0];
        const refData = refDoc.data() as User;
        const commPercent = 10; // 10%
        const commissionAmt = Math.round(planAmount * (commPercent / 100) * 100) / 100;
        if (commissionAmt > 0) {
          const newRefBal = Math.round(((Number(refData.balance) || 0) + commissionAmt) * 100) / 100;
          await updateDoc(refDoc.ref, {
            balance: newRefBal,
            totalReferralEarned: Math.round(((Number(refData.totalReferralEarned) || 0) + commissionAmt) * 100) / 100,
            updatedAt: nowIso,
          });
          const commTxId = 'tx-ref-' + Date.now();
          await setDoc(doc(firestoreDb, 'transactions', commTxId), {
            id: commTxId,
            userId: refData.id,
            username: refData.username,
            type: 'referral_commission',
            amount: commissionAmt,
            currency: 'KWD',
            status: 'completed',
            referenceId: invId,
            description: `Referral commission (${commPercent}%) from ${user.username}'s activation of ${plan.name}`,
            createdAt: nowIso,
          });
        }
      }
    } catch (refErr) {
      console.warn('Referral commission credit note:', refErr);
    }
  }

  return newInvestment;
}

/**
 * Direct Firebase App Settings / Config update (Admin)
 * Updates plans, deposit methods, or general settings in Firestore.
 * Instantly broadcasts to ALL users and admin screens.
 */
export async function firebaseUpdateSettingsConfig(updates: {
  settings?: any;
  plans?: InvestmentPlan[];
  depositMethods?: any[];
  withdrawalNetworks?: any[];
  supportLinks?: any;
  adminPassword?: string;
  adminPasswordHash?: string;
}): Promise<void> {
  const configRef = doc(firestoreDb, 'app_settings', 'config');
  await setDoc(
    configRef,
    {
      ...updates,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Direct Firebase Admin Login
 * Works on any hosting provider (Netlify, Vercel, Firebase Hosting, Cloud Run)
 */
export async function firebaseLoginAdmin(username: string, password: string): Promise<any> {
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();
  if (!u || !p) {
    throw new Error('Admin username and password are required');
  }

  // Default credentials
  let expectedUser = 'admin';
  const expectedPasses = ['admin12345', 'admin123', 'admin'];

  try {
    const cfgSnap = await getDoc(doc(firestoreDb, 'app_settings', 'config'));
    if (cfgSnap.exists()) {
      const data = cfgSnap.data();
      if (data.adminUsername) expectedUser = data.adminUsername.toLowerCase();
      if (data.adminPassword) expectedPasses.push(data.adminPassword);
    }
  } catch (err) {
    console.warn('Config fetch note in firebaseLoginAdmin:', err);
  }

  if (u !== expectedUser || !expectedPasses.includes(p)) {
    throw new Error('Invalid Super Admin credentials. Please check your username and password.');
  }

  const adminToken = 'adm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  return {
    success: true,
    isAdmin: true,
    admin: {
      id: 'admin-root',
      username: 'admin',
      role: 'admin',
    },
    adminToken,
    message: 'Admin authenticated successfully via Cloud Engine',
  };
}

/**
 * Direct Firebase User Login
 * Queries Firestore directly so login works flawlessly in all environments
 */
export async function firebaseLoginUser(identifier: string, password?: string): Promise<any> {
  const cleanId = (identifier || '').trim().toLowerCase();
  if (!cleanId) {
    throw new Error('Username, email, or mobile is required');
  }

  // Super Admin shortcut
  if (cleanId === 'admin') {
    return await firebaseLoginAdmin(cleanId, password || '');
  }

  const usersSnap = await getDocs(collection(firestoreDb, 'users'));
  let matchedUser: User | null = null;

  usersSnap.forEach((d) => {
    const u = d.data() as User;
    const cleanPhone = (u.phone || (u as any).mobile || '').replace(/[^0-9]/g, '');
    const searchPhone = cleanId.replace(/[^0-9]/g, '');

    if (
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      (searchPhone.length >= 7 && cleanPhone.endsWith(searchPhone))
    ) {
      matchedUser = { ...u, id: d.id };
    }
  });

  if (!matchedUser) {
    throw new Error('Account not found. Please verify your credentials or register a new account.');
  }

  const user = matchedUser as User;
  if (user.status === 'blocked' || user.status === 'suspended') {
    throw new Error('Your account has been suspended or locked. Please contact official support.');
  }

  // Verify password if set on user doc
  if (password && (user as any).password && (user as any).password !== password) {
    throw new Error('Invalid password. Please check your password and try again.');
  }

  const token = 'usr-' + user.id + '-' + Date.now();
  return {
    success: true,
    user,
    token,
    message: 'Authenticated successfully',
  };
}

/**
 * Direct Firebase User Deletion (Admin)
 * Purges user and cascades through all child records
 */
export async function firebaseDeleteUser(userId: string): Promise<void> {
  if (!userId) return;

  // 1. Delete user doc
  await deleteDoc(doc(firestoreDb, 'users', userId));

  // 2. Cascade delete investments
  const invQuery = query(collection(firestoreDb, 'investments'), where('userId', '==', userId));
  const invSnap = await getDocs(invQuery);
  for (const d of invSnap.docs) {
    await deleteDoc(doc(firestoreDb, 'investments', d.id));
  }

  // 3. Cascade delete deposits
  const depQuery = query(collection(firestoreDb, 'deposits'), where('userId', '==', userId));
  const depSnap = await getDocs(depQuery);
  for (const d of depSnap.docs) {
    await deleteDoc(doc(firestoreDb, 'deposits', d.id));
  }

  // 4. Cascade delete withdrawals
  const wthQuery = query(collection(firestoreDb, 'withdrawals'), where('userId', '==', userId));
  const wthSnap = await getDocs(wthQuery);
  for (const d of wthSnap.docs) {
    await deleteDoc(doc(firestoreDb, 'withdrawals', d.id));
  }

  // 5. Cascade delete transactions
  const txQuery = query(collection(firestoreDb, 'transactions'), where('userId', '==', userId));
  const txSnap = await getDocs(txQuery);
  for (const d of txSnap.docs) {
    await deleteDoc(doc(firestoreDb, 'transactions', d.id));
  }

  // 6. Cascade delete notifications
  const notifQuery = query(collection(firestoreDb, 'notifications'), where('userId', '==', userId));
  const notifSnap = await getDocs(notifQuery);
  for (const d of notifSnap.docs) {
    await deleteDoc(doc(firestoreDb, 'notifications', d.id));
  }
}

/**
 * Direct Firebase User Update (Admin)
 */
export async function firebaseUpdateUser(userId: string, updates: any): Promise<void> {
  if (!userId) return;
  let userRef = doc(firestoreDb, 'users', userId);
  let snap = await getDoc(userRef);
  if (!snap.exists()) {
    const q1 = query(collection(firestoreDb, 'users'), where('id', '==', userId));
    const q1Snap = await getDocs(q1);
    if (!q1Snap.empty) {
      userRef = doc(firestoreDb, 'users', q1Snap.docs[0].id);
    } else {
      const q2 = query(collection(firestoreDb, 'users'), where('username', '==', userId));
      const q2Snap = await getDocs(q2);
      if (!q2Snap.empty) {
        userRef = doc(firestoreDb, 'users', q2Snap.docs[0].id);
      }
    }
  }
  await setDoc(
    userRef,
    {
      ...updates,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Direct Firebase Balance Adjustment (Admin)
 */
export async function firebaseAdjustUserBalance(
  userId: string,
  amount: number,
  type: 'add' | 'deduct',
  reason: string
): Promise<number> {
  let userRef = doc(firestoreDb, 'users', userId);
  let snap = await getDoc(userRef);
  if (!snap.exists()) {
    const q1 = query(collection(firestoreDb, 'users'), where('id', '==', userId));
    const q1Snap = await getDocs(q1);
    if (!q1Snap.empty) {
      userRef = doc(firestoreDb, 'users', q1Snap.docs[0].id);
      snap = q1Snap.docs[0];
    } else {
      const q2 = query(collection(firestoreDb, 'users'), where('username', '==', userId));
      const q2Snap = await getDocs(q2);
      if (!q2Snap.empty) {
        userRef = doc(firestoreDb, 'users', q2Snap.docs[0].id);
        snap = q2Snap.docs[0];
      }
    }
  }

  if (!snap.exists()) throw new Error('User not found in cloud database');
  const u = snap.data() as User;

  const currentBal = u.balance || 0;
  const delta = type === 'add' ? amount : -amount;
  const newBal = Math.max(0, Math.round((currentBal + delta) * 100) / 100);

  const nowIso = new Date().toISOString();
  await setDoc(
    userRef,
    {
      balance: newBal,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  // Record transaction
  const txId = 'tx-' + Date.now() + '-adj';
  await setDoc(doc(firestoreDb, 'transactions', txId), {
    id: txId,
    userId: u.id,
    username: u.username,
    type: 'balance_adjustment',
    amount: delta,
    currency: 'KWD',
    status: 'completed',
    referenceId: 'ADJ-' + Date.now(),
    description: reason || `Admin balance adjustment: ${delta > 0 ? '+' : ''}${delta.toFixed(2)} KWD`,
    createdAt: nowIso,
  });

  // Send notification
  const notifId = 'notif-' + Date.now();
  await setDoc(doc(firestoreDb, 'notifications', notifId), {
    id: notifId,
    userId: u.id,
    title: delta > 0 ? 'Balance Credited' : 'Balance Debited',
    message: `${delta > 0 ? '+' : ''}${delta.toFixed(2)} KWD adjustment applied to your account. Note: ${reason || 'Admin adjustment'}`,
    type: 'financial',
    createdAt: nowIso,
    read: false,
  });

  return newBal;
}

/**
 * Direct Firebase Deposit Deletion (Admin)
 */
export async function firebaseDeleteDeposit(depositId: string): Promise<void> {
  if (!depositId) return;
  const depRef = doc(firestoreDb, 'deposits', depositId);
  const snap = await getDoc(depRef);
  if (snap.exists()) {
    await deleteDoc(depRef);
  } else {
    const q = query(collection(firestoreDb, 'deposits'), where('id', '==', depositId));
    const qSnap = await getDocs(q);
    for (const d of qSnap.docs) {
      await deleteDoc(doc(firestoreDb, 'deposits', d.id));
    }
  }

  const txQuery = query(collection(firestoreDb, 'transactions'), where('referenceId', '==', depositId));
  const txSnap = await getDocs(txQuery);
  for (const d of txSnap.docs) {
    await deleteDoc(doc(firestoreDb, 'transactions', d.id));
  }
}

/**
 * Direct Firebase Withdrawal Deletion (Admin)
 */
export async function firebaseDeleteWithdrawal(withdrawalId: string, refundBalance = false): Promise<void> {
  if (!withdrawalId) return;
  const wthRef = doc(firestoreDb, 'withdrawals', withdrawalId);
  const snap = await getDoc(wthRef);

  if (snap.exists() && refundBalance) {
    const w = snap.data();
    if (w.userId && w.amountKwd) {
      const uRef = doc(firestoreDb, 'users', w.userId);
      const uSnap = await getDoc(uRef);
      if (uSnap.exists()) {
        const u = uSnap.data() as User;
        const restoredBal = Math.round(((u.balance || 0) + w.amountKwd) * 100) / 100;
        const newLocked = Math.max(0, Math.round(((u.lockedBalance || 0) - w.amountKwd) * 100) / 100);
        await updateDoc(uRef, {
          balance: restoredBal,
          lockedBalance: newLocked,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  await deleteDoc(wthRef);

  const txQuery = query(collection(firestoreDb, 'transactions'), where('referenceId', '==', withdrawalId));
  const txSnap = await getDocs(txQuery);
  for (const d of txSnap.docs) {
    await deleteDoc(doc(firestoreDb, 'transactions', d.id));
  }
}

/**
 * Direct Firebase Transaction Deletion & Creation (Admin)
 */
export async function firebaseDeleteTransaction(txId: string): Promise<void> {
  if (!txId) return;
  await deleteDoc(doc(firestoreDb, 'transactions', txId));
}

export async function firebaseCreateTransaction(tx: any): Promise<void> {
  const txId = tx.id || 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const nowIso = new Date().toISOString();
  await setDoc(doc(firestoreDb, 'transactions', txId), {
    ...tx,
    id: txId,
    createdAt: tx.createdAt || nowIso,
  });

  if (tx.status === 'completed' && tx.type === 'balance_adjustment' && tx.userId && tx.amount) {
    const uRef = doc(firestoreDb, 'users', tx.userId);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists()) {
      const u = uSnap.data() as User;
      const newBal = Math.max(0, Math.round(((u.balance || 0) + parseFloat(tx.amount)) * 100) / 100);
      await updateDoc(uRef, {
        balance: newBal,
        updatedAt: nowIso,
      });
    }
  }
}

/**
 * Direct Firebase Notification Deletion & Clear All (Admin)
 */
export async function firebaseDeleteNotification(notifId: string): Promise<void> {
  if (!notifId) return;
  await deleteDoc(doc(firestoreDb, 'notifications', notifId));
}

export async function firebaseClearAllNotifications(userId?: string): Promise<void> {
  const q = userId
    ? query(collection(firestoreDb, 'notifications'), where('userId', '==', userId))
    : collection(firestoreDb, 'notifications');
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(doc(firestoreDb, 'notifications', d.id));
  }
}

/**
 * Direct Firebase Config Plan Sync (Admin)
 */
export async function firebaseSyncPlans(plans: InvestmentPlan[]): Promise<void> {
  await firebaseUpdateSettingsConfig({ plans });
}

/**
 * Direct Firebase Config Deposit Methods Sync (Admin)
 */
export async function firebaseSyncDepositMethods(depositMethods: any[]): Promise<void> {
  await firebaseUpdateSettingsConfig({ depositMethods });
}

/**
 * Direct Firebase Config Withdrawal Networks Sync (Admin)
 */
export async function firebaseSyncWithdrawalNetworks(withdrawalNetworks: any[]): Promise<void> {
  await firebaseUpdateSettingsConfig({ withdrawalNetworks });
}

/**
 * Direct Firebase Config Customer Support Links Sync (Admin)
 */
export async function firebaseSyncSupportLinks(supportLinks: any[]): Promise<void> {
  await firebaseUpdateSettingsConfig({ supportLinks });
}

/**
 * Ensures global baseline configuration exists in Firestore
 */
export async function ensureFirestoreBaselineConfig(baseline: {
  settings: any;
  plans: any[];
  depositMethods: any[];
  withdrawalNetworks: any[];
  supportLinks: any[];
}): Promise<void> {
  try {
    const configRef = doc(firestoreDb, 'app_settings', 'config');
    const snap = await getDoc(configRef);
    if (!snap.exists()) {
      await setDoc(configRef, {
        ...baseline,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('Seeded global app_settings/config in Firestore');
    } else {
      const data = snap.data();
      const updates: any = {};
      if (!data.plans || data.plans.length === 0) updates.plans = baseline.plans;
      if (!data.depositMethods || data.depositMethods.length === 0) updates.depositMethods = baseline.depositMethods;
      if (!data.withdrawalNetworks || data.withdrawalNetworks.length === 0) updates.withdrawalNetworks = baseline.withdrawalNetworks;
      if (!data.supportLinks || data.supportLinks.length === 0) updates.supportLinks = baseline.supportLinks;
      if (!data.settings) updates.settings = baseline.settings;
      if (Object.keys(updates).length > 0) {
        await updateDoc(configRef, { ...updates, updatedAt: new Date().toISOString() });
      }
    }
  } catch (err: any) {
    console.warn('ensureFirestoreBaselineConfig note:', err?.message || err);
  }
}
