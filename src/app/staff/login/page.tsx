'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Loader2, HardHat } from 'lucide-react';
import { Header } from '@/components/header';

const STAFF_SESSION_KEY = 'sila-staff-auth';

export default function StaffLoginPage() {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const firestore = useFirestore();

    useEffect(() => {
        const storedUser = sessionStorage.getItem(STAFF_SESSION_KEY);
        if (storedUser) {
            router.push('/staff');
        }
    }, [router]);

    const handleLogin = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            if (!firestore) throw new Error("Database offline");
            
            const staffRef = collection(firestore, 'staff');
            const q = query(staffRef, where('username', '==', username.toLowerCase().trim()), where('pin', '==', pin));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                const sessionData = {
                    id: snapshot.docs[0].id,
                    username: userData.username,
                    name: userData.name,
                    role: userData.role || 'staff'
                };
                
                if (sessionData.role === 'admin') {
                    sessionStorage.setItem('sila-admin-auth', JSON.stringify(sessionData));
                    router.push('/admin');
                } else {
                    sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(sessionData));
                    router.push('/staff');
                }
            } else {
                setError('Invalid username or PIN.');
            }
        } catch (err) {
            console.error(err);
            setError('Login failed. Please check your connection.');
        } finally {
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
                            <div className="p-3 bg-amber-100 rounded-full text-amber-700">
                                <HardHat size={32} />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold font-headline">Portal Access</CardTitle>
                        <CardDescription>
                            Login to access your dashboard and manage operations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. johndoe"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pin">PIN</Label>
                            <Input
                                id="pin"
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                placeholder="••••"
                                className="text-center text-lg tracking-widest"
                                disabled={isLoading}
                            />
                            {error && <p className="text-sm text-destructive text-center font-medium mt-2">{error}</p>}
                        </div>
                        <Button onClick={handleLogin} className="w-full h-11 bg-slate-900 hover:bg-slate-800" disabled={isLoading || !username || !pin}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <Shield className="mr-2" />}
                            {isLoading ? 'Verifying...' : 'Secure Login'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
