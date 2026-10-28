'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Target, TrendingUp, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/header';
import Link from 'next/link';

const SALES_SESSION_KEY = 'sila-sales-auth';

export default function SalesLoginPage() {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const firestore = useFirestore();

    useEffect(() => {
        const storedUser = sessionStorage.getItem(SALES_SESSION_KEY);
        if (storedUser) {
            router.push('/sales');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const cleanUsername = username.toLowerCase().trim();
        const cleanPin = pin.trim();

        if (!cleanUsername || !cleanPin) {
            setError('Please enter both your username and secret PIN.');
            setIsLoading(false);
            return;
        }

        try {
            if (!firestore) throw new Error('Database connection unavailable');

            const staffRef = collection(firestore, 'staff');
            const q = query(staffRef, where('username', '==', cleanUsername), where('pin', '==', cleanPin));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                const sessionData = {
                    id: snapshot.docs[0].id,
                    username: userData.username,
                    name: userData.name,
                    role: userData.role || 'sales'
                };

                if (sessionData.role === 'admin') {
                    sessionStorage.setItem('sila-admin-auth', JSON.stringify(sessionData));
                    router.push('/admin');
                } else {
                    sessionStorage.setItem(SALES_SESSION_KEY, JSON.stringify(sessionData));
                    router.push('/sales');
                }
            } else {
                setError('Invalid username or PIN. Please contact your administrator.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Sign in failed. Please check your internet connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-sm border-slate-200/90 shadow-xl rounded-2xl bg-white overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500" />
                    <CardHeader className="text-center space-y-1.5 pt-6">
                        <div className="flex justify-center mb-1">
                            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-700 shadow-xs border border-emerald-200">
                                <Target size={30} className="stroke-[2.2]" />
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider mx-auto border border-emerald-200">
                            <TrendingUp size={12} /> Sales &amp; Growth Suite
                        </div>
                        <CardTitle className="text-2xl font-black font-headline text-slate-900 tracking-tight">Sales Portal</CardTitle>
                        <CardDescription className="text-xs text-slate-500 max-w-xs mx-auto">
                            Sign in to track booked site measurements, quotes, targets, and client conversion rates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-7">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="username" className="text-xs font-bold text-slate-700">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. juma_sales"
                                    disabled={isLoading}
                                    className="h-10 text-xs rounded-xl"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="pin" className="text-xs font-bold text-slate-700">Secret PIN</Label>
                                <Input
                                    id="pin"
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="Enter your PIN"
                                    disabled={isLoading}
                                    className="h-10 text-xs rounded-xl font-mono tracking-widest"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold leading-relaxed">
                                    {error}
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <ShieldCheck size={16} className="mr-2" />}
                                Sign In to Sales Module
                            </Button>
                        </form>

                        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
                            Looking for field operations?{' '}
                            <Link href="/staff/login" className="text-primary font-bold hover:underline">
                                Staff Portal
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
