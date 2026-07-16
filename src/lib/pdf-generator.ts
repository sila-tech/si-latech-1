import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateProjectTotals, DEFAULTS } from './calculator';

export async function generateQuotePdfBuffer(clientInfo: any, rooms: any[]): Promise<Buffer> {
  const doc = new jsPDF();
  const primaryColor = '#095388';
  const invoiceDate = new Date().toLocaleDateString('en-GB');
  const invoiceNumber = `SILA-${String(Date.now()).slice(-6)}`;
  
  const isTBeam = clientInfo?.beamType === 'tbeam';
  const BLOCK_PRICE = isTBeam ? 110 : 85;
  const BEAM_PRICE_PER_METER = isTBeam ? 1250 : 520;

  const defaultsWithBeamType = { ...DEFAULTS, beamType: clientInfo?.beamType || 'flat' };
  const totals = calculateProjectTotals(rooms, defaultsWithBeamType);
  
  const blocksTotal = totals.totalBlocks * BLOCK_PRICE;
  const beamsTotal = totals.totalInvoiceBeamLength * BEAM_PRICE_PER_METER;
  const grandTotal = blocksTotal + beamsTotal;

  // Header
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

  let currentY = 50;
  const invoiceToX = 14;
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('QUOTE TO', invoiceToX, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50);
  doc.text(`Client Name: ${clientInfo.clientName || 'Customer'}`, invoiceToX, currentY);
  currentY += 5;
  doc.text(`Contact: ${clientInfo.clientContact || 'N/A'}`, invoiceToX, currentY);
  currentY += 15;

  // Invoice Details
  autoTable(doc, {
    startY: currentY,
    head: [['Description', 'Quantity', 'Unit Price (KES)', 'Total (KES)']],
    body: [
      [isTBeam ? 'Precast Concrete T-Beams (Linear Meters)' : 'Precast Concrete Flat Beams (Linear Meters)', totals.totalInvoiceBeamLength.toFixed(2) + 'm', BEAM_PRICE_PER_METER.toString(), beamsTotal.toLocaleString()],
      [isTBeam ? 'Concrete Hollow Blocks for T-Beams (Pieces)' : 'Hollow Concrete Blocks (Pieces)', totals.totalBlocks.toString(), BLOCK_PRICE.toString(), blocksTotal.toLocaleString()]
    ],
    theme: 'grid',
    headStyles: { fillColor: [9, 83, 136], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Grand Total
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.text('TOTAL:', 130, currentY);
  doc.text(`KES ${grandTotal.toLocaleString()}`, 160, currentY);

  currentY += 20;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Thank you for choosing SI-LATECH Solutions.', 14, currentY);
  doc.text('Note: This quote is valid for 30 days and includes material costs only.', 14, currentY + 5);

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
