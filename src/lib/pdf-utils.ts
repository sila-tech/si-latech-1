
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const addLogoToPdf = (doc: jsPDF, color: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(color);
    doc.text('SI-LATECH', 14, 22);
};

export const addPdfBackground = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const backgroundColor = '#ffffff'; 
    doc.setFillColor(backgroundColor);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
    }
};

export const generateInvoicePdf = (data: {
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
    doc.text('ESTIMATE / INVOICE', 145, 14);
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
        ['Prestressed Concrete Beams', (safeTotals.totalInvoiceBeamLength || 0).toFixed(2), 'm', '750.00', ((safeTotals.totalInvoiceBeamLength || 0) * 750).toLocaleString()],
        ['Concrete Hollow Blocks (4x8x16)', (safeTotals.totalBlocks || 0), 'pcs', '135.00', ((safeTotals.totalBlocks || 0) * 135).toLocaleString()],
        ['Technician Installation Fee', (safeTotals.totalArea || 0).toFixed(2), 'm²', '150.00', ((safeTotals.totalArea || 0) * 150).toLocaleString()],
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
    const grandTotal = ((safeTotals.totalInvoiceBeamLength || 0) * 750) + ((safeTotals.totalBlocks || 0) * 135) + ((safeTotals.totalArea || 0) * 150);

    // Totals Section
    const totalsX = 145;
    const totalsValueX = 196;
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL: ', totalsX, finalY, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString()}`, totalsValueX, finalY, { align: 'right' });

    doc.save(`SI-LATECH-Invoice-${invoiceNumber}.pdf`);
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
        const length = typeof calcs.shorter === 'number' ? calcs.shorter : 0;
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
