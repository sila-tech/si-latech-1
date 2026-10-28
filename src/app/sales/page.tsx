'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Loader2,
    Target,
    FolderKanban,
    MessageSquareText,
    Calculator,
    Wallet,
    Plus,
    Search,
    MapPin,
    Layers,
    Phone,
    MessageCircle,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    Download,
    TrendingUp,
    Sparkles,
    Eye,
    Edit,
    AlertCircle,
    Building,
    User,
    ArrowUpRight,
    FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { SalesSidebar, type SalesSection } from '@/components/sales/sales-sidebar';
import { BookMeasurementDialog } from '@/components/sales/book-measurement-dialog';
import { SalesConversationDialog, type LeadStatus } from '@/components/sales/sales-conversation-dialog';
import { SalesCalculatorView } from '@/components/sales/sales-calculator-view';
import { SalesTargetsView } from '@/components/sales/sales-targets-view';
import { generateQuotePdf } from '@/lib/pdf-utils';

const SALES_SESSION_KEY = 'sila-sales-auth';

export default function SalesDashboardPage() {
    const [user, setUser] = useState<{ id?: string; username: string; name: string; role?: string } | null>(null);
    const [activeSection, setActiveSection] = useState<SalesSection>('overview');

    // Dialog & project navigation states
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [conversationProject, setConversationProject] = useState<any>(null);
    const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
    const [calculatorProjectId, setCalculatorProjectId] = useState<string>('new');

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Facilitation form state
    const [facAmount, setFacAmount] = useState('');
    const [facReason, setFacReason] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);

    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Verify authentication
    useEffect(() => {
        const stored = sessionStorage.getItem(SALES_SESSION_KEY);
        if (!stored) {
            router.push('/sales/login');
        } else {
            setUser(JSON.parse(stored));
        }
    }, [router]);

    // Query projects associated with this sales rep
    const projectsQuery = useMemoFirebase(
        () =>
            user?.username
                ? query(collection(firestore, 'projects'), where('salesRep', '==', user.username))
                : null,
        [firestore, user?.username]
    );
    const { data: rawProjects, isLoading: projectsLoading } = useCollection<any>(projectsQuery);

    // Sort projects desc by creation date
    const projects = useMemo(() => {
        if (!rawProjects) return [];
        return [...rawProjects].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [rawProjects]);

    // Query activities / conversations
    const activitiesQuery = useMemoFirebase(
        () =>
            user?.username
                ? query(collection(firestore, 'sales_activities'), where('salesRep', '==', user.username))
                : null,
        [firestore, user?.username]
    );
    const { data: rawActivities, isLoading: activitiesLoading } = useCollection<any>(activitiesQuery);

    const activities = useMemo(() => {
        if (!rawActivities) return [];
        return [...rawActivities].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [rawActivities]);

    // Facilitation history
    const myFinancesQuery = useMemoFirebase(
        () =>
            user?.username
                ? query(collection(firestore, 'finances'), where('requestedBy', '==', user.username))
                : null,
        [firestore, user?.username]
    );
    const { data: rawRequests, isLoading: requestsLoading } = useCollection<any>(myFinancesQuery);

    const myRequests = useMemo(() => {
        if (!rawRequests) return [];
        return [...rawRequests].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [rawRequests]);

    // Target configuration (default or fetched)
    const targets = useMemo(() => {
        return {
            measurementsTarget: 20,
            dealsTarget: 8,
        };
    }, []);

    // Conversion rate metrics
    const wonCount = useMemo(() => {
        return projects.filter((p) => p.leadStatus === 'won' || p.conversionStatus === 'converted').length;
    }, [projects]);

    const lostCount = useMemo(() => {
        return projects.filter((p) => p.leadStatus === 'lost' || p.conversionStatus === 'lost').length;
    }, [projects]);

    const conversionRate = useMemo(() => {
        if (projects.length === 0) return 0;
        return Math.round((wonCount / projects.length) * 100);
    }, [projects.length, wonCount]);

    // Filtered projects list
    const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                (p.name || '').toLowerCase().includes(q) ||
                (p.clientName || '').toLowerCase().includes(q) ||
                (p.projectLocation || '').toLowerCase().includes(q) ||
                (p.clientContact || '').includes(q);

            if (!matchesSearch) return false;

            if (statusFilter === 'all') return true;
            const pStatus = p.leadStatus || (p.conversionStatus === 'converted' ? 'won' : 'measurement_booked');
            return pStatus === statusFilter;
        });
    }, [projects, searchQuery, statusFilter]);

    // Upcoming follow-up reminders
    const upcomingFollowUps = useMemo(() => {
        return projects.filter((p) => p.nextFollowUpDate && p.leadStatus !== 'won' && p.leadStatus !== 'lost');
    }, [projects]);

    const handleLogout = () => {
        sessionStorage.removeItem(SALES_SESSION_KEY);
        router.push('/sales/login');
    };

    const handleOpenInCalculator = (projectId: string) => {
        setCalculatorProjectId(projectId);
        setActiveSection('calculator');
    };

    const handleQuickStatusChange = async (project: any, newStatus: LeadStatus) => {
        try {
            const projectRef = doc(firestore, 'projects', project.id);
            const updatePayload: any = {
                leadStatus: newStatus,
                updatedAt: serverTimestamp(),
            };
            if (newStatus === 'won') {
                updatePayload.conversionStatus = 'converted';
                updatePayload.convertedAt = serverTimestamp();
                updatePayload.status = 'running';
            } else if (newStatus === 'lost') {
                updatePayload.conversionStatus = 'lost';
                updatePayload.lostAt = serverTimestamp();
            } else {
                updatePayload.conversionStatus = 'in_progress';
            }
            await updateDoc(projectRef, updatePayload);
            toast({
                title: newStatus === 'won' ? '🎉 Closed Won!' : 'Status Updated',
                description: `Project "${project.name}" marked as ${newStatus}.`,
            });
        } catch (err) {
            toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
        }
    };

    // Download official client quotation PDF
    const handleDownloadQuote = (proj: any) => {
        const quoteNumber = `QT-${proj.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const calc = proj.calculatedTotals || proj.totals || {};
        const safeTotals = {
            ...calc,
            totalBlocks: calc.totalBlocks || calc.totalBlocksRequired || 0,
            totalInvoiceBeamLength: calc.totalInvoiceBeamLength || 0,
            totalArea: calc.totalSlabArea || calc.totalArea || 0,
            beamType: proj.settings?.beamType || 'flat',
        };

        try {
            generateQuotePdf({
                invoiceNumber: quoteNumber,
                clientInfo: {
                    clientName: proj.clientName || 'Valued Client',
                    projectName: proj.name || 'Site Project',
                    projectLocation: proj.projectLocation || 'N/A',
                    clientContact: proj.clientContact || 'N/A',
                    contactPerson: user?.name || 'Sales Rep',
                },
                totals: safeTotals,
                perRoomCalculations: proj.rooms || [],
            });
            toast({
                title: 'Quote Downloaded!',
                description: `Official PDF quotation for ${proj.name} has been downloaded.`,
            });
        } catch (err) {
            console.error('Failed to generate quote PDF:', err);
            toast({
                title: 'Error',
                description: 'Failed to generate PDF. Make sure rooms are added.',
                variant: 'destructive',
            });
        }
    };

    const handleRequestFacilitation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!facAmount || !facReason) {
            toast({ title: 'Validation Error', description: 'Please fill out amount and reason.', variant: 'destructive' });
            return;
        }

        setIsRequesting(true);
        try {
            await addDoc(collection(firestore, 'finances'), {
                type: 'facilitation_request',
                amount: parseFloat(facAmount),
                reason: `[Sales] ${facReason}`,
                requestedBy: user?.username,
                requestedByName: user?.name,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Request Submitted',
                description: 'Your sales site facilitation request has been sent to Admin for approval.',
            });
            setFacAmount('');
            setFacReason('');
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to submit request.', variant: 'destructive' });
        } finally {
            setIsRequesting(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        );
    }

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
                return <Badge className="bg-teal-600 text-white font-bold text-[10px] border-0">SITE MEASURED</Badge>;
            case 'measurement_booked':
            default:
                return <Badge className="bg-blue-600 text-white font-bold text-[10px] border-0">BOOKED</Badge>;
        }
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-1 border border-emerald-200">
                        <TrendingUp size={13} /> Sales Performance Dashboard
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">
                        Welcome back, {user.name}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Track site measurements, conversion rates, and client conversation pipelines.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setIsBookModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-md"
                    >
                        <Plus size={15} /> Book Measurement
                    </Button>
                    <Button
                        onClick={() => {
                            setCalculatorProjectId('new');
                            setActiveSection('calculator');
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-xs"
                    >
                        <Calculator size={15} /> Open Calculator &amp; Quotes
                    </Button>
                </div>
            </div>

            {/* KPI Stat Cards (No Pipeline Money) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4.5 space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Booked Measurements</span>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <FolderKanban size={16} />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{projects.length}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Site measurements in pipeline</p>
                </Card>

                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4.5 space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Won Conversions</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-emerald-600">{wonCount}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">Deals converted to orders</p>
                </Card>

                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4.5 space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Conversion Rate</span>
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <Target size={16} />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-purple-600">{conversionRate}%</p>
                    <p className="text-[11px] text-slate-400 font-medium">Booked to won ratio</p>
                </Card>

                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-4.5 space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Follow-ups</span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                            <Clock size={16} />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">
                        {upcomingFollowUps.length}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">Scheduled client discussions</p>
                </Card>
            </div>

            {/* Upcoming Follow-ups Alert */}
            {upcomingFollowUps.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-600 text-white shrink-0">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-purple-950">
                                You have {upcomingFollowUps.length} upcoming client follow-ups scheduled!
                            </p>
                            <p className="text-[11px] text-purple-700">
                                Next: {upcomingFollowUps[0]?.clientName} ({upcomingFollowUps[0]?.name}) on {upcomingFollowUps[0]?.nextFollowUpDate}
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setActiveSection('conversations')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl h-8 shrink-0"
                    >
                        View Conversations
                    </Button>
                </div>
            )}

            {/* Recent Booked Measurements Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <FolderKanban size={18} className="text-blue-600" /> Recent Booked Measurements
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveSection('projects')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                        View All ({projects.length}) &rarr;
                    </Button>
                </div>

                {projectsLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-emerald-600" />
                    </div>
                ) : projects.length === 0 ? (
                    <Card className="p-8 text-center border-dashed border-slate-300 rounded-2xl bg-white">
                        <Target className="mx-auto text-slate-400 mb-2" size={32} />
                        <p className="text-sm font-bold text-slate-700">No Booked Measurements Yet</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            When you schedule site visits or meet clients to book measurements, register them here to track your conversion rate.
                        </p>
                        <Button
                            onClick={() => setIsBookModalOpen(true)}
                            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                        >
                            <Plus size={14} className="mr-1" /> Book Your First Measurement
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.slice(0, 6).map((proj: any) => {
                            const roomsCount = proj.rooms?.length || 0;
                            return (
                                <Card
                                    key={proj.id}
                                    className="border-slate-200/90 shadow-2xs rounded-2xl bg-white hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
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
                                        <CardContent className="p-4 space-y-2 text-xs">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                <MapPin size={13} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{proj.projectLocation || 'Location not specified'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                <Phone size={13} className="text-slate-400 shrink-0" />
                                                <span>{proj.clientContact || 'No contact number'}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600 font-medium">
                                                <span>{roomsCount} Slab Areas Measured</span>
                                                <span className="text-purple-700 font-bold">{proj.conversations?.length || 0} Notes</span>
                                            </div>
                                        </CardContent>
                                    </div>
                                    <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                                        <div className="grid grid-cols-2 gap-2 w-full">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenInCalculator(proj.id)}
                                                className="text-[11px] font-bold rounded-xl h-8 border-slate-200 hover:bg-amber-50 hover:text-amber-800 gap-1"
                                                title="Open in Calculator"
                                            >
                                                <Calculator size={13} className="text-amber-600" /> Calculate
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadQuote(proj)}
                                                className="text-[11px] font-bold rounded-xl h-8 border-slate-200 bg-sky-50 text-sky-700 hover:bg-sky-100 gap-1"
                                                title="Download Official Client Quote PDF"
                                            >
                                                <Download size={13} /> Quote PDF
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2 w-full">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setConversationProject(proj);
                                                    setIsConversationModalOpen(true);
                                                }}
                                                className="flex-1 text-[11px] font-bold rounded-xl h-8 border-slate-200 hover:bg-purple-50 hover:text-purple-700"
                                            >
                                                <MessageSquareText size={13} className="mr-1 text-purple-600" /> Log Follow-up
                                            </Button>
                                            {proj.leadStatus !== 'won' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleQuickStatusChange(proj, 'won')}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl h-8 px-2.5"
                                                    title="Mark Deal Won"
                                                >
                                                    <CheckCircle2 size={13} />
                                                </Button>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    const renderProjects = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline flex items-center gap-2">
                        <FolderKanban className="text-blue-600" /> Booked Measurements &amp; Pipeline
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        All site measurements and client projects associated with your account ({projects.length} total).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            setCalculatorProjectId('new');
                            setActiveSection('calculator');
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-xs"
                    >
                        <Calculator size={15} /> New Calculation &amp; Quote
                    </Button>
                    <Button
                        onClick={() => setIsBookModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-md"
                    >
                        <Plus size={15} /> Book Measurement
                    </Button>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-2xs">
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                    {[
                        { id: 'all', label: `All (${projects.length})` },
                        { id: 'measurement_booked', label: 'Booked' },
                        { id: 'measured', label: 'Measured' },
                        { id: 'quoted', label: 'Quoted' },
                        { id: 'negotiation', label: 'Negotiation' },
                        { id: 'won', label: `Won (${wonCount})` },
                        { id: 'lost', label: `Lost (${lostCount})` },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setStatusFilter(t.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                statusFilter === t.id
                                    ? t.id === 'won'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : t.id === 'lost'
                                        ? 'bg-red-600 text-white shadow-2xs'
                                        : 'bg-slate-900 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by client, project, phone..."
                        className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Projects Grid */}
            {projectsLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-emerald-600" />
                </div>
            ) : filteredProjects.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-slate-300 rounded-2xl bg-white">
                    <FolderKanban className="mx-auto text-slate-400 mb-2" size={36} />
                    <p className="text-sm font-bold text-slate-700">No projects found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or status filter.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProjects.map((proj: any) => {
                        const roomsCount = proj.rooms?.length || 0;
                        const conversationsCount = proj.conversations?.length || 0;

                        return (
                            <Card
                                key={proj.id}
                                className="border-slate-200/90 shadow-2xs rounded-2xl bg-white hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                            >
                                <div>
                                    <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/70">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="space-y-0.5 min-w-0">
                                                <CardTitle className="text-base font-black text-slate-900 truncate">
                                                    {proj.name}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-slate-600 font-semibold truncate">
                                                    {proj.clientName || 'Valued Client'}
                                                </CardDescription>
                                            </div>
                                            {renderLeadBadge(proj.leadStatus)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3 text-xs">
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <MapPin size={14} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{proj.projectLocation || 'Location not specified'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-600 font-medium">
                                            <span className="flex items-center gap-2">
                                                <Phone size={14} className="text-slate-400 shrink-0" />
                                                <span>{proj.clientContact || 'No contact'}</span>
                                            </span>
                                            {proj.clientContact && (
                                                <div className="flex items-center gap-1">
                                                    <a
                                                        href={`tel:${proj.clientContact}`}
                                                        className="p-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                        title="Call Client"
                                                    >
                                                        <Phone size={12} />
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/${proj.clientContact.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                        title="WhatsApp Client"
                                                    >
                                                        <MessageCircle size={12} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-600">
                                            <span>
                                                <span className="font-bold text-slate-900">{roomsCount}</span> Slab Areas
                                            </span>
                                            <span>
                                                <span className="font-bold text-purple-700">{conversationsCount}</span> Conversation Notes
                                            </span>
                                        </div>
                                    </CardContent>
                                </div>

                                <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenInCalculator(proj.id)}
                                            className="text-[11px] font-bold rounded-xl h-8 border-slate-200 hover:bg-amber-50 hover:text-amber-800 gap-1"
                                            title="Open in Calculator"
                                        >
                                            <Calculator size={13} className="text-amber-600" /> Calculate
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadQuote(proj)}
                                            className="text-[11px] font-bold rounded-xl h-8 border-slate-200 bg-sky-50 text-sky-700 hover:bg-sky-100 gap-1"
                                            title="Download Client Quote PDF"
                                        >
                                            <Download size={13} /> Quote PDF
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setConversationProject(proj);
                                                setIsConversationModalOpen(true);
                                            }}
                                            className="flex-1 text-[11px] font-bold rounded-xl h-8 border-slate-200 hover:bg-purple-50 hover:text-purple-700"
                                        >
                                            <MessageSquareText size={13} className="mr-1 text-purple-600" /> Log Follow-up
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {proj.leadStatus !== 'won' && (
                                                <button
                                                    onClick={() => handleQuickStatusChange(proj, 'won')}
                                                    className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 border border-emerald-200 text-[10px]"
                                                >
                                                    Won
                                                </button>
                                            )}
                                            {proj.leadStatus !== 'lost' && (
                                                <button
                                                    onClick={() => handleQuickStatusChange(proj, 'lost')}
                                                    className="px-2 py-1 rounded-md bg-red-50 text-red-600 font-bold hover:bg-red-100 border border-red-200 text-[10px]"
                                                >
                                                    Lost
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderConversations = () => (
        <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline flex items-center gap-2">
                        <MessageSquareText className="text-purple-600" /> Client Conversations &amp; Follow-ups
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Timeline of phone calls, site meetings, WhatsApp chats, and client agreements.
                    </p>
                </div>
                {projects.length > 0 && (
                    <Button
                        onClick={() => {
                            setConversationProject(projects[0]);
                            setIsConversationModalOpen(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-md"
                    >
                        <Plus size={15} /> Log New Interaction
                    </Button>
                )}
            </div>

            {/* Upcoming Follow-ups Table / Card */}
            {upcomingFollowUps.length > 0 && (
                <Card className="border-purple-200 bg-purple-50/40 rounded-2xl shadow-2xs overflow-hidden">
                    <CardHeader className="p-4 bg-purple-100/60 border-b border-purple-200">
                        <CardTitle className="text-sm font-black text-purple-950 flex items-center gap-2">
                            <Clock size={16} className="text-purple-700" /> Pending Action Items &amp; Next Follow-ups
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {upcomingFollowUps.map((p) => (
                            <div
                                key={p.id}
                                className="p-3 bg-white rounded-xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                            >
                                <div className="space-y-0.5">
                                    <p className="font-bold text-xs text-slate-900">
                                        {p.name} &bull; <span className="text-purple-700 font-semibold">{p.clientName}</span> ({p.clientContact})
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Follow-up Scheduled: <span className="font-bold text-slate-800">{p.nextFollowUpDate}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setConversationProject(p);
                                            setIsConversationModalOpen(true);
                                        }}
                                        className="h-7 text-[11px] font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        Log Call Notes
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Activities Feed */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recent Conversation History ({activities.length})
                </h3>

                {activitiesLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-purple-600" />
                    </div>
                ) : activities.length === 0 ? (
                    <Card className="p-8 text-center border-dashed border-slate-300 rounded-2xl bg-white">
                        <MessageSquareText className="mx-auto text-slate-400 mb-2" size={32} />
                        <p className="text-sm font-bold text-slate-700">No conversations recorded yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Click "Log Conversation" on any booked measurement to record your interaction notes.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {activities.map((act) => (
                            <Card key={act.id} className="p-4 border-slate-200 bg-white rounded-2xl shadow-2xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900">{act.projectName}</span>
                                        <span className="text-xs text-slate-500">&bull;</span>
                                        <span className="text-xs font-semibold text-slate-700">{act.clientName}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                            act.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            act.channel === 'site_visit' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                            'bg-purple-50 text-purple-700 border-purple-200'
                                        }`}>
                                            {act.channel || 'call'}
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
        </div>
    );

    const renderFacilitation = () => (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline flex items-center gap-2">
                    <Wallet className="text-teal-600" /> Sales Site Facilitation
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Request operational funds for site measurement visits, transport, fuel, and client lunches.
                </p>
            </div>

            <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-5">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Wallet className="text-teal-400" size={18} /> Request Field Facilitation
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                        Direct request to Super Admin for fuel or field expenses.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleRequestFacilitation} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Amount Required (KSh)</Label>
                            <Input
                                type="number"
                                value={facAmount}
                                onChange={(e) => setFacAmount(e.target.value)}
                                placeholder="e.g. 2000"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Purpose / Site Visit Details</Label>
                            <Input
                                value={facReason}
                                onChange={(e) => setFacReason(e.target.value)}
                                placeholder="e.g. Fuel for booking site measurement in Karen & Rongai"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-10 rounded-xl"
                            disabled={isRequesting}
                        >
                            {isRequesting ? <Loader2 className="animate-spin mr-2" size={15} /> : null}
                            Submit Facilitation Request
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Facilitation History</h3>
                {requestsLoading ? (
                    <Loader2 className="animate-spin mx-auto text-teal-600" />
                ) : myRequests.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No previous facilitation requests submitted.</p>
                ) : (
                    <div className="space-y-2">
                        {myRequests.map((req: any) => (
                            <div
                                key={req.id}
                                className="bg-white p-3.5 rounded-xl border border-slate-200 text-sm flex justify-between items-center shadow-2xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900">KSh {req.amount?.toLocaleString()}</p>
                                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase bg-teal-50 text-teal-700 border-teal-200">
                                            Facilitation
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{req.reason}</p>
                                </div>
                                <span
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                        req.status === 'approved'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : req.status === 'rejected'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                >
                                    {req.status?.toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return renderOverview();
            case 'projects':
                return renderProjects();
            case 'calculator':
                return (
                    <SalesCalculatorView
                        salesUser={user}
                        existingProjects={projects}
                        activeProjectId={calculatorProjectId}
                        onBackToProjects={() => setActiveSection('projects')}
                    />
                );
            case 'conversations':
                return renderConversations();
            case 'targets':
                return <SalesTargetsView salesUser={user} projects={projects} customTargets={targets} />;
            case 'facilitation':
                return renderFacilitation();
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <SalesSidebar
                activeSection={activeSection}
                onSectionChange={(s) => {
                    if (s === 'calculator') setCalculatorProjectId('new');
                    setActiveSection(s);
                }}
                salesName={user.name}
                username={user.username}
                onLogout={handleLogout}
                pendingConversationsCount={upcomingFollowUps.length}
            />

            {/* Main Content */}
            <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
                    {renderSection()}
                </div>
            </main>

            {/* Modals */}
            <BookMeasurementDialog
                open={isBookModalOpen}
                onOpenChange={setIsBookModalOpen}
                salesUser={user}
                onSuccess={(newId) => handleOpenInCalculator(newId)}
            />

            <SalesConversationDialog
                open={isConversationModalOpen}
                onOpenChange={setIsConversationModalOpen}
                project={conversationProject}
                salesUser={user}
                onSuccess={() => {}}
            />
        </div>
    );
}
