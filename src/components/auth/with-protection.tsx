
'use client';

import React, { useState, useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { SiLatechIcon, logoUrl } from '@/lib/branding';

const SESSION_STORAGE_KEY = 'sila-auth-token';

export function withProtection<P extends object>(
  WrappedComponent: ComponentType<P>,
  secretCode: string
): ComponentType<P> {
  const ProtectedComponent = (props: P) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
      // Check session storage on component mount
      const storedToken = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (storedToken === btoa(secretCode)) { // basic encoding
        setIsAuthenticated(true);
      }
    }, [secretCode]);

    const handleLogin = () => {
      if (inputCode === secretCode) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, btoa(secretCode));
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('Invalid secret code. Please try again.');
        setInputCode('');
      }
    };

    if (isAuthenticated) {
      return <WrappedComponent {...props} />;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-sm mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {logoUrl.endsWith('.svg') ? (
                <SiLatechIcon className="h-12 w-12 text-primary" />
              ) : (
                <Image src={logoUrl} alt="SI-LATECH Logo" width={48} height={48} className="text-primary" />
              )}
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
                <ShieldAlert />
                Protected Area
            </CardTitle>
            <CardDescription>
              Please enter the secret code to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret-code">Secret Code</Label>
              <Input
                id="secret-code"
                type="password"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your code"
              />
              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </div>
            <Button onClick={handleLogin} className="w-full">
              <KeyRound />
              Unlock
            </Button>
            <Button variant="link" className="w-full" onClick={() => router.push('/')}>
              Go back to Calculator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  ProtectedComponent.displayName = `withProtection(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ProtectedComponent;
}
