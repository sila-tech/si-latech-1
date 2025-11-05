
'use client';

import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import type { ReactNode } from 'react';

/**
 * This component is responsible for initializing Firebase on the client side.
 * It ensures that Firebase is initialized only once and provides the necessary
 * instances to the FirebaseProvider.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // initializeFirebase is a client-side function, so it's safe to call it here.
  const { firebaseApp, auth, firestore } = initializeFirebase();

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
