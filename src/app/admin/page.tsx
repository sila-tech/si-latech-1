'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, addDoc, serverTimestamp, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    Briefcase,
    FileText,
    LayoutDashboard,
    Calendar,
    Search,
    TrendingUp,
    Layers,
    History,
    Download,
    Activity,
    MapPin,
    Image as ImageIcon,
    UserCheck,
    Edit,
    Trash2,
    Eye,
    X,
    FileSpreadsheet,
    Plus,
    Check,
    SlidersHorizontal,
    DollarSign,
    MoreVertical,
    BarChart3,
    Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useCalculator } from '@/context/calculator-context';
import { generateQuotePdf, generatePromaxPdf, generateProfitRequestPdf, generateMaterialSchedulePdf } from '@/lib/pdf-utils';
import { calcRoomBlocksAndBeams } from '@/lib/calculator';
import { RoomLayoutVisualizer } from '@/components/silacalc/room-layout-visualizer';
import { StaffManagement } from '@/components/admin/staff-management';
import { FinanceManagement } from '@/components/admin/finance-management';
import { InvestorManagement } from '@/components/admin/investor-management';
import { PortfolioManagement } from '@/components/admin/portfolio-management';
import { AdminSidebar, type AdminSection } from '@/components/admin/admin-sidebar';
import { AdminProjectEditorModal } from '@/components/admin/admin-project-editor-modal';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminDashboardPage() {
    const [activeSection, setActiveSection] = useState<AdminSection>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [projectStatusFilter, setProjectStatusFilter] = useState('running');
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isLayoutViewOpen, setIsLayoutViewOpen] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [adminName, setAdminName] = useState('Admin');

    const [isAdminEditorOpen, setIsAdminEditorOpen] = useState(false);
    const [adminEditorProject, setAdminEditorProject] = useState<any>(null);

    const [deletingProject, setDeletingProject] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    const PAGE_SIZE = 12;
    const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);

    const router = useRouter();
    const { totals: currentTotals, pricingRates, updatePricingRates } = useCalculator();
    const { toast } = useToast();

    const [tempRates, setTempRates] = useState<any>({
        beamFlatRate: 500,
        beamTbeamRate: 950,
        blockFlatRate: 80,
        blockTbeamRate: 95,
        cementRate: 800,
        sandRate: 3000,
        ballastRate: 3200,
        brcRate: 25000,
        propRate: 500,
    });

    useEffect(() => {
        if (pricingRates) {
            setTempRates({ ...pricingRates });
        }
    }, [pricingRates]);

    const handleSaveRates = async () => {
        await updatePricingRates({
            beamFlatRate: Number(tempRates.beamFlatRate) || 500,
            beamTbeamRate: Number(tempRates.beamTbeamRate) || 950,
            blockFlatRate: Number(tempRates.blockFlatRate) || 80,
            blockTbeamRate: Number(tempRates.blockTbeamRate) || 95,
            cementRate: Number(tempRates.cementRate) || 800,
            sandRate: Number(tempRates.sandRate) || 3000,
            ballastRate: Number(tempRates.ballastRate) || 3200,
            brcRate: Number(tempRates.brcRate) || 25000,
            propRate: Number(tempRates.propRate) || 500,
        });
        setIsPricingModalOpen(false);
    };

    useEffect(() => {
        const storedAuth = sessionStorage.getItem('sila-admin-auth');
        if (!storedAuth) {
            router.push('/admin/login');
            return;
        }
        if (storedAuth === btoa('Sila4927')) {
            setIsSuperAdmin(true);
            setAdminName('Super Admin');
        } else {
            try {
                const parsed = JSON.parse(storedAuth);
                if (parsed.role === 'admin' || parsed.role === 'staff') {
                    setIsSuperAdmin(parsed.role === 'admin');
                    setAdminName(parsed.name || 'Administrator');
                } else {
                    router.push('/admin/login');
                }
            } catch {
                router.push('/admin/login');
            }
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem('sila-admin-auth');
        router.replace('/admin/login');
    };

    const firestore = useFirestore();

    const staffQuery = useMemoFirebase(
        () => query(collection(firestore, 'staff'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: staffList } = useCollection<any>(staffQuery);

    const projectsQuery = useMemoFirebase(
        () => query(collection(firestore, 'projects'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: projects, isLoading: projectsLoading } = useCollection<any>(projectsQuery);

    const invoicesQuery = useMemoFirebase(
        () => query(collection(firestore, 'quotes'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: invoices, isLoading: invoicesLoading } = useCollection<any>(invoicesQuery);

    const getProjectName = (proj: any) => {
        const raw = proj?.name?.trim();
        if (!raw || raw.toLowerCase() === 'na' || raw.toLowerCase() === 'n/a') return 'Unnamed project';
        return raw;
    };

    const getProjectLocation = (proj: any) => {
        const raw = (proj?.projectLocation || proj?.location)?.trim();
        if (!raw || raw.toLowerCase() === 'na' || raw.toLowerCase() === 'n/a') return 'Location not specified';
        return raw;
    };

    const handleDownloadSavedQuote = (inv: any) => {
        generateQuotePdf({
            invoiceNumber: inv.invoiceNumber,
            clientInfo: {
                clientName: inv.clientName || 'N/A',
                projectName: inv.projectName || 'N/A',
                projectLocation: inv.projectLocation || 'N/A',
                clientContact: inv.clientContact || 'N/A',
                contactPerson: inv.contactPerson || 'N/A'
            },
            totals: inv.totals,
            perRoomCalculations: inv.rooms || [],
            discountType: inv.discountType || 'none',
            discountValue: inv.discountValue || 0,
            paymentMethods: inv.paymentMethods || [],
            customPaymentNotes: inv.customPaymentNotes || '',
            clientChangeRequestNotes: inv.clientChangeRequestNotes || ''
        });
    };

    const handleDownloadPromax = (proj: any) => {
        const BEAM_PRICE_PER_METER = proj.settings?.beamType === 'tbeam' ? (pricingRates?.beamTbeamRate || 950) : (pricingRates?.beamFlatRate || 500);
        const settings = {
            ...(proj.settings || { beamSpacing: 0.55, blockWidth: 0.2, wastagePercentage: 10, propSpacing: 1.2, concreteThickness: 0.05 }),
            blockCommissionRate: 5
        };
        const reCalculatedRooms = proj.rooms?.map((r: any) => {
            const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, BEAM_PRICE_PER_METER, r.name);
            return { ...r, roomCalcs };
        }) || [];
        const totalBlocks = reCalculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.totalBlocks || 0), 0);
        generatePromaxPdf({
            clientInfo: { projectName: getProjectName(proj), projectLocation: getProjectLocation(proj) },
            totals: { totalBlocks },
            perRoomCalculations: reCalculatedRooms
        });
    };

    const filteredProjects = useMemo(() => {
        return (projects || []).filter((p: any) => {
            const name = getProjectName(p).toLowerCase();
            const client = (p.clientName || '').toLowerCase();
            const loc = getProjectLocation(p).toLowerCase();
            const q = searchQuery.toLowerCase();
            const matchesSearch = name.includes(q) || client.includes(q) || loc.includes(q);
            if (!matchesSearch) return false;
            const pStatus = p.status || 'pending';
            if (projectStatusFilter === 'all') return true;
            return pStatus === projectStatusFilter;
        }).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [projects, searchQuery, projectStatusFilter]);

    const handleDeleteProject = async () => {
        if (!deletingProject) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, 'projects', deletingProject.id));
            toast({ title: 'Project Deleted', description: 'Project removed successfully.' });
            setDeletingProject(null);
        } catch (err) {
            toast({ title: 'Error', description: 'Could not delete project.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportProfitReport = () => {
        if (!projects || projects.length === 0) { toast({ title: 'No Data', description: 'No projects to export.' }); return; }
        let csv = 'data:text/csv;charset=utf-8,Project Name,Client Name,Location,Status,Profit (KSh),Created At\n';
        projects.forEach((p: any) => {
            csv += `"${getProjectName(p).replace(/"/g, '""')}","${(p.clientName || 'N/A').replace(/"/g, '""')}","${getProjectLocation(p).replace(/"/g, '""')}",${p.status || 'pending'},${p.profit || 0},${p.createdAt?.seconds ? format(new Date(p.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : 'N/A'}\n`;
        });
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', `sila_profit_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        toast({ title: 'Exported', description: 'CSV profit report downloaded.' });
    };

    const handleDownloadQuotesCSV = () => {
        if (!invoices || invoices.length === 0) { toast({ title: 'No Quotes', description: 'No quotes to export.' }); return; }
        let csv = 'data:text/csv;charset=utf-8,Invoice #,Client Name,Project Name,Grand Total (KSh),Date\n';
        invoices.forEach((inv: any) => {
            csv += `"${(inv.invoiceNumber || '').replace(/"/g, '""')}","${(inv.clientName || 'N/A').replace(/"/g, '""')}","${(inv.projectName || 'N/A').replace(/"/g, '""')}",${inv.grandTotal || 0},${inv.createdAt?.seconds ? format(new Date(inv.createdAt.seconds * 1000), 'yyyy-MM-dd') : 'N/A'}\n`;
        });
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', `sila_quotes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        toast({ title: 'Exported', description: 'Quotes CSV downloaded.' });
    };

    const analytics = useMemo(() => {
        const all = projects || [];
        const running = all.filter((p: any) => (p.status || 'pending') === 'running').length;
        const expected = all.filter((p: any) => (p.status || 'pending') === 'expected').length;
        const pending = all.filter((p: any) => (p.status || 'pending') === 'pending').length;
        const finished = all.filter((p: any) => (p.status || 'pending') === 'finished').length;
        const totalRevenue = (invoices || []).reduce((sum: number, inv: any) => sum + (inv.grandTotal || 0), 0);
        const invList = invoices || [];
        const avgProjectValue = invList.length > 0 ? totalRevenue / invList.length : 0;
        return { running, expected, pending, finished, totalRevenue, avgProjectValue, totalProjects: all.length };
    }, [projects, invoices]);

    if (projectsLoading || invoicesLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-[#095388] mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">Loading admin dashboard…</p>
                </div>
            </div>
        );
    }

    const renderOverview = () => (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">Operations Overview</h1>
                <p className="text-slate-500 text-sm mt-1">SI-LATECH operations, project statistics, and financial health.</p>
            </div>

            {/* Stat Cards with Solid Colored Backgrounds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Total Revenue Card - Solid Emerald */}
                <Card className="bg-emerald-600 text-white border-0 rounded-2xl shadow-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-100 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><TrendingUp size={15} className="text-emerald-200" /> Total Revenue</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-white tabular-nums mt-1.5">
                            KSh {analytics.totalRevenue.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-emerald-100/90 font-medium">Combined value of all saved quotes</p>
                    </CardContent>
                </Card>

                {/* Saved Projects Card - Solid Blue */}
                <Card className="bg-blue-600 text-white border-0 rounded-2xl shadow-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-100 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Layers size={15} className="text-blue-200" /> Saved Projects</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-white tabular-nums mt-1.5">
                            {analytics.totalProjects}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-blue-100/90 font-medium">{analytics.running} running · {analytics.pending} pending · {analytics.finished} finished</p>
                    </CardContent>
                </Card>

                {/* Historical Quotes Card - Solid Purple */}
                <Card className="bg-purple-600 text-white border-0 rounded-2xl shadow-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-purple-100 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><History size={15} className="text-purple-200" /> Historical Quotes</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-white tabular-nums mt-1.5">
                            {invoices?.length || 0}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-purple-100/90 font-medium">Avg value: KSh {Math.round(analytics.avgProjectValue).toLocaleString()}</p>
                    </CardContent>
                </Card>

                {/* Active Session Profit Card - Solid Amber */}
                <Card className="bg-amber-500 text-slate-950 border-0 rounded-2xl shadow-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-amber-950 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Activity size={15} className="text-amber-950" /> Active Session Profit</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-slate-950 tabular-nums mt-1.5">
                            KSh {currentTotals.totalProjectProfit.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-amber-950/80 font-bold">Live calculator state profit</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Panel */}
            <Card className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#095388]" /> Management Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    <Button onClick={handleExportProfitReport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-sm w-full">
                        <Download size={14} /> Export Profit Report
                    </Button>
                    <Button onClick={handleDownloadQuotesCSV} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-sm w-full">
                        <FileSpreadsheet size={14} /> Export Quotes CSV
                    </Button>
                    <Button onClick={() => setActiveSection('projects')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-sm w-full">
                        <Layers size={14} /> Manage Projects
                    </Button>
                    <Button onClick={() => setActiveSection('finances')} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 rounded-xl gap-2 shadow-sm w-full">
                        <DollarSign size={14} /> Financial Tracking
                    </Button>
                </div>
            </Card>

            {/* Status Breakdown Cards */}
            <div>
                <h2 className="text-base font-bold text-slate-900 mb-3">Project Status Distribution</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { label: 'Running Projects', value: analytics.running, color: 'bg-blue-600 text-white border-0' },
                        { label: 'Expected (Deposit)', value: analytics.expected, color: 'bg-purple-600 text-white border-0' },
                        { label: 'Pending Projects', value: analytics.pending, color: 'bg-amber-500 text-slate-950 border-0' },
                        { label: 'Finished Projects', value: analytics.finished, color: 'bg-emerald-600 text-white border-0' },
                    ].map(item => (
                        <div key={item.label} className={`rounded-2xl border p-4 sm:p-5 text-center shadow-sm ${item.color}`}>
                            <p className="text-2xl sm:text-3xl font-black">{item.value}</p>
                            <p className="text-xs font-bold mt-1 uppercase tracking-wider">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderProjects = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">Projects</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and edit all client construction project records.</p>
                </div>
                <Button
                    onClick={() => { setAdminEditorProject(null); setIsAdminEditorOpen(true); }}
                    className="bg-[#095388] hover:bg-[#07426c] text-white font-bold text-xs h-10 px-4 rounded-xl gap-2 shadow-sm shrink-0"
                >
                    <Plus size={15} /> New Project &amp; Quote
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-2xs">
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                    {['running', 'expected', 'pending', 'finished', 'all'].map(s => (
                        <button
                            key={s}
                            onClick={() => setProjectStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                projectStatusFilter === s
                                    ? s === 'running' ? 'bg-blue-600 text-white shadow-2xs'
                                    : s === 'expected' ? 'bg-purple-600 text-white shadow-2xs'
                                    : s === 'pending' ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                    : s === 'finished' ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-800 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {s === 'all' ? `All (${projects?.length || 0})` : s === 'expected' ? 'Expected' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search projects by name, client, location…"
                        className="pl-9 pr-8 text-xs h-9 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Projects list grouped by date */}
            <div className="space-y-8">
                {(() => {
                    const groups: Record<string, any[]> = { 'Today': [], 'Yesterday': [], 'This Week': [], 'Earlier': [] };
                    const visible = filteredProjects.slice(0, displayLimit);
                    visible.forEach((proj: any) => {
                        let label = 'Earlier';
                        if (proj.createdAt?.seconds) {
                            const d = new Date(proj.createdAt.seconds * 1000);
                            if (isToday(d)) label = 'Today';
                            else if (isYesterday(d)) label = 'Yesterday';
                            else if (isThisWeek(d, { weekStartsOn: 1 })) label = 'This Week';
                        }
                        groups[label].push(proj);
                    });

                    if (filteredProjects.length === 0) {
                        return (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                                <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-slate-600">No projects found</p>
                                <p className="text-xs text-slate-400 mt-1">Try adjusting your status filter or search query.</p>
                            </div>
                        );
                    }

                    return (
                        <>
                            {Object.entries(groups).filter(([, list]) => list.length > 0).map(([label, groupProjects]) => (
                                <div key={label} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                            {label}
                                        </h3>
                                        <div className="h-px flex-grow bg-slate-200" />
                                        <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {groupProjects.length} {groupProjects.length === 1 ? 'project' : 'projects'}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {groupProjects.map((proj: any) => {
                                            const status = proj.status || 'pending';
                                            const name = getProjectName(proj);
                                            const location = getProjectLocation(proj);
                                            
                                            // Full solid status-based card colors
                                            const cardBg = status === 'running'
                                                ? 'bg-blue-600 text-white border-0 hover:bg-blue-700'
                                                : status === 'expected'
                                                ? 'bg-purple-600 text-white border-0 hover:bg-purple-700'
                                                : status === 'finished'
                                                ? 'bg-emerald-600 text-white border-0 hover:bg-emerald-700'
                                                : 'bg-amber-500 text-slate-950 border-0 hover:bg-amber-600';

                                            const isAmber = status === 'pending';

                                            return (
                                                <Card key={proj.id} className={`group ${cardBg} shadow-sm hover:shadow-lg transition-all rounded-2xl overflow-hidden flex flex-col justify-between`}>
                                                    <div>
                                                        <CardHeader className={`border-b ${isAmber ? 'border-amber-600/30 bg-amber-600/10' : 'border-white/10 bg-white/10'} p-4`}>
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="space-y-0.5 min-w-0">
                                                                    <CardTitle className={`text-base font-black truncate ${isAmber ? 'text-slate-950' : 'text-white'}`}>
                                                                        {name}
                                                                    </CardTitle>
                                                                    <CardDescription className={`text-xs truncate ${isAmber ? 'text-slate-900/80 font-semibold' : 'text-white/80'}`}>
                                                                        {proj.clientName || 'No client name'}
                                                                    </CardDescription>
                                                                </div>
                                                                <Badge className={
                                                                    isAmber
                                                                        ? 'bg-slate-950 text-white border-0 text-[10px] font-bold shrink-0'
                                                                        : 'bg-white text-slate-900 border-0 text-[10px] font-bold shrink-0'
                                                                }>
                                                                    {status === 'expected' ? 'EXPECTED' : status.toUpperCase()}
                                                                </Badge>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-4 space-y-2.5">
                                                            <div className={`flex items-center gap-2 text-xs font-semibold ${isAmber ? 'text-slate-950' : 'text-white/90'}`}>
                                                                <MapPin size={14} className="shrink-0 opacity-80" />
                                                                <span className="truncate">{location}</span>
                                                            </div>
                                                            <div className={`flex items-center gap-2 text-xs font-semibold ${isAmber ? 'text-slate-950' : 'text-white/90'}`}>
                                                                <Layers size={14} className="shrink-0 opacity-80" />
                                                                <span>{proj.rooms?.length || 0} Rooms / Slab Areas</span>
                                                            </div>
                                                            {proj.planData?.imageUri && (
                                                                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg w-fit ${isAmber ? 'bg-slate-950/10 text-slate-950 border border-slate-950/20' : 'bg-white/20 text-white border border-white/20'}`}>
                                                                    <Sparkles size={13} />
                                                                    <span>AI Floor Plan Attached</span>
                                                                </div>
                                                            )}
                                                            <div className={`flex items-center gap-2 text-xs font-semibold ${isAmber ? 'text-slate-950/80' : 'text-white/80'}`}>
                                                                <Calendar size={13} className="shrink-0" />
                                                                <span>
                                                                    {proj.createdAt?.seconds
                                                                        ? (isToday(new Date(proj.createdAt.seconds * 1000))
                                                                            ? `Today, ${format(new Date(proj.createdAt.seconds * 1000), 'h:mm a')}`
                                                                            : isYesterday(new Date(proj.createdAt.seconds * 1000))
                                                                                ? `Yesterday, ${format(new Date(proj.createdAt.seconds * 1000), 'h:mm a')}`
                                                                                : format(new Date(proj.createdAt.seconds * 1000), 'MMM d, yyyy'))
                                                                        : 'Date N/A'}
                                                                </span>
                                                            </div>
                                                        </CardContent>
                                                    </div>

                                                    {/* Card footer — 3 primary actions + overflow dropdown */}
                                                    <CardFooter className="bg-slate-50/60 border-t p-3 flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 bg-white hover:bg-slate-100 font-bold text-[11px] h-8 text-slate-700 border-slate-200"
                                                            onClick={() => setSelectedProject(proj)}
                                                            title="View Details"
                                                        >
                                                            <Eye size={12} className="mr-1 text-slate-500" /> View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 font-bold text-[11px] h-8"
                                                            onClick={() => { setAdminEditorProject(proj); setIsAdminEditorOpen(true); }}
                                                            title="Edit Rooms, Bargain & AI Plan Reader"
                                                        >
                                                            <Edit size={12} className="mr-1 text-sky-600" /> Edit
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-bold h-8 w-8 p-0"
                                                                    title="More actions"
                                                                >
                                                                    <MoreVertical size={14} />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200">
                                                                <DropdownMenuItem
                                                                    className="text-xs cursor-pointer hover:bg-slate-50 font-medium"
                                                                    onClick={() => handleDownloadPromax(proj)}
                                                                >
                                                                    <Download size={13} className="mr-2 text-slate-500" /> Promax Order
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-xs cursor-pointer text-red-600 hover:bg-red-50 font-medium"
                                                                    onClick={() => setDeletingProject(proj)}
                                                                >
                                                                    <Trash2 size={13} className="mr-2" /> Delete Project
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </CardFooter>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {filteredProjects.length > displayLimit && (
                                <div className="flex flex-col items-center gap-2 pt-4">
                                    <p className="text-xs text-slate-500">
                                        Showing {Math.min(displayLimit, filteredProjects.length)} of {filteredProjects.length} projects
                                    </p>
                                    <div className="flex gap-3">
                                        <Button onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)} className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 px-5 rounded-xl">
                                            Load More ({filteredProjects.length - displayLimit} remaining)
                                        </Button>
                                        <Button variant="outline" onClick={() => setDisplayLimit(filteredProjects.length)} className="border-slate-300 text-slate-700 font-semibold text-xs h-9 px-4 rounded-xl">
                                            Show All ({filteredProjects.length})
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );

    const renderQuotes = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">Quote History</h1>
                    <p className="text-slate-500 text-sm mt-1">All client quote invoices generated from the calculator.</p>
                </div>
                <Button onClick={handleDownloadQuotesCSV} variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 px-4 rounded-xl gap-2 shadow-2xs">
                    <Download size={13} /> Export CSV
                </Button>
            </div>
            <Card className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Date</TableHead>
                                <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Quote #</TableHead>
                                <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Client</TableHead>
                                <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Project</TableHead>
                                <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right text-slate-500">Amount (KSh)</TableHead>
                                <TableHead className="uppercase text-[10px] font-bold tracking-wider text-center text-slate-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!invoices || invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-slate-400 italic">No historical quotes found.</TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((inv: any) => (
                                    <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors border-b">
                                        <TableCell className="text-xs text-slate-600">
                                            {inv.createdAt?.seconds ? format(new Date(inv.createdAt.seconds * 1000), 'dd MMM yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-slate-500">{inv.invoiceNumber}</TableCell>
                                        <TableCell className="font-bold text-slate-900">{inv.clientName || 'N/A'}</TableCell>
                                        <TableCell className="text-xs text-slate-600">{inv.projectName || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-black text-[#095388] tabular-nums">
                                            KSh {inv.grandTotal?.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-400 hover:text-primary h-8 w-8 p-0"
                                                    onClick={() => handleDownloadSavedQuote(inv)}
                                                    title="Download PDF"
                                                >
                                                    <Download size={15} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold text-[11px] h-8 px-2"
                                                    onClick={() => { setAdminEditorProject(inv); setIsAdminEditorOpen(true); }}
                                                    title="Edit Bargain & Payment Methods"
                                                >
                                                    Edit / Bargain
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );

    const renderSection = () => {
        switch (activeSection) {
            case 'overview': return renderOverview();
            case 'projects': return renderProjects();
            case 'quotes': return renderQuotes();
            case 'finances': return <FinanceManagement isSuperAdmin={isSuperAdmin} />;
            case 'investments': return <InvestorManagement />;
            case 'portfolio': return <PortfolioManagement />;
            case 'team': return isSuperAdmin ? <StaffManagement /> : null;
            default: return null;
        }
    };

    return (
        <>
            <AdminSidebar
                activeSection={activeSection}
                onSectionChange={(s) => { setActiveSection(s); setDisplayLimit(PAGE_SIZE); }}
                isSuperAdmin={isSuperAdmin}
                adminName={adminName}
                onLogout={handleLogout}
                onManageRates={() => setIsPricingModalOpen(true)}
            />

            {/* Main Content Area */}
            <main className="flex-1 min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-10 pt-18 lg:pt-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {renderSection()}
                </div>
            </main>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
                <DialogContent className="w-[92vw] sm:max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
                            <Trash2 size={18} /> Confirm Delete
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-slate-600 py-2">
                        Are you sure you want to delete <strong className="text-slate-900">{getProjectName(deletingProject)}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                        <Button variant="outline" size="sm" onClick={() => setDeletingProject(null)}>Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={handleDeleteProject} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Delete Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Pricing Rates Dialog */}
            <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <SlidersHorizontal className="text-amber-500" size={20} /> Live Rate &amp; Pricing Management
                        </DialogTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Changes saved here sync in real time across all open invoices and active calculator sessions.
                        </CardDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-3 text-xs">
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5 border-b pb-1">
                                <Layers size={14} className="text-primary" /> Beam &amp; Infill Block Unit Rates
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: 'beamTbeamRate', label: 'T-Beam Rate (KSh / meter)', placeholder: '950' },
                                    { key: 'beamFlatRate', label: 'Flat Beam Rate (KSh / meter)', placeholder: '500' },
                                    { key: 'blockTbeamRate', label: 'T-Beam Block Rate (KSh / pcs)', placeholder: '95' },
                                    { key: 'blockFlatRate', label: 'Flat Block Rate (KSh / pcs)', placeholder: '80' },
                                ].map(field => (
                                    <div key={field.key} className="space-y-1.5 bg-slate-50 p-3 rounded-lg border">
                                        <label className="font-semibold text-slate-700 block">{field.label}</label>
                                        <Input
                                            type="number"
                                            value={tempRates[field.key]}
                                            onChange={e => setTempRates((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5 border-b pb-1">
                                <Briefcase size={14} className="text-emerald-600" /> Concrete Materials &amp; Accessories
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: 'cementRate', label: 'Cement Rate (KSh / bag)', placeholder: '800' },
                                    { key: 'sandRate', label: 'Sand Rate (KSh / m³)', placeholder: '3000' },
                                    { key: 'ballastRate', label: 'Ballast Rate (KSh / m³)', placeholder: '3200' },
                                    { key: 'brcRate', label: 'BRC Mesh Rate (KSh / roll)', placeholder: '25000' },
                                ].map(field => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="font-semibold text-slate-700 block">{field.label}</label>
                                        <Input
                                            type="number"
                                            value={tempRates[field.key]}
                                            onChange={e => setTempRates((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                        />
                                    </div>
                                ))}
                                <div className="space-y-1.5 col-span-2">
                                    <label className="font-semibold text-slate-700 block">Prop Hire Rate (KSh / prop)</label>
                                    <Input
                                        type="number"
                                        value={tempRates.propRate}
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, propRate: e.target.value }))}
                                        placeholder="500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsPricingModalOpen(false)}>Cancel</Button>
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" onClick={handleSaveRates}>
                            <Check size={14} className="mr-1.5" /> Save &amp; Sync Live Rates
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Project Details Dialog */}
            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:hidden">
                    {(() => {
                        if (!selectedProject) return null;
                        const BEAM_PRICE_PER_METER = selectedProject.settings?.beamType === 'tbeam' ? (pricingRates?.beamTbeamRate || 950) : (pricingRates?.beamFlatRate || 500);
                        const settings = {
                            ...(selectedProject.settings || { beamSpacing: 0.55, blockWidth: 0.2, wastagePercentage: 10, propSpacing: 1.2, concreteThickness: 0.05 }),
                            blockCommissionRate: 5
                        };
                        const calculatedRooms = selectedProject.rooms?.map((r: any) => {
                            const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, BEAM_PRICE_PER_METER, r.name);
                            return { ...r, roomCalcs };
                        }) || [];
                        const totals = {
                            area: calculatedRooms.reduce((acc: number, r: any) => acc + (r.length * r.width), 0),
                            actualBeams: calculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.actualBeamCount || 0), 0),
                            invoiceBlocks: calculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.totalBlocks || 0), 0),
                            beamProfit: calculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.beamProfitValue || 0), 0),
                            blockCommission: calculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.blockCommission || 0), 0),
                            totalProfit: calculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.totalRoomProfit || 0), 0),
                        };
                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-primary">{getProjectName(selectedProject)}</DialogTitle>
                                    <p className="text-sm text-slate-500">{selectedProject?.clientName || 'No Client'} — {getProjectLocation(selectedProject)}</p>
                                </DialogHeader>
                                <div className="space-y-8 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="bg-slate-50 border-none">
                                            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Technical Breakdown</CardTitle></CardHeader>
                                            <CardContent className="space-y-2">
                                                {[
                                                    ['Total Area', `${totals.area.toFixed(2)} m²`],
                                                    ['Actual Beams Required', `${totals.actualBeams} pcs`],
                                                    ['Standard Blocks (Invoice)', `${totals.invoiceBlocks.toLocaleString()} pcs`],
                                                ].map(([label, val]) => (
                                                    <div key={label} className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-600">{label}:</span>
                                                        <span className="font-bold">{val}</span>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-slate-900 text-white border-none">
                                            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Profit Overview</CardTitle></CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="flex justify-between items-center text-sm"><span className="text-slate-400">Beam Profit:</span><span className="font-bold text-sky-400">KSh {totals.beamProfit.toLocaleString()}</span></div>
                                                <div className="flex justify-between items-center text-sm"><span className="text-slate-400">Block Commission:</span><span className="font-bold text-sky-400">KSh {totals.blockCommission.toLocaleString()}</span></div>
                                                <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between items-center">
                                                    <span className="font-bold">Est. Project Profit:</span>
                                                    <span className="text-xl font-black text-white">KSh {totals.totalProfit.toLocaleString()}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {selectedProject.planData?.imageUri && (
                                        <div className="space-y-2 border border-slate-700 rounded-xl p-4 bg-slate-900 text-white shadow-lg">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-bold text-sky-400 flex items-center gap-2"><ImageIcon size={16} /> Saved Blueprint CAD Plan</h4>
                                                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                                                    {selectedProject.planData.parsedRooms?.length || selectedProject.rooms?.length || 0} Rooms
                                                </span>
                                            </div>
                                            <div className="relative w-full h-[300px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                                                <img src={selectedProject.planData.imageUri} alt="Blueprint" className="max-w-full max-h-full object-contain" />
                                                {selectedProject.planData.parsedRooms && (
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                                                        {selectedProject.planData.parsedRooms.map((r: any, idx: number) => {
                                                            if (!r.boundingBox) return null;
                                                            const [ymin, xmin, ymax, xmax] = r.boundingBox;
                                                            return (
                                                                <g key={idx}>
                                                                    <rect x={xmin} y={ymin} width={xmax - xmin} height={ymax - ymin} fill="rgba(14, 165, 233, 0.18)" stroke="#0ea5e9" strokeWidth={2} rx="6" />
                                                                    <foreignObject x={xmin + 4} y={ymin + 4} width={Math.max(90, xmax - xmin - 8)} height="24">
                                                                        <div className="bg-sky-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded truncate w-fit shadow-sm">
                                                                            {idx + 1}. {r.name}
                                                                        </div>
                                                                    </foreignObject>
                                                                </g>
                                                            );
                                                        })}
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Layers size={18} className="text-primary" /> Room Breakdown</h3>
                                        <div className="space-y-2">
                                            {calculatedRooms.map((room: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                                    <div>
                                                        <p className="font-bold text-slate-900">{room.name}</p>
                                                        <p className="text-xs text-slate-500">{room.length}m × {room.width}m — {(room.length * room.width).toFixed(2)} m²</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-primary">{room.roomCalcs?.invoiceBeamCount} Beams (Invoiced)</p>
                                                        <p className="text-[10px] text-slate-400">{room.roomCalcs?.actualBeamCount} Actual Beams</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <Button className="bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 col-span-2 shadow-md" onClick={() => { router.push(`/project/${selectedProject.id}`); setSelectedProject(null); }}>
                                            <Edit className="mr-2 h-4 w-4" /> Open &amp; Re-Edit in Calculator
                                        </Button>
                                        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11" onClick={() => handleDownloadPromax(selectedProject)}>
                                            <Download className="mr-2 h-4 w-4" /> Manufacturing Order
                                        </Button>
                                        <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold h-11" onClick={() => generateMaterialSchedulePdf({ clientInfo: { projectName: getProjectName(selectedProject), projectLocation: getProjectLocation(selectedProject), clientName: selectedProject.clientName || 'N/A' }, rooms: selectedProject.rooms || [], settings: selectedProject.settings || { beamSpacing: 0.55, blockWidth: 0.2, wastagePercentage: 10 } })}>
                                            <Download className="mr-2 h-4 w-4" /> Material Breakdown
                                        </Button>
                                        <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold h-11" onClick={() => setIsLayoutViewOpen(true)}>
                                            <ImageIcon className="mr-2 h-4 w-4" /> View Layout Diagrams
                                        </Button>
                                        <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-11" onClick={() => generateProfitRequestPdf({ clientInfo: { projectName: getProjectName(selectedProject), projectLocation: getProjectLocation(selectedProject), clientName: selectedProject.clientName || 'N/A' }, totals: { beamProfit: totals.beamProfit, blockCommission: totals.blockCommission, totalProfit: totals.totalProfit, totalBeams: calculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.invoiceTotalBeamLength || 0), 0), totalBlocks: totals.invoiceBlocks } })}>
                                            <FileText className="mr-2 h-4 w-4" /> Profit Request
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Layout Diagrams */}
            <Dialog open={isLayoutViewOpen} onOpenChange={setIsLayoutViewOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print-dialog-content">
                    <DialogHeader className="print:hidden">
                        <DialogTitle className="text-2xl font-black text-slate-900">Technical Layout Diagrams</DialogTitle>
                        <CardDescription>Visual guide for staff and site technicians.</CardDescription>
                    </DialogHeader>
                    <div className="hidden print:block border-b-2 border-slate-955 pb-4 mb-6">
                        <div className="flex justify-between items-start">
                            <div><h1 className="text-2xl font-black text-slate-950 tracking-tight">SI-LATECH</h1><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prestressed Beams &amp; Concrete Blocks</p></div>
                            <div className="text-right"><p className="text-xs font-bold text-slate-900">TECHNICAL LAYOUT SHEET</p><p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-GB')}</p></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible print:h-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 print:grid-cols-1 print:gap-12 print:py-0">
                            {selectedProject?.rooms?.map((r: any, idx: number) => {
                                const BEAM_PRICE_PER_METER = selectedProject.settings?.beamType === 'tbeam' ? (pricingRates?.beamTbeamRate || 950) : (pricingRates?.beamFlatRate || 500);
                                const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, selectedProject.settings || { beamSpacing: 0.55, blockWidth: 0.2, wastagePercentage: 10 }, BEAM_PRICE_PER_METER, r.name);
                                return <RoomLayoutVisualizer key={idx} calc={roomCalcs} roomName={r.name} showInternal={true} />;
                            })}
                        </div>
                    </div>
                    <CardFooter className="flex justify-between border-t pt-4 print:hidden">
                        <p className="text-xs text-slate-400 italic">SI-LATECH Internal Staff Document</p>
                        <Button onClick={() => window.print()} className="bg-primary font-bold"><Download size={16} className="mr-2" /> Print for Site Technician</Button>
                    </CardFooter>
                </DialogContent>
            </Dialog>

            {/* Admin Full Project & Quote Editor Modal */}
            <AdminProjectEditorModal
                open={isAdminEditorOpen}
                onOpenChange={setIsAdminEditorOpen}
                project={adminEditorProject}
                staffList={staffList || []}
                pricingRates={pricingRates}
            />
        </>
    );
}
