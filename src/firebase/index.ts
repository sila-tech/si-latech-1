
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyAFGP49gapYCyHkJhyqKhQXKy8gxs_KLT0",
    authDomain: "si-latech.firebaseapp.com",
    projectId: "si-latech",
    storageBucket: "si-latech.appspot.com",
    messagingSenderId: "930374267549",
    appId: "1:930374267549:web:6d1bd560e7bdd549069a74"
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

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
