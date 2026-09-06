import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let firebaseApp;
let db;
let auth;

export function initFirebase() {
  if (firebaseApp) return { db, auth };

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase] Missing credentials, running in demo mode');
    return { db: null, auth: null };
  }

  firebaseApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);

  console.log('[Firebase] Admin SDK initialized');
  return { db, auth };
}

export function getDb() {
  return db;
}

export function getAuthInstance() {
  return auth;
}
