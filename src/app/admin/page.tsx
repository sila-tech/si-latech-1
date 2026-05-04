
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
                    <h1 className="text-4xl font-black font-headline text-primary tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Management overview for SI-LATECH operations.</p>
                </div>
                <Button asChild variant="outline" className="bg-white hover:bg-slate-50 border-slate-200">
                    <Link href="/">Go to Calculator</Link>
                </Button>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-primary font-bold">
                            <TrendingUp size={16} /> Current Project Profit
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-slate-900">KSh {totals.totalProjectProfit.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Based on rooms currently in calculator</p>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-primary font-bold">
                            <Layers size={16} /> Total Saved Projects
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-slate-900">{projects?.length || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Database project count</p>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-primary font-bold">
                            <History size={16} /> Historical Invoices
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-slate-900">{invoices?.length || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500">Total invoices generated</p>
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
                        <h2 className="text-2xl font-bold font-headline text-slate-900">Recent Invoices</h2>
                    </div>
                    <Card className="border border-slate-200 shadow-md overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Date</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Invoice #</TableHead>
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
                                            No historical invoices found.
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
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-primary">
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
                        <h2 className="text-2xl font-bold font-headline text-slate-900">Project Database</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search projects..." 
                                className="pl-8 bg-white border-slate-200" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <Card className="border border-slate-200 shadow-md bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Project Name</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Client</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Status</TableHead>
                                    <TableHead className="uppercase text-[10px] font-bold tracking-wider text-right text-slate-500">View</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white">
                                {!filteredProjects || filteredProjects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-slate-400 italic">
                                            No projects match your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProjects.map((p) => (
                                        <TableRow key={p.id} className="border-b">
                                            <TableCell className="font-bold text-primary">{p.name || 'Untitled'}</TableCell>
                                            <TableCell className="text-sm font-medium text-slate-700">{p.clientName || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={p.status === 'purchased' ? 'default' : 'secondary'} className="bg-sky-100 text-sky-700 hover:bg-sky-200 border-none">
                                                    {p.status || 'pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => router.push(`/project/${p.id}`)} className="text-slate-400 hover:text-primary">
                                                    <ArrowRight size={18} />
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
                    <Card className="border border-slate-200 shadow-lg bg-white p-12 text-center">
                        <div className="bg-sky-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TrendingUp className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Detailed Profit Analysis</h3>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            Access the full financial breakdown including material margins, block commissions, and per-room profit analysis.
                        </p>
                        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-md">
                            <Link href="/profit">View Full Profit Report</Link>
                        </Button>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
