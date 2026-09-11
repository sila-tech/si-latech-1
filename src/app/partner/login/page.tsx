'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Header } from '@/components/header';
import { getPartnerSession, setPartnerSession, PartnerCompany } from '@/lib/partner-storage';

export default function PartnerLoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const firestore = useFirestore();

    useEffect(() => {
        const stored = getPartnerSession();
        if (stored?.id) {
            router.push('/partner');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const cleanIdentifier = identifier.trim().toLowerCase();
        const cleanPasscode = passcode.trim();

        if (!cleanIdentifier || !cleanPasscode) {
            setError('Please enter both your company identifier and passcode.');
            setIsLoading(false);
            return;
        }

        try {
            // Check offline cache first
            const cached = getPartnerSession();
            if (cached && (cached.email.toLowerCase() === cleanIdentifier || cached.name.toLowerCase() === cleanIdentifier)) {
                // If offline and matched cached profile
                setPartnerSession(cached);
                router.push('/partner');
                return;
            }

            if (!firestore) {
                // If offline and no matching cache
                setError('Database offline. Please connect to the internet to sign in for the first time.');
                setIsLoading(false);
                return;
            }

            // Query partners collection
            const partnersRef = collection(firestore, 'partners');
            const q = query(partnersRef, where('email', '==', cleanIdentifier));
            let snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Also allow username/name match
                const qName = query(partnersRef, where('username', '==', cleanIdentifier));
                snapshot = await getDocs(qName);
            }

            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                const data = docSnap.data();

                if (data.passcode === cleanPasscode || data.pin === cleanPasscode || data.password === cleanPasscode) {
                    const company: PartnerCompany = {
                        id: docSnap.id,
                        name: data.name || data.companyName || 'Partner Company',
                        email: data.email || cleanIdentifier,
                        phone: data.phone || data.contact || '',
                        contactPerson: data.contactPerson || '',
                        defaultProfitMargin: data.defaultProfitMargin !== undefined ? Number(data.defaultProfitMargin) : 15,
                        createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString()
                    };

                    setPartnerSession(company);
                    router.push('/partner');
                    return;
                } else {
                    setError('Incorrect passcode. Please contact SI-LATECH office if you forgot your credentials.');
                }
            } else {
                // Fallback check in staff/admin collection if a staff or admin attempts login
                const staffRef = collection(firestore, 'staff');
                const staffQ = query(staffRef, where('username', '==', cleanIdentifier), where('pin', '==', cleanPasscode));
                const staffSnap = await getDocs(staffQ);

                if (!staffSnap.empty) {
                    const staffData = staffSnap.docs[0].data();
                    if (staffData.role === 'admin') {
                        sessionStorage.setItem('sila-admin-auth', JSON.stringify({ id: staffSnap.docs[0].id, username: staffData.username, name: staffData.name, role: 'admin' }));
                        router.push('/admin');
                        return;
                    } else {
                        sessionStorage.setItem('sila-staff-auth', JSON.stringify({ id: staffSnap.docs[0].id, username: staffData.username, name: staffData.name, role: 'staff' }));
                        router.push('/staff');
                        return;
                    }
                }

                setError('Account not found. Please contact SI-LATECH Admin to create your company account.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err?.message || 'Login failed. Please check your network connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white">
                    <CardHeader className="text-center space-y-2 pb-4">
                        <div className="flex justify-center">
                            <div className="p-3.5 bg-primary/10 rounded-2xl text-primary ring-8 ring-primary/5">
                                <Building2 size={36} />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
                            Partner Portal
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs sm:text-sm">
                            Sign in to manage your company projects, calculate slabs, and generate quotes.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold animate-in fade-in">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="identifier" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Company Email / Username
                                </Label>
                                <Input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="e.g. apexbuilders or info@apex.co.ke"
                                    disabled={isLoading}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="passcode" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Passcode / PIN
                                </Label>
                                <Input
                                    id="passcode"
                                    type="password"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md transition-all mt-2 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Sign In to Dashboard
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
                            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                Offline-enabled PWA Dashboard
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Don't have partner credentials? Contact SI-LATECH management at{' '}
                                <a href="tel:+254741557960" className="text-primary font-bold hover:underline">
                                    +254 741 557 960
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
