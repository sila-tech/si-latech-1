'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    LayoutDashboard,
    Calculator,
    FolderKanban,
    MessageSquareText,
    Target,
    Wallet,
    LogOut,
    Menu,
    X,
    ChevronRight,
    TrendingUp,
    PhoneCall,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export type SalesSection = 'overview' | 'calculator' | 'projects' | 'conversations' | 'targets' | 'facilitation';

interface NavItem {
    id: SalesSection;
    label: string;
    icon: React.ElementType;
    activeBg: string;
    activeText: string;
    iconColor: string;
    badge?: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'overview',      label: 'Sales Overview',       icon: LayoutDashboard,    activeBg: 'bg-emerald-600', activeText: 'text-white font-bold',  iconColor: 'text-white' },
    { id: 'calculator',    label: 'Slab Calculator',      icon: Calculator,         activeBg: 'bg-amber-500',   activeText: 'text-slate-950 font-bold', iconColor: 'text-slate-950' },
    { id: 'projects',      label: 'Booked Measurements',  icon: FolderKanban,       activeBg: 'bg-blue-600',    activeText: 'text-white font-bold',  iconColor: 'text-white' },
    { id: 'conversations', label: 'Client Conversations', icon: MessageSquareText,  activeBg: 'bg-purple-600',  activeText: 'text-white font-bold',  iconColor: 'text-white' },
    { id: 'targets',       label: 'Targets & Conversion', icon: Target,             activeBg: 'bg-indigo-600',  activeText: 'text-white font-bold',  iconColor: 'text-white' },
    { id: 'facilitation',  label: 'Site Facilitation',    icon: Wallet,             activeBg: 'bg-teal-600',    activeText: 'text-white font-bold',  iconColor: 'text-white' },
];

interface SalesSidebarProps {
    activeSection: SalesSection;
    onSectionChange: (section: SalesSection) => void;
    salesName: string;
    username: string;
    onLogout: () => void;
    pendingConversationsCount?: number;
}

export function SalesSidebar({
    activeSection,
    onSectionChange,
    salesName,
    username,
    onLogout,
    pendingConversationsCount = 0,
}: SalesSidebarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200">
            {/* Brand Header */}
            <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <Link href="/" className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-100 shadow-2xs">
                        <img src="/logo.png" alt="SI-LATECH Logo" className="h-full w-full object-contain" />
                    </Link>
                    <div>
                        <p className="text-base font-black text-slate-900 tracking-tight">SI-LATECH</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1">
                            <TrendingUp size={11} /> Sales &amp; Growth
                        </p>
                    </div>
                </div>
            </div>

            {/* Sales rep profile badge */}
            <div className="px-4 py-3 border-b border-slate-100 bg-emerald-50/40">
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs text-white">
                        <Target className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{salesName}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold truncate">@{username} (Sales)</p>
                    </div>
                </div>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Sales Suite</p>
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onSectionChange(item.id);
                                setMobileOpen(false);
                            }}
                            className={cn(
                                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group',
                                isActive
                                    ? `${item.activeBg} ${item.activeText} shadow-2xs border border-slate-200/60`
                                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <Icon className={cn('h-4 w-4 shrink-0', isActive ? item.iconColor : 'text-slate-400 group-hover:text-slate-700')} />
                                <span>{item.label}</span>
                            </span>
                            {item.id === 'conversations' && pendingConversationsCount > 0 ? (
                                <span className={cn(
                                    'text-[10px] font-extrabold px-1.5 py-0.5 rounded-full',
                                    isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                                )}>
                                    {pendingConversationsCount}
                                </span>
                            ) : (
                                <ChevronRight className={cn('h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity', isActive && 'opacity-100')} />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer / Quick Help & Logout */}
            <div className="p-3 border-t border-slate-100 space-y-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="w-full justify-start text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl h-9"
                >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop fixed sidebar */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 shadow-xs">
                <SidebarContent />
            </aside>

            {/* Mobile Header Bar */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="w-7 h-7 rounded-lg overflow-hidden border border-slate-100">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </Link>
                        <span className="font-black text-slate-900 text-sm tracking-tight">SI-LATECH SALES</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {salesName}
                    </span>
                </div>
            </div>

            {/* Mobile slide-over drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
                    <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10">
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    );
}
