
'use client';

import { initializeFirebase, initiateAnonymousSignIn } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import { useEffect, type ReactNode } from 'react';

/**
 * This component is responsible for initializing Firebase on the client side.
 * It ensures that Firebase is initialized only once and provides the necessary
 * instances to the FirebaseProvider.
 * It also initiates the anonymous sign-in flow.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // initializeFirebase is a client-side function, so it's safe to call it here.
  const { firebaseApp, auth, firestore } = initializeFirebase();

  useEffect(() => {
    // We only want to run this once when the app loads.
    // The onAuthStateChanged listener in the provider will handle the result.
    if (auth.currentUser === null) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth]);

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
