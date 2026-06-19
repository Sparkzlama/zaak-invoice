import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase project config
// 1. Go to https://console.firebase.google.com
// 2. Create a project -> Add app -> Web
// 3. Copy the config object below
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const missing = Object.entries(firebaseConfig).filter(([, v]) => !v || v.startsWith('YOUR_')).map(([k]) => k);
if (missing.length > 0) {
  alert(`Firebase not configured! Missing or invalid in frontend/.env: ${missing.join(', ')}\n\nFollow the setup guide to add your Firebase project config.`);
}
// Strip any accidental quotes from values
Object.keys(firebaseConfig).forEach(k => {
  if (typeof firebaseConfig[k] === 'string') {
    firebaseConfig[k] = firebaseConfig[k].replace(/^["']|["']$/g, '');
  }
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
