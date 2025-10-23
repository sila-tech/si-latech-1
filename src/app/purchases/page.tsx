
'use client';

import React from 'react';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/header';
import { withProtection } from '@/components/auth/with-protection';
import type { ProjectData } from '@/firebase/data-manager';
import { format } from 'date-fns';
import { useCalculator } from '@/context/calculator-context';
import { useRouter } from 'next/navigation';

function PurchasesPage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const { setRooms, setSettings, setLintelLength } = useCalculator();
    const router = useRouter();

    const purchasedProjectsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'customers', user.uid, 'projects'),
            where('status', '==', 'purchased')
        );
    }, [firestore, user]);

    const { data: projects, isLoading } = useCollection<ProjectData>(purchasedProjectsQuery);
    
    const sortedProjects = useMemo(() => {
        if (!projects) return [];
        return [...projects].sort((a, b) => new Date(b.purchasedAt!).getTime() - new Date(a.purchasedAt!).getTime());
    }, [projects]);
    
    const handleViewReport = (project: ProjectData) => {
        setRooms(project.rooms || []);
        setSettings(project.settings);
        setLintelLength(project.lintelLength || 0);
        router.push('/profit');
    };

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                                <ShoppingBag />
                                Purchased Projects
                            </h1>
                            <p className="text-muted-foreground">Review internal profit reports for all completed sales.</p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/">
                                <ArrowLeft />
                                Back to Calculator
                            </Link>
                        </Button>
                    </div>

                    {isLoading || isUserLoading ? (
                         <Card>
                            <CardContent className="p-10 text-center flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary" />
                                <p className="ml-2">Loading purchased projects...</p>
                            </CardContent>
                        </Card>
                    ) : sortedProjects && sortedProjects.length > 0 ? (
                        <div className="space-y-4">
                            {sortedProjects.map((project) => (
                                <Card key={project.id} className="flex flex-col sm:flex-row items-center justify-between p-4">
                                    <div>
                                        <h3 className="font-semibold">{project.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Purchased on: <span className="text-green-400 font-medium">{format(new Date(project.purchasedAt!), 'PPP')}</span>
                                        </p>
                                    </div>
                                    <Button onClick={() => handleViewReport(project)} className="mt-4 sm:mt-0">
                                        <FileText />
                                        View Internal Report
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-10 text-center">
                                <p className="text-muted-foreground">No purchased projects found.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

export default withProtection(PurchasesPage, 'Sila4927');
