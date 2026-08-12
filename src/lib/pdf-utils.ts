import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calculateProjectTotals, calcRoomBlocksAndBeams } from './calculator';

export const addLogoToPdf = (doc: jsPDF, color: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(color);
    doc.text('SI-LATECH', 35, 18);
    try {
        if (typeof window !== 'undefined') {
            const img = new window.Image();
            img.src = '/logo.png';
            doc.addImage(img, 'PNG', 14, 5, 18, 18);
        }
    } catch (e) {}
};

export const addPdfBackground = (doc: jsPDF) => {
    // Watermark is optional and background fill is omitted to prevent blank pages
};

export const generateQuotePdf = (data: {
    invoiceNumber: string;
    clientInfo: {
        clientName: string;
        projectName: string;
        projectLocation: string;
        clientContact: string;
        contactPerson: string;
    };
    totals: any;
    perRoomCalculations?: any[];
    discountType?: 'none' | 'percent' | 'amount';
    discountValue?: number;
    paymentMethods?: string[];
    customPaymentNotes?: string;
    clientChangeRequestNotes?: string;
}) => {
    const { 
        invoiceNumber, 
        clientInfo, 
        totals, 
        perRoomCalculations = [],
        discountType = 'none',
        discountValue = 0,
        paymentMethods = [],
        customPaymentNotes = '',
        clientChangeRequestNotes = ''
    } = data;

    const doc = new jsPDF();
    const primaryColor = '#095388';
    const invoiceDate = new Date().toLocaleDateString('en-GB');

    const safeTotals = totals || {
        totalInvoiceBeamLength: 0,
        totalBlocks: 0,
        totalArea: 0,
    };

    const isTBeam = safeTotals.beamType === 'tbeam';
    const BEAM_PRICE_PER_METER = totals.beamPrice !== undefined ? totals.beamPrice : (isTBeam ? 950 : 500);
    const BLOCK_PRICE = totals.blockPrice !== undefined ? totals.blockPrice : (isTBeam ? 95 : 80);

    const totalArea = safeTotals.totalArea || (perRoomCalculations || []).reduce((acc: number, r: any) => acc + ((r.length || 0) * (r.width || 0)), 0);
    const brcRollsNeeded = safeTotals.brc?.rollsNeeded !== undefined ? safeTotals.brc.rollsNeeded : Math.ceil(totalArea / 115.2);

    const beamsSubtotal = (safeTotals.totalInvoiceBeamLength || 0) * BEAM_PRICE_PER_METER;
    const blocksSubtotal = (safeTotals.totalBlocks || 0) * BLOCK_PRICE;
    const grossTotal = beamsSubtotal + blocksSubtotal;

    let discountAmount = 0;
    if (discountType === 'percent' && discountValue > 0) {
        discountAmount = (grossTotal * discountValue) / 100;
    } else if (discountType === 'amount' && discountValue > 0) {
        discountAmount = discountValue;
    }
    const netGrandTotal = Math.max(0, grossTotal - discountAmount);

    // --- Header (Identical to main calculator) ---
    addLogoToPdf(doc, primaryColor);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.text('OFFICIAL QUOTE', 75, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Head Office: Ruiru, behind Rubis petrol station', 140, 22);
    doc.text('Tel: +254 141 981 315', 140, 27);
    doc.text('Email: info.silatechsolutions@gmail.com', 140, 32);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('@si-latech, a better simpler and cost effective way to build.', 14, 38);

    let currentY = 60;
    const invoiceToX = 14;
    const shipToX = 110;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text('QUOTE TO', invoiceToX, currentY);
    doc.text('SHIP / SITE TO', shipToX, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.text(`Client Name: ${clientInfo.clientName || 'N/A'}`, invoiceToX, currentY);
    doc.text(`Site Name: ${clientInfo.projectName || 'N/A'}`, shipToX, currentY);
    currentY += 5;
    doc.text(`Project Name: ${clientInfo.projectName || 'N/A'}`, invoiceToX, currentY);
    doc.text(`Address: ${clientInfo.projectLocation || 'N/A'}`, shipToX, currentY);
    currentY += 5;
    doc.text(`Location: ${clientInfo.projectLocation || 'N/A'}`, invoiceToX, currentY);
    doc.text(`Contact Person: ${clientInfo.contactPerson || 'N/A'}`, shipToX, currentY);
    currentY += 5;
    doc.text(`Contact: ${clientInfo.clientContact || 'N/A'}`, invoiceToX, currentY);
    
    const metaY = currentY + 10;
    doc.text(`Quote No.:`, 14, metaY);
    doc.text(`Date:`, 14, metaY + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoiceNumber}`, 44, metaY);
    doc.text(`${invoiceDate}`, 44, metaY + 5);

    const tableRows = [
        [
            isTBeam ? 'Total Invoiced T-Beams (m)' : 'Total Invoiced Beams (m)',
            (safeTotals.totalInvoiceBeamLength || 0).toFixed(2),
            BEAM_PRICE_PER_METER.toFixed(2),
            beamsSubtotal.toFixed(2)
        ],
        [
            isTBeam ? 'Total Blocks for T-Beams (pcs)' : 'Total Blocks (pcs)',
            (safeTotals.totalBlocks || 0).toString(),
            BLOCK_PRICE.toFixed(2),
            blocksSubtotal.toFixed(2)
        ]
    ];

    (doc as any).autoTable({
        head: [['DESCRIPTION', 'QTY / MTRS', 'RATE (KSH)', 'AMOUNT (KSH)']],
        body: tableRows,
        startY: metaY + 15,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, fontStyle: 'bold' },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY;
    const totalsX = 145;
    const totalsValueX = 200;
    
    finalY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#D32F2F');
    doc.text('NB: Transportation of all materials is to be paid for by the customer.', 14, finalY);

    if (discountAmount > 0) {
        finalY += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);
        doc.text('Subtotal:', totalsX, finalY, { align: 'right' });
        doc.text(`Ksh ${grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY, { align: 'right' });

        finalY += 6;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        const discountLabel = discountType === 'percent' ? `Bargain Discount (${discountValue}%):` : 'Bargain Discount:';
        doc.text(discountLabel, totalsX, finalY, { align: 'right' });
        doc.text(`- Ksh ${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY, { align: 'right' });
    }

    finalY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(totalsX - 60, finalY - 1, 85, 10, 3, 3, 'F');
    doc.text('BALANCE DUE: ', totalsX, finalY + 5, { align: 'right' });
    doc.text(`Ksh ${netGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 5, { align: 'right' });

    const beamWeight = (safeTotals.totalInvoiceBeamLength || 0) * 18;
    const blockWeight = (safeTotals.totalBlocks || 0) * 12;
    const approxTonnage = (beamWeight + blockWeight) / 1000;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Approx. Weight: ~${approxTonnage.toFixed(2)} tonnes`, 14, finalY + 5);

    let notesY = finalY + 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text('NOTES', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50);
    notesY += 5;

    doc.text(`1. BRC Mesh: Based on your calculations, you may require ${brcRollsNeeded} roll(s) of BRC mesh (48m x 2.4m). This is not included in the quote total.`, 14, notesY);
    notesY += 5;

    doc.text('2. Payment: All payments for beams and blocks are to be made to Promax Kenya Limited. Account details will be provided.', 14, notesY);
    notesY += 5;

    if (customPaymentNotes) {
        doc.text(`3. Payment Note: ${customPaymentNotes}`, 14, notesY);
        notesY += 5;
    }

    doc.text(`${customPaymentNotes ? '4' : '3'}. We provide a technician paid by the client.`, 14, notesY);
    notesY += 5;

    if (clientChangeRequestNotes) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('SPECIAL AGREEMENT / REVISION NOTES:', 14, notesY);
        notesY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50);
        doc.text(clientChangeRequestNotes, 14, notesY);
    }

    addPdfBackground(doc);

    doc.save(`SI-LATECH-Quote-${invoiceNumber}.pdf`);
    return true;
};

export const generatePromaxPdf = (data: {
    clientInfo: {
        projectName: string;
        projectLocation: string;
    };
    totals: any;
    perRoomCalculations: any[];
}) => {
    const { clientInfo, totals, perRoomCalculations } = data;
    const doc = new jsPDF();
    const primaryColor = '#0f172a'; // Slate-900
    
    addPdfBackground(doc);
    addLogoToPdf(doc, primaryColor);
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `PROMAX-${String(Date.now()).slice(-6)}`;
    
    const beamAggregates = new Map<number, number>();
    perRoomCalculations.forEach(p => {
        const calcs = p.roomCalcs || p;
        const roomName = p.room?.name || calcs.name || '';
        const isBalcony = roomName.toLowerCase().includes('balcony') || 
                          roomName.toLowerCase().includes('verandah') || 
                          roomName.toLowerCase().includes('velander') || 
                          roomName.toLowerCase().includes('veranda') || 
                          roomName.toLowerCase().includes('velanda');
        
        if (calcs.effectiveBeams) {
            calcs.effectiveBeams.forEach((b: any) => {
                const len = b.invoiceLength || b.length;
                if (!len) return;
                const count = isBalcony ? (b.count * 2) : b.count;
                beamAggregates.set(len, (beamAggregates.get(len) || 0) + count);
            });
        }
    });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('PROMAX MANUFACTURING ORDER', 130, 14);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text(`#${reportNumber}`, 130, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('PROJECT INFO:', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Project Name: ${clientInfo.projectName || 'N/A'}`, 14, 56);
    doc.text(`Location: ${clientInfo.projectLocation || 'N/A'}`, 14, 61);
    doc.text(`Order Date: ${reportDate}`, 14, 66);

    const tableColumn = ['ITEM DESCRIPTION', 'SPECIFICATION / LENGTH', 'QTY REQUIRED', 'UNIT'];
    const tableRows: any[] = [];

    const sortedLengths = Array.from(beamAggregates.keys()).sort((a, b) => b - a);
    sortedLengths.forEach(len => {
        tableRows.push([
            'Prestressed Concrete Beam',
            `${len.toFixed(2)} meters`,
            beamAggregates.get(len),
            'pcs'
        ]);
    });

    tableRows.push([
        'Concrete Hollow Blocks (4x8x16)',
        'Standard Infill Block',
        totals.totalBlocks || 0,
        'pcs'
    ]);

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 76,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
            2: { halign: 'center' },
            3: { halign: 'center' },
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text('AUTHORIZATION & PRODUCTION NOTES:', 14, finalY);
    finalY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text('• Manufactured to SI-LATECH structural engineering standards.', 14, finalY);
    finalY += 5;
    doc.text('• Verify beam lengths on site before loading dispatch trucks.', 14, finalY);

    doc.save(`PROMAX-Order-${reportNumber}.pdf`);
    return true;
};

export const generateProfitRequestPdf = (data: {
    clientInfo: {
        projectName: string;
        projectLocation: string;
        clientName: string;
    };
    totals: {
        beamProfit: number;
        blockCommission: number;
        totalProfit: number;
        totalBeams: number;
        totalBlocks: number;
    };
}) => {
    const { clientInfo, totals } = data;
    const doc = new jsPDF();
    const primaryColor = '#0f172a';
    
    addPdfBackground(doc);
    addLogoToPdf(doc, primaryColor);
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reqNumber = `PRF-${String(Date.now()).slice(-6)}`;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('PROFIT FACILITATION REQUEST', 130, 14);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text(`#${reqNumber}`, 130, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('PROJECT DETAILS:', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client: ${clientInfo.clientName || 'N/A'}`, 14, 56);
    doc.text(`Project: ${clientInfo.projectName || 'N/A'}`, 14, 61);
    doc.text(`Location: ${clientInfo.projectLocation || 'N/A'}`, 14, 66);
    doc.text(`Date Generated: ${reportDate}`, 14, 71);

    const tableColumn = ['PROFIT CATEGORY', 'QUANTITY / VOLUME', 'PROFIT RATE', 'TOTAL PROFIT (KSH)'];
    const tableRows = [
        ['Beam Profit Share', `${(totals.totalBeams || 0).toFixed(2)} LM`, 'KSh 150 / LM', `Ksh ${totals.beamProfit.toLocaleString()}`],
        ['Block Commission', `${totals.totalBlocks || 0} pcs`, 'KSh 5 / pcs', `Ksh ${totals.blockCommission.toLocaleString()}`],
    ];

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 81,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor);
    doc.text('TOTAL REQUESTED PROFIT:', 120, finalY, { align: 'right' });
    doc.text(`Ksh ${totals.totalProfit.toLocaleString()}`, 196, finalY, { align: 'right' });

    doc.save(`Profit-Facilitation-${reqNumber}.pdf`);
    return true;
};

export const generateMaterialSchedulePdf = (data: {
    clientInfo: {
        projectName: string;
        projectLocation: string;
        clientName: string;
    };
    rooms: any[];
    settings: any;
}) => {
    const { clientInfo, rooms, settings } = data;
    const doc = new jsPDF();
    const primaryColor = '#0f172a';
    
    addPdfBackground(doc);
    addLogoToPdf(doc, primaryColor);
    const reportDate = new Date().toLocaleDateString('en-GB');

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('SITE MATERIAL SCHEDULE', 130, 14);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text(`SCHEDULE-${String(Date.now()).slice(-6)}`, 130, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('SITE DETAILS:', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client: ${clientInfo.clientName || 'N/A'}`, 14, 56);
    doc.text(`Project: ${clientInfo.projectName || 'N/A'}`, 14, 61);
    doc.text(`Location: ${clientInfo.projectLocation || 'N/A'}`, 14, 66);
    doc.text(`Date: ${reportDate}`, 14, 71);

    const tableColumn = ['ROOM / AREA', 'SPAN (M)', 'BEAMS (INVOICE)', 'ACTUAL BEAMS', 'BLOCKS (PCS)'];
    const tableRows: any[] = [];

    rooms.forEach((r: any) => {
        const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, 950, r.name);
        tableRows.push([
            r.name,
            `${r.length} x ${r.width}`,
            roomCalcs.invoiceBeamCount,
            roomCalcs.actualBeamCount,
            roomCalcs.totalBlocks
        ]);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 81,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'right' },
        }
    });

    doc.save(`Material-Schedule-${clientInfo.projectName || 'Site'}.pdf`);
    return true;
};
