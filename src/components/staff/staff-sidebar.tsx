'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    FolderKanban,
    Wallet,
    Bot,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Building2,
    HardHat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export type StaffSection = 'projects' | 'facilitation' | 'ai';

interface NavItem {
    id: StaffSection;
    label: string;
    icon: React.ElementType;
    activeBg: string;
    activeText: string;
    iconColor: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'projects',     label: 'Assigned Projects', icon: FolderKanban, activeBg: 'bg-blue-600',    activeText: 'text-white font-bold',    iconColor: 'text-white' },
    { id: 'facilitation', label: 'Site Facilitation', icon: Wallet,       activeBg: 'bg-amber-500',   activeText: 'text-slate-950 font-bold',   iconColor: 'text-slate-950' },
    { id: 'ai',           label: 'Field Assistant',  icon: Bot,          activeBg: 'bg-purple-600',  activeText: 'text-white font-bold',  iconColor: 'text-white' },
];

interface StaffSidebarProps {
    activeSection: StaffSection;
    onSectionChange: (section: StaffSection) => void;
    staffName: string;
    username: string;
    onLogout: () => void;
}

export function StaffSidebar({
    activeSection,
    onSectionChange,
    staffName,
    username,
    onLogout,
}: StaffSidebarProps) {
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
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Field Staff Portal</p>
                    </div>
                </div>
            </div>

            {/* Staff profile badge */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-xs text-white">
                        <HardHat className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{staffName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">@{username}</p>
                    </div>
                </div>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Portal Navigation</p>
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
                                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group',
                                isActive
                                    ? `${item.activeBg} ${item.activeText} shadow-2xs border border-slate-200/60`
                                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                            )}
                        >
                            <Icon
                                className={cn(
                                    'h-4 w-4 shrink-0 transition-colors',
                                    isActive ? item.iconColor : 'text-slate-400 group-hover:text-slate-600'
                                )}
                            />
                            <span className="flex-1 text-left">{item.label}</span>
                            {isActive && (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="px-3 py-4 border-t border-slate-100 space-y-2 bg-slate-50/40">
                <Button
                    onClick={onLogout}
                    variant="ghost"
                    className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs h-9 rounded-xl justify-start gap-2"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium transition-colors"
                >
                    ← Back to Main App
                </Link>
            </div>
        </div>
    );

    const activeItem = NAV_ITEMS.find((item) => item.id === activeSection);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0 h-screen overflow-y-auto shadow-2xs">
                <SidebarContent />
            </aside>

            {/* Mobile Top Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 text-slate-800 shadow-xs">
                <div className="flex items-center gap-2.5">
                    <Button
                        size="icon"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Open Staff Menu"
                        className="h-9 w-9 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 shadow-2xs rounded-xl"
                    >
                        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="SI-LATECH" className="w-6 h-6 object-contain" />
                        <span className="text-xs font-black tracking-tight text-slate-900 uppercase">
                            Staff <span className="text-amber-600">/ {activeItem?.label || 'Portal'}</span>
                        </span>
                    </div>
                </div>

                <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 truncate max-w-[120px]">
                    {staffName.split(' ')[0]}
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-2xs transition-opacity"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </aside>
                </>
            )}
        </>
    );
}
