'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It shows a toast notification and logs the error safely.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Show user-friendly toast instead of crashing the page
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this resource or perform this action.',
        variant: 'destructive',
      });

      // Log safely based on environment
      if (process.env.NODE_ENV === 'development') {
        console.error('Firestore Permission Denied:', error);
      } else {
        console.error('Firestore Permission Denied: The operation was rejected by security rules.');
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
