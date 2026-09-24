import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp({
  apiKey: rawConfig.apiKey,
  authDomain: rawConfig.authDomain,
  projectId: rawConfig.projectId,
  storageBucket: rawConfig.storageBucket,
  messagingSenderId: rawConfig.messagingSenderId,
  appId: rawConfig.appId,
});

const db = getFirestore(app, rawConfig.firestoreDatabaseId || '(default)');

async function seed() {
  console.log('Seeding initial data into Firestore...');
  const dataFile = path.resolve(process.cwd(), 'data/wealthera.json');
  if (!fs.existsSync(dataFile)) {
    console.log('No local data file found.');
    return;
  }

  const localData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  // 1. Seed app settings (plans, deposit methods, settings)
  const configRef = doc(db, 'app_settings', 'config');
  const configSnap = await getDoc(configRef);

  if (!configSnap.exists()) {
    console.log('Writing initial app_settings/config to Firestore...');
    await setDoc(configRef, {
      settings: localData.settings || {},
      plans: localData.plans || [],
      depositMethods: localData.depositMethods || [],
      withdrawalNetworks: localData.withdrawalNetworks || [],
      supportLinks: localData.supportLinks || {},
      updatedAt: new Date().toISOString(),
    });
    console.log('app_settings/config seeded successfully!');
  } else {
    console.log('app_settings/config already exists in Firestore.');
  }

  // 2. Seed users
  if (Array.isArray(localData.users)) {
    console.log(`Checking ${localData.users.length} users to sync into Firestore...`);
    for (const u of localData.users) {
      const userRef = doc(db, 'users', u.id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          ...u,
          updatedAt: new Date().toISOString(),
        });
        console.log(`Synced user @${u.username} (${u.id}) to Firestore`);
      }
    }
  }

  // 3. Seed user investments if any
  if (Array.isArray(localData.userInvestments) && localData.userInvestments.length > 0) {
    for (const inv of localData.userInvestments) {
      const invRef = doc(db, 'investments', inv.id);
      await setDoc(invRef, inv, { merge: true });
    }
    console.log(`Synced ${localData.userInvestments.length} investments to Firestore`);
  }

  // 4. Seed deposit requests if any
  if (Array.isArray(localData.depositRequests) && localData.depositRequests.length > 0) {
    for (const dep of localData.depositRequests) {
      const depRef = doc(db, 'deposits', dep.id);
      await setDoc(depRef, dep, { merge: true });
    }
    console.log(`Synced ${localData.depositRequests.length} deposit requests to Firestore`);
  }

  // 5. Seed withdrawal requests if any
  if (Array.isArray(localData.withdrawalRequests) && localData.withdrawalRequests.length > 0) {
    for (const w of localData.withdrawalRequests) {
      const wRef = doc(db, 'withdrawals', w.id);
      await setDoc(wRef, w, { merge: true });
    }
    console.log(`Synced ${localData.withdrawalRequests.length} withdrawal requests to Firestore`);
  }

  console.log('Firebase Firestore seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
