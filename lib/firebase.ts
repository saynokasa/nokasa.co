import { initializeApp, getApps, cert, AppOptions } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("Missing Firebase environment variables");
}

const firebaseConfig: AppOptions = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
};

if (!getApps().length) {
  try {
    initializeApp(firebaseConfig);
    console.log('Firebase Admin SDK initialized');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

export const auth = getAuth();
export const db = getFirestore();
