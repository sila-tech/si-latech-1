'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Plus,
    Trash2,
    Calculator,
    Download,
    MessageCircle,
    Save,
    Layers,
    DollarSign,
    CheckCircle2,
    RefreshCw,
    Building,
    FileText,
    Clock,
    AlertCircle,
    ArrowRight,
    Check,
} from 'lucide-react';
import { calculateProjectTotals, calcBRC } from '@/lib/calculator';
import { generateQuotePdf, generateMaterialSchedulePdf } from '@/lib/pdf-utils';
import { useCalculator } from '@/context/calculator-context';
import { useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface SalesRoom {
    id: string;
    name: string;
    length: number;
    width: number;
}

export type SyncStatus = 'idle' | 'unsaved' | 'saving' | 'synced' | 'error';

interface SalesCalculatorViewProps {
    salesUser: { username: string; name: string };
    existingProjects?: any[];
    activeProjectId?: string;
    onProjectSaved?: (projectId?: string) => void;
    onBackToProjects?: () => void;
}

export function SalesCalculatorView({
    salesUser,
    existingProjects = [],
    activeProjectId,
    onProjectSaved,
    onBackToProjects,
}: SalesCalculatorViewProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { pricingRates } = useCalculator();

    const [projectName, setProjectName] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [projectLocation, setProjectLocation] = useState('');
    const [selectedExistingProjectId, setSelectedExistingProjectId] = useState<string>(activeProjectId || 'new');
    const [beamType, setBeamType] = useState<'flat' | 'tbeam'>('flat');

    const [rooms, setRooms] = useState<SalesRoom[]>([
        { id: '1', name: 'Room 1 (Main Slab)', length: 5.0, width: 4.0 },
    ]);

    // Live auto-sync status state
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

    // References for robust debounced auto-sync
    const currentProjectIdRef = useRef<string>(activeProjectId || 'new');
    const isSyncingRef = useRef<boolean>(false);
    const pendingSyncRef = useRef<boolean>(false);
    const lastSavedSnapshotRef = useRef<string>('');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef<boolean>(true);

    // Keep currentProjectIdRef in sync with state
    useEffect(() => {
        currentProjectIdRef.current = selectedExistingProjectId;
    }, [selectedExistingProjectId]);

    // Active pricing rates with fallbacks
    const BEAM_PRICE = beamType === 'tbeam' ? (pricingRates?.beamTbeamRate || 1200) : (pricingRates?.beamFlatRate || 545);
    const BLOCK_PRICE = beamType === 'tbeam' ? (pricingRates?.blockTbeamRate || 100) : (pricingRates?.blockFlatRate || 90);
    const CEMENT_PRICE = pricingRates?.cementRate || 800;
    const SAND_PRICE = pricingRates?.sandRate || 3000;
    const BALLAST_PRICE = pricingRates?.ballastRate || 3200;
    const BRC_PRICE = pricingRates?.brcRate || 25000;
    const PROP_PRICE = pricingRates?.propRate || 500;

    const settings: any = {
        beamType,
        beamSpacing: 0.55,
        blockWidth: 0.2,
        wastagePercentage: 10,
        propSpacing: 1.2,
        concreteThickness: 0.05,
        blockCommissionRate: 5,
        beamFlatRate: pricingRates?.beamFlatRate || 545,
        beamTbeamRate: pricingRates?.beamTbeamRate || 1200,
    };

    // Calculate project totals using unified calculator engine
    const fullCalculation = calculateProjectTotals(rooms as any, settings);
    const totalArea = fullCalculation.totalArea || 0;
    const totalBeamsLength = fullCalculation.totalInvoiceBeamLength || 0;
    const evaluatedRooms = (fullCalculation.perRoomCalculations || []).map((p: any) => ({
        ...p.room,
        roomCalcs: p.roomCalcs,
        area: p.room.length * p.room.width,
    }));
    const totalBeamPcs = (fullCalculation.perRoomCalculations || []).reduce(
        (sum: number, p: any) => sum + (p.roomCalcs?.invoiceBeamCount || p.roomCalcs?.actualBeamCount || 0),
        0
    );
    const totalBlocks = fullCalculation.totalBlocks || 0;
    const cementBags = fullCalculation.totalCementBags || 0;
    const sandTonnes = fullCalculation.totalSandTonnes || 0;
    const ballastTonnes = fullCalculation.totalBallastTonnes || 0;
    const brc = calcBRC(totalArea, settings);
    const brcRolls = brc.rollsNeeded;
    const propsCount = fullCalculation.timber?.totalProps || 0;

    // Costs
    const beamsCost = Math.round(totalBeamsLength * BEAM_PRICE);
    const blocksCost = Math.round(totalBlocks * BLOCK_PRICE);
    const cementCost = Math.round(cementBags * CEMENT_PRICE);
    const sandCost = Math.round(sandTonnes * SAND_PRICE);
    const ballastCost = Math.round(ballastTonnes * BALLAST_PRICE);
    const brcCost = Math.round(brcRolls * BRC_PRICE);
    const propsCost = Math.round(propsCount * PROP_PRICE);

    const totalEstimate = beamsCost + blocksCost + cementCost + sandCost + ballastCost + brcCost;

    // Build serialized snapshot to detect real mutations
    const buildSnapshot = useCallback(() => {
        return JSON.stringify({
            id: currentProjectIdRef.current,
            name: projectName.trim(),
            clientName: clientName.trim(),
            clientContact: clientContact.trim(),
            projectLocation: projectLocation.trim(),
            beamType,
            rooms: rooms.map((r) => ({
                id: r.id,
                name: r.name,
                length: Number(r.length) || 0,
                width: Number(r.width) || 0,
            })),
        });
    }, [projectName, clientName, clientContact, projectLocation, beamType, rooms]);

    // Perform the actual Firestore sync
    const performSync = useCallback(
        async (isManual = false) => {
            if (isSyncingRef.current) {
                pendingSyncRef.current = true;
                return;
            }

            // Need at least a project name or client name if starting new, or must have existing ID
            const hasExisting = currentProjectIdRef.current !== 'new';
            const hasNameOrClient = projectName.trim().length > 0 || clientName.trim().length > 0;

            if (!hasExisting && !hasNameOrClient) {
                if (isManual) {
                    toast({
                        title: 'Notice',
                        description: 'Please enter a Project Name or Client Name before saving.',
                        variant: 'destructive',
                    });
                }
                return;
            }

            isSyncingRef.current = true;
            setSyncStatus('saving');

            try {
                const targetId = currentProjectIdRef.current;
                const existingProj = existingProjects.find((p) => p.id === targetId);

                // Preserve existing won/lost/negotiation status, or advance to measured
                let targetLeadStatus = existingProj?.leadStatus;
                if (!targetLeadStatus || targetLeadStatus === 'measurement_booked') {
                    if (totalArea > 0) targetLeadStatus = 'measured';
                }

                const projectDataPayload: any = {
                    name: projectName.trim() || (clientName.trim() ? `${clientName.trim()}'s Project` : 'Site Slab Project'),
                    clientName: clientName.trim() || 'Valued Client',
                    clientContact: clientContact.trim(),
                    projectLocation: projectLocation.trim(),
                    salesRep: salesUser.username,
                    salesRepName: salesUser.name,
                    assignedTo: salesUser.username,
                    leadStatus: targetLeadStatus || 'measured',
                    conversionStatus: existingProj?.conversionStatus || 'in_progress',
                    rooms,
                    settings,
                    calculatedTotals: {
                        totalSlabArea: totalArea,
                        totalInvoiceBeamLength: totalBeamsLength,
                        totalBeamPieces: totalBeamPcs,
                        totalBlocks: totalBlocks,
                        totalBlocksRequired: totalBlocks,
                        cementBags,
                        sandTonnes,
                        ballastTonnes,
                        brcRolls,
                        propsCount,
                        totalProjectCost: totalEstimate,
                    },
                    totals: {
                        totalInvoiceBeamLength: totalBeamsLength,
                        totalBlocks: totalBlocks,
                        totalBlocksRequired: totalBlocks,
                        totalArea: totalArea,
                        beamType: beamType,
                        beamPrice: BEAM_PRICE,
                        blockPrice: BLOCK_PRICE,
                        cementBags,
                        sandTonnes,
                        ballastTonnes,
                        brcRolls,
                        propsCount,
                        totalProjectCost: totalEstimate,
                    },
                    updatedAt: serverTimestamp(),
                };

                let savedId = targetId;

                if (targetId !== 'new') {
                    // Update existing project doc
                    await updateDoc(doc(firestore, 'projects', targetId), projectDataPayload);
                } else {
                    // Create new project doc
                    projectDataPayload.createdAt = serverTimestamp();
                    projectDataPayload.bookedAt = serverTimestamp();
                    projectDataPayload.status = 'pending';
                    const newDoc = await addDoc(collection(firestore, 'projects'), projectDataPayload);
                    savedId = newDoc.id;
                    currentProjectIdRef.current = newDoc.id;
                    setSelectedExistingProjectId(newDoc.id);
                    if (onProjectSaved) {
                        onProjectSaved(newDoc.id);
                    }
                }

                lastSavedSnapshotRef.current = buildSnapshot();
                setSyncStatus('synced');
                const now = new Date();
                setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

                if (isManual) {
                    toast({
                        title: '✓ Synced & Saved to Pipeline',
                        description: `Project "${projectDataPayload.name}" is fully updated in your pipeline.`,
                    });
                }
            } catch (error) {
                console.error('Error during auto-sync:', error);
                setSyncStatus('error');
                if (isManual) {
                    toast({
                        title: 'Sync Error',
                        description: 'Could not sync project to cloud. Please check your network connection.',
                        variant: 'destructive',
                    });
                }
            } finally {
                isSyncingRef.current = false;
                if (pendingSyncRef.current) {
                    pendingSyncRef.current = false;
                    performSync(false);
                }
            }
        },
        [
            projectName,
            clientName,
            clientContact,
            projectLocation,
            salesUser,
            rooms,
            settings,
            totalArea,
            totalBeamsLength,
            totalBeamPcs,
            totalBlocks,
            cementBags,
            sandTonnes,
            ballastTonnes,
            brcRolls,
            propsCount,
            totalEstimate,
            beamType,
            BEAM_PRICE,
            BLOCK_PRICE,
            existingProjects,
            firestore,
            toast,
            buildSnapshot,
            onProjectSaved,
        ]
    );

    // When selecting an existing project from dropdown or props
    const handleSelectProject = (projectId: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        setSelectedExistingProjectId(projectId);
        currentProjectIdRef.current = projectId;

        if (projectId === 'new') {
            setProjectName('');
            setClientName('');
            setClientContact('');
            setProjectLocation('');
            setRooms([{ id: crypto.randomUUID(), name: 'Room 1 (Main Slab)', length: 5.0, width: 4.0 }]);
            setBeamType('flat');
            setSyncStatus('idle');
            lastSavedSnapshotRef.current = '';
            return;
        }

        const proj = existingProjects.find((p) => p.id === projectId);
        if (proj) {
            setProjectName(proj.name || '');
            setClientName(proj.clientName || '');
            setClientContact(proj.clientContact || '');
            setProjectLocation(proj.projectLocation || '');
            if (proj.rooms && proj.rooms.length > 0) {
                setRooms(
                    proj.rooms.map((r: any) => ({
                        id: r.id || crypto.randomUUID(),
                        name: r.name || 'Room',
                        length: Number(r.length) || 0,
                        width: Number(r.width) || 0,
                    }))
                );
            }
            if (proj.settings?.beamType) {
                setBeamType(proj.settings.beamType);
            }

            // Immediately mark as synced with loaded project data
            const loadedSnapshot = JSON.stringify({
                id: projectId,
                name: (proj.name || '').trim(),
                clientName: (proj.clientName || '').trim(),
                clientContact: (proj.clientContact || '').trim(),
                projectLocation: (proj.projectLocation || '').trim(),
                beamType: proj.settings?.beamType || 'flat',
                rooms: (proj.rooms || []).map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    length: Number(r.length) || 0,
                    width: Number(r.width) || 0,
                })),
            });
            lastSavedSnapshotRef.current = loadedSnapshot;
            setSyncStatus('synced');
            setLastSyncedTime('Just loaded');
        }
    };

    // Auto-load if activeProjectId is passed
    useEffect(() => {
        if (activeProjectId && activeProjectId !== 'new') {
            handleSelectProject(activeProjectId);
        }
    }, [activeProjectId]);

    // Debounced Auto-Save trigger on any user modifications
    useEffect(() => {
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            return;
        }

        const currentSnapshot = buildSnapshot();
        if (currentSnapshot === lastSavedSnapshotRef.current) {
            return;
        }

        // Indicate pending unsaved change
        setSyncStatus('unsaved');

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        const canSave = currentProjectIdRef.current !== 'new' || projectName.trim().length > 0 || clientName.trim().length > 0;
        if (canSave) {
            debounceTimerRef.current = setTimeout(() => {
                performSync(false);
            }, 1200);
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [projectName, clientName, clientContact, projectLocation, beamType, rooms, buildSnapshot, performSync]);

    const addRoom = () => {
        setRooms((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: `Room ${prev.length + 1}`,
                length: 4.0,
                width: 3.5,
            },
        ]);
    };

    const updateRoom = (id: string, field: 'name' | 'length' | 'width', val: any) => {
        setRooms((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                return {
                    ...r,
                    [field]: field === 'name' ? val : parseFloat(val) || 0,
                };
            })
        );
    };

    const removeRoom = (id: string) => {
        if (rooms.length <= 1) return;
        setRooms((prev) => prev.filter((r) => r.id !== id));
    };

    // Primary action: Download Client Quote PDF with immediate auto-sync
    const handleDownloadPdf = async () => {
        if (!projectName.trim() && !clientName.trim()) {
            toast({
                title: 'Client Details Required',
                description: 'Please enter both the Project Name and Client Name before generating the quote.',
                variant: 'destructive',
            });
            return;
        }

        if (totalArea <= 0) {
            toast({
                title: 'Dimensions Required',
                description: 'Please input room dimensions to calculate slab materials.',
                variant: 'destructive',
            });
            return;
        }

        // Ensure latest calculation is synced to Firestore first
        await performSync(false);

        const targetId = currentProjectIdRef.current;
        const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;

        try {
            // If project is synced, also log Quote document in Firestore and advance status to 'quoted'
            if (targetId && targetId !== 'new') {
                await updateDoc(doc(firestore, 'projects', targetId), {
                    leadStatus: 'quoted',
                    updatedAt: serverTimestamp(),
                });

                await addDoc(collection(firestore, 'quotes'), {
                    invoiceNumber: quoteNumber,
                    projectId: targetId,
                    projectName: projectName.trim() || 'Site Project',
                    clientName: clientName.trim() || 'Valued Client',
                    clientContact: clientContact.trim(),
                    projectLocation: projectLocation.trim(),
                    salesRep: salesUser.username,
                    salesRepName: salesUser.name,
                    totals: {
                        totalInvoiceBeamLength: totalBeamsLength,
                        totalBlocks: totalBlocks,
                        totalBlocksRequired: totalBlocks,
                        totalArea: totalArea,
                        beamType: beamType,
                        beamPrice: BEAM_PRICE,
                        blockPrice: BLOCK_PRICE,
                        cementBags,
                        sandTonnes,
                        ballastTonnes,
                        brcRolls,
                        propsCount,
                        totalProjectCost: totalEstimate,
                    },
                    rooms: evaluatedRooms,
                    createdAt: serverTimestamp(),
                });
            }

            generateQuotePdf({
                invoiceNumber: quoteNumber,
                clientInfo: {
                    clientName: clientName.trim() || 'Valued Client',
                    projectName: projectName.trim() || 'Site Project',
                    projectLocation: projectLocation.trim() || 'Site Location N/A',
                    clientContact: clientContact.trim() || 'N/A',
                    contactPerson: salesUser.name,
                },
                totals: {
                    totalInvoiceBeamLength: totalBeamsLength,
                    totalBlocks: totalBlocks,
                    totalBlocksRequired: totalBlocks,
                    totalArea: totalArea,
                    beamType: beamType,
                    beamPrice: BEAM_PRICE,
                    blockPrice: BLOCK_PRICE,
                    cementBags,
                    sandTonnes,
                    ballastTonnes,
                    brc: { rollsNeeded: brcRolls },
                    timber: { totalProps: propsCount },
                    totalProjectCost: totalEstimate,
                },
                perRoomCalculations: evaluatedRooms,
            });

            toast({
                title: 'Quote PDF Generated & Synced!',
                description: `Official quote for ${clientName || projectName} downloaded and synced to pipeline.`,
            });
        } catch (err) {
            console.error('Failed to generate quote PDF:', err);
            toast({
                title: 'Error',
                description: 'Could not generate PDF. Please verify your inputs.',
                variant: 'destructive',
            });
        }
    };

    // Technical Material Schedule PDF
    const handleDownloadMaterialSchedule = async () => {
        if (!projectName.trim()) {
            toast({ title: 'Notice', description: 'Enter Project Name before generating schedule.', variant: 'destructive' });
            return;
        }

        await performSync(false);

        try {
            generateMaterialSchedulePdf({
                clientInfo: {
                    projectName: projectName.trim(),
                    projectLocation: projectLocation.trim() || 'N/A',
                    clientName: clientName.trim() || 'Valued Client',
                },
                rooms: rooms,
                settings: settings,
            });

            toast({
                title: 'Material Schedule Generated!',
                description: `Technical schedule for ${projectName} downloaded.`,
            });
        } catch (err) {
            console.error('Failed to generate material schedule:', err);
        }
    };

    // Share directly to client via WhatsApp
    const handleWhatsAppShare = async () => {
        if (!clientContact) {
            toast({ title: 'Missing Contact', description: 'Enter client contact number to share quote.', variant: 'destructive' });
            return;
        }

        await performSync(false);

        const cleanNumber = clientContact.replace(/\D/g, '');
        const message =
            `Hello ${clientName || 'Client'},\nHere is your official SI-LATECH Slab Estimate for *${projectName || 'your project'}*:\n` +
            `- Total Slab Area: ${totalArea.toFixed(1)} m²\n` +
            `- Precast Beams: ${totalBeamsLength.toFixed(1)} m (${totalBeamPcs} pcs)\n` +
            `- EcoSlab Blocks: ${totalBlocks.toLocaleString()} pcs\n` +
            `- Cement for Topping: ${cementBags} bags\n` +
            `- Sand: ${sandTonnes} Tonnes\n` +
            `- Ballast: ${ballastTonnes} Tonnes\n` +
            `- BRC Mesh: ${brcRolls} Rolls\n` +
            `*Estimated Materials Total: KSh ${totalEstimate.toLocaleString()}*\n\n` +
            `Prepared by ${salesUser.name} (SI-LATECH Sales). Let us know when you'd like delivery scheduled!`;

        const waUrl = `https://wa.me/${cleanNumber.startsWith('0') ? '254' + cleanNumber.slice(1) : cleanNumber}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    // Render Sync Indicator Badge
    const renderSyncIndicator = () => {
        switch (syncStatus) {
            case 'saving':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs animate-pulse">
                        <RefreshCw size={12} className="animate-spin text-blue-600" />
                        <span>Auto-syncing to cloud...</span>
                    </div>
                );
            case 'synced':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Auto-synced</span>
                        {lastSyncedTime && (
                            <span className="text-[10px] text-emerald-600/80 font-normal">({lastSyncedTime})</span>
                        )}
                    </div>
                );
            case 'unsaved':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                        <Clock size={12} className="text-amber-600" />
                        <span>Saving changes...</span>
                    </div>
                );
            case 'error':
                return (
                    <button
                        onClick={() => performSync(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs hover:bg-red-100"
                        title="Click to retry sync"
                    >
                        <AlertCircle size={12} className="text-red-600" />
                        <span>Sync error - tap to retry</span>
                    </button>
                );
            case 'idle':
            default:
                return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200">
                        <span>Auto-sync ready</span>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Primary Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-headline flex items-center gap-2">
                            <Calculator className="text-amber-500" /> Site Slab Calculator &amp; Official Quotation
                        </h1>
                        {renderSyncIndicator()}
                    </div>
                    <p className="text-slate-500 text-xs">
                        All room measurements and quantities auto-save and sync to your sales pipeline in real-time.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={handleDownloadPdf}
                        className="rounded-xl text-xs font-bold bg-[#095388] hover:bg-[#07426c] text-white h-10 px-4 gap-2 shadow-sm"
                    >
                        <Download size={15} /> Download Client Quote (PDF)
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDownloadMaterialSchedule}
                        className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-3.5 gap-1.5"
                        title="Download Material Schedule for Site Engineers"
                    >
                        <FileText size={14} className="text-slate-500" /> Material Schedule
                    </Button>
                    <Button
                        onClick={handleWhatsAppShare}
                        className="rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white h-10 px-3.5 gap-1.5 shadow-xs"
                    >
                        <MessageCircle size={15} /> WhatsApp Quote
                    </Button>
                    {onBackToProjects && (
                        <Button
                            variant="ghost"
                            onClick={onBackToProjects}
                            className="rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 h-10 px-3 gap-1"
                        >
                            <span>Pipeline</span> <ArrowRight size={14} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Project Selection / Association Card */}
            <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white">
                <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <Building size={16} className="text-primary" /> Client &amp; Project Information
                            </CardTitle>
                            {selectedExistingProjectId !== 'new' ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold gap-1">
                                    <Check size={10} /> Linked Project
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-500 text-[10px] font-medium border-dashed">
                                    New Calculation
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold text-slate-500 whitespace-nowrap">Load Project:</Label>
                            <Select value={selectedExistingProjectId} onValueChange={handleSelectProject}>
                                <SelectTrigger className="h-8 text-xs w-56 rounded-lg bg-white border-slate-200 font-semibold">
                                    <SelectValue placeholder="New Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">+ Start Blank Calculation</SelectItem>
                                    {existingProjects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name || 'Unnamed'} ({p.clientName || 'No Client'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Project Name *</Label>
                            <Input
                                placeholder="e.g. Karen Villa / Ruiru Flats"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Client Name *</Label>
                            <Input
                                placeholder="e.g. Eng. Kamau / Arch. Sarah"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Client Phone / WhatsApp</Label>
                            <Input
                                placeholder="e.g. 0722 123 456"
                                value={clientContact}
                                onChange={(e) => setClientContact(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Site Location</Label>
                            <Input
                                placeholder="e.g. Kamakis, Eastern Bypass"
                                value={projectLocation}
                                onChange={(e) => setProjectLocation(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Rooms Dimensions Entry & Live Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rooms Inputs (Left 2 Cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <Layers size={16} className="text-amber-500" /> Slab Areas &amp; Rooms ({rooms.length})
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Beams are laid along the shorter span for maximum structural integrity. Changes auto-save continuously.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={beamType} onValueChange={(v: any) => setBeamType(v)}>
                                    <SelectTrigger className="h-8 text-xs w-36 rounded-lg font-bold bg-white border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="flat">Flat Beams (Standard)</SelectItem>
                                        <SelectItem value="tbeam">T-Beams (Heavy Duty)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={addRoom}
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-8 rounded-lg"
                                >
                                    <Plus size={14} className="mr-1" /> Add Room
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {rooms.map((r, idx) => (
                                <div
                                    key={r.id}
                                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-3"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 space-y-1 w-full sm:w-auto">
                                        <Input
                                            value={r.name}
                                            onChange={(e) => updateRoom(r.id, 'name', e.target.value)}
                                            placeholder="Room Name"
                                            className="h-8 text-xs font-bold bg-white rounded-lg border-slate-200"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="flex items-center gap-1">
                                            <Label className="text-[11px] font-bold text-slate-500">L (m):</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0.5"
                                                value={r.length || ''}
                                                onChange={(e) => updateRoom(r.id, 'length', e.target.value)}
                                                className="h-8 text-xs w-20 font-mono bg-white rounded-lg"
                                            />
                                        </div>
                                        <span className="text-slate-400 font-bold text-xs">&times;</span>
                                        <div className="flex items-center gap-1">
                                            <Label className="text-[11px] font-bold text-slate-500">W (m):</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0.5"
                                                value={r.width || ''}
                                                onChange={(e) => updateRoom(r.id, 'width', e.target.value)}
                                                className="h-8 text-xs w-20 font-mono bg-white rounded-lg"
                                            />
                                        </div>
                                        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-700 shrink-0">
                                            {(r.length * r.width).toFixed(1)} m²
                                        </div>
                                        {rooms.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeRoom(r.id)}
                                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Dual Action Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            onClick={handleDownloadPdf}
                            className="h-11 bg-[#095388] hover:bg-[#07426c] text-white font-bold text-xs rounded-xl shadow-md gap-2"
                        >
                            <Download size={16} />
                            Download Official Client Quote (PDF)
                        </Button>
                        <Button
                            onClick={() => performSync(true)}
                            disabled={syncStatus === 'saving'}
                            variant="outline"
                            className="h-11 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl shadow-xs gap-2"
                        >
                            {syncStatus === 'saving' ? (
                                <RefreshCw size={16} className="animate-spin text-emerald-700" />
                            ) : syncStatus === 'synced' ? (
                                <CheckCircle2 size={16} className="text-emerald-700" />
                            ) : (
                                <Save size={16} className="text-emerald-700" />
                            )}
                            {syncStatus === 'saving'
                                ? 'Syncing to Cloud...'
                                : syncStatus === 'synced'
                                ? '✓ Synced (Force Sync)'
                                : 'Sync & Save to Pipeline'}
                        </Button>
                    </div>
                </div>

                {/* Live Bill of Quantities & Pricing Summary (Right Col) */}
                <div className="space-y-4">
                    <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Bill of Quantities</p>
                                <h3 className="text-lg font-black tracking-tight mt-0.5">Calculated Materials</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Total Area: <span className="font-bold text-white">{totalArea.toFixed(1)} m²</span> ({(totalArea * 10.764).toFixed(0)} sq ft)
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleDownloadPdf}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg h-8 gap-1"
                            >
                                <Download size={13} /> PDF
                            </Button>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-700">Precast Beams</span>
                                    <span className="font-mono font-bold text-slate-900">
                                        {totalBeamsLength.toFixed(1)} m ({totalBeamPcs} pcs)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-700">EcoSlab Blocks</span>
                                    <span className="font-mono font-bold text-slate-900">
                                        {totalBlocks.toLocaleString()} pcs
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-700">Cement (Topping)</span>
                                    <span className="font-mono font-bold text-slate-900">{cementBags} bags</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-700">River Sand</span>
                                    <span className="font-mono font-bold text-slate-900">{sandTonnes} Tonnes</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-700">Ballast (1/2")</span>
                                    <span className="font-mono font-bold text-slate-900">{ballastTonnes} Tonnes</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                    <span className="font-semibold text-slate-700">BRC Mesh (A142)</span>
                                    <span className="font-mono font-bold text-slate-900">{brcRolls} Rolls</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="font-semibold text-slate-700">Telescopic Props</span>
                                    <span className="font-mono font-bold text-slate-900">{propsCount} props</span>
                                </div>
                            </div>

                            {/* Cost Summary Box */}
                            <div className="pt-3 border-t-2 border-dashed border-slate-200">
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Total Materials Estimate</p>
                                    <p className="text-2xl font-black text-slate-950 font-mono mt-0.5">
                                        KSh {totalEstimate.toLocaleString()}
                                    </p>
                                    <p className="text-[11px] text-amber-900/80 mt-1 font-medium">
                                        Approx. KSh {totalArea > 0 ? Math.round(totalEstimate / totalArea).toLocaleString() : 0} per m²
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
