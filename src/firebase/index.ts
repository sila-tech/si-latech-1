'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const firebaseConfig = {
    "projectId": "si-latech",
    "appId": "1:895963925352:web:a074c3e80a083696d11361",
    "storageBucket": "si-latech.appspot.com",
    "apiKey": "AIzaSyBeo-2gQASzxMOi50bOIVN3aBHGzHYo098",
    "authDomain": "si-latech.firebaseapp.com",
    "messagingSenderId": "895963925352",
    "measurementId": "G-L5V81G2N7N"
  };

  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';