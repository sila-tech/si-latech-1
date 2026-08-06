'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, addDoc, serverTimestamp, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
    ArrowRight,
    Download,
    Activity,
    MapPin,
    Image as ImageIcon,
    UserCheck,
    Edit,
    Trash2,
    Eye,
    X,
    BarChart3,
    FileSpreadsheet,
    PieChart,
    Plus,
    Check,
    SlidersHorizontal,
    DollarSign
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useCalculator } from '@/context/calculator-context';
import { generateQuotePdf, generatePromaxPdf, generateProfitRequestPdf, generateMaterialSchedulePdf } from '@/lib/pdf-utils';
import { calcRoomBlocksAndBeams } from '@/lib/calculator';
import Link from 'next/link';
import { RoomLayoutVisualizer } from '@/components/silacalc/room-layout-visualizer';
import { StaffManagement } from '@/components/admin/staff-management';
import { FinanceManagement } from '@/components/admin/finance-management';
import { InvestorManagement } from '@/components/admin/investor-management';
import { PortfolioManagement } from '@/components/admin/portfolio-management';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AdminProjectEditorModal } from '@/components/admin/admin-project-editor-modal';

export default function AdminDashboardPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [projectTab, setProjectTab] = useState('running');
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isLayoutViewOpen, setIsLayoutViewOpen] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    
    // Edit project state
    const [editingProject, setEditingProject] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editClientName, setEditClientName] = useState('');
    const [editStatus, setEditStatus] = useState('pending');
    const [editAssignedTo, setEditAssignedTo] = useState('unassigned');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Admin Full Project & Quote Editor Modal State
    const [isAdminEditorOpen, setIsAdminEditorOpen] = useState(false);
    const [adminEditorProject, setAdminEditorProject] = useState<any>(null);

    // Delete confirmation state
    const [deletingProject, setDeletingProject] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Analytics modal state
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    // Pricing Management State
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    // Pagination state
    const PAGE_SIZE = 12;
    const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);

    const router = useRouter();
    const { totals: currentTotals, pricingRates, updatePricingRates } = useCalculator();
    const { toast } = useToast();

    const [tempRates, setTempRates] = useState<any>({
        beamFlatRate: 520,
        beamTbeamRate: 1100,
        blockFlatRate: 85,
        blockTbeamRate: 100,
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
            beamFlatRate: Number(tempRates.beamFlatRate) || 520,
            beamTbeamRate: Number(tempRates.beamTbeamRate) || 1100,
            blockFlatRate: Number(tempRates.blockFlatRate) || 85,
            blockTbeamRate: Number(tempRates.blockTbeamRate) || 100,
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
        if (storedAuth === btoa('Sila4927')) {
            setIsSuperAdmin(true);
        } else if (storedAuth) {
            try {
                const parsed = JSON.parse(storedAuth);
                if (parsed.role === 'admin') {
                    setIsSuperAdmin(false);
                } else {
                    router.push('/admin/login');
                }
            } catch {
                router.push('/admin/login');
            }
        } else {
            router.push('/admin/login');
        }
    }, [router]);

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

    // Fallback data helper functions
    const getProjectName = (proj: any) => {
        const raw = proj?.name?.trim();
        if (!raw || raw.toLowerCase() === 'na' || raw.toLowerCase() === 'n/a') {
            return 'Unnamed project';
        }
        return raw;
    };

    const getProjectLocation = (proj: any) => {
        const raw = (proj?.projectLocation || proj?.location)?.trim();
        if (!raw || raw.toLowerCase() === 'na' || raw.toLowerCase() === 'n/a') {
            return 'Location not specified';
        }
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
        const BEAM_PRICE_PER_METER = proj.settings?.beamType === 'tbeam' ? (pricingRates?.beamTbeamRate || 1100) : (pricingRates?.beamFlatRate || 520);
        const settings = {
            ...(proj.settings || {
                beamSpacing: 0.55,
                blockWidth: 0.2,
                wastagePercentage: 10,
                propSpacing: 1.2,
                concreteThickness: 0.05
            }),
            blockCommissionRate: 5
        };

        const reCalculatedRooms = proj.rooms?.map((r: any) => {
            const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, BEAM_PRICE_PER_METER, r.name);
            return {
                ...r,
                roomCalcs
            };
        }) || [];

        const totalBlocks = reCalculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.totalBlocks || 0), 0);

        generatePromaxPdf({
            clientInfo: {
                projectName: getProjectName(proj),
                projectLocation: getProjectLocation(proj)
            },
            totals: {
                totalBlocks
            },
            perRoomCalculations: reCalculatedRooms
        });
    };

    const filteredProjects = useMemo(() => {
        return (projects || []).filter(p => {
            const name = getProjectName(p).toLowerCase();
            const client = (p.clientName || '').toLowerCase();
            const loc = getProjectLocation(p).toLowerCase();
            const q = searchQuery.toLowerCase();

            const matchesSearch = name.includes(q) || client.includes(q) || loc.includes(q);
            if (!matchesSearch) return false;
            
            const pStatus = p.status || 'pending';
            if (projectTab === 'all') return true;
            return pStatus === projectTab;
        }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [projects, searchQuery, projectTab]);

    const handleAssignStaff = async (projectId: string, staffUsername: string) => {
        try {
            await updateDoc(doc(firestore, 'projects', projectId), { assignedTo: staffUsername });
            toast({ title: 'Success', description: 'Project assigned to staff.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not assign staff.', variant: 'destructive' });
        }
    };

    const handleUpdateProjectStatus = async (projectId: string, status: string) => {
        try {
            await updateDoc(doc(firestore, 'projects', projectId), { status });
            
            const project = projects?.find((p: any) => p.id === projectId);
            
            if (status === 'running') {
                if (project && project.profit) {
                    await addDoc(collection(firestore, 'finances'), {
                        type: 'income',
                        amount: project.profit,
                        reason: `Project Income: ${project.clientName || getProjectName(project)}`,
                        projectId: projectId,
                        requestedBy: 'System',
                        status: 'approved',
                        createdAt: serverTimestamp()
                    });
                }
            } else if (status === 'pending') {
                if (project) {
                    let finQuery = query(collection(firestore, 'finances'), where('projectId', '==', projectId));
                    let snapshot = await getDocs(finQuery);
                    
                    if (snapshot.empty) {
                        finQuery = query(
                            collection(firestore, 'finances'), 
                            where('reason', '==', `Project Income: ${project.clientName || getProjectName(project)}`),
                            where('type', '==', 'income')
                        );
                        snapshot = await getDocs(finQuery);
                    }

                    for (const d of snapshot.docs) {
                        await deleteDoc(doc(firestore, 'finances', d.id));
                    }
                }
            }

            toast({ title: 'Success', description: `Project status updated to ${status}.` });
        } catch (error) {
            console.error("Error updating project status:", error);
            toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
        }
    };

    const openEditModal = (proj: any) => {
        setEditingProject(proj);
        setEditName(proj.name || '');
        setEditLocation(proj.projectLocation || proj.location || '');
        setEditClientName(proj.clientName || '');
        setEditStatus(proj.status || 'pending');
        setEditAssignedTo(proj.assignedTo || 'unassigned');
    };

    const handleSaveProjectEdit = async () => {
        if (!editingProject) return;
        if (!editName.trim() || !editLocation.trim()) {
            toast({ title: 'Validation Error', description: 'Project Name and Location are required.', variant: 'destructive' });
            return;
        }
        setIsSavingEdit(true);
        try {
            await updateDoc(doc(firestore, 'projects', editingProject.id), {
                name: editName.trim(),
                projectLocation: editLocation.trim(),
                clientName: editClientName.trim(),
                assignedTo: editAssignedTo === 'unassigned' ? '' : editAssignedTo
            });
            if (editStatus !== editingProject.status) {
                await handleUpdateProjectStatus(editingProject.id, editStatus);
            } else {
                toast({ title: 'Success', description: 'Project details updated.' });
            }
            setEditingProject(null);
        } catch (err) {
            toast({ title: 'Error', description: 'Could not update project.', variant: 'destructive' });
        } finally {
            setIsSavingEdit(false);
        }
    };

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

    // Quick Actions Handlers
    const handleExportProfitReport = () => {
        if (!projects || projects.length === 0) {
            toast({ title: "No Data", description: "No projects found to export." });
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Project Name,Client Name,Location,Status,Profit (KSh),Created At\n";
        projects.forEach((p: any) => {
            const pName = `"${getProjectName(p).replace(/"/g, '""')}"`;
            const cName = `"${(p.clientName || 'N/A').replace(/"/g, '""')}"`;
            const loc = `"${getProjectLocation(p).replace(/"/g, '""')}"`;
            const status = p.status || 'pending';
            const profit = p.profit || 0;
            const dateStr = p.createdAt?.seconds ? format(new Date(p.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : 'N/A';
            csvContent += `${pName},${cName},${loc},${status},${profit},${dateStr}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sila_profit_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Profit Report Exported", description: "Downloaded CSV profit report for all projects." });
    };

    const handleDownloadQuotesCSV = () => {
        if (!invoices || invoices.length === 0) {
            toast({ title: "No Quotes", description: "No quote invoices found to export." });
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Invoice #,Client Name,Project Name,Grand Total (KSh),Date\n";
        invoices.forEach((inv: any) => {
            const invNum = `"${(inv.invoiceNumber || '').replace(/"/g, '""')}"`;
            const cName = `"${(inv.clientName || 'N/A').replace(/"/g, '""')}"`;
            const pName = `"${(inv.projectName || 'N/A').replace(/"/g, '""')}"`;
            const total = inv.grandTotal || 0;
            const dateStr = inv.createdAt?.seconds ? format(new Date(inv.createdAt.seconds * 1000), 'yyyy-MM-dd') : 'N/A';
            csvContent += `${invNum},${cName},${pName},${total},${dateStr}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sila_quotes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Quotes Exported", description: "Downloaded CSV of all saved quotes." });
    };

    const handleGenerateProjectSummary = () => {
        if (!projects || projects.length === 0) {
            toast({ title: "No Projects", description: "There are no projects to generate a summary for." });
            return;
        }
        const runningCount = projects.filter((p: any) => (p.status || 'pending') === 'running').length;
        const pendingCount = projects.filter((p: any) => (p.status || 'pending') === 'pending').length;
        const finishedCount = projects.filter((p: any) => (p.status || 'pending') === 'finished').length;
        
        let summaryText = `SI-LATECH PROJECT SUMMARY REPORT\nGenerated: ${new Date().toLocaleString()}\n\n`;
        summaryText += `Total Saved Projects: ${projects.length}\n`;
        summaryText += `Running: ${runningCount} | Pending: ${pendingCount} | Finished: ${finishedCount}\n\n`;
        summaryText += `--------------------------------------------------\n`;
        projects.forEach((p: any, i: number) => {
            summaryText += `${i + 1}. ${getProjectName(p)} | Location: ${getProjectLocation(p)} | Status: ${(p.status || 'pending').toUpperCase()} | Client: ${p.clientName || 'N/A'}\n`;
        });
        
        const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sila_project_summary_${format(new Date(), 'yyyy-MM-dd')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Summary Report Generated", description: "Downloaded project summary report." });
    };

    if (projectsLoading || invoicesLoading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black font-headline text-primary tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Management overview for SI-LATECH operations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => setIsPricingModalOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 px-4 rounded-xl shadow-md transition-all hover:scale-105"
                    >
                        <SlidersHorizontal size={15} className="mr-1.5" /> Manage Live Rates
                    </Button>
                    <Button asChild variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm font-semibold h-10 rounded-xl">
                        <Link href="/">Go to Calculator</Link>
                    </Button>
                </div>
            </div>

            {/* Top Stats & Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Profit Stat Card */}
                <Card className="border border-slate-200/80 shadow-sm bg-white rounded-xl hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center justify-between text-emerald-600 font-bold text-xs uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><TrendingUp size={16} /> Current Profit</span>
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">↑ 12% vs last mo</span>
                        </CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-600 tabular-nums">
                            KSh {currentTotals.totalProjectProfit.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Active calculation profit</p>
                    </CardContent>
                </Card>

                {/* Projects Stat Card */}
                <Card className="border border-slate-200/80 shadow-sm bg-white rounded-xl hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center justify-between text-blue-600 font-bold text-xs uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><Layers size={16} /> Saved Projects</span>
                            <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full border border-blue-200">↑ 8% vs last mo</span>
                        </CardDescription>
                        <CardTitle className="text-3xl font-black text-blue-600 tabular-nums">
                            {projects?.length || 0}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Database project count</p>
                    </CardContent>
                </Card>

                {/* Quotes Stat Card */}
                <Card className="border border-slate-200/80 shadow-sm bg-white rounded-xl hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center justify-between text-purple-600 font-bold text-xs uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><History size={16} /> Saved Quotes</span>
                            <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full border border-purple-200">↑ 15% vs last mo</span>
                        </CardDescription>
                        <CardTitle className="text-3xl font-black text-purple-600 tabular-nums">
                            {invoices?.length || 0}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Total historical quotes</p>
                    </CardContent>
                </Card>

                {/* Quick Actions Panel */}
                <Card className="border border-slate-200/80 shadow-sm bg-slate-900 text-white rounded-xl flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                            <Activity size={16} className="text-sky-400" /> Quick Actions
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">Reports & System Utilities</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 pt-1">
                        <Button 
                            onClick={handleExportProfitReport}
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-8 px-2"
                        >
                            <Download size={12} className="mr-1" /> Profit Report
                        </Button>
                        <Button 
                            onClick={handleDownloadQuotesCSV}
                            variant="outline" 
                            size="sm" 
                            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold h-8 px-2"
                        >
                            <FileSpreadsheet size={12} className="mr-1 text-purple-400" /> Quotes CSV
                        </Button>
                        <Button 
                            onClick={handleGenerateProjectSummary}
                            variant="outline" 
                            size="sm" 
                            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold h-8 px-2"
                        >
                            <FileText size={12} className="mr-1 text-sky-400" /> Summary
                        </Button>
                        <Button 
                            onClick={() => setIsAnalyticsOpen(true)}
                            variant="outline" 
                            size="sm" 
                            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold h-8 px-2"
                        >
                            <BarChart3 size={12} className="mr-1 text-amber-400" /> Analytics
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs Navigation */}
            <Tabs defaultValue="projects" className="w-full">
                <TabsList className="bg-slate-100/90 p-1 h-12 w-auto inline-flex rounded-xl mb-6 flex-wrap overflow-x-auto justify-start border border-slate-200/80">
                    <TabsTrigger 
                        value="projects" 
                        className="px-5 font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                        Projects
                    </TabsTrigger>
                    <TabsTrigger 
                        value="portfolio" 
                        className="px-5 font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                        Gallery
                    </TabsTrigger>
                    <TabsTrigger 
                        value="invoices" 
                        className="px-5 font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                        Quote History
                    </TabsTrigger>
                    <TabsTrigger 
                        value="finances" 
                        className="px-5 font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                        Finances
                    </TabsTrigger>
                    <TabsTrigger 
                        value="investors" 
                        className="px-5 font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
                    >
                        Investments
                    </TabsTrigger>
                    {isSuperAdmin && (
                        <TabsTrigger 
                            value="staff" 
                            className="px-5 font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
                        >
                            Team
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="portfolio">
                    <PortfolioManagement />
                </TabsContent>

                <TabsContent value="finances">
                    <FinanceManagement isSuperAdmin={isSuperAdmin} />
                </TabsContent>

                <TabsContent value="investors">
                    <InvestorManagement />
                </TabsContent>

                {isSuperAdmin && (
                    <TabsContent value="staff">
                        <StaffManagement />
                    </TabsContent>
                )}

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6">
                    <Tabs value={projectTab} onValueChange={setProjectTab} className="w-full">
                        {/* Consolidated Search & Status Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-50/80 p-2 rounded-xl border border-slate-200/80">
                            <TabsList className="bg-slate-200/60 p-1 rounded-lg">
                                <TabsTrigger value="running" className="px-4 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md">
                                    Running
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="px-4 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm rounded-md">
                                    Pending
                                </TabsTrigger>
                                <TabsTrigger value="finished" className="px-4 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm rounded-md">
                                    Finished
                                </TabsTrigger>
                                <TabsTrigger value="all" className="px-4 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md">
                                    All Projects ({projects?.length || 0})
                                </TabsTrigger>
                            </TabsList>

                            {/* Consolidated Search Bar & New Project Button */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search projects..." 
                                        className="pl-9 pr-8 text-xs h-9 bg-white border-slate-300 rounded-lg shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                                            title="Clear search"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Button 
                                    onClick={() => { setAdminEditorProject(null); setIsAdminEditorOpen(true); }}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-9 px-3 rounded-lg flex items-center gap-1.5 shadow-sm shrink-0"
                                >
                                    <Plus size={14} /> New Quote & AI Plan Reader
                                </Button>
                            </div>
                        </div>
                        
                        {/* Projects Grouped by Date */}
                        <div className="space-y-8">
                        {(() => {
                            const groups: Record<string, any[]> = {
                                'Today': [],
                                'Yesterday': [],
                                'This Week': [],
                                'Earlier': []
                            };
                            
                            const visibleProjects = filteredProjects.slice(0, displayLimit);

                            visibleProjects.forEach(proj => {
                                let dateStr = 'Earlier';
                                if (proj.createdAt?.seconds) {
                                    const date = new Date(proj.createdAt.seconds * 1000);
                                    if (isToday(date)) dateStr = 'Today';
                                    else if (isYesterday(date)) dateStr = 'Yesterday';
                                    else if (isThisWeek(date, { weekStartsOn: 1 })) dateStr = 'This Week';
                                    else dateStr = 'Earlier';
                                }
                                if (!groups[dateStr]) groups[dateStr] = [];
                                groups[dateStr].push(proj);
                            });

                            const activeEntries = Object.entries(groups).filter(([_, list]) => list.length > 0);

                            if (filteredProjects.length === 0) {
                                return (
                                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                                        <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-slate-600">No projects found</p>
                                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filter or search query.</p>
                                    </div>
                                );
                            }

                            return (
                                <>
                                {activeEntries.map(([dateLabel, groupProjects]) => (
                                    <div key={dateLabel} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                                {dateLabel}
                                            </h3>
                                            <div className="h-[1px] flex-grow bg-slate-200/80"></div>
                                            <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                {groupProjects.length} {groupProjects.length === 1 ? 'project' : 'projects'}
                                            </Badge>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {groupProjects.map((proj) => {
                                                const status = proj.status || 'pending';
                                                const name = getProjectName(proj);
                                                const location = getProjectLocation(proj);

                                                return (
                                                    <Card key={proj.id} className="group border border-slate-200/90 shadow-sm hover:shadow-md transition-all bg-white rounded-xl overflow-hidden flex flex-col justify-between">
                                                        <div>
                                                            <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <div className="space-y-1">
                                                                        <CardTitle className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                                                            {name}
                                                                        </CardTitle>
                                                                        <CardDescription className="text-xs text-slate-500 line-clamp-1">
                                                                            {proj.clientName || 'No Client Name'}
                                                                        </CardDescription>
                                                                    </div>
                                                                    
                                                                    {/* Read-Only Status Badge (Requirement 7 & 8) */}
                                                                    <Badge className={
                                                                        status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200 px-2.5 py-1 text-[11px] font-bold rounded-[6px]' :
                                                                        status === 'finished' ? 'bg-green-50 text-green-700 border-green-200 px-2.5 py-1 text-[11px] font-bold rounded-[6px]' :
                                                                        'bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-1 text-[11px] font-bold rounded-[6px]'
                                                                    } variant="outline">
                                                                        {status.toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                            </CardHeader>

                                                            <CardContent className="p-4 space-y-3">
                                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                    <MapPin size={14} className="text-primary shrink-0" />
                                                                    <span className="truncate">{location}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                    <Layers size={14} className="text-primary shrink-0" />
                                                                    <span>{proj.rooms?.length || 0} Rooms / Project Areas</span>
                                                                </div>
                                                                {proj.planData?.imageUri && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-sky-600 font-bold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/80 w-fit">
                                                                        <ImageIcon size={14} className="text-sky-500 shrink-0" />
                                                                        <span>CAD Blueprint Attached</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                    <Calendar size={14} className="text-slate-400 shrink-0" />
                                                                    <span>
                                                                        {proj.createdAt?.seconds 
                                                                            ? (isToday(new Date(proj.createdAt.seconds * 1000))
                                                                                ? `Today, ${format(new Date(proj.createdAt.seconds * 1000), 'h:mm a')}`
                                                                                : isYesterday(new Date(proj.createdAt.seconds * 1000))
                                                                                    ? `Yesterday, ${format(new Date(proj.createdAt.seconds * 1000), 'h:mm a')}`
                                                                                    : format(new Date(proj.createdAt.seconds * 1000), 'MMM d, yyyy'))
                                                                            : 'Date N/A'
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {/* Assigned Staff Info */}
                                                                <div className="flex items-center justify-between pt-2 border-t text-xs">
                                                                    <span className="text-slate-400 flex items-center gap-1.5">
                                                                        <UserCheck size={14} /> Assigned:
                                                                    </span>
                                                                    {proj.assignedTo ? (
                                                                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                                                            {proj.assignedTo}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <CardFooter className="bg-slate-50/70 border-t p-3 grid grid-cols-5 gap-1">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="bg-white hover:bg-slate-100 font-bold text-[11px] h-8 px-1" 
                                                                onClick={() => setSelectedProject(proj)}
                                                                title="View Details & Plan"
                                                            >
                                                                <Eye size={12} className="mr-1 text-slate-600" /> View
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 font-bold text-[11px] h-8 px-1" 
                                                                onClick={() => {
                                                                    setAdminEditorProject(proj);
                                                                    setIsAdminEditorOpen(true);
                                                                }}
                                                                title="Edit Rooms, Bargain & AI Plan Reader"
                                                            >
                                                                <Edit size={12} className="mr-1 text-sky-600" /> Edit Quote
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="bg-white hover:bg-slate-100 font-bold text-[11px] h-8 px-1" 
                                                                onClick={() => openEditModal(proj)}
                                                                title="Edit Info"
                                                            >
                                                                Info
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="bg-white hover:bg-slate-900 hover:text-white font-bold text-[11px] h-8 px-1" 
                                                                onClick={() => handleDownloadPromax(proj)}
                                                                title="Download Promax Manufacturing Order"
                                                            >
                                                                Promax
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-[11px] h-8 px-1" 
                                                                onClick={() => setDeletingProject(proj)}
                                                                title="Delete Project"
                                                            >
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination / Load More Controls (Requirement 10) */}
                                {filteredProjects.length > displayLimit && (
                                    <div className="flex flex-col items-center justify-center pt-6 space-y-2">
                                        <p className="text-xs text-slate-500">
                                            Showing {Math.min(displayLimit, filteredProjects.length)} of {filteredProjects.length} saved projects
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <Button 
                                                onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
                                                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 px-6 rounded-lg"
                                            >
                                                Load More ({filteredProjects.length - displayLimit} remaining)
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                onClick={() => setDisplayLimit(filteredProjects.length)}
                                                className="border-slate-300 text-slate-700 font-semibold text-xs h-9 px-4 rounded-lg"
                                            >
                                                Show All ({filteredProjects.length})
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                </>
                            );
                        })()}
                        </div>
                    </Tabs>
                </TabsContent>

                {/* Quotes Tab */}
                <TabsContent value="invoices" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headline text-slate-900">Recent Quotes</h2>
                    </div>
                    <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Date</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Quote #</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Client</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Project</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right text-slate-500">Amount (KSh)</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-center text-slate-500">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white">
                                {!invoices || invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">
                                            No historical quotes found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((inv) => (
                                        <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors border-b">
                                            <TableCell className="text-sm text-slate-600">
                                                {inv.createdAt?.seconds ? format(new Date(inv.createdAt.seconds * 1000), 'dd MMM yyyy') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-500">
                                                {inv.invoiceNumber}
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900">
                                                {inv.clientName || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {inv.projectName || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right font-black text-primary tabular-nums">
                                                KSh {inv.grandTotal?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center flex items-center justify-center gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-slate-400 hover:text-primary h-8 w-8 p-0"
                                                    onClick={() => handleDownloadSavedQuote(inv)}
                                                    title="Download PDF"
                                                >
                                                    <Download size={16} />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold text-[11px] h-8 px-2"
                                                    onClick={() => {
                                                        setAdminEditorProject(inv);
                                                        setIsAdminEditorOpen(true);
                                                    }}
                                                    title="Edit Bargain & Payment Methods"
                                                >
                                                    Edit / Bargain
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Project Dialog */}
            <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900">Edit Project Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-3 text-xs">
                        <div className="space-y-1.5">
                            <Label htmlFor="editName">Project Name <span className="text-red-500">*</span></Label>
                            <Input 
                                id="editName" 
                                value={editName} 
                                onChange={e => setEditName(e.target.value)} 
                                placeholder="Project Name" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editLocation">Project Location <span className="text-red-500">*</span></Label>
                            <Input 
                                id="editLocation" 
                                value={editLocation} 
                                onChange={e => setEditLocation(e.target.value)} 
                                placeholder="Location" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editClientName">Client Name</Label>
                            <Input 
                                id="editClientName" 
                                value={editClientName} 
                                onChange={e => setEditClientName(e.target.value)} 
                                placeholder="Client Name" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Project Status</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending" className="text-amber-600 font-semibold">Pending</SelectItem>
                                    <SelectItem value="running" className="text-blue-600 font-semibold">Running</SelectItem>
                                    <SelectItem value="finished" className="text-green-600 font-semibold">Finished</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Assigned Staff Member</Label>
                            <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Assign Staff" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned" className="text-slate-400 italic">Unassigned</SelectItem>
                                    {staffList?.map((s: any) => (
                                        <SelectItem key={s.id} value={s.username}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setEditingProject(null)}>Cancel</Button>
                        <Button size="sm" className="bg-primary text-white font-bold" onClick={handleSaveProjectEdit} disabled={isSavingEdit}>
                            {isSavingEdit && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Project Confirmation Dialog */}
            <Dialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
                            <Trash2 size={18} /> Confirm Delete
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-slate-600 py-2">
                        Are you sure you want to delete project <strong className="text-slate-900">{getProjectName(deletingProject)}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDeletingProject(null)}>Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={handleDeleteProject} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Delete Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Analytics Overview Dialog */}
            <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="text-primary" size={20} /> System Operations Analytics
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-slate-50 p-4 rounded-xl border">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Running Projects</p>
                                <p className="text-2xl font-black text-blue-600 mt-1">
                                    {projects?.filter((p: any) => (p.status || 'pending') === 'running').length || 0}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Pending Projects</p>
                                <p className="text-2xl font-black text-amber-600 mt-1">
                                    {projects?.filter((p: any) => (p.status || 'pending') === 'pending').length || 0}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Finished Projects</p>
                                <p className="text-2xl font-black text-green-600 mt-1">
                                    {projects?.filter((p: any) => (p.status || 'pending') === 'finished').length || 0}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                            <h4 className="text-sm font-bold text-sky-400">Total System Revenue Overview</h4>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Total Calculation Profit:</span>
                                <span className="font-bold text-emerald-400">KSh {currentTotals.totalProjectProfit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Total Saved Invoices:</span>
                                <span className="font-bold">{invoices?.length || 0} quotes</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manage Pricing Rates Dialog */}
            <Dialog open={isPricingModalOpen} onOpenChange={setIsPricingModalOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <SlidersHorizontal className="text-amber-500" size={20} /> Live Rate & Pricing Management
                        </DialogTitle>
                        <CardDescription className="text-xs">
                            Changes saved here sync in real time across all open invoices, quotes, and active calculator sessions.
                        </CardDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-3 text-xs">
                        {/* Beams & Infill Blocks Section */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5 border-b pb-1">
                                <Layers size={14} className="text-primary" /> Beam & Infill Block Unit Rates
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border">
                                    <Label htmlFor="beamTbeamRate" className="font-semibold text-slate-700">T-Beam Rate (KSh / meter)</Label>
                                    <Input 
                                        id="beamTbeamRate" 
                                        type="number"
                                        value={tempRates.beamTbeamRate} 
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, beamTbeamRate: e.target.value }))} 
                                        placeholder="1100" 
                                    />
                                </div>
                                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border">
                                    <Label htmlFor="beamFlatRate" className="font-semibold text-slate-700">Flat Beam Rate (KSh / meter)</Label>
                                    <Input 
                                        id="beamFlatRate" 
                                        type="number"
                                        value={tempRates.beamFlatRate} 
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, beamFlatRate: e.target.value }))} 
                                        placeholder="520" 
                                    />
                                </div>
                                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border">
                                    <Label htmlFor="blockTbeamRate" className="font-semibold text-slate-700">T-Beam Block Rate (KSh / pcs)</Label>
                                    <Input 
                                        id="blockTbeamRate" 
                                        type="number"
                                        value={tempRates.blockTbeamRate} 
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, blockTbeamRate: e.target.value }))} 
                                        placeholder="100" 
                                    />
                                </div>
                                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border">
                                    <Label htmlFor="blockFlatRate" className="font-semibold text-slate-700">Flat Block Rate (KSh / pcs)</Label>
                                    <Input 
                                        id="blockFlatRate" 
                                        type="number"
                                        value={tempRates.blockFlatRate} 
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, blockFlatRate: e.target.value }))} 
                                        placeholder="85" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Raw Materials & Accessories Section */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5 border-b pb-1">
                                <Briefcase size={14} className="text-emerald-600" /> Concrete Materials & Accessories
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="cementRate" className="font-semibold">Cement Rate (KSh / bag)</Label>
                                    <Input 
                                        id="cementRate" 
                                        type="number"
                                        value={tempRates.cementRate} 
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, cementRate: e.target.value }))} 
                                        placeholder="800" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="sandRate" className="font-semibold">Sand Rate (KSh / m³)</Label>
                                    <Input 
                                        id="sandRate" 
                                        type="number"
                                        value={tempRates.sandRate} 
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, sandRate: e.target.value }))} 
                                        placeholder="3000" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ballastRate" className="font-semibold">Ballast Rate (KSh / m³)</Label>
                                    <Input 
                                        id="ballastRate" 
                                        type="number"
                                        value={tempRates.ballastRate} 
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, ballastRate: e.target.value }))} 
                                        placeholder="3200" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="brcRate" className="font-semibold">BRC Mesh Rate (KSh / roll)</Label>
                                    <Input 
                                        id="brcRate" 
                                        type="number"
                                        value={tempRates.brcRate} 
                                        onChange={e => setTempRates((prev: any) => ({ ...prev, brcRate: e.target.value }))} 
                                        placeholder="25000" 
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <Label htmlFor="propRate" className="font-semibold">Prop Hire Rate (KSh / prop)</Label>
                                    <Input 
                                        id="propRate" 
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
                            <Check size={14} className="mr-1.5" /> Save & Sync Live Rates
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Project Details Dialog */}
            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:hidden">
                    {(() => {
                        if (!selectedProject) return null;
                        
                        const BEAM_PRICE_PER_METER = selectedProject.settings?.beamType === 'tbeam' ? (pricingRates?.beamTbeamRate || 1100) : (pricingRates?.beamFlatRate || 520);
                        const settings = {
                            ...(selectedProject.settings || {
                                beamSpacing: 0.55,
                                blockWidth: 0.2,
                                wastagePercentage: 10,
                                propSpacing: 1.2,
                                concreteThickness: 0.05
                            }),
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
                            totalProfit: calculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.totalRoomProfit || 0), 0)
                        };

                        return (
                            <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-primary">{getProjectName(selectedProject)}</DialogTitle>
                                <p className="text-sm text-muted-foreground">{selectedProject?.clientName || 'No Client'} — {getProjectLocation(selectedProject)}</p>
                            </DialogHeader>
                            
                            <div className="space-y-8 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-slate-50 border-none">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Technical Breakdown</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600">Total Area:</span>
                                                <span className="font-bold">{totals.area.toFixed(2)} m²</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600">Actual Beams Required:</span>
                                                <span className="font-bold">{totals.actualBeams} pcs</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600">Standard Blocks (Invoice):</span>
                                                <span className="font-bold text-primary">{totals.invoiceBlocks.toLocaleString()} pcs</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-slate-900 text-white border-none">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Profit Overview</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Beam Profit:</span>
                                                <span className="font-bold text-sky-400">KSh {totals.beamProfit.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Block Commission:</span>
                                                <span className="font-bold text-sky-400">KSh {totals.blockCommission.toLocaleString()}</span>
                                            </div>
                                            <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between items-center">
                                                <span className="font-bold">Estimated Project Profit:</span>
                                                <span className="text-xl font-black text-white">KSh {totals.totalProfit.toLocaleString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Saved Blueprint CAD Plan & Bounding Boxes */}
                                 {selectedProject.planData?.imageUri && (
                                     <div className="space-y-2 border border-slate-700 rounded-xl p-4 bg-slate-900 text-white shadow-lg">
                                         <div className="flex items-center justify-between">
                                             <h4 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                                                 <ImageIcon size={16} /> Saved Blueprint CAD Plan & AI Overlay
                                             </h4>
                                             <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                                                 {selectedProject.planData.parsedRooms?.length || selectedProject.rooms?.length || 0} Rooms Detected
                                             </span>
                                         </div>
                                         <div className="relative w-full h-[340px] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                                             <img 
                                                 src={selectedProject.planData.imageUri} 
                                                 alt="Saved Blueprint Plan" 
                                                 className="max-w-full max-h-full object-contain pointer-events-none select-none" 
                                             />
                                             {selectedProject.planData.parsedRooms && (
                                                 <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                                                     {selectedProject.planData.parsedRooms.map((r: any, idx: number) => {
                                                         if (!r.boundingBox) return null;
                                                         const [ymin, xmin, ymax, xmax] = r.boundingBox;
                                                         return (
                                                             <g key={idx}>
                                                                 <rect
                                                                     x={xmin}
                                                                     y={ymin}
                                                                     width={xmax - xmin}
                                                                     height={ymax - ymin}
                                                                     fill="rgba(14, 165, 233, 0.18)"
                                                                     stroke="#0ea5e9"
                                                                     strokeWidth={2}
                                                                     rx="6"
                                                                 />
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
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Layers size={18} className="text-primary" />
                                        Room Breakdown
                                    </h3>
                                    <div className="space-y-3">
                                        {calculatedRooms.map((room: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                                <div>
                                                    <p className="font-bold text-slate-900">{room.name}</p>
                                                    <p className="text-xs text-slate-500">{room.length}m x {room.width}m — {(room.length * room.width).toFixed(2)} m²</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-primary">{room.roomCalcs?.invoiceBeamCount} Beams (Invoiced)</p>
                                                    <p className="text-[10px] text-slate-400">{room.roomCalcs?.actualBeamCount} Beams</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                                     <Button 
                                         className="bg-sky-600 hover:bg-sky-700 text-white font-bold h-12 col-span-1 sm:col-span-2 shadow-md text-base" 
                                         onClick={() => {
                                             router.push(`/project/${selectedProject.id}`);
                                             setSelectedProject(null);
                                         }}
                                     >
                                         <Edit className="mr-2 h-5 w-5" /> Open & Re-Edit in Calculator
                                     </Button>
                                    <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-12" onClick={() => handleDownloadPromax(selectedProject)}>
                                        <Download className="mr-2 h-5 w-5" /> Manufacturing Order
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="border-primary text-primary hover:bg-primary/5 font-bold h-12"
                                        onClick={() => generateMaterialSchedulePdf({
                                            clientInfo: {
                                                projectName: getProjectName(selectedProject),
                                                projectLocation: getProjectLocation(selectedProject),
                                                clientName: selectedProject.clientName || 'N/A'
                                            },
                                            rooms: selectedProject.rooms || [],
                                            settings: selectedProject.settings || { beamSpacing: 0.55, blockWidth: 0.2, wastagePercentage: 10 }
                                        })}
                                    >
                                        <Download className="mr-2 h-5 w-5" /> Material Breakdown
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="border-primary text-primary hover:bg-primary/5 font-bold h-12"
                                        onClick={() => setIsLayoutViewOpen(true)}
                                    >
                                        <ImageIcon className="mr-2 h-5 w-5" /> View Layout Diagrams
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-12"
                                        onClick={() => generateProfitRequestPdf({
                                            clientInfo: {
                                                projectName: getProjectName(selectedProject),
                                                projectLocation: getProjectLocation(selectedProject),
                                                clientName: selectedProject.clientName || 'N/A'
                                            },
                                            totals: {
                                                beamProfit: totals.beamProfit,
                                                blockCommission: totals.blockCommission,
                                                totalProfit: totals.totalProfit,
                                                totalBeams: calculatedRooms.reduce((acc: number, r: any) => acc + (r.roomCalcs?.invoiceTotalBeamLength || 0), 0),
                                                totalBlocks: totals.invoiceBlocks
                                            }
                                        })}
                                    >
                                        <FileText className="mr-2 h-5 w-5" /> Profit Request
                                    </Button>
                                </div>
                            </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Layout Diagrams Dialog for Admin/Staff */}
            <Dialog open={isLayoutViewOpen} onOpenChange={setIsLayoutViewOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print-dialog-content">
                    <DialogHeader className="print:hidden">
                        <DialogTitle className="text-2xl font-black text-slate-900">Technical Layout Diagrams</DialogTitle>
                        <CardDescription>Visual guide for staff and site technicians.</CardDescription>
                    </DialogHeader>
                    
                    <div className="hidden print:block border-b-2 border-slate-955 pb-4 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-black text-slate-950 tracking-tight">SI-LATECH</h1>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prestressed Beams & Concrete Blocks</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-900">TECHNICAL LAYOUT SHEET</p>
                                <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-GB')}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 text-xs">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Project Name</span>
                                <strong className="text-slate-900 font-bold">{getProjectName(selectedProject)}</strong>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Client Name</span>
                                <strong className="text-slate-900 font-bold">{selectedProject?.clientName || 'N/A'}</strong>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                                <strong className="text-slate-900 font-bold">{getProjectLocation(selectedProject)}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible print:h-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 print:grid-cols-1 print:gap-12 print:py-0">
                            {selectedProject?.rooms?.map((r: any, idx: number) => {
                                const BEAM_PRICE_PER_METER = selectedProject.settings?.beamType === 'tbeam' ? 1100 : 520;
                                const settings = selectedProject.settings || {
                                    beamSpacing: 0.55,
                                    blockWidth: 0.2,
                                    wastagePercentage: 10
                                };
                                const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, BEAM_PRICE_PER_METER, r.name);
                                return (
                                    <RoomLayoutVisualizer key={idx} calc={roomCalcs} roomName={r.name} showInternal={true} />
                                );
                            })}
                        </div>
                    </div>
                    
                    <CardFooter className="flex justify-between border-t pt-4 print:hidden">
                        <p className="text-xs text-slate-400 italic">SI-LATECH Internal Staff Document</p>
                        <Button onClick={() => window.print()} className="bg-primary font-bold">
                            <Download size={16} className="mr-2" /> Print for Site Technician
                        </Button>
                    </CardFooter>
                </DialogContent>
            </Dialog>

            {/* Admin Full Project & Quote Editor Modal (Bargain, Payment Methods, Rooms & AI Plan Reader) */}
            <AdminProjectEditorModal 
                open={isAdminEditorOpen} 
                onOpenChange={setIsAdminEditorOpen} 
                project={adminEditorProject} 
                staffList={staffList || []} 
                pricingRates={pricingRates} 
            />
        </div>
    );
}
