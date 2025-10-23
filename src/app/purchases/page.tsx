
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText, ShoppingBag, BadgeCheck, BadgeHelp } from 'lucide-react';
import { Header } from '@/components/header';
import { withProtection } from '@/components/auth/with-protection';
import type { ProjectData } from '@/firebase/data-manager';
import { format } from 'date-fns';
import { useCalculator } from '@/context/calculator-context';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { updateProjectStatus } from '@/firebase/data-manager';
import { useToast } from '@/hooks/use-toast';

function PurchasesPage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const { setRooms, setSettings, setLintelLength } = useCalculator();
    const router = useRouter();
    const { toast } = useToast();

    const projectsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'customers', user.uid, 'projects');
    }, [firestore, user]);

    const { data: projects, isLoading } = useCollection<ProjectData>(projectsQuery);
    
    const sortedProjects = useMemo(() => {
        if (!projects) return [];
        return [...projects].sort((a, b) => {
             const dateA = a.purchasedAt ? new Date(a.purchasedAt) : new Date(a.createdAt);
             const dateB = b.purchasedAt ? new Date(b.purchasedAt) : new Date(b.createdAt);
             return dateB.getTime() - dateA.getTime();
        });
    }, [projects]);
    
    const handleViewReport = (project: ProjectData) => {
        if (project.status !== 'purchased') {
            toast({
                title: 'Report Not Available',
                description: 'An internal profit report can only be generated for purchased projects.',
                variant: 'destructive',
            });
            return;
        }
        setRooms(project.rooms || []);
        setSettings(project.settings);
        setLintelLength(project.lintelLength || 0);
        router.push('/profit');
    };
    
    const handleMarkAsPurchased = (project: ProjectData) => {
        if (!firestore || !user || !project.id) return;
        const projectRef = collection(firestore, 'customers', user.uid, 'projects');
        updateProjectStatus(projectRef.doc(project.id), 'purchased');
        toast({ title: 'Project Updated', description: `Marked "${project.name}" as purchased.`});
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
                                All Projects
                            </h1>
                            <p className="text-muted-foreground">Review all saved projects and view internal reports for completed sales.</p>
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
                                <p className="ml-2">Loading projects...</p>
                            </CardContent>
                        </Card>
                    ) : sortedProjects && sortedProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedProjects.map((project) => (
                                <Card key={project.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-start">
                                            {project.name}
                                             {project.status === 'purchased' ? (
                                               <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                                                 <BadgeCheck /> Purchased
                                               </Badge>
                                            ) : (
                                               <Badge variant="secondary">
                                                 <BadgeHelp /> Pending
                                               </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            Saved on: {format(new Date(project.createdAt), 'PP')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-2">
                                        {project.status === 'purchased' && project.purchasedAt && (
                                            <p className="text-sm text-green-400 font-medium">
                                                Purchased on: {format(new Date(project.purchasedAt), 'PPP')}
                                            </p>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex flex-col sm:flex-row gap-2">
                                         {project.status === 'pending' && (
                                            <Button 
                                                variant="default"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleMarkAsPurchased(project)}
                                            >
                                                <BadgeCheck /> Mark as Purchased
                                            </Button>
                                         )}
                                        <Button 
                                            onClick={() => handleViewReport(project)} 
                                            size="sm"
                                            className="w-full"
                                            variant={project.status === 'purchased' ? 'secondary' : 'outline'}
                                        >
                                            <FileText />
                                            View Report
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-10 text-center">
                                <p className="text-muted-foreground">No saved projects found.</p>
                                <p>Go back to the calculator to create and save a new project.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

export default withProtection(PurchasesPage, 'Sila4927');
