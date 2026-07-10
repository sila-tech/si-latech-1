
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calculateProjectTotals } from './calculator';

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

    const isTBeam = safeTotals.beamType === 'tbeam';
    const BEAM_PRICE = isTBeam ? 1250 : 520;
    const BLOCK_PRICE = isTBeam ? 110 : 85;

    // Table
    const tableColumn = ['DESCRIPTION', 'QTY', 'UNIT', 'RATE', 'AMOUNT'];
    const tableRows = [
        [isTBeam ? 'Prestressed Concrete T-Beams' : 'Prestressed Concrete Beams', (safeTotals.totalInvoiceBeamLength || 0).toFixed(2), 'm', BEAM_PRICE.toFixed(2), ((safeTotals.totalInvoiceBeamLength || 0) * BEAM_PRICE).toLocaleString()],
        [isTBeam ? 'Concrete Hollow Blocks for T-Beams (4x8x16)' : 'Concrete Hollow Blocks (4x8x16)', (safeTotals.totalBlocks || 0), 'pcs', BLOCK_PRICE.toFixed(2), ((safeTotals.totalBlocks || 0) * BLOCK_PRICE).toLocaleString()],
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
    const grandTotal = ((safeTotals.totalInvoiceBeamLength || 0) * BEAM_PRICE) + ((safeTotals.totalBlocks || 0) * BLOCK_PRICE);

    // Totals Section
    const totalsX = 145;
    const totalsValueX = 196;
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL: ', totalsX, finalY, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString()}`, totalsValueX, finalY, { align: 'right' });

    const beamWeight = (safeTotals.totalInvoiceBeamLength || 0) * 18;
    const blockWeight = (safeTotals.totalBlocks || 0) * 12;
    const approxTonnage = (beamWeight + blockWeight) / 1000;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Approx. Weight: ~${approxTonnage.toFixed(2)} tonnes`, totalsValueX, finalY + 8, { align: 'right' });

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

export const generateMaterialSchedulePdf = (data: {
    clientInfo: {
        clientName: string;
        projectName: string;
        projectLocation: string;
        selectedFloor?: string;
    };
    rooms: any[];
    settings: any;
}) => {
    const { clientInfo, rooms, settings } = data;
    const doc = new jsPDF();
    const primaryColor = '#095388';
    const scheduleDate = new Date().toLocaleDateString('en-GB');
    const scheduleNumber = `MAT-${String(Date.now()).slice(-6)}`;

    const renderFloorMaterialPage = (pageTitle: string, pageTotals: any) => {
      const { totalConcreteVolume, totalCementBags, totalSandTonnes, totalBallastTonnes, brc, lintel, timber, lintelSteel } = pageTotals;
      
      const combinedCementBags = totalCementBags + lintel.cementBags;
      const combinedSandTonnes = totalSandTonnes + lintel.sandTonnes;
      const combinedBallastTonnes = totalBallastTonnes + lintel.ballastTonnes;
      const combinedWetVolume = totalConcreteVolume + lintel.wetVolume;

      addLogoToPdf(doc, primaryColor);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor);
      doc.text(pageTitle, 60, 22);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('PROJECT DETAILS', 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      doc.text(`Client: ${clientInfo.clientName || 'N/A'}`, 14, 61);
      doc.text(`Project: ${clientInfo.projectName || 'N/A'}`, 14, 66);
      doc.text(`Location: ${clientInfo.projectLocation || 'N/A'}`, 14, 71);

      doc.text(`Schedule No.: ${scheduleNumber}`, 145, 61);
      doc.text(`Date: ${scheduleDate}`, 145, 66);

      const tableColumn = ['MATERIAL', 'QUANTITY', 'UNIT', 'NOTES'];
      const tableRows = [
        ['Cement (50kg bags)', combinedCementBags, 'bags', 'Includes slab & lintels, plus 10% wastage'],
        ['Sand', combinedSandTonnes.toFixed(2), 'tonnes', 'Includes slab & lintels, plus 10% wastage'],
        ['Ballast / Coarse Aggregate', combinedBallastTonnes.toFixed(2), 'tonnes', 'Includes slab & lintels, plus 10% wastage'],
        ['BRC Mesh A98', brc?.rollsNeeded || 0, 'rolls', `For a total slab area of ${(pageTotals.totalArea || 0).toFixed(2)} m²`],
        ['Total Wet Concrete Volume', combinedWetVolume.toFixed(3), 'm³', 'Excludes wastage, for mixing reference'],
        [`D${lintelSteel?.longitudinal?.diameter || 12} Steel Bars`, lintelSteel?.longitudinal?.barsToOrder || 0, 'pcs', `12m lengths for lintel longitudinals`],
        [`D${lintelSteel?.stirrups?.diameter || 8} Steel Bars`, lintelSteel?.stirrups?.barsToOrder || 0, 'pcs', `12m lengths for lintel stirrups`],
        ['3x2 Timber', `${(timber?.total3x2m || 0).toFixed(2)}m (${(timber?.total3x2ft || 0).toFixed(2)} ft)`, 'length', `${timber?.total3x2pieces || 0} total pieces`],
        ['6x1 Timber', `${(timber?.total6x1m || 0).toFixed(2)}m (${(timber?.total6x1ft || 0).toFixed(2)} ft)`, 'length', 'For slab side shuttering'],
        ['Props', timber?.totalProps || 0, 'pcs', 'For supporting 3x2 timbers'],
      ];

      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: {
          1: { halign: 'right' },
        }
      });

      let finalY = (doc as any).lastAutoTable.finalY;
      
      finalY += 15;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('NOTES', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      finalY += 6;
      doc.text('1. All quantities are estimates. Verify with site measurements before ordering.', 14, finalY);
      finalY += 6;
      doc.text('2. This schedule includes materials for the beam & block slab, wall lintels, and timber formwork.', 14, finalY);
      finalY += 6;
      doc.text('3. Steel bar quantities are for lintels only and include 5% wastage. Order standard 12m lengths.', 14, finalY);
    };

    const selectedFloor = clientInfo.selectedFloor || 'all';
    
    // Fallback totals calculation if rooms/settings are valid
    let totals = { totalArea: 0, totalConcreteVolume: 0, totalCementBags: 0, totalSandTonnes: 0, totalBallastTonnes: 0, brc: { rollsNeeded: 0 }, lintel: { cementBags: 0, sandTonnes: 0, ballastTonnes: 0, wetVolume: 0 }, timber: { total3x2m: 0, total3x2ft: 0, total3x2pieces: 0, total6x1m: 0, total6x1ft: 0, totalProps: 0 }, lintelSteel: { longitudinal: { diameter: 12, barsToOrder: 0 }, stirrups: { diameter: 8, barsToOrder: 0 } } };
    
    if (rooms && rooms.length > 0 && settings) {
        totals = calculateProjectTotals(rooms, settings, 0);
    }

    const uniqueFloors = Array.from(new Set((rooms || []).map(r => {
      if (r.name && r.name.includes(':')) {
        return r.name.split(':')[0].trim();
      }
      return '';
    }).filter(Boolean)));

    if (selectedFloor === 'separate' && uniqueFloors.length > 1) {
      uniqueFloors.forEach((floor, idx) => {
        if (idx > 0) {
          doc.addPage();
        }
        const floorRooms = rooms.filter(r => r.name.startsWith(floor + ':'));
        const floorTotals = calculateProjectTotals(floorRooms, settings, 0);
        renderFloorMaterialPage(`Materials Schedule - ${floor.toUpperCase()}`, floorTotals);
      });

      // Add combined summary page at the end
      doc.addPage();
      renderFloorMaterialPage('Consolidated Materials Schedule (Combined)', totals);
    } else if (selectedFloor !== 'all' && selectedFloor !== 'separate') {
      // Single specific floor
      const floorRooms = rooms.filter(r => r.name.startsWith(selectedFloor + ':'));
      const floorTotals = calculateProjectTotals(floorRooms, settings, 0);
      renderFloorMaterialPage(`Materials Schedule - ${selectedFloor.toUpperCase()}`, floorTotals);
    } else {
      // Combined quote (single page)
      renderFloorMaterialPage('Consolidated Materials Schedule', totals);
    }

    addPdfBackground(doc);
    doc.save(`SI-LATECH-Material-Schedule-${scheduleNumber}.pdf`);
    return true;
};
