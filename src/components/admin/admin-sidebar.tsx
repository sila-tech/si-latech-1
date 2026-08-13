'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    DollarSign,
    TrendingUp,
    Image as ImageIcon,
    Users,
    SlidersHorizontal,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ChevronDown,
    Building2,
    Shield,
    BarChart2,
    Landmark,
    PlusCircle,
    Clock,
    HandCoins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export type AdminSection =
    | 'overview'
    | 'projects'
    | 'quotes'
    | 'finances'
    | 'investments'
    | 'portfolio'
    | 'team';

interface NavItem {
    id: AdminSection;
    label: string;
    icon: React.ElementType;
    activeBg: string;
    activeText: string;
    iconColor: string;
    superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'overview',    label: 'Overview',    icon: LayoutDashboard, activeBg: 'bg-sky-600',     activeText: 'text-white font-bold',     iconColor: 'text-white' },
    { id: 'projects',    label: 'Projects',    icon: FolderKanban,    activeBg: 'bg-blue-600',    activeText: 'text-white font-bold',    iconColor: 'text-white' },
    { id: 'quotes',      label: 'Quotes',      icon: FileText,        activeBg: 'bg-purple-600',  activeText: 'text-white font-bold',  iconColor: 'text-white' },
    { id: 'finances',    label: 'Finances',    icon: DollarSign,      activeBg: 'bg-emerald-600', activeText: 'text-white font-bold', iconColor: 'text-white' },
    { id: 'investments', label: 'Investments', icon: TrendingUp,      activeBg: 'bg-amber-500',   activeText: 'text-slate-950 font-bold',   iconColor: 'text-slate-950' },
    { id: 'portfolio',   label: 'Portfolio',   icon: ImageIcon,       activeBg: 'bg-pink-600',    activeText: 'text-white font-bold',    iconColor: 'text-white' },
    { id: 'team',        label: 'Team',        icon: Users,           activeBg: 'bg-indigo-600',  activeText: 'text-white font-bold',  iconColor: 'text-white', superAdminOnly: true },
];

export interface FinanceSubTabItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

export const FINANCE_SUB_TABS: FinanceSubTabItem[] = [
    { id: 'overview',         label: 'Overview & Graph', icon: BarChart2 },
    { id: 'bank',             label: 'Mini Bank (Ledger)', icon: Landmark },
    { id: 'manual_record',    label: 'Manual Record',   icon: PlusCircle },
    { id: 'pending_requests', label: 'Pending Requests', icon: Clock },
    { id: 'staff_loans',      label: 'Staff Loans',     icon: HandCoins },
];

interface AdminSidebarProps {
    activeSection: AdminSection;
    onSectionChange: (section: AdminSection) => void;
    activeFinanceSubTab?: string;
    onFinanceSubTabSelect?: (subTab: string) => void;
    isSuperAdmin: boolean;
    adminName: string;
    onLogout: () => void;
    onManageRates: () => void;
}

export function AdminSidebar({
    activeSection,
    onSectionChange,
    activeFinanceSubTab = 'overview',
    onFinanceSubTabSelect,
    isSuperAdmin,
    adminName,
    onLogout,
    onManageRates,
}: AdminSidebarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [financesDropdownOpen, setFinancesDropdownOpen] = useState(true);

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.superAdminOnly || isSuperAdmin
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-gradient-to-b from-[#07365a] via-[#095388] to-[#062c4a] text-white border-r border-sky-900/50">
            {/* Brand Header */}
            <div className="px-5 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Link href="/" className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white/10 border border-white/20 p-1 shadow-sm">
                        <img src="/logo.png" alt="SI-LATECH Logo" className="h-full w-full object-contain" />
                    </Link>
                    <div>
                        <p className="text-base font-black text-white tracking-tight">SI-LATECH</p>
                        <p className="text-[10px] text-sky-300 font-bold uppercase tracking-widest">Admin Control</p>
                    </div>
                </div>
            </div>

            {/* Admin profile badge */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className="w-8 h-8 rounded-full bg-sky-500/30 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-sm text-sky-300">
                        <Shield className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{adminName}</p>
                        <p className="text-[10px] text-sky-200/80 font-medium">{isSuperAdmin ? 'Super Admin' : 'Administrator'}</p>
                    </div>
                </div>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                <p className="text-[10px] font-bold text-sky-300/60 uppercase tracking-widest px-3 mb-2">Management</p>
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    const isFinances = item.id === 'finances';

                    return (
                        <div key={item.id} className="space-y-1">
                            <button
                                onClick={() => {
                                    onSectionChange(item.id);
                                    if (isFinances) {
                                        setFinancesDropdownOpen(!financesDropdownOpen);
                                    } else {
                                        setMobileOpen(false);
                                    }
                                }}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group',
                                    isActive
                                        ? `${item.activeBg} ${item.activeText} shadow-md`
                                        : 'text-sky-100/80 hover:bg-white/10 hover:text-white'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-4 w-4 shrink-0 transition-colors',
                                        isActive ? item.iconColor : 'text-sky-300/70 group-hover:text-white'
                                    )}
                                />
                                <span className="flex-1 text-left">{item.label}</span>
                                {isFinances ? (
                                    financesDropdownOpen ? (
                                        <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                                    )
                                ) : isActive ? (
                                    <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                                ) : null}
                            </button>

                            {/* Dropdown sub-items for Finances */}
                            {isFinances && financesDropdownOpen && (
                                <div className="pl-4 pr-1 py-1 space-y-1 bg-black/15 rounded-xl border border-white/5 my-1 animate-in fade-in duration-200">
                                    {FINANCE_SUB_TABS.map((sub) => {
                                        const SubIcon = sub.icon;
                                        const isSubActive = isActive && activeFinanceSubTab === sub.id;
                                        return (
                                            <button
                                                key={sub.id}
                                                onClick={() => {
                                                    onSectionChange('finances');
                                                    if (onFinanceSubTabSelect) {
                                                        onFinanceSubTabSelect(sub.id);
                                                    }
                                                    setMobileOpen(false);
                                                }}
                                                className={cn(
                                                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors text-left',
                                                    isSubActive
                                                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                                                        : 'text-sky-200/70 hover:bg-white/10 hover:text-white'
                                                )}
                                            >
                                                <SubIcon className={cn('h-3.5 w-3.5 shrink-0', isSubActive ? 'text-emerald-400' : 'text-sky-300/60')} />
                                                <span className="truncate">{sub.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="px-3 py-4 border-t border-white/10 space-y-2 bg-black/10">
                <Button
                    onClick={onManageRates}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 rounded-xl justify-start gap-2 shadow-sm border-0"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Manage Live Rates
                </Button>
                <Button
                    onClick={onLogout}
                    variant="ghost"
                    className="w-full text-red-300 hover:bg-red-500/20 hover:text-red-200 font-bold text-xs h-9 rounded-xl justify-start gap-2"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-sky-200/70 hover:text-white hover:bg-white/10 font-medium transition-colors"
                >
                    ← Back to Calculator
                </Link>
            </div>
        </div>
    );

    const activeItem = NAV_ITEMS.find((item) => item.id === activeSection);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#07365a] border-r border-sky-900/50 h-screen sticky top-0 left-0 z-30 overflow-y-auto shadow-md">
                <SidebarContent />
            </aside>

            {/* Mobile Top Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#07365a] border-b border-sky-900/50 flex items-center justify-between px-3 text-white shadow-md">
                <div className="flex items-center gap-2.5">
                    <Button
                        size="icon"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Open Admin Menu"
                        className="h-9 w-9 bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-xs rounded-xl"
                    >
                        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="SI-LATECH" className="w-6 h-6 object-contain" />
                        <span className="text-xs font-black tracking-tight text-white uppercase">
                            Admin <span className="text-sky-300">/ {activeItem?.label || 'Dashboard'}</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        onClick={onManageRates}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] h-7 px-2.5 rounded-lg border-0 shadow-xs"
                    >
                        <SlidersHorizontal className="h-3 w-3 mr-1" />
                        Rates
                    </Button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs transition-opacity"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-[#07365a] border-r border-sky-900/50 flex flex-col overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </aside>
                </>
            )}
        </>
    );
}
