'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyCngcu8-ue7yernIaiYXI2-TQXUvyrwssI',
  authDomain: 'cursor-hra-objekty.firebaseapp.com',
  projectId: 'cursor-hra-objekty',
  storageBucket: 'cursor-hra-objekty.firebasestorage.app',
  messagingSenderId: '103321620215',
  appId: '1:103321620215:web:9d7a9ac89bb80d79864df2',
  measurementId: 'G-WWBE35G2N7'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Optional: Analytics pouze v prohlížeči a pokud je podporováno
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      try {
        getAnalytics(app);
      } catch (_) {
        // ignore
      }
    }
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;


