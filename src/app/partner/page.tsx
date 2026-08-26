'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    Plus,
    Trash2,
    Download,
    Percent,
    ShieldCheck,
    AlertCircle,
    Info,
    LogOut,
    Layers,
    Save,
    FolderPlus,
    CheckCircle2,
    Calendar,
    Coins,
    FileText,
    Share2,
    ArrowRight
} from 'lucide-react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    getPartnerSession,
    clearPartnerSession,
    getOfflinePartnerProjects,
    saveOfflinePartnerProject,
    deleteOfflinePartnerProject,
    getActivePartnerProjectId,
    PartnerCompany,
    PartnerProject
} from '@/lib/partner-storage';
import { calculateProjectTotals, CalculationDefaults, DEFAULTS } from '@/lib/calculator';
import { generateQuotePdf } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/use-toast';

interface LocalRoom {
    id: string;
    name: string;
    length: number;
    width: number;
}

export default function PartnerDashboard() {
    const router = useRouter();
    const { toast } = useToast();
    const [company, setCompany] = useState<PartnerCompany | null>(null);
    const [projects, setProjects] = useState<PartnerProject[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string>('');

    // Project Info
    const [projectName, setProjectName] = useState('New Slab Project');
    const [clientName, setClientName] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [projectLocation, setProjectLocation] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [profitPercentage, setProfitPercentage] = useState<number>(15);
    const [beamType, setBeamType] = useState<'flat' | 'tbeam'>('flat');

    // Rooms
    const [rooms, setRooms] = useState<LocalRoom[]>([
        { id: '1', name: 'Living Room', length: 5.0, width: 4.0 },
        { id: '2', name: 'Master Bedroom', length: 4.0, width: 3.5 },
    ]);

    // Initialize session and projects
    useEffect(() => {
        const session = getPartnerSession();
        if (!session?.id) {
            router.push('/partner/login');
            return;
        }
        setCompany(session);

        const loadedProjects = getOfflinePartnerProjects(session.id);
        setProjects(loadedProjects);

        const lastActiveId = getActivePartnerProjectId(session.id);
        if (lastActiveId && loadedProjects.some(p => p.id === lastActiveId)) {
            loadProject(loadedProjects.find(p => p.id === lastActiveId)!);
        } else if (loadedProjects.length > 0) {
            loadProject(loadedProjects[0]);
        } else {
            // New initial project
            const initialId = `proj_${Date.now()}`;
            setActiveProjectId(initialId);
            setProfitPercentage(session.defaultProfitMargin || 15);
        }
    }, [router]);

    const loadProject = (p: PartnerProject) => {
        setActiveProjectId(p.id);
        setProjectName(p.name);
        setClientName(p.clientName || '');
        setClientContact(p.clientContact || '');
        setProjectLocation(p.projectLocation || '');
        setContactPerson(p.contactPerson || '');
        setProfitPercentage(p.profitPercentage ?? company?.defaultProfitMargin ?? 15);
        setBeamType(p.beamType || 'flat');
        setRooms(p.rooms && p.rooms.length > 0 ? p.rooms : [{ id: '1', name: 'Room 1', length: 4.0, width: 4.0 }]);
    };

    const handleCreateNewProject = () => {
        const newProjId = `proj_${Date.now()}`;
        const newProj: PartnerProject = {
            id: newProjId,
            partnerId: company?.id || 'default',
            name: `Project ${projects.length + 1}`,
            clientName: '',
            clientContact: '',
            projectLocation: '',
            contactPerson: '',
            rooms: [{ id: '1', name: 'Living Room', length: 4.5, width: 3.8 }],
            profitPercentage: company?.defaultProfitMargin ?? 15,
            beamType: 'flat',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        saveOfflinePartnerProject(newProj);
        setProjects(getOfflinePartnerProjects(company?.id || 'default'));
        loadProject(newProj);
        toast({ title: 'New Project Created', description: 'Your new project is ready for calculations.' });
    };

    // Auto-save project whenever changed
    useEffect(() => {
        if (!company?.id || !activeProjectId) return;
        const projData: PartnerProject = {
            id: activeProjectId,
            partnerId: company.id,
            name: projectName,
            clientName,
            clientContact,
            projectLocation,
            contactPerson,
            rooms,
            profitPercentage,
            beamType,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        saveOfflinePartnerProject(projData);
        setProjects(getOfflinePartnerProjects(company.id));
    }, [company?.id, activeProjectId, projectName, clientName, clientContact, projectLocation, contactPerson, rooms, profitPercentage, beamType]);

    // Room management
    const addRoom = () => {
        const newId = `room_${Date.now()}`;
        setRooms(prev => [...prev, { id: newId, name: `Room ${prev.length + 1}`, length: 4.0, width: 3.5 }]);
    };

    const updateRoom = (id: string, field: 'name' | 'length' | 'width', val: string | number) => {
        setRooms(prev => prev.map(r => {
            if (r.id !== id) return r;
            return {
                ...r,
                [field]: field === 'name' ? val : Math.max(0, Number(val) || 0)
            };
        }));
    };

    const removeRoom = (id: string) => {
        if (rooms.length <= 1) {
            toast({ title: 'Minimum 1 Room', description: 'At least one room is required in the slab project.', variant: 'destructive' });
            return;
        }
        setRooms(prev => prev.filter(r => r.id !== id));
    };

    const handleDeleteProject = (projId: string) => {
        if (!company?.id) return;
        deleteOfflinePartnerProject(company.id, projId);
        const remaining = getOfflinePartnerProjects(company.id);
        setProjects(remaining);
        if (remaining.length > 0) {
            loadProject(remaining[0]);
        } else {
            handleCreateNewProject();
        }
        toast({ title: 'Project Removed', description: 'The project has been deleted from your dashboard.' });
    };

    const handleLogout = () => {
        clearPartnerSession();
        router.push('/partner/login');
    };

    // Calculate Partner Project Totals with Hidden 1-beam SI-LATECH cut + Partner Margin %
    const calculationSettings: CalculationDefaults = useMemo(() => ({
        ...DEFAULTS,
        beamType,
        isPartnerMode: true,
        partnerProfitPercentage: profitPercentage,
        partnerCompanyId: company?.id
    }), [beamType, profitPercentage, company?.id]);

    const formattedRooms = useMemo(() => {
        return rooms.map(r => ({
            id: r.id,
            name: r.name,
            length: Number(r.length) || 0,
            width: Number(r.width) || 0
        }));
    }, [rooms]);

    const totals = useMemo(() => {
        return calculateProjectTotals(formattedRooms, calculationSettings);
    }, [formattedRooms, calculationSettings]);

    const BEAM_PRICE = beamType === 'tbeam' ? 1200 : 545;
    const BLOCK_PRICE = beamType === 'tbeam' ? 95 : 80;

    const beamsInvoiceTotal = totals.totalInvoiceBeamLength * BEAM_PRICE;
    const blocksInvoiceTotal = totals.totalBlocks * BLOCK_PRICE;
    const quoteGrandTotal = beamsInvoiceTotal + blocksInvoiceTotal;

    const partnerProfitAmount = totals.totalPartnerProfitValue || (totals.totalPartnerProfitMetres * BEAM_PRICE);

    // PDF Quote generation
    const handleDownloadQuote = () => {
        try {
            const invoiceNumber = `QT-${String(Date.now()).slice(-6)}`;
            generateQuotePdf({
                invoiceNumber,
                clientInfo: {
                    clientName: clientName || 'Valued Client',
                    projectName: projectName || 'Precast Slab Project',
                    projectLocation: projectLocation || 'N/A',
                    clientContact: clientContact || 'N/A',
                    contactPerson: contactPerson || 'N/A',
                },
                totals: {
                    ...totals,
                    beamPrice: BEAM_PRICE,
                    blockPrice: BLOCK_PRICE,
                },
                partnerCompanyInfo: {
                    name: company?.name || 'Partner Contractor',
                    phone: company?.phone || '',
                    email: company?.email || '',
                    isPartner: true,
                    partnerProfitPercentage: profitPercentage
                }
            });
            toast({ title: 'Quote Downloaded', description: 'Official client quotation generated successfully.' });
        } catch (e: any) {
            console.error('PDF error:', e);
            toast({ title: 'Download Error', description: 'Could not generate PDF quote. Please try again.', variant: 'destructive' });
        }
    };

    if (!company) return null;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />

            {/* Partner Header Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-20 z-40 shadow-xs">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                    {company.name}
                                </h1>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                                    Partner Dashboard
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Beam & Block Estimator &bull; Offline Ready
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleCreateNewProject}
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-300 font-bold text-xs flex items-center gap-1.5 h-9"
                        >
                            <FolderPlus size={15} />
                            New Project
                        </Button>
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold h-9"
                        >
                            <LogOut size={15} className="mr-1" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-5">
                
                {/* 1. REQUIRED NOTICES & POLICIES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Office Confirmation Alert */}
                    <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-900 shadow-xs">
                        <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                            <AlertCircle size={18} />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-wider text-amber-900">
                                Order Processing Notice
                            </h2>
                            <p className="text-xs font-semibold text-amber-950 mt-0.5 leading-relaxed">
                                Please confirm your quote with the office in case of any changes so that they can be processed.
                            </p>
                        </div>
                    </div>

                    {/* Commission Settlement Banner */}
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-3 text-blue-900 shadow-xs">
                        <div className="p-2 bg-primary text-white rounded-xl shrink-0 mt-0.5">
                            <Coins size={18} />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-wider text-primary">
                                Profit & Commission Payout Policy
                            </h2>
                            <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-relaxed">
                                All profits and commissions are to be paid after site has been completed.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: Project Details & Rooms (2 Cols) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Project Info Card */}
                        <Card className="border-slate-200 rounded-2xl shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                        <CardTitle className="text-base font-bold text-slate-900">
                                            Project & Client Details
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Saved automatically to your offline storage.
                                        </CardDescription>
                                    </div>

                                    {/* Saved Projects Switcher */}
                                    {projects.length > 1 && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-500">Switch:</span>
                                            <select
                                                value={activeProjectId}
                                                onChange={(e) => {
                                                    const p = projects.find(proj => proj.id === e.target.value);
                                                    if (p) loadProject(p);
                                                }}
                                                className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                                            >
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name || 'Untitled'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-700">Project Name</Label>
                                        <Input
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            placeholder="e.g. Ruiru Residential Slab"
                                            className="h-10 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-700">Client Name</Label>
                                        <Input
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            placeholder="e.g. Eng. James Mwangi"
                                            className="h-10 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-700">Site Location</Label>
                                        <Input
                                            value={projectLocation}
                                            onChange={(e) => setProjectLocation(e.target.value)}
                                            placeholder="e.g. Juja Farm, Kiambu"
                                            className="h-10 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-700">Client Phone</Label>
                                        <Input
                                            value={clientContact}
                                            onChange={(e) => setClientContact(e.target.value)}
                                            placeholder="e.g. +254 700 000 000"
                                            className="h-10 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-bold text-slate-700">Beam System:</Label>
                                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setBeamType('flat')}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${beamType === 'flat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                Flat Beam (545/m)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBeamType('tbeam')}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${beamType === 'tbeam' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                T-Beam (1,200/m)
                                            </button>
                                        </div>
                                    </div>

                                    {projects.length > 1 && (
                                        <Button
                                            onClick={() => handleDeleteProject(activeProjectId)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:bg-red-50 text-xs font-bold h-8"
                                        >
                                            <Trash2 size={14} className="mr-1" />
                                            Delete Project
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Room Dimensions & Schedule */}
                        <Card className="border-slate-200 rounded-2xl shadow-xs">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-900">
                                        Room Dimensions & Layout
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Enter room dimensions to calculate required beams and hollow blocks.
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={addRoom}
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl h-9 flex items-center gap-1"
                                >
                                    <Plus size={16} />
                                    Add Room
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {rooms.map((room, idx) => (
                                    <div
                                        key={room.id}
                                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                                    >
                                        <div className="sm:col-span-4">
                                            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                                                Room / Section Name
                                            </Label>
                                            <Input
                                                value={room.name}
                                                onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                                                placeholder={`e.g. Room ${idx + 1}`}
                                                className="h-9 bg-white rounded-lg text-xs font-bold"
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                                                Length (Metres)
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.5"
                                                value={room.length || ''}
                                                onChange={(e) => updateRoom(room.id, 'length', e.target.value)}
                                                className="h-9 bg-white rounded-lg text-xs font-bold"
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                                                Width (Metres)
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.5"
                                                value={room.width || ''}
                                                onChange={(e) => updateRoom(room.id, 'width', e.target.value)}
                                                className="h-9 bg-white rounded-lg text-xs font-bold"
                                            />
                                        </div>
                                        <div className="sm:col-span-2 flex items-center justify-end pt-3 sm:pt-0">
                                            <Button
                                                onClick={() => removeRoom(room.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Profit Margin & Quote Summary (1 Col) */}
                    <div className="space-y-6">

                        {/* PROFIT MARGIN CUSTOMIZER */}
                        <Card className="border-primary/30 bg-white rounded-2xl shadow-md overflow-hidden">
                            <div className="bg-primary text-white p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-primary-foreground/80">
                                        Your Profit Margin
                                    </span>
                                    <Percent size={18} />
                                </div>
                                <div className="mt-2 flex items-baseline justify-between">
                                    <h3 className="text-3xl font-black">{profitPercentage}%</h3>
                                    <span className="text-xs text-primary-foreground/90 font-medium">
                                        Added to Invoiced Metres
                                    </span>
                                </div>
                            </div>

                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Set Your Profit %:</span>
                                        <span className="text-primary font-black">{profitPercentage}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="40"
                                        step="1"
                                        value={profitPercentage}
                                        onChange={(e) => setProfitPercentage(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>0% (Base)</span>
                                        <span>15% (Standard)</span>
                                        <span>30%</span>
                                        <span>40%</span>
                                    </div>
                                </div>

                                {/* Preset Margin Quick Buttons */}
                                <div className="grid grid-cols-4 gap-1.5 pt-1">
                                    {[10, 15, 20, 25].map(pct => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setProfitPercentage(pct)}
                                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${profitPercentage === pct ? 'bg-primary text-white border-primary shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                                        >
                                            {pct}%
                                        </button>
                                    ))}
                                </div>

                                {/* Expected Partner Earnings */}
                                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                                        Your Estimated Profit On Beams:
                                    </span>
                                    <div className="text-xl font-black text-emerald-950">
                                        Ksh {Math.round(partnerProfitAmount).toLocaleString()}
                                    </div>
                                    <span className="text-[10px] text-emerald-700 block">
                                        ({totals.totalPartnerProfitMetres?.toFixed(1) || '0.0'} extra invoiced metres added for your profit)
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CLIENT QUOTE SUMMARY CARD */}
                        <Card className="border-slate-200 bg-white rounded-2xl shadow-xs space-y-4 p-5">
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    Client Quotation Summary
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Ready to download for your client.
                                </p>
                            </div>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Total Floor Area:</span>
                                    <span className="font-bold text-slate-900">{totals.totalArea.toFixed(2)} m²</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Invoiced Beam Metres:</span>
                                    <span className="font-bold text-slate-900">{totals.totalInvoiceBeamLength.toFixed(2)} m</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Hollow Concrete Blocks:</span>
                                    <span className="font-bold text-slate-900">{totals.totalBlocks} pcs</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Beams Subtotal:</span>
                                    <span className="font-bold text-slate-900">Ksh {Math.round(beamsInvoiceTotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Blocks Subtotal:</span>
                                    <span className="font-bold text-slate-900">Ksh {Math.round(blocksInvoiceTotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 text-sm font-black text-slate-900">
                                    <span>Client Total Quote:</span>
                                    <span className="text-primary text-base">Ksh {Math.round(quoteGrandTotal).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Download Button */}
                            <Button
                                onClick={handleDownloadQuote}
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Download Client Quote PDF
                            </Button>

                            {/* Mandatory Uneditable Footer Notice */}
                            <div className="pt-2 text-center space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                    Powered by SI-LATECH
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium block">
                                    All materials are to be paid to PROMAX KENYA LTD
                                </span>
                            </div>
                        </Card>

                    </div>

                </div>
            </main>
        </div>
    );
}
