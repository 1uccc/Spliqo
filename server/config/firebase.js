import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let isFirebaseConfigured = false;
let db = null;
let auth = null;
let bucket = null;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICE_ACCOUNT_FILE = path.join(__dirname, '../serviceAccountKey.json');

try {
  let credential = null;
  let projectId = process.env.FIREBASE_PROJECT_ID;

  if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    try {
      const raw = fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf-8');
      const serviceAccount = JSON.parse(raw);
      if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
        credential = admin.credential.cert(serviceAccount);
        projectId = serviceAccount.project_id;
        console.log('[Firebase Admin] Loaded credentials from server/serviceAccountKey.json');
      }
    } catch (e) {
      console.warn('[Firebase Admin] Error parsing serviceAccountKey.json:', e.message);
    }
  }

  if (!credential && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    });
    projectId = process.env.FIREBASE_PROJECT_ID;
    console.log('[Firebase Admin] Loaded credentials from .env variables');
  }

  if (credential) {
    admin.initializeApp({
      credential,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });

    db = admin.firestore();
    auth = admin.auth();
    bucket = admin.storage().bucket();
    isFirebaseConfigured = true;
    console.log(`[Firebase Admin] Successfully connected to project "${projectId}"!`);
  } else {
    console.log('[Spliqo Server] Running with Local JSON Store fallback (Firebase Admin credentials not set in server/.env). Fully operational out-of-the-box.');
  }
} catch (err) {
  console.warn('[Firebase Admin] Warning initializing Firebase Admin:', err.message);
  console.log('[Spliqo Server] Operating in Local Store fallback mode.');
}

export { admin, db, auth, bucket, isFirebaseConfigured };
