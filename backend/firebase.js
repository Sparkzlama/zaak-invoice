import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let fbDb = null;
let fbAuth = null;

export function initFirebase() {
  if (getApps().length > 0) {
    fbDb = getFirestore();
    fbAuth = getAuth();
    return { db: fbDb, auth: fbAuth };
  }

  const serviceAccountPath = path.join(__dirname, 'service-account.json');

  try {
    // Try environment variable first (for Render/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
      console.log('Firebase Admin initialized from env var');
    } else if (fs.existsSync(serviceAccountPath)) {
      const content = fs.readFileSync(serviceAccountPath, 'utf-8');
      const serviceAccount = JSON.parse(content);
      if (serviceAccount.private_key && !serviceAccount.private_key.includes('YOUR_PRIVATE_KEY')) {
        initializeApp({ credential: cert(serviceAccount) });
        console.log('Firebase Admin initialized with service account file');
      } else {
        throw new Error('Placeholder service account detected');
      }
    } else {
      throw new Error('No service account file');
    }
  } catch (e) {
    // Fallback: try GOOGLE_APPLICATION_CREDENTIALS or ADC
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        initializeApp({ credential: applicationDefault() });
      } else if (process.env.FIREBASE_PROJECT_ID) {
        initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
      } else {
        // For local dev without Firebase - create a mock
        console.warn('No Firebase credentials found. API calls requiring auth will fail.');
        console.warn('Set up service-account.json or GOOGLE_APPLICATION_CREDENTIALS env var.');
        // Initialize with a fake project to let the server start
        initializeApp({ projectId: 'demo-zaak-invoice' });
      }
    } catch (e2) {
      console.error('Firebase init failed:', e2.message);
      // Final fallback
      initializeApp({ projectId: 'demo-zaak-invoice' });
    }
  }

  // Try to get Firestore/Auth - may fail if no credentials
  try {
    fbDb = getFirestore();
    fbAuth = getAuth();
  } catch (e) {
    console.warn('Firestore/Auth not available:', e.message);
  }

  return { db: fbDb, auth: fbAuth };
}

export function getFirestoreDb() {
  if (!fbDb) initFirebase();
  return fbDb;
}

export function getFirebaseAuth() {
  if (!fbAuth) initFirebase();
  return fbAuth;
}
