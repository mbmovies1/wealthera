import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Suppress internal gRPC idle stream disconnection noise on server
try {
  setLogLevel('silent');
} catch {
  // ignore
}

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

let dbInstance: any = null;

export function getFirebaseDb() {
  if (dbInstance) return dbInstance;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('firebase-applet-config.json not found, skipping server Firebase init');
      return null;
    }
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const apps = getApps();
    const existing = apps.find((a) => a.name === 'server-app');
    const app = existing || initializeApp(
      {
        apiKey: cfg.apiKey,
        authDomain: cfg.authDomain,
        projectId: cfg.projectId,
        storageBucket: cfg.storageBucket,
        messagingSenderId: cfg.messagingSenderId,
        appId: cfg.appId,
      },
      'server-app'
    );
    try {
      dbInstance = initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        cfg.firestoreDatabaseId || '(default)'
      );
    } catch {
      dbInstance = getFirestore(app, cfg.firestoreDatabaseId || '(default)');
    }
    return dbInstance;
  } catch (err: any) {
    console.warn('Failed to initialize server Firestore:', err?.message || err);
    return null;
  }
}

export async function syncUserToFirestore(user: any) {
  try {
    const db = getFirebaseDb();
    if (!db || !user?.id) return;
    const cleanUser = { ...user };
    delete cleanUser.passwordHash;
    delete cleanUser.salt;
    cleanUser.updatedAt = cleanUser.updatedAt || new Date().toISOString();
    await setDoc(doc(db, 'users', user.id), cleanUser, { merge: true });
  } catch (e: any) {
    console.warn('syncUserToFirestore error:', e?.message || e);
  }
}

export async function syncDepositToFirestore(deposit: any) {
  try {
    const db = getFirebaseDb();
    if (!db || !deposit?.id) return;
    await setDoc(doc(db, 'deposits', deposit.id), deposit, { merge: true });
  } catch (e: any) {
    console.warn('syncDepositToFirestore error:', e?.message || e);
  }
}

export async function syncWithdrawalToFirestore(withdrawal: any) {
  try {
    const db = getFirebaseDb();
    if (!db || !withdrawal?.id) return;
    await setDoc(doc(db, 'withdrawals', withdrawal.id), withdrawal, { merge: true });
  } catch (e: any) {
    console.warn('syncWithdrawalToFirestore error:', e?.message || e);
  }
}

export async function syncInvestmentToFirestore(investment: any) {
  try {
    const db = getFirebaseDb();
    if (!db || !investment?.id) return;
    await setDoc(doc(db, 'investments', investment.id), investment, { merge: true });
  } catch (e: any) {
    console.warn('syncInvestmentToFirestore error:', e?.message || e);
  }
}

export async function syncTransactionToFirestore(transaction: any) {
  try {
    const db = getFirebaseDb();
    if (!db || !transaction?.id) return;
    await setDoc(doc(db, 'transactions', transaction.id), transaction, { merge: true });
  } catch (e: any) {
    console.warn('syncTransactionToFirestore error:', e?.message || e);
  }
}

export async function fetchConfigFromFirestore(): Promise<any | null> {
  try {
    const db = getFirebaseDb();
    if (!db) return null;
    const snap = await getDoc(doc(db, 'app_settings', 'config'));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e: any) {
    console.warn('fetchConfigFromFirestore error:', e?.message || e);
    return null;
  }
}

export async function syncConfigToFirestore(payload: {
  settings?: any;
  plans?: any[];
  depositMethods?: any[];
  withdrawalNetworks?: any[];
  supportLinks?: any;
}) {
  try {
    const db = getFirebaseDb();
    if (!db) return;
    await setDoc(
      doc(db, 'app_settings', 'config'),
      {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e: any) {
    console.warn('syncConfigToFirestore error:', e?.message || e);
  }
}

export async function deleteUserFromFirestore(userId: string) {
  try {
    const db = getFirebaseDb();
    if (!db || !userId) return;
    await deleteDoc(doc(db, 'users', userId));
  } catch (e: any) {
    console.warn('deleteUserFromFirestore error:', e?.message || e);
  }
}

export async function deleteDepositFromFirestore(depositId: string) {
  try {
    const db = getFirebaseDb();
    if (!db || !depositId) return;
    await deleteDoc(doc(db, 'deposits', depositId));
  } catch (e: any) {
    console.warn('deleteDepositFromFirestore error:', e?.message || e);
  }
}

export async function deleteWithdrawalFromFirestore(withdrawalId: string) {
  try {
    const db = getFirebaseDb();
    if (!db || !withdrawalId) return;
    await deleteDoc(doc(db, 'withdrawals', withdrawalId));
  } catch (e: any) {
    console.warn('deleteWithdrawalFromFirestore error:', e?.message || e);
  }
}

export async function deleteTransactionFromFirestore(transactionId: string) {
  try {
    const db = getFirebaseDb();
    if (!db || !transactionId) return;
    await deleteDoc(doc(db, 'transactions', transactionId));
  } catch (e: any) {
    console.warn('deleteTransactionFromFirestore error:', e?.message || e);
  }
}

export async function deleteInvestmentFromFirestore(investmentId: string) {
  try {
    const db = getFirebaseDb();
    if (!db || !investmentId) return;
    await deleteDoc(doc(db, 'investments', investmentId));
  } catch (e: any) {
    console.warn('deleteInvestmentFromFirestore error:', e?.message || e);
  }
}

export async function fetchAllUsersFromFirestore(): Promise<any[]> {
  try {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, 'users'));
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (e: any) {
    console.warn('fetchAllUsersFromFirestore error:', e?.message || e);
    return [];
  }
}

export async function fetchAllDepositsFromFirestore(): Promise<any[]> {
  try {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, 'deposits'));
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (e: any) {
    console.warn('fetchAllDepositsFromFirestore error:', e?.message || e);
    return [];
  }
}

export async function fetchAllWithdrawalsFromFirestore(): Promise<any[]> {
  try {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, 'withdrawals'));
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (e: any) {
    console.warn('fetchAllWithdrawalsFromFirestore error:', e?.message || e);
    return [];
  }
}

export async function fetchAllInvestmentsFromFirestore(): Promise<any[]> {
  try {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, 'investments'));
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (e: any) {
    console.warn('fetchAllInvestmentsFromFirestore error:', e?.message || e);
    return [];
  }
}

export async function fetchAllTransactionsFromFirestore(): Promise<any[]> {
  try {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, 'transactions'));
    const list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (e: any) {
    console.warn('fetchAllTransactionsFromFirestore error:', e?.message || e);
    return [];
  }
}

/**
 * Bidirectional synchronize server memory/disk database with Firestore cloud database
 * Guarantees that users registered on mobile immediately sync to PC Admin and vice-versa.
 */
export async function syncAllServerDataWithFirestore(dbInstanceObj: any) {
  try {
    const db = getFirebaseDb();
    if (!db || !dbInstanceObj) return;

    // 1. Sync Configuration (Settings, Plans, Gateways, Networks, Support Links)
    const cloudCfg = await fetchConfigFromFirestore();
    const localUpdatedAt = dbInstanceObj.getSettings()?.updatedAt;
    const cloudUpdatedAt = cloudCfg?.updatedAt;
    const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;
    const cloudTime = cloudUpdatedAt ? new Date(cloudUpdatedAt).getTime() : 0;

    if (cloudCfg && cloudTime > localTime) {
      dbInstanceObj.applyCloudConfig(cloudCfg);
    } else {
      // Local is newer or cloud is missing config: push local to cloud!
      await syncConfigToFirestore({
        settings: dbInstanceObj.getSettings(),
        plans: dbInstanceObj.getPlans(),
        depositMethods: dbInstanceObj.getDepositMethods(),
        withdrawalNetworks: dbInstanceObj.getWithdrawalNetworks(),
        supportLinks: dbInstanceObj.getSupportLinks(),
      });
    }

    // 2. Bidirectional User Sync
    const cloudUsers = await fetchAllUsersFromFirestore();
    const localUsers = dbInstanceObj.getUsers();

    // Pull Firestore users into local DB
    for (const cu of cloudUsers) {
      if (!cu.id) continue;
      const existing = dbInstanceObj.findUserById(cu.id) || (cu.username ? dbInstanceObj.findUserByUsername(cu.username) : null);
      if (!existing) {
        // User registered from mobile or another device directly to Firestore
        dbInstanceObj.insertDirectUser({
          id: cu.id,
          username: cu.username,
          fullName: cu.fullName || cu.name || cu.username,
          email: cu.email || `${cu.username}@gmail.com`,
          phone: cu.phone || cu.mobile || '03000000000',
          mobile: cu.mobile || cu.phone || '03000000000',
          balance: typeof cu.balance === 'number' ? cu.balance : 0,
          lockedBalance: typeof cu.lockedBalance === 'number' ? cu.lockedBalance : 0,
          role: cu.role || 'user',
          referredBy: cu.referredBy || null,
          referralCode: cu.referralCode || cu.username,
          status: cu.status || 'active',
          password: cu.password || 'password123',
          createdAt: cu.createdAt || new Date().toISOString(),
          updatedAt: cu.updatedAt || new Date().toISOString(),
          lastEarningClaimAt: cu.lastEarningClaimAt || cu.lastProfitClaimDate,
        });
        dbInstanceObj.broadcast('users_updated');
      } else {
        const cloudUserTime = cu.updatedAt ? new Date(cu.updatedAt).getTime() : 0;
        const localUserTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;

        if (cloudUserTime > localUserTime) {
          // Merge cloud updates (like balance, email, status, activePlanId)
          let changed = false;
          if (cu.email && cu.email !== existing.email) {
            existing.email = cu.email;
            changed = true;
          }
          if (cu.phone && cu.phone !== existing.phone) {
            existing.phone = cu.phone;
            existing.mobile = cu.phone;
            changed = true;
          }
          if (typeof cu.balance === 'number' && Math.abs(cu.balance - existing.balance) > 0.001) {
            existing.balance = cu.balance;
            changed = true;
          }
          if (cu.status && cu.status !== existing.status) {
            existing.status = cu.status;
            changed = true;
          }
          if (cu.fullName && cu.fullName !== existing.fullName) {
            existing.fullName = cu.fullName;
            changed = true;
          }
          if (cu.activePlanId !== undefined && cu.activePlanId !== existing.activePlanId) {
            existing.activePlanId = cu.activePlanId;
            changed = true;
          }
          if (cu.assignedPlanId !== undefined && cu.assignedPlanId !== existing.assignedPlanId) {
            existing.assignedPlanId = cu.assignedPlanId;
            changed = true;
          }
          if (changed) {
            existing.updatedAt = cu.updatedAt;
            dbInstanceObj.persist(true);
            dbInstanceObj.broadcast('users_updated', { userId: existing.id });
          }
        } else if (localUserTime > cloudUserTime) {
          await syncUserToFirestore(existing);
        }
      }
    }

    // Push local users to Firestore if missing in cloud
    for (const lu of localUsers) {
      if (!lu.id) continue;
      const inCloud = cloudUsers.some((cu) => cu.id === lu.id || (cu.username && cu.username.toLowerCase() === lu.username.toLowerCase()));
      if (!inCloud) {
        await syncUserToFirestore(lu);
      }
    }

    // 3. Bidirectional Deposits Sync
    const cloudDeposits = await fetchAllDepositsFromFirestore();
    const localDeposits = dbInstanceObj.getDeposits ? dbInstanceObj.getDeposits() : [];
    for (const cd of cloudDeposits) {
      if (!cd.id) continue;
      const ex = localDeposits.find((d: any) => d.id === cd.id);
      if (!ex) {
        dbInstanceObj.insertDirectDeposit ? dbInstanceObj.insertDirectDeposit(cd) : null;
      }
    }
    for (const ld of localDeposits) {
      if (!ld.id) continue;
      const inCloud = cloudDeposits.some((cd) => cd.id === ld.id);
      if (!inCloud) {
        await syncDepositToFirestore(ld);
      }
    }

    // 4. Bidirectional Withdrawals Sync
    const cloudWithdrawals = await fetchAllWithdrawalsFromFirestore();
    const localWithdrawals = dbInstanceObj.getWithdrawals ? dbInstanceObj.getWithdrawals() : [];
    for (const cw of cloudWithdrawals) {
      if (!cw.id) continue;
      const ex = localWithdrawals.find((w: any) => w.id === cw.id);
      if (!ex) {
        dbInstanceObj.insertDirectWithdrawal ? dbInstanceObj.insertDirectWithdrawal(cw) : null;
      }
    }
    for (const lw of localWithdrawals) {
      if (!lw.id) continue;
      const inCloud = cloudWithdrawals.some((cw) => cw.id === lw.id);
      if (!inCloud) {
        await syncWithdrawalToFirestore(lw);
      }
    }

    // Persist local changes
    dbInstanceObj.persist(true);
  } catch (err: any) {
    console.warn('syncAllServerDataWithFirestore note:', err?.message || err);
  }
}


