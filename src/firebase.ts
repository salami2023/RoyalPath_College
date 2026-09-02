import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure Firestore with long-polling to prevent WebSocket/WebChannel timeout errors in sandboxed/iframe preview environments
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch (e) {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

// Suppress non-fatal connection warning logs from polling fallback
try {
  setLogLevel('error');
} catch (e) {
  // ignore
}

export const db = firestoreInstance;
export const auth = getAuth(app);
export const firestore = db;
export default app;




