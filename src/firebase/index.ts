
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const firebaseConfig = {
    projectId: 'si-latech',
    appId: '1:895963925352:web:a074c3e80a083696d11361',
    storageBucket: 'si-latech.appspot.com',
    apiKey: 'AIzaSyBeo-2gQASzxMOi50bOIVN3aBHGzHYo098',
    authDomain: 'si-latech.firebaseapp.com',
    messagingSenderId: '895963925352',
    measurementId: 'G-L5V81G2N7N',
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Sign in anonymously if there's no user.
  // This is non-blocking. The user state will be handled by the onAuthStateChanged listener in the provider.
  if (!auth.currentUser) {
    signInAnonymously(auth);
  }

  return {
    firebaseApp: app,
    auth: auth,
    firestore: getFirestore(app),
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
