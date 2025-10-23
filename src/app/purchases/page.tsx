
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2, FileText, ShoppingBag, BadgeCheck, BadgeHelp, Award } from 'lucide-react';
import { Header } from '@/components/header';
import { Separator } from '@/components/ui/separator';
import type { ProjectData } from '@/firebase/data-manager';
import { format } from 'date-fns';
import { useCalculator } from '@/context/calculator-context';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { updateProjectStatus } from '@/firebase/data-manager';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { logoImageData } from '@/lib/logo-image';
import { withProtection } from '@/components/auth/with-protection';

// @ts-ignore
import { jsPDF_AutoTable } from 'jspdf-autotable';

function PurchasesPage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const { setRooms, setSettings, setLintelLength, totals } = useCalculator();
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
        const projectRef = doc(firestore, 'customers', user.uid, 'projects', project.id);
        updateProjectStatus(projectRef, 'purchased');
        toast({ title: 'Project Updated', description: `Marked "${project.name}" as purchased.`});
    };

    const handleGenerateCertificate = (project: ProjectData) => {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let currentY = 30;
        const primaryColor = '#1e7a3a';
        const textColor = '#333333';
        const margin = 20;

        // --- A. Header / Branding ---
        doc.addImage(logoImageData, 'PNG', pageWidth / 2 - 30, currentY, 60, 13);
        currentY += 25;
        
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Certificate of Quality & Appreciation', pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(textColor);
        doc.text('“A better, simpler, and cost-effective way to build.”', pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        // --- Certificate Info ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const year = project.purchasedAt ? new Date(project.purchasedAt).getFullYear() : new Date().getFullYear();
        doc.text(`Certificate No: SILATECH/QC/${year}/${String(project.id || 'N/A').slice(-5)}`, margin, currentY);
        doc.text(`Date Issued: ${format(new Date(), 'do MMMM yyyy')}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 15;

        // --- B. Project Details ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('🏗️ Presented To:', margin, currentY);
        currentY += 10;

        const details = [
            ['Client’s Full Name:', project.name || 'N/A'],
            ['Project Name / Location:', 'As per site instructions'],
            ['Project Type:', 'Beams & Blocks Slab Construction'],
            ['Completion Date:', project.purchasedAt ? format(new Date(project.purchasedAt), 'dd/MM/yyyy') : 'N/A'],
        ];

        (doc as any).autoTable({
            startY: currentY,
            body: details,
            theme: 'plain',
            styles: {
                font: 'helvetica',
                fontSize: 10,
                cellPadding: 2,
                textColor: textColor,
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
            },
            didDrawPage: (data: any) => { currentY = data.cursor.y; }
        });

        // --- C. Message of Appreciation ---
        currentY += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('💬 Message of Appreciation', margin, currentY);
        currentY += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        const message = [
            'On behalf of Silatech Construction Ltd, we extend our sincere appreciation for trusting us with your project.',
            'Your confidence in our Beams & Blocks Technology has allowed us to demonstrate that construction can indeed be better, simpler, and more cost-effective.',
            'This certificate confirms that your slab has been constructed, inspected, and certified to meet Silatech’s high standards of quality, strength, and durability.',
            'We are proud to have been part of your vision and remain committed to supporting you in future developments.'
        ];
        
        message.forEach(line => {
            const splitLine = doc.splitTextToSize(line, pageWidth - (margin * 2));
            doc.text(splitLine, margin, currentY);
            currentY += (splitLine.length * 5) + 3;
        });
        
        // --- D. Signature ---
        currentY = pageHeight - 50;
        doc.line(margin, currentY, margin + 80, currentY);
        doc.text('Managing Director', margin, currentY + 7);
        doc.text('SI-LATECH', margin, currentY + 12);
        
        // --- Footer ---
        const footerY = pageHeight - 20;
        doc.setLineWidth(0.5);
        doc.setDrawColor(primaryColor);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        doc.setFontSize(9);
        doc.setTextColor(textColor);
        const footerText = `P.O. Box [XXXX] – Nairobi, Kenya | 📞 +254 741 557 960`;
        doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });

        doc.save(`Silatech-Certificate-of-Appreciation-${project.name}.pdf`);
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
                                         {project.status === 'pending' ? (
                                            <Button 
                                                variant="default"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleMarkAsPurchased(project)}
                                            >
                                                <BadgeCheck /> Mark as Purchased
                                            </Button>
                                         ) : (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleGenerateCertificate(project)}
                                            >
                                                <Award /> Certificate
                                            </Button>
                                         )}
                                        <Button 
                                            onClick={() => handleViewReport(project)} 
                                            size="sm"
                                            className="w-full"
                                            variant={project.status === 'purchased' ? 'outline' : 'outline'}
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
