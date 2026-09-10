import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

// Configuration priority:
// 1. Vite environment variables (VITE_FIREBASE_*)
// 2. Provisioned firebase-applet-config.json
// Support both Vite (import.meta.env) and Node.js (process.env)
const env =
  typeof process !== 'undefined' && process?.env
    ? process.env
    : typeof import.meta !== 'undefined' && (import.meta as any)?.env
    ? (import.meta as any).env
    : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

// Target Firestore Database ID (if provisioned with named database)
const databaseId =
  env.VITE_FIREBASE_DATABASE_ID ||
  appletConfig.firestoreDatabaseId ||
  undefined;

// Initialize Firebase App instance safely (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore (supporting custom database ID if provisioned)
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export { firebaseConfig, databaseId };
