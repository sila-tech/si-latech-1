
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, addDoc, serverTimestamp, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    Activity
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, isToday, isYesterday } from 'date-fns';
import { useCalculator } from '@/context/calculator-context';
import { generateQuotePdf, generatePromaxPdf, generateProfitRequestPdf, generateMaterialSchedulePdf } from '@/lib/pdf-utils';
import { calcRoomBlocksAndBeams } from '@/lib/calculator';
import Link from 'next/link';
import { MapPin, Image as ImageIcon, UserCheck } from 'lucide-react';
import { RoomLayoutVisualizer } from '@/components/silacalc/room-layout-visualizer';
import { StaffManagement } from '@/components/admin/staff-management';
import { FinanceManagement } from '@/components/admin/finance-management';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [projectTab, setProjectTab] = useState('running');
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isLayoutViewOpen, setIsLayoutViewOpen] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const router = useRouter();
    const { totals: currentTotals } = useCalculator();
    const { toast } = useToast();

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

    const handleDownloadSavedQuote = (inv: any) => {
        generateQuotePdf({
            invoiceNumber: inv.invoiceNumber,
            clientInfo: {
                clientName: inv.clientName,
                projectName: inv.projectName,
                projectLocation: inv.projectLocation,
                clientContact: inv.clientContact || 'N/A',
                contactPerson: inv.contactPerson || 'N/A'
            },
            totals: inv.totals,
            perRoomCalculations: inv.rooms || []
        });
    };

    const handleDownloadPromax = (proj: any) => {
        const BEAM_PRICE_PER_METER = proj.settings?.beamType === 'tbeam' ? 1250 : 545; // Dynamic price
        const settings = {
            ...(proj.settings || {
                beamSpacing: 0.55,
                blockWidth: 0.2,
                wastagePercentage: 10,
                propSpacing: 1.2,
                concreteThickness: 0.05
            }),
            blockCommissionRate: 5 // Force to 5 as per recent business rule
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
                projectName: proj.name,
                projectLocation: proj.projectLocation || 'N/A'
            },
            totals: {
                totalBlocks
            },
            perRoomCalculations: reCalculatedRooms
        });
    };

    const filteredProjects = projects?.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (p.clientName || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        const pStatus = p.status || 'pending';
        if (projectTab === 'all') return true;
        return pStatus === projectTab;
    }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

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
            
            // If the project is moved to running, record the profit as income
            if (status === 'running') {
                if (project && project.profit) {
                    await addDoc(collection(firestore, 'finances'), {
                        type: 'income',
                        amount: project.profit,
                        reason: `Project Income: ${project.clientName || 'Unnamed Project'}`,
                        projectId: projectId,
                        requestedBy: 'System',
                        status: 'approved',
                        createdAt: serverTimestamp()
                    });
                }
            } else if (status === 'pending') {
                // If moved back to pending, remove the income record from finances
                if (project) {
                    // We check for both projectId (new way) or matching reason (for older backfilled ones)
                    let finQuery = query(collection(firestore, 'finances'), where('projectId', '==', projectId));
                    let snapshot = await getDocs(finQuery);
                    
                    if (snapshot.empty) {
                        finQuery = query(
                            collection(firestore, 'finances'), 
                            where('reason', '==', `Project Income: ${project.clientName || 'Unnamed Project'}`),
                            where('type', '==', 'income')
                        );
                        snapshot = await getDocs(finQuery);
                    }

                    for (const d of snapshot.docs) {
                        await deleteDoc(doc(firestore, 'finances', d.id));
                    }
                }
            }

            toast({ title: 'Success', description: `Project marked as ${status}.` });
        } catch (error) {
            console.error("Error updating project status:", error);
            toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
        }
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
                    <p className="text-muted-foreground">Management overview for SI-LATECH operations.</p>
                </div>
                <Button asChild variant="outline" className="bg-white hover:bg-slate-50 border-slate-200">
                    <Link href="/">Go to Calculator</Link>
                </Button>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-primary font-bold">
                            <TrendingUp size={16} /> Current Profit
                        </CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">KSh {currentTotals.totalProjectProfit.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Active calculation profit</p>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-primary font-bold">
                            <Layers size={16} /> Saved Projects
                        </CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">{projects?.length || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Database project count</p>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-primary font-bold">
                            <History size={16} /> Saved Quotes
                        </CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">{invoices?.length || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Total historical quotes</p>
                    </CardContent>
                </Card>

                {/* Admin Actions Card */}
                <Card className="border border-slate-200 shadow-md bg-slate-900 text-white md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                             Administrative Controls
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">Technical reports & exports</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2 pt-2">
                         <div className="flex items-center gap-2 text-xs text-slate-300 italic py-2">
                            Select a project below to view its specific profit breakdown.
                         </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="projects" className="w-full">
                <TabsList className="bg-slate-100 p-1 h-12 w-auto inline-flex rounded-lg mb-8 flex-wrap overflow-x-auto justify-start">
                    <TabsTrigger value="projects" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                        Project Management
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                        Quote History
                    </TabsTrigger>
                    <TabsTrigger value="finances" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                        Finances
                    </TabsTrigger>
                    {isSuperAdmin && (
                        <TabsTrigger value="staff" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                            Team Management
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="finances">
                    <FinanceManagement isSuperAdmin={isSuperAdmin} />
                </TabsContent>

                {isSuperAdmin && (
                    <TabsContent value="staff">
                        <StaffManagement />
                    </TabsContent>
                )}

                <TabsContent value="projects" className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <h2 className="text-2xl font-bold font-headline text-slate-900">Saved Projects</h2>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search projects..." 
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <Tabs value={projectTab} onValueChange={setProjectTab} className="w-full">
                        <TabsList className="bg-slate-100 p-1 mb-6">
                            <TabsTrigger value="running" className="px-4 data-[state=active]:bg-white">Running</TabsTrigger>
                            <TabsTrigger value="pending" className="px-4 data-[state=active]:bg-white">Pending</TabsTrigger>
                            <TabsTrigger value="finished" className="px-4 data-[state=active]:bg-white">Finished</TabsTrigger>
                            <TabsTrigger value="all" className="px-4 data-[state=active]:bg-white">All Projects</TabsTrigger>
                        </TabsList>
                        
                        <div className="space-y-12">
                        {(() => {
                            const groups: Record<string, any[]> = {};
                            
                            filteredProjects?.forEach(proj => {
                                let dateStr = 'Older Projects';
                                if (proj.createdAt?.seconds) {
                                    const date = new Date(proj.createdAt.seconds * 1000);
                                    if (isToday(date)) dateStr = 'Today';
                                    else if (isYesterday(date)) dateStr = 'Yesterday';
                                    else dateStr = format(date, 'MMMM d, yyyy');
                                }
                                if (!groups[dateStr]) groups[dateStr] = [];
                                groups[dateStr].push(proj);
                            });

                            return Object.entries(groups).map(([dateLabel, groupProjects]) => (
                                <div key={dateLabel} className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                            {dateLabel}
                                        </h3>
                                        <div className="h-[1px] flex-grow bg-slate-100"></div>
                                        <span className="text-[10px] font-bold text-slate-300">{groupProjects.length} projects</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {groupProjects.map((proj) => (
                                            <Card key={proj.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden flex flex-col">
                                                <CardHeader className="bg-slate-50 border-b pb-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                                {proj.name}
                                                                <Badge variant="outline" className={
                                                                    (proj.status || 'pending') === 'running' ? 'bg-sky-50 text-sky-600 border-sky-200' :
                                                                    (proj.status || 'pending') === 'finished' ? 'bg-green-50 text-green-600 border-green-200' :
                                                                    'bg-amber-50 text-amber-600 border-amber-200'
                                                                }>
                                                                    {(proj.status || 'pending').toUpperCase()}
                                                                </Badge>
                                                            </CardTitle>
                                                            <CardDescription className="text-xs">{proj.clientName || 'No Client Name'}</CardDescription>
                                                        </div>
                                                        <div className="bg-white px-2 py-1 rounded border border-slate-200 text-[10px] font-bold text-slate-500">
                                                            {proj.createdAt?.seconds ? format(new Date(proj.createdAt.seconds * 1000), 'h:mm a') : 'N/A'}
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="py-4 space-y-3 flex-grow">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <MapPin size={14} className="text-primary" />
                                                        {proj.projectLocation || 'No location specified'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <Layers size={14} className="text-primary" />
                                                        {proj.rooms?.length || 0} Rooms / Project Areas
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-2 border-t mt-2">
                                                        <UserCheck size={14} className="text-slate-400" />
                                                        <Select value={proj.assignedTo || "unassigned"} onValueChange={(val) => handleAssignStaff(proj.id, val === "unassigned" ? "" : val)}>
                                                            <SelectTrigger className="h-7 text-xs flex-1">
                                                                <SelectValue placeholder="Assign Staff" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="unassigned" className="text-xs text-slate-500 italic">Unassigned</SelectItem>
                                                                {staffList?.map((s: any) => (
                                                                    <SelectItem key={s.id} value={s.username} className="text-xs">{s.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-2 border-t">
                                                        <Activity size={14} className="text-slate-400" />
                                                        <Select value={proj.status || "pending"} onValueChange={(val) => handleUpdateProjectStatus(proj.id, val)}>
                                                            <SelectTrigger className="h-7 text-xs flex-1">
                                                                <SelectValue placeholder="Status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending" className="text-xs text-amber-600">Pending</SelectItem>
                                                                <SelectItem value="running" className="text-xs text-sky-600">Running</SelectItem>
                                                                <SelectItem value="finished" className="text-xs text-green-600">Finished</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="bg-slate-50 border-t p-3 grid grid-cols-2 gap-2">
                                                    <Button variant="outline" size="sm" className="bg-white font-bold text-xs" onClick={() => setSelectedProject(proj)}>
                                                        View Details
                                                    </Button>
                                                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 font-bold text-xs" onClick={() => handleDownloadPromax(proj)}>
                                                        <Download size={14} className="mr-1" /> Promax
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                        </div>
                    </Tabs>
                </TabsContent>

                <TabsContent value="invoices" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headline text-slate-900">Recent Quotes</h2>
                    </div>
                    <Card className="border border-slate-200 shadow-md overflow-hidden bg-white">
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
                                                {inv.clientName}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {inv.projectName}
                                            </TableCell>
                                            <TableCell className="text-right font-black text-primary">
                                                KSh {inv.grandTotal?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-slate-400 hover:text-primary"
                                                    onClick={() => handleDownloadSavedQuote(inv)}
                                                >
                                                    <Download size={16} />
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

            {/* Project Details Dialog */}
            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:hidden">
                    {(() => {
                        if (!selectedProject) return null;
                        
                        // Re-calculate details for the selected project to avoid zero values
                        const BEAM_PRICE_PER_METER = selectedProject.settings?.beamType === 'tbeam' ? 1250 : 545;
                        const settings = {
                            ...(selectedProject.settings || {
                                beamSpacing: 0.55,
                                blockWidth: 0.2,
                                wastagePercentage: 10,
                                propSpacing: 1.2,
                                concreteThickness: 0.05
                            }),
                            blockCommissionRate: 5 // Force to 5 as per recent business rule
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
                                <DialogTitle className="text-2xl font-black text-primary">{selectedProject?.name}</DialogTitle>
                                <p className="text-sm text-muted-foreground">{selectedProject?.clientName} — {selectedProject?.projectLocation}</p>
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
                                    <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-12" onClick={() => handleDownloadPromax(selectedProject)}>
                                        <Download className="mr-2 h-5 w-5" /> Manufacturing Order
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="border-primary text-primary hover:bg-primary/5 font-bold h-12"
                                        onClick={() => generateMaterialSchedulePdf({
                                            clientInfo: {
                                                projectName: selectedProject.name,
                                                projectLocation: selectedProject.projectLocation || 'N/A',
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
                                                projectName: selectedProject.name,
                                                projectLocation: selectedProject.projectLocation || 'N/A',
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
                    
                    {/* Printable Sheet Header (hidden on screen, shown in print) */}
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
                                <strong className="text-slate-900 font-bold">{selectedProject?.name}</strong>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Client Name</span>
                                <strong className="text-slate-900 font-bold">{selectedProject?.clientName || 'N/A'}</strong>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                                <strong className="text-slate-900 font-bold">{selectedProject?.projectLocation || 'N/A'}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible print:h-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 print:grid-cols-1 print:gap-12 print:py-0">
                            {selectedProject?.rooms?.map((r: any, idx: number) => {
                                // Recalculate room layout
                                const BEAM_PRICE_PER_METER = selectedProject.settings?.beamType === 'tbeam' ? 1250 : 545;
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
        </div>
    );
}
