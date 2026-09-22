import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateProjectTotals, DEFAULTS } from './calculator';

export interface QuoteCalculationResult {
  buffer: Buffer;
  invoiceNumber: string;
  invoiceDate: string;
  totals: {
    totalArea: number;
    totalBlocks: number;
    totalInvoiceBeamLength: number;
    beamPricePerMeter: number;
    blockPrice: number;
    beamsTotal: number;
    blocksTotal: number;
    grandTotal: number;
    currency: string;
  };
  rooms: any[];
}

export async function generateQuotePdfDetails(clientInfo: any, rooms: any[]): Promise<QuoteCalculationResult> {
  const doc = new jsPDF();
  const primaryColor = '#095388';
  const invoiceDate = clientInfo?.invoiceDate || new Date().toLocaleDateString('en-GB');
  const invoiceNumber = clientInfo?.invoiceNumber || clientInfo?.quoteReference || `SILA-${String(Date.now()).slice(-6)}`;
  
  const isTBeam = clientInfo?.beamType === 'tbeam';
  const BLOCK_PRICE = isTBeam ? 100 : 90;
  const BEAM_PRICE_PER_METER = isTBeam ? 1200 : 545;

  const defaultsWithBeamType = { ...DEFAULTS, beamType: clientInfo?.beamType || 'flat' };
  const totals = calculateProjectTotals(rooms, defaultsWithBeamType);
  
  const blocksTotal = totals.totalBlocks * BLOCK_PRICE;
  const beamsTotal = totals.totalInvoiceBeamLength * BEAM_PRICE_PER_METER;
  const grandTotal = blocksTotal + beamsTotal;

  // Header Bar
  doc.setFillColor(9, 83, 136); // #095388
  doc.rect(0, 0, 210, 8, 'F');

  // Company Brand / Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text('SI-LATECH SOLUTIONS', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text('Precast Concrete Beam & Block Slab Systems', 14, 28);

  // Quote Reference & Date Box on top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.text('OFFICIAL QUOTE', 140, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(`Ref: #${invoiceNumber}`, 140, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`Date: ${invoiceDate}`, 140, 31);
  doc.text(`Validity: 30 Days`, 140, 36);

  // Company Contacts on right below header
  doc.setFontSize(8.5);
  doc.setTextColor(100);
  doc.text('Head Office: Ruiru, behind Rubis petrol station', 14, 38);
  doc.text('Tel: +254 741 557 960 | Email: info.silatechsolutions@gmail.com', 14, 43);

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(14, 47, 196, 47);

  // Client Details Section
  let currentY = 55;
  const invoiceToX = 14;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor);
  doc.text('QUOTE ISSUED TO:', invoiceToX, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50);
  doc.text(`Client Name: ${clientInfo.clientName || 'Valued Customer'}`, invoiceToX, currentY);
  currentY += 5;

  const contact = clientInfo.clientContact || clientInfo.phone || clientInfo.contact || 'N/A';
  doc.text(`Contact: ${contact}`, invoiceToX, currentY);
  currentY += 5;

  const location = clientInfo.projectLocation || clientInfo.siteLocation || clientInfo.location;
  if (location) {
    doc.text(`Site Location: ${location}`, invoiceToX, currentY);
    currentY += 5;
  }

  doc.text(`System Specification: ${isTBeam ? 'T-Beam System (No Propping / High Strength)' : 'Flat Beam System (Standard Lightweight)'}`, invoiceToX, currentY);
  currentY += 5;

  const totalAreaDisplay = totals.totalArea ? totals.totalArea.toFixed(2) + ' m²' : (rooms.length + ' room(s)');
  doc.text(`Scope / Area: ${totalAreaDisplay} (${rooms.length} structural bay(s)/room(s))`, invoiceToX, currentY);
  currentY += 10;

  // Invoice Details Table
  autoTable(doc, {
    startY: currentY,
    head: [['Item Description', 'Quantity', 'Unit Rate (KES)', 'Total Amount (KES)']],
    body: [
      [
        isTBeam
          ? 'Precast Concrete T-Beams (Reinforced Heavy Duty)\nLength calculated with standard engineering bearing'
          : 'Precast Concrete Flat Beams (Standard Profile)\nLength calculated with standard engineering bearing',
        totals.totalInvoiceBeamLength.toFixed(2) + ' lm',
        BEAM_PRICE_PER_METER.toLocaleString() + ' / lm',
        beamsTotal.toLocaleString()
      ],
      [
        isTBeam
          ? 'Precast Hollow Concrete Blocks for T-Beams\nHigh-density lightweight infill blocks'
          : 'Precast Hollow Concrete Blocks (Standard 400x220mm)\nHigh-density lightweight infill blocks',
        totals.totalBlocks.toLocaleString() + ' pcs',
        BLOCK_PRICE.toLocaleString() + ' / pc',
        blocksTotal.toLocaleString()
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [9, 83, 136], textColor: 255, fontStyle: 'bold', halign: 'left' },
    styles: { fontSize: 9.5, cellPadding: 6 },
    columnStyles: {
      0: { cellWidth: 92 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Grand Total Summary Box
  doc.setFillColor(245, 248, 252);
  doc.roundedRect(120, currentY, 76, 18, 2, 2, 'F');
  doc.setDrawColor(9, 83, 136);
  doc.setLineWidth(0.5);
  doc.roundedRect(120, currentY, 76, 18, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(9, 83, 136);
  doc.text('ESTIMATED TOTAL:', 124, currentY + 7);

  doc.setFontSize(13);
  doc.setTextColor(9, 83, 136);
  doc.text(`KES ${grandTotal.toLocaleString()}`, 124, currentY + 14);

  currentY += 28;

  // Terms & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text('TERMS & CONDITIONS:', 14, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('1. Validity: This quotation is valid for 30 calendar days from the date of issue.', 14, currentY);
  currentY += 4.5;
  doc.text('2. Materials Included: Quotation covers precast beams and infill hollow blocks specified above.', 14, currentY);
  currentY += 4.5;
  doc.text('3. Payment Terms: 50% deposit required prior to beam casting/preparation; balance payable before dispatch.', 14, currentY);
  currentY += 4.5;
  doc.text('4. Site Readiness: Offloading and ring beam level verification to be confirmed by the site supervisor.', 14, currentY);
  currentY += 8;

  // Footer bar
  doc.setFillColor(9, 83, 136);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255);
  doc.text('SI-LATECH SOLUTIONS | Fast, Cost-Effective & Modern Precast Slab Solutions', 50, 293);

  const arrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    invoiceNumber,
    invoiceDate,
    totals: {
      totalArea: Number((totals.totalArea || 0).toFixed(2)),
      totalBlocks: totals.totalBlocks,
      totalInvoiceBeamLength: Number((totals.totalInvoiceBeamLength || 0).toFixed(2)),
      beamPricePerMeter: BEAM_PRICE_PER_METER,
      blockPrice: BLOCK_PRICE,
      beamsTotal,
      blocksTotal,
      grandTotal,
      currency: 'KES'
    },
    rooms
  };
}

export async function generateQuotePdfBuffer(clientInfo: any, rooms: any[]): Promise<Buffer> {
  const result = await generateQuotePdfDetails(clientInfo, rooms);
  return result.buffer;
}
