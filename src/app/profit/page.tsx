
'use client';

import React from 'react';
import Link from 'next/link';
import { useCalculator } from '@/context/calculator-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Header } from '@/components/header';
import { Separator } from '@/components/ui/separator';
import { withProtection } from '@/components/auth/with-protection';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const addLogoToPdf = (doc: jsPDF, logoUrl: string) => {
    try {
        const img = new (window as any).Image();
        img.src = logoUrl;
        const imageWidth = 35;
        const imageAspectRatio = img.width > 0 ? img.height / img.width : 1;
        const imageHeight = imageWidth * imageAspectRatio;

        const format = logoUrl.substring(logoUrl.indexOf('/') + 1, logoUrl.indexOf(';')).toUpperCase();
        if (['JPEG', 'PNG', 'JPG'].includes(format) && img.width > 0) {
            doc.addImage(logoUrl, format, 14, 15, imageWidth, imageHeight);
        } else {
            throw new Error('Unsupported image format or invalid image.');
        }
    } catch (e) {
        // Fallback for SVGs or other issues.
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('SI-LATECH', 14, 22);
    }
};

const addPdfBackground = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const backgroundColor = '#f2f5f9'; // HSL(210, 40%, 96.1%)
    doc.setFillColor(backgroundColor);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
    }
};


function ProfitReportPage() {
    const { perRoomCalculations, totals, projectName, logoUrl } = useCalculator();

    const handleDownload = () => {
        const doc = new jsPDF();
        addPdfBackground(doc);
        const reportDate = new Date().toLocaleDateString('en-GB');
        const reportNumber = `PROFIT-${String(Date.now()).slice(-6)}`;
        const primaryColor = '#0284c7';

        if (logoUrl) {
            addLogoToPdf(doc, logoUrl);
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text('Internal Profit Report', 60, 22);


        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${reportDate}`, 14, 50);
        doc.text(`Report ID: ${reportNumber}`, 14, 55);
        
        // --- Summary Section ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text('Project Profit Summary', 14, 65);

        (doc as any).autoTable({
            startY: 70,
            theme: 'plain',
            body: [
                ['Total Beam Profit', `KSh ${totals.totalBeamProfitValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                ['Total Block Commission', `KSh ${totals.totalBlockCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                [{ content: 'Total Project Profit', styles: { fontStyle: 'bold' } }, { content: `KSh ${totals.totalProjectProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold' } }],
            ],
            styles: { fontSize: 11, cellPadding: 2 },
            columnStyles: {
                1: { halign: 'right' }
            }
        });

        // --- Per-Room Breakdown ---
        let finalY = (doc as any).lastAutoTable.finalY;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text('Per-Room Breakdown', 14, finalY + 15);

        const tableColumn = ['Room', 'Beam Profit (KSh)', 'Block Commission (KSh)', 'Total Room Profit (KSh)'];
        const tableRows = perRoomCalculations.map(p => ([
            `${p.room.name} (${p.room.width}m x ${p.room.length}m)`,
            p.roomCalcs.beamProfitValue.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            p.roomCalcs.blockCommission.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            p.roomCalcs.totalRoomProfit.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        ]));

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: finalY + 20,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9 },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right', fontStyle: 'bold' },
            }
        });
        
        doc.save(`Internal-Profit-Report-${reportNumber}.pdf`);
    };

    const handleDownloadPromaxInvoice = () => {
        const doc = new jsPDF();
        addPdfBackground(doc);
        const invoiceDate = new Date().toLocaleDateString('en-GB');
        const invoiceNumber = `PROMAX-INV-${String(Date.now()).slice(-6)}`;
        const primaryColor = '#0284c7';

        const beamProfit = totals.totalBeamProfitValue;
        const blockCommission = totals.totalBlockCommission;
        const totalDue = beamProfit + blockCommission;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(primaryColor);
        doc.text('INVOICE TO PROMAX LIMITED', 14, 22);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Date: ${invoiceDate}`, 145, 20);
        doc.text(`Invoice No: ${invoiceNumber}`, 145, 25);
        
        doc.text(`From: SI-LATECH`, 14, 40);
        if (projectName) {
            doc.text(`Project: ${projectName}`, 14, 45);
        }

        const tableColumn = ['Description', 'Amount (KSh)'];
        const tableRows = [
            [`Payment for Beam Metres (${totals.totalProfitBeamLength.toFixed(2)}m)`, beamProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })],
            [`Payment for Blocks (${totals.totalBlocks} pcs)`, blockCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })],
        ];

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 11 },
            columnStyles: { 1: { halign: 'right' } },
        });
        
        let finalY = (doc as any).lastAutoTable.finalY;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL DUE', 14, finalY + 15);
        doc.text(`KSh ${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 200, finalY + 15, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Please make payments via M-Pesa to 0741557960.', 14, finalY + 30);
        
        doc.save(`Promax-Invoice-${invoiceNumber}.pdf`);
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight font-headline">Internal Profit Report</h1>
                            <p className="text-muted-foreground">A detailed breakdown of profit margins for the current project.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button onClick={handleDownload}>
                                <Download /> Download Report
                           </Button>
                           <Button onClick={handleDownloadPromaxInvoice} variant="secondary">
                                <FileText /> Promax Invoice
                           </Button>
                           <Button asChild variant="outline">
                                <Link href="/">
                                    <ArrowLeft />
                                    Back to Calculator
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {perRoomCalculations.length > 0 ? (
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sky-600">Project Profit Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="text-sm font-medium text-muted-foreground">Total Beam Profit</p>
                                        <p className="text-2xl font-bold">KSh {totals.totalBeamProfitValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="text-sm font-medium text-muted-foreground">Total Block Commission</p>
                                        <p className="text-2xl font-bold">KSh {totals.totalBlockCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="p-4 bg-sky-900/50 rounded-lg">
                                        <p className="text-sm font-medium text-sky-300">Total Project Profit</p>
                                        <p className="text-2xl font-bold text-sky-300">KSh {totals.totalProjectProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold font-headline">Per-Room Breakdown</h2>
                                {perRoomCalculations.map((p, index) => {
                                    const { room, roomCalcs } = p;
                                    return (
                                        <Card key={room.id} className="overflow-hidden">
                                            <CardHeader className="bg-muted/50 p-4">
                                                <CardTitle>{room.name}</CardTitle>
                                                <CardDescription>{room.width}m x {room.length}m</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-3">
                                                <h4 className="font-semibold">Beam Calculations</h4>
                                                <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                    <li><span className="font-medium">Actual Beams:</span> {roomCalcs.actualBeamCount} pcs</li>
                                                    <li><span className="font-medium">Invoice Beams:</span> {roomCalcs.invoiceBeamCount} pcs</li>
                                                    <li><span className="font-medium text-sky-400">Profit Beams:</span> {roomCalcs.profitBeams} pcs</li>
                                                    <li><span className="font-medium text-sky-400">Profit Length:</span> {roomCalcs.profitBeamLength.toFixed(2)}m</li>
                                                </ul>
                                                <Separator />
                                                <h4 className="font-semibold">Financials</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="p-3 bg-muted rounded-md">
                                                        <p className="text-xs text-muted-foreground">Beam Profit</p>
                                                        <p className="font-semibold">KSh {roomCalcs.beamProfitValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="p-3 bg-muted rounded-md">
                                                        <p className="text-xs text-muted-foreground">Block Commission</p>
                                                        <p className="font-semibold">KSh {roomCalcs.blockCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="p-3 bg-muted rounded-md">
                                                        <p className="text-xs text-muted-foreground">Total Room Profit</p>
                                                        <p className="font-semibold text-sky-400">KSh {roomCalcs.totalRoomProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-10 text-center">
                                <p className="text-muted-foreground">No room data available.</p>
                                <p className="mt-2">Return to the calculator to add rooms or generate a quick quote.</p>
                                <Button asChild className="mt-4">
                                    <Link href="/">Go to Calculator</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

export default withProtection(ProfitReportPage, 'Sila4927');

    