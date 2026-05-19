
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const addLogoToPdf = (doc: jsPDF, color: string) => {
    try {
        doc.addImage('/logo.png', 'PNG', 14, 5, 18, 18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(color);
        doc.text('SI-LATECH', 35, 18);
    } catch (e) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(color);
        doc.text('SI-LATECH', 14, 22);
    }
};

let fadedLogoBase64 = '';

if (typeof window !== 'undefined') {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 0.025; // 2.5% opacity for perfect faded watermark look
        ctx.drawImage(img, 0, 0);
        fadedLogoBase64 = canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.error('Failed to pre-fade watermark logo:', e);
    }
  };
  img.src = '/logo.png';
}

export const addPdfBackground = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const backgroundColor = '#ffffff'; 
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(backgroundColor);
        doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
        
        try {
            if (fadedLogoBase64) {
                // Pre-faded base64 has baked-in transparency, rendering perfectly on all mobile phones & laptops
                doc.addImage(fadedLogoBase64, 'PNG', 45, 90, 120, 120, undefined, 'FAST');
            } else {
                // Fallback to GState if base64 is not yet loaded
                if ((doc as any).setGState) {
                    const gState = new (doc as any).GState({ opacity: 0.03 });
                    (doc as any).setGState(gState);
                }
                doc.addImage('/logo.png', 'PNG', 45, 90, 120, 120, undefined, 'FAST');
                if ((doc as any).setGState) {
                    const gStateReset = new (doc as any).GState({ opacity: 1.0 });
                    (doc as any).setGState(gStateReset);
                }
            }
        } catch (e) {
            // Skip watermark if image fails
        }
    }
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
    perRoomCalculations: any[];
}) => {
    const { invoiceNumber, clientInfo, totals, perRoomCalculations } = data;
    const doc = new jsPDF();
    const primaryColor = '#0f172a'; // Slate-900 for text
    const accentColor = '#0ea5e9'; // Sky Blue
    
    addPdfBackground(doc);
    addLogoToPdf(doc, primaryColor);

    const invoiceDate = new Date().toLocaleDateString('en-GB');

    // Safety check for totals
    const safeTotals = totals || {
        totalInvoiceBeamLength: 0,
        totalBlocks: 0,
        totalArea: 0,
    };

    // Header Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('OFFICIAL QUOTE', 145, 14);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text(`#${invoiceNumber}`, 145, 22);

    // Client Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('BILL TO:', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(clientInfo.clientName, 14, 56);
    doc.text(clientInfo.projectName, 14, 61);
    doc.text(clientInfo.projectLocation, 14, 66);
    doc.text(`Contact: ${clientInfo.clientContact}`, 14, 71);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('SHIP TO:', 100, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(clientInfo.projectName, 100, 56);
    doc.text(clientInfo.projectLocation, 100, 61);
    doc.text(`Attn: ${clientInfo.contactPerson}`, 100, 66);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('DATE:', 145, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(invoiceDate, 145, 56);

    // Table
    const tableColumn = ['DESCRIPTION', 'QTY', 'UNIT', 'RATE', 'AMOUNT'];
    const tableRows = [
        ['Prestressed Concrete Beams', (safeTotals.totalInvoiceBeamLength || 0).toFixed(2), 'm', '545.00', ((safeTotals.totalInvoiceBeamLength || 0) * 545).toLocaleString()],
        ['Concrete Hollow Blocks (4x8x16)', (safeTotals.totalBlocks || 0), 'pcs', '85.00', ((safeTotals.totalBlocks || 0) * 85).toLocaleString()],
    ];

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;
    const grandTotal = ((safeTotals.totalInvoiceBeamLength || 0) * 545) + ((safeTotals.totalBlocks || 0) * 85);

    // Totals Section
    const totalsX = 145;
    const totalsValueX = 196;
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL: ', totalsX, finalY, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString()}`, totalsValueX, finalY, { align: 'right' });

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
        const clearLength = isBalcony ? calcs.longer : calcs.shorter;
        const length = calcs.individualBeamLength ?? (typeof clearLength === 'number' && clearLength > 0 ? clearLength + 0.20 : 0);
        const count = typeof calcs.actualBeamCount === 'number' ? calcs.actualBeamCount : 0;
        if (length > 0) {
            beamAggregates.set(length, (beamAggregates.get(length) || 0) + count);
        }
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor);
    doc.text('PROMAX MANUFACTURING ORDER', 14, 40);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${clientInfo.projectName}`, 14, 50);
    doc.text(`Location: ${clientInfo.projectLocation}`, 14, 55);
    doc.text(`Date: ${reportDate}`, 14, 60);
    doc.text(`Order ID: ${reportNumber}`, 145, 60);

    const beamColumn = ['DESCRIPTION', 'LENGTH (M)', 'QUANTITY', 'TOTAL LM'];
    const beamRows = Array.from(beamAggregates.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([length, count]) => ([
            'Prestressed Beam',
            (length || 0).toFixed(2),
            `${count} pcs`,
            ((length || 0) * count).toFixed(2)
        ]));

    (doc as any).autoTable({
        head: [beamColumn],
        body: beamRows,
        startY: 70,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL BLOCK REQUIREMENTS:', 14, finalY);
    doc.text(`${(totals?.totalBlocks || 0).toLocaleString()} pcs`, 196, finalY, { align: 'right' });
    
    finalY += 10;
    doc.setDrawColor(200);
    doc.line(14, finalY, 196, finalY);

    finalY += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('Note: Beam quantities are based on actual physical room spans. Block quantities include standard project allowance.', 14, finalY);

    doc.save(`Promax-Breakdown-${reportNumber}.pdf`);
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
    const primaryColor = '#095388'; // Brand blue
    
    addPdfBackground(doc);
    addLogoToPdf(doc, primaryColor);
    
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `PR-SILA-${String(Date.now()).slice(-6)}`;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor);
    doc.text('COMMISSION REQUEST INVOICE', 14, 45);

    // Bill To Section (Promax)
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text('BILL TO:', 14, 60);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('PROMAX KENYA LTD', 14, 66);
    doc.setFont('helvetica', 'normal');
    doc.text('Nairobi, Kenya', 14, 71);

    // Project Info Section
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('PROJECT REFERENCE:', 100, 60);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Project: ${clientInfo.projectName}`, 100, 66);
    doc.text(`Client: ${clientInfo.clientName}`, 100, 71);
    doc.text(`Location: ${clientInfo.projectLocation}`, 100, 76);

    // Metadata
    doc.setFont('helvetica', 'bold');
    doc.text('DATE:', 155, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceDate, 175, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('REF NO:', 155, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNumber, 175, 66);

    // Table
    const tableColumn = ['DESCRIPTION', 'DETAILS', 'UNIT RATE', 'TOTAL AMOUNT (KSH)'];
    const tableRows = [
        [
            'Beam Commission (Extra Meterage)', 
            `${totals.totalBeams.toFixed(2)} m (billed)`, 
            'Calculated', 
            totals.beamProfit.toLocaleString()
        ],
        [
            'Block Commission', 
            `${totals.totalBlocks} pcs`, 
            '5.00 / pc', 
            totals.blockCommission.toLocaleString()
        ]
    ];

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
            3: { halign: 'right' }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    // Total Amount Due
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('TOTAL AMOUNT DUE:', 14, finalY);
    doc.setFontSize(14);
    doc.text(`Ksh ${totals.totalProfit.toLocaleString()}`, 196, finalY, { align: 'right' });

    // Footer
    const footerY = 270;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('This invoice is a formal request for commission and rebates on the referenced project.', 14, footerY);
    doc.text('Please process the payment as per the agreed terms.', 14, footerY + 5);

    doc.save(`Commission-Request-${clientInfo.projectName}-${invoiceNumber}.pdf`);
    return true;
};
