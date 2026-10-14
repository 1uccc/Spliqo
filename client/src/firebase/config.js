import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyChMfQ7qkVQk2CN3Du6QHYufgBJW0hDvpo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "spliq0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "spliq0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "spliq0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "107887506783",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:107887506783:web:a268d8c2d07f0421b372ea",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-52B2Y097YF"
};

export const isFirebaseLive = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;
let googleProvider = null;

if (isFirebaseLive) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();

    // Initialize Analytics if supported in current browser environment
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {});

    console.log('[Firebase Client] Initialized with live project spliq0.');
  } catch (e) {
    console.warn('[Firebase Client] Initialization warning:', e.message);
  }
} else {
  console.log('[Firebase Client] Running in local demo mode.');
}

export { app, auth, db, storage, analytics, googleProvider };
