
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    Download
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useCalculator } from '@/context/calculator-context';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const { totals } = useCalculator();

    const firestore = useFirestore();

    const projectsQuery = useMemoFirebase(
        () => query(collection(firestore, 'projects'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: projects, isLoading: projectsLoading } = useCollection<any>(projectsQuery);

    const invoicesQuery = useMemoFirebase(
        () => query(collection(firestore, 'invoices'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: invoices, isLoading: invoicesLoading } = useCollection<any>(invoicesQuery);

    const filteredProjects = projects?.filter(p => 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.clientName || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

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
                    <h1 className="text-4xl font-black font-headline text-[#095388] tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Management overview for SI-LATECH operations.</p>
                </div>
                <Button asChild variant="outline" className="bg-white hover:bg-slate-50 border-slate-200">
                    <Link href="/">Go to Calculator</Link>
                </Button>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-[#f59e0b]">
                            <TrendingUp size={16} /> Current Project Profit
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">KSh {totals.totalProjectProfit.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Based on rooms currently in calculator</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-[#095388]">
                            <Layers size={16} /> Total Saved Projects
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">{projects?.length || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Database project count</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-[#f59e0b]">
                            <History size={16} /> Historical Invoices
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">{invoices?.length || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Total invoices generated</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="bg-slate-100 p-1 h-12 w-auto inline-flex rounded-lg mb-8">
                    <TabsTrigger value="invoices" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                        Invoice History
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                        Project Management
                    </TabsTrigger>
                    <TabsTrigger value="profit" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
                        Current Profit Detail
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headline text-[#0f172a]">Recent Invoices</h2>
                    </div>
                    <Card className="border-none shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-b">
                                <TableRow>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider">Date</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider">Invoice #</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider">Client</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider">Project</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right">Amount (KSh)</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!invoices || invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                            No historical invoices found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((inv) => (
                                        <TableRow key={inv.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="text-sm text-slate-500">
                                                {inv.createdAt?.seconds ? format(new Date(inv.createdAt.seconds * 1000), 'dd MMM yyyy') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-400">
                                                {inv.invoiceNumber}
                                            </TableCell>
                                            <TableCell className="font-bold text-[#0f172a]">
                                                {inv.clientName}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {inv.projectName}
                                            </TableCell>
                                            <TableCell className="text-right font-black text-[#0f172a]">
                                                {inv.grandTotal?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-[#095388]">
                                                    <Download size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="projects" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-headline text-[#0f172a]">Project Database</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search projects..." 
                                className="pl-8 bg-white" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <Card className="border-none shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-b">
                                <TableRow>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider">Project Name</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider">Client</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider">Status</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right">View</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!filteredProjects || filteredProjects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                            No projects match your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProjects.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-bold text-[#095388]">{p.name || 'Untitled'}</TableCell>
                                            <TableCell className="text-sm font-medium">{p.clientName || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={p.status === 'purchased' ? 'default' : 'secondary'}>
                                                    {p.status || 'pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => router.push(`/project/${p.id}`)}>
                                                    <ArrowRight size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="profit">
                    <Card className="border-none shadow-sm bg-white p-8 text-center">
                        <TrendingUp className="h-12 w-12 text-[#f59e0b] mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Detailed Profit Analysis</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Access the full financial breakdown including material margins, block commissions, and per-room profit analysis.
                        </p>
                        <Button asChild className="bg-[#095388] hover:bg-[#07426d]">
                            <Link href="/profit">View Full Profit Report</Link>
                        </Button>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
