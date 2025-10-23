

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
import { withProtection } from '@/components/auth/with-protection';
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
        const margin = 15;
        const primaryColor = '#1e7a3a'; // Silatech Green
        const textColor = '#333333';
        const lightTextColor = '#666666';
        let currentY = 20;

        // --- A. Header / Branding ---
        doc.addImage(logoImageData, 'PNG', margin, 15, 40, 13);
        
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Certificate of Quality & Compliance', pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(lightTextColor);
        doc.text('“A better, simpler, and cost-effective way to build.”', pageWidth / 2, currentY, { align: 'center' });

        currentY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Certificate No: SILATECH/QC/${new Date().getFullYear()}/${String(project.id || 'N/A').slice(-5)}`, pageWidth - margin, 40, { align: 'right' });
        doc.text(`Date of Issuance: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - margin, 45, { align: 'right' });

        // --- B. Project Details ---
        currentY += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Project Details', margin, currentY);
        currentY += 6;
        
        const projectDetails = [
            ['Client Name:', project.name || 'N/A'],
            ['Project Name / Location:', 'As per site instructions'],
            ['Project Type:', 'Beams & Blocks Slab'],
            ['Completion Date:', project.purchasedAt ? format(new Date(project.purchasedAt), 'do MMMM yyyy') : 'N/A'],
            ['Project Supervisor:', 'Eng. Simon Larry'],
            ['Quality Inspector:', 'Eng. [Inspector Name]'],
        ];

        (doc as any).autoTable({
            startY: currentY,
            body: projectDetails,
            theme: 'plain',
            styles: {
                font: 'helvetica',
                fontSize: 10,
                cellPadding: 2,
                textColor: textColor,
            },
            columnStyles: {
                0: { fontStyle: 'bold' },
            },
            didDrawPage: (data: any) => { currentY = data.cursor.y; }
        });

        // --- C. Materials & Specification Summary ---
        currentY += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Materials & Specification Summary', margin, currentY);

        const materialsData = [
            ['Flat Beams', `${project.settings.beamSectionW * 1000}mm x ${project.settings.beamSectionH * 1000}mm concrete beams`, 'Silatech'],
            ['Hollow Blocks', `${project.settings.blockLength * 1000}mm x ${project.settings.blockWidth * 1000}mm`, 'Silatech'],
            ['Reinforcement Steel', `D${project.settings.dia_longitudinal} & D${project.settings.dia_stirrup} high-tensile bars`, 'Promax Steel'],
            ['Concrete Mix Ratio', `${project.settings.concreteMixRatioCement}:${project.settings.concreteMixRatioSand}:${project.settings.concreteMixRatioBallast} (Cement:Sand:Ballast)`, 'Site Mixed'],
            ['Cement Brand', 'Bamburi / Savannah / Rhino', 'Local Source'],
        ];

        (doc as any).autoTable({
            startY: currentY + 5,
            head: [['Material', 'Specification', 'Supplier / Source']],
            body: materialsData,
            theme: 'grid',
            headStyles: { fillColor: [30, 122, 58], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9 },
            didDrawPage: (data: any) => { currentY = data.cursor.y; }
        });

        // --- D. Quality Inspection Checklist ---
        currentY += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Quality Inspection Checklist', margin, currentY);
        
        const checklistData = [
            ['Beam Alignment', 'Checked using laser level', '✔ Pass'],
            ['Block Placement', 'Even and properly seated', '✔ Pass'],
            ['Reinforcement', 'As per design and spacing', '✔ Pass'],
            ['Concrete Cover', `Minimum ${project.settings.cover * 1000}mm maintained`, '✔ Pass'],
            ['Curing Duration', 'Minimum 7 days ensured', '✔ Pass'],
            ['Workmanship Finish', 'Smooth and uniform surface', '✔ Pass'],
        ];

        (doc as any).autoTable({
            startY: currentY + 5,
            head: [['Item', 'Inspection Criteria', 'Status']],
            body: checklistData,
            theme: 'grid',
            headStyles: { fillColor: [30, 122, 58], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9 },
            columnStyles: { 2: { halign: 'center' } },
            didDrawPage: (data: any) => { currentY = data.cursor.y; }
        });

        // --- E. Declaration & Approval ---
        currentY += 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Declaration & Approval', margin, currentY);
        currentY += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(textColor);
        const declarationText = `We, Silatech, hereby certify that the Beams & Blocks slab constructed at the above project site has been inspected, tested, and found to comply with the required structural and quality standards for safety, durability, and workmanship.`;
        const splitDeclaration = doc.splitTextToSize(declarationText, pageWidth - (margin * 2));
        doc.text(splitDeclaration, margin, currentY);
        currentY += (splitDeclaration.length * 5) + 10;

        // --- F. Signatures & Authentication ---
        currentY += 20;
        const signatureX1 = margin + 10;
        const signatureX2 = pageWidth / 2;
        const signatureX3 = pageWidth - margin - 50;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor);

        doc.line(signatureX1, currentY, signatureX1 + 60, currentY);
        doc.text('Project Supervisor', signatureX1, currentY + 5);
        doc.text('Eng. Simon Larry', signatureX1, currentY + 10);

        doc.line(signatureX2 - 30, currentY, signatureX2 + 30, currentY);
        doc.text('Quality Inspector', signatureX2, currentY + 5, { align: 'center' });
        doc.text('Eng. _______________', signatureX2, currentY + 10, { align: 'center' });

        doc.line(pageWidth - margin - 60, currentY, pageWidth - margin, currentY);
        doc.text('Silatech Representative', pageWidth - margin, currentY + 5, { align: 'right' });
        doc.text('Mr./Ms. _______________', pageWidth-margin, currentY + 10, {align: 'right'});
        
        // --- Footer ---
        const footerY = pageHeight - 20;
        doc.setLineWidth(0.5);
        doc.setDrawColor(primaryColor);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        doc.setFontSize(9);
        doc.setTextColor(lightTextColor);
        const footerText = `Silatech | P.O. Box [XXXX] – Nairobi, Kenya | 📞 +254 741 557 960 | "A better, simpler, and cost-effective way to build."`;
        doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });


        doc.save(`Silatech-Certificate-${project.name}.pdf`);
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
