
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, LogOut, LayoutDashboard, Users, HandCoins, Briefcase, Menu, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AdminDataProvider } from '@/context/AdminDataContext';
import { Header } from '@/components/header';

const SESSION_STORAGE_KEY = 'sila-admin-auth';
const ADMIN_SECRET = 'Sila4927';

const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => {
    const pathname = usePathname();

    const linkClass = (path: string) => cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
        pathname === path ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground"
    );

    return (
        <nav className="grid items-start px-2 text-sm font-medium gap-1">
            <Link href="/admin" className={linkClass("/admin")} onClick={onLinkClick}>
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
            </Link>
            <Link href="/admin/investors" className={linkClass("/admin/investors")} onClick={onLinkClick}>
                <Briefcase className="h-4 w-4" />
                Investors
            </Link>
            <Link href="/admin/loans" className={linkClass("/admin/loans")} onClick={onLinkClick}>
                <HandCoins className="h-4 w-4" />
                Loans
            </Link>
        </nav>
    );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <AdminDataProvider>
            <div className="flex flex-col h-screen bg-slate-50/50">
                <Header />
                <div className="flex-1 grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] overflow-hidden">
                    {/* Desktop Sidebar */}
                    <aside className="hidden border-r bg-white md:block overflow-y-auto pt-8">
                        <div className="flex h-full flex-col gap-2">
                            <div className="flex-1">
                                <NavLinks />
                            </div>
                            <div className="p-4 border-t">
                                <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex flex-col overflow-hidden">
                        <header className="md:hidden flex h-14 items-center gap-4 border-b bg-white px-4 shrink-0">
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="flex flex-col p-0">
                                    <SheetHeader className="p-6 border-b">
                                        <SheetTitle>Admin Menu</SheetTitle>
                                    </SheetHeader>
                                    <div className="flex-1 py-4">
                                        <NavLinks onLinkClick={() => setMobileMenuOpen(false)} />
                                    </div>
                                    <div className="p-4 border-t">
                                        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Logout
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <span className="font-bold text-primary">SI-LATECH Admin</span>
                        </header>
                        <main className="flex-1 overflow-y-auto p-4 md:p-8">
                            <div className="mx-auto max-w-7xl w-full">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </AdminDataProvider>
    );
}
