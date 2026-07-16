
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyAFGP49gapYCyHkJhyqKhQXKy8gxs_KLT0",
    authDomain: "si-latech.firebaseapp.com",
    projectId: "si-latech",
    storageBucket: "si-latech.firebasestorage.app",
    messagingSenderId: "930374267549",
    appId: "1:930374267549:web:6d1bd560e7bdd549069a74"
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  let firestore;
  try {
    firestore = initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch (e) {
    firestore = getFirestore(app);
  }

  return {
    firebaseApp: app,
    auth: auth,
    firestore: firestore,
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  let firestore;
  try {
    firestore = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
  } catch (e) {
    firestore = getFirestore(firebaseApp);
  }
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore,
  };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
