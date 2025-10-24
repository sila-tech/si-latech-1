
'use client';

import React, { useState, useEffect, ComponentType, SVGProps } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { logoImageData } from '@/lib/branding';
import { useCalculator } from '@/context/calculator-context';

const SESSION_STORAGE_KEY = 'sila-auth-token';

function SiLatechIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...props}
    >
      <path
        fill="currentColor"
        d="M17.435 2.065a2 2 0 0 1 1.732 1l3.464 6a2 2 0 0 1 0 2l-3.464 6a2 2 0 0 1-1.732 1H6.565a2 2 0 0 1-1.732-1l-3.464-6a2 2 0 0 1 0-2l3.464-6a2 2 0 0 1 1.732-1h10.87ZM8.353 7.647a.5.5 0 0 0-.706.706L10.294 11H8.5a2.5 2.5 0 0 0 0 5h3.147l-2.647 2.647a.5.5 0 1 0 .706.706L13.707 15H15.5a2.5 2.5 0 0 0 0-5H12.353l2.647-2.647a.5.5 0 0 0-.706-.706L10.293 9H8.353Z"
      />
    </svg>
  );
}

export function withProtection<P extends object>(
  WrappedComponent: ComponentType<P>,
  secretCode: string
): ComponentType<P> {
  const ProtectedComponent = (props: P) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { logoUrl } = useCalculator();

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
              {logoUrl && logoUrl !== logoImageData ? (
                 <Image src={logoUrl} alt="SI-LATECH Logo" width={48} height={48} className="text-primary" />
              ) : (
                 <SiLatechIcon className="h-12 w-12 text-primary" />
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
