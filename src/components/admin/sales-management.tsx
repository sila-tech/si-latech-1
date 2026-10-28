'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    Loader2,
    Target,
    TrendingUp,
    Users,
    FolderKanban,
    MessageSquareText,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    MapPin,
    Phone,
    Download,
    Award,
    Edit2,
    Filter,
    BarChart3,
    ArrowUpRight,
    Building,
    UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { generateQuotePdf } from '@/lib/pdf-utils';

export function SalesManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'reps' | 'pipeline' | 'conversations' | 'funnel'>('reps');
    const [selectedRepFilter, setSelectedRepFilter] = useState<string>('all');
    const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Target modal state
    const [editingRepTarget, setEditingRepTarget] = useState<any>(null);
    const [targetMeasurements, setTargetMeasurements] = useState('20');
    const [targetDeals, setTargetDeals] = useState('8');
    const [targetRevenue, setTargetRevenue] = useState('2000000');
    const [isSavingTarget, setIsSavingTarget] = useState(false);

    // Fetch team members with role == 'sales'
    const salesTeamQuery = useMemoFirebase(
        () => query(collection(firestore, 'staff'), where('role', '==', 'sales')),
        [firestore]
    );
    const { data: rawSalesReps, isLoading: repsLoading } = useCollection<any>(salesTeamQuery);

    // Also fetch all staff in case some reps are designated staff
    const allStaffQuery = useMemoFirebase(
        () => query(collection(firestore, 'staff'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: allStaff } = useCollection<any>(allStaffQuery);

    // Fetch all projects
    const projectsQuery = useMemoFirebase(
        () => query(collection(firestore, 'projects'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: rawProjects, isLoading: projectsLoading } = useCollection<any>(projectsQuery);

    // Fetch all sales activities / conversations
    const activitiesQuery = useMemoFirebase(
        () => query(collection(firestore, 'sales_activities'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: rawActivities, isLoading: activitiesLoading } = useCollection<any>(activitiesQuery);

    // Fetch targets
    const targetsQuery = useMemoFirebase(
        () => query(collection(firestore, 'sales_targets')),
        [firestore]
    );
    const { data: salesTargets } = useCollection<any>(targetsQuery);

    // Combine sales reps: those with role === 'sales' plus any username that has projects with salesRep set
    const salesReps = useMemo(() => {
        const repsMap = new Map<string, any>();

        // Add explicit sales role members
        (allStaff || []).forEach((s) => {
            if (s.role === 'sales') {
                repsMap.set(s.username, {
                    id: s.id,
                    username: s.username,
                    name: s.name,
                    role: s.role,
                });
            }
        });

        // Also detect anyone who has booked measurements in projects
        (rawProjects || []).forEach((p) => {
            if (p.salesRep && !repsMap.has(p.salesRep)) {
                repsMap.set(p.salesRep, {
                    id: p.salesRep,
                    username: p.salesRep,
                    name: p.salesRepName || p.salesRep,
                    role: 'sales',
                });
            }
        });

        return Array.from(repsMap.values());
    }, [allStaff, rawProjects]);

    // Aggregate statistics per sales rep
    const repStats = useMemo(() => {
        return salesReps.map((rep) => {
            const repProjects = (rawProjects || []).filter(
                (p) => p.salesRep === rep.username || p.assignedTo === rep.username
            );
            const total = repProjects.length;
            const wonProjects = repProjects.filter((p) => p.leadStatus === 'won' || p.conversionStatus === 'converted');
            const lostProjects = repProjects.filter((p) => p.leadStatus === 'lost' || p.conversionStatus === 'lost');
            const wonCount = wonProjects.length;
            const lostCount = lostProjects.length;
            const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

            const wonRevenue = wonProjects.reduce((sum, p) => {
                const val = p.calculatedTotals?.totalProjectCost || p.totals?.totalProjectCost || 0;
                return sum + Number(val);
            }, 0);

            const totalPipeline = repProjects.reduce((sum, p) => {
                const val = p.calculatedTotals?.totalProjectCost || p.totals?.totalProjectCost || 0;
                return sum + Number(val);
            }, 0);

            const repTarget = (salesTargets || []).find((t) => t.username === rep.username) || {
                measurementsTarget: 20,
                dealsTarget: 8,
                revenueTarget: 2000000,
            };

            return {
                ...rep,
                totalProjects: total,
                wonCount,
                lostCount,
                conversionRate,
                wonRevenue,
                totalPipeline,
                targets: repTarget,
            };
        });
    }, [salesReps, rawProjects, salesTargets]);

    // Global team aggregates
    const teamTotalProjects = (rawProjects || []).filter((p) => p.salesRep).length;
    const teamWonProjects = (rawProjects || []).filter((p) => p.salesRep && (p.leadStatus === 'won' || p.conversionStatus === 'converted'));
    const teamWonCount = teamWonProjects.length;
    const teamConversionRate = teamTotalProjects > 0 ? Math.round((teamWonCount / teamTotalProjects) * 100) : 0;
    const teamWonRevenue = teamWonProjects.reduce((sum, p) => {
        const val = p.calculatedTotals?.totalProjectCost || p.totals?.totalProjectCost || 0;
        return sum + Number(val);
    }, 0);

    // Filtered projects for Pipeline tab
    const filteredPipelineProjects = useMemo(() => {
        return (rawProjects || []).filter((p) => {
            // Must be associated with a sales rep OR have a lead status
            const isSalesProj = Boolean(p.salesRep || p.leadStatus || p.bookedAt);
            if (!isSalesProj && selectedRepFilter === 'all') {
                // If filter is all, also allow any project that has leadStatus
                if (!p.leadStatus) return false;
            }

            if (selectedRepFilter !== 'all' && p.salesRep !== selectedRepFilter && p.assignedTo !== selectedRepFilter) {
                return false;
            }

            if (leadStatusFilter !== 'all' && (p.leadStatus || 'measurement_booked') !== leadStatusFilter) {
                return false;
            }

            const q = searchQuery.toLowerCase();
            if (q) {
                const matches =
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.clientName || '').toLowerCase().includes(q) ||
                    (p.projectLocation || '').toLowerCase().includes(q) ||
                    (p.salesRepName || '').toLowerCase().includes(q) ||
                    (p.clientContact || '').includes(q);
                if (!matches) return false;
            }

            return true;
        });
    }, [rawProjects, selectedRepFilter, leadStatusFilter, searchQuery]);

    // Filtered activities
    const filteredActivities = useMemo(() => {
        return (rawActivities || []).filter((a) => {
            if (selectedRepFilter !== 'all' && a.salesRep !== selectedRepFilter) return false;
            const q = searchQuery.toLowerCase();
            if (q) {
                const matches =
                    (a.projectName || '').toLowerCase().includes(q) ||
                    (a.clientName || '').toLowerCase().includes(q) ||
                    (a.salesRepName || '').toLowerCase().includes(q) ||
                    (a.notes || '').toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [rawActivities, selectedRepFilter, searchQuery]);

    const handleSaveRepTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRepTarget) return;

        setIsSavingTarget(true);
        try {
            await setDoc(doc(firestore, 'sales_targets', editingRepTarget.username), {
                username: editingRepTarget.username,
                name: editingRepTarget.name,
                measurementsTarget: parseInt(targetMeasurements) || 20,
                dealsTarget: parseInt(targetDeals) || 8,
                revenueTarget: parseFloat(targetRevenue) || 2000000,
                updatedAt: serverTimestamp(),
            });

            toast({
                title: 'Targets Updated',
                description: `Monthly sales quota updated for ${editingRepTarget.name}.`,
            });
            setEditingRepTarget(null);
        } catch (err) {
            console.error('Failed to update targets:', err);
            toast({ title: 'Error', description: 'Could not save targets.', variant: 'destructive' });
        } finally {
            setIsSavingTarget(false);
        }
    };

    const handleReassignRep = async (projectId: string, newRepUsername: string) => {
        try {
            const targetRep = salesReps.find((r) => r.username === newRepUsername);
            const projectRef = doc(firestore, 'projects', projectId);
            await updateDoc(projectRef, {
                salesRep: newRepUsername,
                salesRepName: targetRep?.name || newRepUsername,
                assignedTo: newRepUsername,
                updatedAt: serverTimestamp(),
            });
            toast({
                title: 'Project Reassigned',
                description: `Project reassigned to ${targetRep?.name || newRepUsername}.`,
            });
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to reassign project.', variant: 'destructive' });
        }
    };

    const handleDownloadQuote = (proj: any) => {
        const quoteNumber = `QT-${proj.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        generateQuotePdf({
            invoiceNumber: quoteNumber,
            clientInfo: {
                clientName: proj.clientName || 'Valued Client',
                projectName: proj.name || 'Site Project',
                projectLocation: proj.projectLocation || 'N/A',
                clientContact: proj.clientContact || 'N/A',
                contactPerson: proj.salesRepName || 'Sales Rep',
            },
            totals: proj.calculatedTotals || proj.totals || {},
            perRoomCalculations: proj.rooms || [],
        });
    };

    const renderLeadBadge = (leadStatus?: string) => {
        switch (leadStatus) {
            case 'won':
                return <Badge className="bg-emerald-600 text-white font-bold text-[10px] border-0">CLOSED WON</Badge>;
            case 'lost':
                return <Badge className="bg-red-500 text-white font-bold text-[10px] border-0">CLOSED LOST</Badge>;
            case 'negotiation':
                return <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] border-0">IN NEGOTIATION</Badge>;
            case 'quoted':
                return <Badge className="bg-purple-600 text-white font-bold text-[10px] border-0">QUOTE SENT</Badge>;
            case 'measured':
                return <Badge className="bg-teal-600 text-white font-bold text-[10px] border-0">MEASURED</Badge>;
            case 'measurement_booked':
            default:
                return <Badge className="bg-blue-600 text-white font-bold text-[10px] border-0">BOOKED</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-1 border border-emerald-200">
                        <Target size={13} /> Sales Force Management
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">
                        Sales &amp; Site Measurements Suite
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Track booked site measurements, sales rep performance, conversion rates, and client conversations.
                    </p>
                </div>
            </div>

            {/* Top Team KPI Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sales Representatives</p>
                    <p className="text-2xl font-black text-slate-900">{salesReps.length}</p>
                    <p className="text-[11px] text-slate-400">Active field reps</p>
                </Card>

                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Measurements</p>
                    <p className="text-2xl font-black text-blue-600">{teamTotalProjects}</p>
                    <p className="text-[11px] text-slate-400">Booked &amp; measured</p>
                </Card>

                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Won Conversions</p>
                    <p className="text-2xl font-black text-emerald-600">{teamWonCount}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">Closed deals</p>
                </Card>

                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Conversion Rate</p>
                    <p className="text-2xl font-black text-purple-600">{teamConversionRate}%</p>
                    <p className="text-[11px] text-slate-400">Booking to sale</p>
                </Card>

                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4 space-y-1 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Converted Revenue</p>
                    <p className="text-xl font-black text-slate-900 font-mono">
                        KSh {(teamWonRevenue / 1000).toFixed(0)}k
                    </p>
                    <p className="text-[11px] text-slate-400">Won orders total</p>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-2">
                {[
                    { id: 'reps', label: `Sales Reps (${salesReps.length})`, icon: Users },
                    { id: 'pipeline', label: `Measurements Pipeline (${filteredPipelineProjects.length})`, icon: FolderKanban },
                    { id: 'conversations', label: `Client Conversations (${filteredActivities.length})`, icon: MessageSquareText },
                    { id: 'funnel', label: 'Conversion Funnel', icon: BarChart3 },
                ].map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                                isActive
                                    ? 'border-emerald-600 text-emerald-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Icon size={15} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: Sales Reps Leaderboard */}
            {activeTab === 'reps' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Sales Representative Leaderboard</h3>
                            <p className="text-xs text-slate-500">
                                Compare individual measurement bookings, conversion rates, and revenue milestones.
                            </p>
                        </div>
                    </div>

                    {repsLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-600" /></div>
                    ) : salesReps.length === 0 ? (
                        <Card className="p-8 text-center border-dashed border-slate-300 rounded-2xl bg-white">
                            <Users className="mx-auto text-slate-400 mb-2" size={32} />
                            <p className="text-sm font-bold text-slate-700">No Sales Representatives Configured</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Go to the <span className="font-bold text-slate-700">Team</span> section in Admin to add accounts with the "Sales Representative" role.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {repStats.map((rep) => (
                                <Card
                                    key={rep.username}
                                    className="border-slate-200/90 shadow-2xs rounded-2xl bg-white overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                                >
                                    <div>
                                        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="space-y-0.5 min-w-0">
                                                    <CardTitle className="text-base font-black text-slate-900 truncate">
                                                        {rep.name}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs font-semibold text-emerald-700">
                                                        @{rep.username} &bull; Sales Rep
                                                    </CardDescription>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                                                        <Award size={12} /> {rep.conversionRate}%
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3 text-xs">
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Booked</p>
                                                    <p className="text-lg font-black text-slate-900">{rep.totalProjects}</p>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                                    <p className="text-[10px] text-emerald-700 font-bold uppercase">Won</p>
                                                    <p className="text-lg font-black text-emerald-700">{rep.wonCount}</p>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
                                                    <p className="text-[10px] text-red-600 font-bold uppercase">Lost</p>
                                                    <p className="text-lg font-black text-red-600">{rep.lostCount}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 pt-1 text-xs">
                                                <div className="flex justify-between items-center text-slate-600">
                                                    <span>Won Sales Revenue:</span>
                                                    <span className="font-bold font-mono text-emerald-700">
                                                        KSh {rep.wonRevenue.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-slate-600">
                                                    <span>Active Pipeline Value:</span>
                                                    <span className="font-bold font-mono text-slate-800">
                                                        KSh {rep.totalPipeline.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-100 text-[11px]">
                                                    <span>Target Quota:</span>
                                                    <span className="font-semibold text-slate-700">
                                                        {rep.targets.measurementsTarget || 20} bookings / {rep.targets.dealsTarget || 8} won
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>

                                    <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedRepFilter(rep.username);
                                                setActiveTab('pipeline');
                                            }}
                                            className="flex-1 text-[11px] font-bold rounded-xl h-8 border-slate-200"
                                        >
                                            View Projects ({rep.totalProjects})
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingRepTarget(rep);
                                                setTargetMeasurements(rep.targets?.measurementsTarget?.toString() || '20');
                                                setTargetDeals(rep.targets?.dealsTarget?.toString() || '8');
                                                setTargetRevenue(rep.targets?.revenueTarget?.toString() || '2000000');
                                            }}
                                            className="text-[11px] font-bold rounded-xl h-8 border-slate-200 px-3 text-slate-700"
                                            title="Edit Target Quotas"
                                        >
                                            <Edit2 size={12} className="mr-1" /> Targets
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Measurements Pipeline */}
            {activeTab === 'pipeline' && (
                <div className="space-y-4">
                    {/* Filter controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <Label className="text-xs font-bold text-slate-500">Sales Rep:</Label>
                                <Select value={selectedRepFilter} onValueChange={setSelectedRepFilter}>
                                    <SelectTrigger className="h-8 text-xs w-44 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sales Reps</SelectItem>
                                        {salesReps.map((r) => (
                                            <SelectItem key={r.username} value={r.username}>
                                                {r.name} (@{r.username})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Label className="text-xs font-bold text-slate-500">Stage:</Label>
                                <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                                    <SelectTrigger className="h-8 text-xs w-40 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Stages</SelectItem>
                                        <SelectItem value="measurement_booked">Booked</SelectItem>
                                        <SelectItem value="measured">Measured</SelectItem>
                                        <SelectItem value="quoted">Quoted</SelectItem>
                                        <SelectItem value="negotiation">In Negotiation</SelectItem>
                                        <SelectItem value="won">Closed Won</SelectItem>
                                        <SelectItem value="lost">Closed Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Search pipeline..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 text-xs pl-8 rounded-lg bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Projects Table / Cards */}
                    {projectsLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-600" /></div>
                    ) : filteredPipelineProjects.length === 0 ? (
                        <Card className="p-8 text-center border-dashed border-slate-300 rounded-2xl bg-white">
                            <p className="text-sm font-bold text-slate-700">No projects match the current filter</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPipelineProjects.map((proj: any) => {
                                const estCost = proj.calculatedTotals?.totalProjectCost || proj.totals?.totalProjectCost || 0;
                                return (
                                    <Card
                                        key={proj.id}
                                        className="border-slate-200/90 shadow-2xs rounded-2xl bg-white overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                                    >
                                        <div>
                                            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="space-y-0.5 min-w-0">
                                                        <CardTitle className="text-sm font-black text-slate-900 truncate">
                                                            {proj.name}
                                                        </CardTitle>
                                                        <CardDescription className="text-xs text-slate-600 font-semibold truncate">
                                                            {proj.clientName || 'Valued Client'}
                                                        </CardDescription>
                                                    </div>
                                                    {renderLeadBadge(proj.leadStatus)}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-2.5 text-xs">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <MapPin size={13} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{proj.projectLocation || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-slate-600">
                                                    <span className="flex items-center gap-2">
                                                        <Phone size={13} className="text-slate-400 shrink-0" />
                                                        <span>{proj.clientContact || 'No contact'}</span>
                                                    </span>
                                                    {proj.clientContact && (
                                                        <a
                                                            href={`https://wa.me/${proj.clientContact.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-emerald-600 hover:underline font-bold text-[11px]"
                                                        >
                                                            WhatsApp
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                                                    <span className="text-slate-500">Sales Rep:</span>
                                                    <span className="font-bold text-slate-900">
                                                        {proj.salesRepName || proj.salesRep || 'Unassigned'}
                                                    </span>
                                                </div>
                                                {estCost > 0 && (
                                                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/60 flex justify-between items-center font-mono">
                                                        <span className="text-[11px] font-sans font-bold text-amber-900">Estimate:</span>
                                                        <span className="font-bold text-slate-950">KSh {estCost.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </div>

                                        <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 flex-1">
                                                <span className="text-[10px] font-bold text-slate-400">Reassign:</span>
                                                <Select
                                                    value={proj.salesRep || 'unassigned'}
                                                    onValueChange={(val) => handleReassignRep(proj.id, val)}
                                                >
                                                    <SelectTrigger className="h-7 text-[11px] rounded-lg bg-white flex-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {salesReps.map((r) => (
                                                            <SelectItem key={r.username} value={r.username}>
                                                                {r.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadQuote(proj)}
                                                className="h-7 px-2 text-[11px] font-bold rounded-lg border-slate-200 hover:bg-slate-100"
                                                title="Quote PDF"
                                            >
                                                <Download size={12} />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: Client Conversations Feed */}
            {activeTab === 'conversations' && (
                <div className="space-y-4 max-w-4xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Team Interaction History</h3>
                            <p className="text-xs text-slate-500">
                                Live log of phone calls, site visits, and WhatsApp updates filed by sales reps.
                            </p>
                        </div>
                    </div>

                    {activitiesLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-600" /></div>
                    ) : filteredActivities.length === 0 ? (
                        <Card className="p-8 text-center border-dashed border-slate-300 rounded-2xl bg-white">
                            <p className="text-sm font-bold text-slate-700">No conversation activities recorded yet</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredActivities.map((act) => (
                                <Card key={act.id} className="p-4 border-slate-200 bg-white rounded-2xl shadow-2xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-black text-slate-900">{act.projectName}</span>
                                            <span className="text-xs text-slate-500">&bull;</span>
                                            <span className="text-xs font-semibold text-slate-700">{act.clientName}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                                                {act.channel || 'call'}
                                            </span>
                                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                By: {act.salesRepName || act.salesRep}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {renderLeadBadge(act.leadStatus)}
                                            <span className="text-[11px] text-slate-400">
                                                {act.createdAt?.seconds ? format(new Date(act.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Recently'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pt-2 text-xs text-slate-700 leading-relaxed">
                                        {act.notes}
                                    </div>
                                    {act.nextFollowUpDate && (
                                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-purple-700 font-semibold">
                                            <Calendar size={12} />
                                            <span>Next follow-up: {act.nextFollowUpDate}</span>
                                            {act.nextAction && <span>&bull; Action: {act.nextAction}</span>}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: Conversion Funnel */}
            {activeTab === 'funnel' && (
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-6">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2 mb-1">
                            <BarChart3 size={18} className="text-emerald-600" /> Overall Sales Conversion Funnel
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mb-6">
                            Stages progression from initial site measurement booking to final contract award.
                        </CardDescription>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-center">
                            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">1. Booked</p>
                                <p className="text-3xl font-black text-blue-900">
                                    {(rawProjects || []).filter((p) => p.salesRep && (p.leadStatus === 'measurement_booked' || !p.leadStatus)).length}
                                </p>
                                <p className="text-[11px] text-blue-600 font-medium">Initial Booking</p>
                            </div>

                            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">2. Measured</p>
                                <p className="text-3xl font-black text-teal-900">
                                    {(rawProjects || []).filter((p) => p.salesRep && p.leadStatus === 'measured').length}
                                </p>
                                <p className="text-[11px] text-teal-600 font-medium">Site Surveyed</p>
                            </div>

                            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">3. Quoted</p>
                                <p className="text-3xl font-black text-purple-900">
                                    {(rawProjects || []).filter((p) => p.salesRep && p.leadStatus === 'quoted').length}
                                </p>
                                <p className="text-[11px] text-purple-600 font-medium">Quote Presented</p>
                            </div>

                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">4. In Discussion</p>
                                <p className="text-3xl font-black text-amber-900">
                                    {(rawProjects || []).filter((p) => p.salesRep && p.leadStatus === 'negotiation').length}
                                </p>
                                <p className="text-[11px] text-amber-600 font-medium">Price / Terms</p>
                            </div>

                            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 space-y-1 shadow-2xs">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">5. Closed Won</p>
                                <p className="text-3xl font-black text-emerald-950">{teamWonCount}</p>
                                <p className="text-[11px] text-emerald-700 font-bold">{teamConversionRate}% Conversion</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Target Setting Dialog */}
            {editingRepTarget && (
                <Dialog open={Boolean(editingRepTarget)} onOpenChange={() => setEditingRepTarget(null)}>
                    <DialogContent className="max-w-md bg-white rounded-2xl border-slate-200 p-0 overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black text-white">
                                    Set Monthly Sales Targets
                                </DialogTitle>
                                <DialogDescription className="text-xs text-white/80">
                                    Target quota benchmarks for {editingRepTarget.name} (@{editingRepTarget.username})
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <form onSubmit={handleSaveRepTarget} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Monthly Measurements Target</Label>
                                <Input
                                    type="number"
                                    value={targetMeasurements}
                                    onChange={(e) => setTargetMeasurements(e.target.value)}
                                    placeholder="e.g. 20"
                                    className="h-9 text-xs rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Monthly Converted Deals Target</Label>
                                <Input
                                    type="number"
                                    value={targetDeals}
                                    onChange={(e) => setTargetDeals(e.target.value)}
                                    placeholder="e.g. 8"
                                    className="h-9 text-xs rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Monthly Revenue Quota (KSh)</Label>
                                <Input
                                    type="number"
                                    value={targetRevenue}
                                    onChange={(e) => setTargetRevenue(e.target.value)}
                                    placeholder="e.g. 2000000"
                                    className="h-9 text-xs rounded-xl"
                                    required
                                />
                            </div>

                            <DialogFooter className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingRepTarget(null)}
                                    className="text-xs rounded-xl h-9"
                                    disabled={isSavingTarget}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="text-xs font-bold rounded-xl h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isSavingTarget}
                                >
                                    {isSavingTarget ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                                    Save Targets
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
