
'use client';

import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import { type ReactNode, useEffect } from 'react';
import { getAuth, signInAnonymously } from 'firebase/auth';

/**
 * This component is responsible for initializing Firebase on the client side.
 * It ensures that Firebase is initialized only once and provides the necessary
 * instances to the FirebaseProvider. It also handles anonymous user sign-in.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // initializeFirebase is a client-side function, so it's safe to call it here.
  const { firebaseApp, auth, firestore } = initializeFirebase();

  useEffect(() => {
    const performAnonymousSignIn = async () => {
      const authInstance = getAuth(firebaseApp);
      if (!authInstance.currentUser) {
        try {
          await signInAnonymously(authInstance);
        } catch (error: any) {
          if (error.code === 'auth/requests-to-this-api-identitytoolkit-method-google.cloud.identitytoolkit.v1.authenticationservice.signup-are-blocked') {
            console.warn(
              "SilaCalc: Anonymous sign-in is disabled in your Firebase project. Saving and loading projects will not work until it's enabled. Please go to your Firebase Console -> Authentication -> Sign-in method -> and enable 'Anonymous' provider."
            );
          } else {
            console.error("Anonymous sign-in failed", error);
          }
        }
      }
    };
    performAnonymousSignIn();
  }, [firebaseApp]);

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
