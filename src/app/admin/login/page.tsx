
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound, ShieldAlert, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';

const SESSION_STORAGE_KEY = 'sila-admin-auth';
const ADMIN_SECRET = 'Sila4927';

export default function AdminLoginPage() {
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storedToken = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedToken === btoa(ADMIN_SECRET)) {
            router.push('/admin');
        }
    }, [router]);

    const handleLogin = () => {
        setIsLoading(true);
        if (inputCode === ADMIN_SECRET) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, btoa(ADMIN_SECRET));
            router.push('/admin');
        } else {
            setError('Invalid admin secret code.');
            setInputCode('');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-sm border-primary/20 shadow-xl">
                    <CardHeader className="text-center space-y-1">
                        <div className="flex justify-center mb-2">
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <ShieldAlert size={32} />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold font-headline">Admin Access</CardTitle>
                        <CardDescription>
                            Enter the administrative secret code to manage the SI-LATECH system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-code">Secret Code</Label>
                            <Input
                                id="admin-code"
                                type="password"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                placeholder="••••••••"
                                className="text-center text-lg tracking-widest"
                                disabled={isLoading}
                            />
                            {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
                        </div>
                        <Button onClick={handleLogin} className="w-full h-11" disabled={isLoading || !inputCode}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <KeyRound className="mr-2" />}
                            {isLoading ? 'Verifying...' : 'Unlock Admin Dashboard'}
                        </Button>
                        <Button variant="link" className="w-full text-muted-foreground" onClick={() => router.push('/')} disabled={isLoading}>
                            Return to Public Calculator
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
