import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let isFirebaseConfigured = false;
let db = null;
let auth = null;
let bucket = null;

try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });

    db = admin.firestore();
    auth = admin.auth();
    bucket = admin.storage().bucket();
    isFirebaseConfigured = true;
    console.log('[Firebase] Initialized with Google Cloud Admin SDK credentials.');
  } else {
    console.log('[SplitMate Server] Running with Local JSON Store fallback (Firebase Admin credentials not set in server/.env). Fully operational out-of-the-box.');
  }
} catch (err) {
  console.warn('[Firebase] Warning initializing Firebase Admin:', err.message);
  console.log('[SplitMate Server] Operating in Local Store fallback mode.');
}

export { admin, db, auth, bucket, isFirebaseConfigured };
