
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, LogOut, LayoutDashboard, Users, HandCoins, Briefcase, Menu, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';

const SESSION_STORAGE_KEY = 'sila-admin-auth';
const ADMIN_SECRET = 'Sila4927';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        const storedToken = sessionStorage.getItem(SESSION_STORAGE_KEY);
        const authorized = storedToken === btoa(ADMIN_SECRET);
        
        if (!authorized && !isLoginPage) {
            router.replace('/admin/login');
        } else {
            setIsAuthenticated(authorized);
        }
    }, [isLoginPage, router]);

    if (isLoginPage) return <>{children}</>;

    if (isAuthenticated === null) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleLogout = () => {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        router.replace('/admin/login');
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            <Header />
            <div className="flex flex-col flex-1">
                <header className="bg-white border-b px-8 h-14 flex items-center justify-between shadow-sm sticky top-20 z-40">
                    <div className="flex items-center gap-4">
                        <ShieldCheck className="text-[#095388] h-5 w-5" />
                        <span className="font-black tracking-tight text-[#095388]">Administrative Gated Section</span>
                    </div>
                    <Button onClick={handleLogout} variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </header>
                <main className="flex-1 p-4 md:p-12">
                    {children}
                </main>
            </div>
        </div>
    );
}
