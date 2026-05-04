
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
import { Loader2, Briefcase, Users, LayoutDashboard, ExternalLink, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { InvestorsPortfolioTab } from '@/components/admin/investors-portfolio-tab';

export default function AdminDashboardPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const firestore = useFirestore();

    const projectsQuery = useMemoFirebase(
        () => query(collection(firestore, 'projects'), orderBy('createdAt', 'desc')),
        [firestore]
    );

    const { data: projects, isLoading: projectsLoading } = useCollection<any>(projectsQuery);

    const filteredProjects = projects?.filter(p => 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.clientName || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (projectsLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black font-headline text-primary tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage SI-LATECH projects and investor portfolios.</p>
                </div>
            </div>

            <Tabs defaultValue="projects" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
                    <TabsTrigger value="projects" className="flex items-center gap-2">
                        <Briefcase size={16} />
                        Projects
                    </TabsTrigger>
                    <TabsTrigger value="investors" className="flex items-center gap-2">
                        <Users size={16} />
                        Investors
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>Global Project List</CardTitle>
                                <CardDescription>View and manage all calculator projects saved by users.</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search projects..." 
                                    className="pl-8" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[600px]">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead>Project Details</TableHead>
                                            <TableHead>Client Information</TableHead>
                                            <TableHead>Created Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!filteredProjects || filteredProjects.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                                    {searchQuery ? "No projects match your search." : "No projects found in the database."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProjects.map((p) => (
                                                <TableRow key={p.id} className="group hover:bg-slate-100/50 transition-colors">
                                                    <TableCell>
                                                        <div className="font-bold text-primary">{p.name || 'Untitled Project'}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                            <LayoutDashboard size={12} />
                                                            {p.rooms?.length || 0} Rooms
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm font-medium">{p.clientName || 'N/A'}</div>
                                                        <div className="text-xs text-muted-foreground">{p.projectLocation || 'Location not specified'}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {p.createdAt?.seconds ? format(new Date(p.createdAt.seconds * 1000), 'PPP') : 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={p.status === 'purchased' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                                            {p.status || 'pending'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => router.push(`/project/${p.id}`)}>
                                                            <ExternalLink size={14} className="mr-1" /> View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="investors">
                    <InvestorsPortfolioTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
