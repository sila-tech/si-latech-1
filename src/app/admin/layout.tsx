'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        const storedToken = sessionStorage.getItem('sila-admin-auth');
        let authorized = false;
        if (storedToken) {
            try {
                const parsed = JSON.parse(storedToken);
                if (parsed.role === 'admin' || parsed.role === 'staff') {
                    authorized = true;
                }
            } catch {
                if (storedToken === btoa('Sila4927')) {
                    authorized = true;
                }
            }
        }

        if (!authorized && !isLoginPage) {
            router.replace('/admin/login');
        } else {
            setIsAuthenticated(authorized);
        }
    }, [isLoginPage, router]);

    if (isLoginPage) return <>{children}</>;

    if (isAuthenticated === null) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-[#095388]" />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50/60">
            {children}
        </div>
    );
}
