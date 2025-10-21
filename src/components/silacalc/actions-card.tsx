
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  Upload,
  FileText,
  Loader2,
  Wand2,
  List,
  FileDown,
  Warehouse,
} from 'lucide-react';
import { handlePlanUpload, handleGenerateQuote } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import type { Room, RoomCalculation, ConcreteCalculation, BrcCalculation, AggregatedRoomGroup } from '@/lib/calculator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type PerRoomCalculation = {
  room: Room;
  roomCalcs: RoomCalculation;
  concreteCalcs: ConcreteCalculation;
  brcCalcs: BrcCalculation;
};

type ActionsCardProps = {
  rooms: Room[];
  totals: {
    totalArea: number;
    totalBlocks: number;
    totalBeamLength: number;
    totalConcreteVolume: number;
    totalCementBags: number;
    totalSandTonnes: number;
    totalBallastTonnes: number;
    totalSandWheelbarrows: number;
    totalBallastWheelbarrows: number;
    brc: { rollsNeeded: number };
  };
  setRooms: (rooms: { name: string; length: number; width: number }[]) => void;
  perRoomCalculations: PerRoomCalculation[];
  aggregatedBreakdown: AggregatedRoomGroup[];
};

type ClientInfo = {
  clientName: string;
  projectName: string;
  projectLocation: string;
  clientContact: string;
  contactPerson: string;
};

function SubmitButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={pending}>
      {pending && <Loader2 className="mr-2 animate-spin" />}
      {children}
    </Button>
  );
}

const ClientInfoDialog = ({ onGenerateClick, title, description, open, onOpenChange }: { onGenerateClick: (clientInfo: ClientInfo) => void; title: string; description: string; open: boolean, onOpenChange: (open: boolean) => void; }) => {
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: '',
    projectName: '',
    projectLocation: '',
    clientContact: '',
    contactPerson: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setClientInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleGenerate = () => {
    onGenerateClick(clientInfo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" value={clientInfo.clientName} onChange={handleChange} placeholder="e.g., John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientContact">Client Contact</Label>
              <Input id="clientContact" value={clientInfo.clientContact} onChange={handleChange} placeholder="e.g., +254 7..."/>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" value={clientInfo.projectName} onChange={handleChange} placeholder="e.g., Residential House"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectLocation">Project Location</Label>
            <Input id="projectLocation" value={clientInfo.projectLocation} onChange={handleChange} placeholder="e.g., Karen, Nairobi" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Site Contact Person</Label>
            <Input id="contactPerson" value={clientInfo.contactPerson} onChange={handleChange} placeholder="e.g., Site Foreman" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleGenerate}>Generate & Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export function ActionsCard({ totals, setRooms, perRoomCalculations, aggregatedBreakdown }: ActionsCardProps) {
  const { toast } = useToast();
  const [isInvoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isBreakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  const [isAggregatedDialogOpen, setAggregatedDialogOpen] = useState(false);
  

  const handleDownloadInvoice = (clientInfo: ClientInfo) => {
    const { totalBlocks, totalBeamLength } = totals;
    const doc = new jsPDF();
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `SILA-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    const BLOCK_PRICE = 85;
    const BEAM_PRICE_PER_METER = 545;
    const VAT_RATE = 0.16;

    const blocksTotal = totalBlocks * BLOCK_PRICE;
    const beamsTotal = totalBeamLength * BEAM_PRICE_PER_METER;
    const subtotal = blocksTotal + beamsTotal;
    const vat = subtotal * VAT_RATE;
    const grandTotal = subtotal + vat;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text('SI-LATECH', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Beam & Block Slab Quotation / Tax Invoice', 14, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Head Office: Juja, Kenya', 145, 20);
    doc.text('Tel: +254 741 557960', 145, 25);
    doc.text('Email: info@silatech.co.ke', 145, 30);
    doc.text('VAT Registration No.: P051XXXXXXX', 145, 35);

    const invoiceToX = 14;
    const shipToX = 110;
    const startY = 45;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('INVOICE TO', invoiceToX, startY);
    doc.text('SHIP / SITE TO', shipToX, startY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client Name: ${clientInfo.clientName}`, invoiceToX, startY + 6);
    doc.text(`Project Name: ${clientInfo.projectName}`, invoiceToX, startY + 11);
    doc.text(`Location: ${clientInfo.projectLocation}`, invoiceToX, startY + 16);
    doc.text(`Contact: ${clientInfo.clientContact}`, invoiceToX, startY + 21);

    doc.text(`Site Name: ${clientInfo.projectName}`, shipToX, startY + 6);
    doc.text(`Address: ${clientInfo.projectLocation}`, shipToX, startY + 11);
    doc.text(`Contact Person: ${clientInfo.contactPerson}`, shipToX, startY + 16);
    
    const metaX = 14;
    const metaY = startY + 30;
    doc.text(`Invoice No.:`, metaX, metaY);
    doc.text(`Date:`, metaX, metaY + 5);
    doc.text(`Terms:`, metaX, metaY + 10);
    doc.text(`Due Date:`, metaX, metaY + 15);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoiceNumber}`, metaX + 30, metaY);
    doc.text(`${invoiceDate}`, metaX + 30, metaY + 5);
    doc.text(`Due on Receipt`, metaX + 30, metaY + 10);
    doc.text(`${invoiceDate}`, metaX + 30, metaY + 15);

    const tableColumn = ['DATE', 'DESCRIPTION', 'VAT', 'QTY', 'UNIT', 'RATE (KSH)', 'AMOUNT (KSH)'];
    const tableRows = [
      [invoiceDate, 'Beam & Block Slab Works – Blocks', '16% S', totalBlocks, 'pcs', BLOCK_PRICE.toFixed(2), blocksTotal.toFixed(2)],
      [invoiceDate, 'Flat Beams (in metres)', '16% S', totalBeamLength.toFixed(2), 'm', BEAM_PRICE_PER_METER.toFixed(2), beamsTotal.toFixed(2)],
    ];

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: metaY + 25,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY;
    const totalsX = 130;
    const totalsValueX = 200;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SUBTOTAL: ', totalsX, finalY + 10, { align: 'right' });
    doc.text(`Ksh ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 10, { align: 'right' });
    doc.text('VAT @16%: ', totalsX, finalY + 15, { align: 'right' });
    doc.text(`Ksh ${vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 15, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL: ', totalsX, finalY + 22, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 22, { align: 'right' });
    
    doc.setFillColor(240,240,240);
    doc.roundedRect(totalsX - 60, finalY + 27, 85, 10, 3, 3, 'F');
    doc.text('BALANCE DUE: ', totalsX, finalY + 33, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 33, { align: 'right' });

    finalY = finalY + 45;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('VAT SUMMARY', 14, finalY);
    (doc as any).autoTable({
      head: [['RATE', 'VAT (Ksh)', 'NET (Ksh)']],
      body: [['16%', vat.toFixed(2), subtotal.toFixed(2)]],
      startY: finalY + 2,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
      bodyStyles: { textColor: 50 },
      tableWidth: 80,
    });
    
    finalY = (doc as any).lastAutoTable.finalY;

    finalY = Math.max(finalY, finalY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('NOTES', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    finalY += 5;
    doc.text(`1. BRC Mesh: Based on your calculations, you may require ${totals.brc.rollsNeeded} roll(s) of BRC mesh. This is not included in the total.`, 14, finalY);
    finalY += 5;
    doc.text('2. Payment: All payments for beam and blocks are to be made to Promax Kenya Ltd. Account details will be provided.', 14, finalY);

    doc.save(`SI-LATECH-Invoice-${invoiceNumber}.pdf`);
    setInvoiceDialogOpen(false);
  };

  const handleDownloadMaterialSchedule = (clientInfo: ClientInfo) => {
    const { totalConcreteVolume, totalCementBags, totalSandTonnes, totalBallastTonnes, brc } = totals;
    const doc = new jsPDF();
    const scheduleDate = new Date().toLocaleDateString('en-GB');
    const scheduleNumber = `MAT-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text('SI-LATECH', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Slab Materials Schedule', 14, 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('PROJECT DETAILS', 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client: ${clientInfo.clientName}`, 14, 51);
    doc.text(`Project: ${clientInfo.projectName}`, 14, 56);
    doc.text(`Location: ${clientInfo.projectLocation}`, 14, 61);

    doc.text(`Schedule No.: ${scheduleNumber}`, 145, 51);
    doc.text(`Date: ${scheduleDate}`, 145, 56);

    const tableColumn = ['MATERIAL', 'QUANTITY', 'UNIT', 'NOTES'];
    const tableRows = [
      ['Cement (50kg bags)', totalCementBags, 'bags', 'Includes 10% wastage'],
      ['Sand', totalSandTonnes.toFixed(3), 'tonnes', 'Includes 10% wastage'],
      ['Ballast', totalBallastTonnes.toFixed(3), 'tonnes', 'Includes 10% wastage'],
      ['BRC Mesh A98', brc.rollsNeeded, 'rolls', `For a total area of ${totals.totalArea.toFixed(2)} m²`],
      ['Total Concrete Needed', totalConcreteVolume.toFixed(3), 'm³', 'Excludes wastage, for mixing reference'],
    ];

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 70,
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
    doc.text('2. This schedule is for materials required for the slab only and excludes other structural elements.', 14, finalY);

    doc.save(`SI-LATECH-Material-Schedule-${scheduleNumber}.pdf`);
    setScheduleDialogOpen(false);
  };

  const handleDownloadBreakdownReport = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `BRK-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text('SI-LATECH CONSTRUCTION LTD', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Beam & Block Breakdown Report', 14, 30);

    doc.setFontSize(10);
    doc.text(`Project Name: ${clientInfo.projectName}`, 14, 40);
    doc.text(`Client: ${clientInfo.clientName}`, 14, 45);
    doc.text(`Date: ${reportDate}`, 14, 50);

    let currentY = 60;

    perRoomCalculations.forEach(({ room, roomCalcs, concreteCalcs, brcCalcs }) => {
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor);
      doc.text(`Room: ${room.name} — ${roomCalcs.shorter.toFixed(2)} m × ${roomCalcs.longer.toFixed(2)} m`, 14, currentY);
      currentY += 8;

      const body = [
          [`Beams:`, `${roomCalcs.shorter.toFixed(2)} m × ${roomCalcs.beamCount} beams`],
          [`Total beam length:`, `${roomCalcs.totalBeamLength.toFixed(2)} m`],
          [`Blocks:`, `${roomCalcs.totalBlocks} pcs`],
          [`Concrete volume (beams + topping):`, `${concreteCalcs.totalConcrete.toFixed(3)} m³`],
          [`BRC (A98, ${brcCalcs.areaPerRoll} m² per roll):`, `${brcCalcs.rollsNeeded} rolls`],
          [`Cement:`, `${concreteCalcs.cementBags} bags (50 kg)`],
          [`Sand:`, `${concreteCalcs.sandTonnes.toFixed(2)} t — ${concreteCalcs.sandWheelbarrows} wheelbarrows`],
          [`Ballast:`, `${concreteCalcs.ballastTonnes.toFixed(2)} t — ${concreteCalcs.ballastWheelbarrows} wheelbarrows`],
      ];
      
      (doc as any).autoTable({
          startY: currentY,
          body: body,
          theme: 'plain',
          styles: { fontSize: 10, cellPadding: 1, overflow: 'linebreak' },
          columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 80 },
              1: { cellWidth: 'auto' }
          },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('PROJECT TOTALS', 14, currentY);
    currentY += 7;

    const totalsBody = [
        ['Total blocks:', `${totals.totalBlocks} pcs`],
        ['Total beam length:', `${totals.totalBeamLength.toFixed(2)} m`],
        ['Total concrete:', `${totals.totalConcreteVolume.toFixed(3)} m³`],
        ['Total BRC rolls:', `${totals.brc.rollsNeeded} rolls`],
        ['Total cement:', `${totals.totalCementBags} bags`],
        ['Total sand:', `${totals.totalSandTonnes.toFixed(2)} t — ${totals.totalSandWheelbarrows} wb`],
        ['Total ballast:', `${totals.totalBallastTonnes.toFixed(2)} t — ${totals.totalBallastWheelbarrows} wb`],
    ];

    (doc as any).autoTable({
        startY: currentY,
        body: totalsBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { cellWidth: 'auto' }
        }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text('NOTES', 14, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50);
    const notes = [
      'Beams are placed parallel to the shorter side, spaced at 0.6 m.',
      'Blocks measure 400 mm × 200 mm, laid between beams.',
      'All quantities are rounded up to the nearest whole piece.',
      'This report is for estimation and site guidance only.',
    ];
    notes.forEach(note => {
      doc.text(note, 14, currentY);
      currentY += 5;
    });

    doc.save(`SI-LATECH-Breakdown-Report-${reportNumber}.pdf`);
    setBreakdownDialogOpen(false);
  };
  
  const handleDownloadAggregatedBreakdown = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `AGGR-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text('SI-LATECH CONSTRUCTION LTD', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Aggregated Beams & Blocks Breakdown', 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Project Name: ${clientInfo.projectName}`, 14, 40);
    doc.text(`Client: ${clientInfo.clientName}`, 14, 45);
    doc.text(`Date: ${reportDate}`, 14, 50);

    let currentY = 60;

    aggregatedBreakdown.forEach(group => {
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor);
        doc.text(`Room Size: ${group.shorter.toFixed(2)} m × ${group.longer.toFixed(2)} m — Count: ${group.roomCount} rooms`, 14, currentY);
        currentY += 8;

        const body = [
            [`Beams:`, `${group.beamLengthEach.toFixed(2)} m × ${group.beamsPerRoom} beams × ${group.roomCount} rooms`],
            [`Total beams (group):`, `${group.totalBeams} beams`],
            [`Total beam length (group):`, `${group.totalBeamLength.toFixed(2)} m`],
            [],
            [`Blocks:`, `${group.blocksPerRoom} pcs × ${group.roomCount} rooms`],
            [`Total blocks (group):`, `${group.totalBlocks} pcs`],
        ];
        
        (doc as any).autoTable({
            startY: currentY,
            body: body,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1, overflow: 'linebreak' },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80 },
                1: { cellWidth: 'auto' }
            },
        });
        currentY = (doc as any).lastAutoTable.finalY;
        doc.setDrawColor(200);
        doc.line(14, currentY + 5, 196, currentY + 5);
        currentY += 10;
    });

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('PROJECT TOTALS', 14, currentY);
    currentY += 7;

    const totalBeams = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBeams, 0);
    const totalBeamLength = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBeamLength, 0);
    const totalBlocks = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBlocks, 0);

    const totalsBody = [
        ['Total distinct room sizes:', `${aggregatedBreakdown.length}`],
        ['Total beams (all groups):', `${totalBeams} beams`],
        ['Total beam length (all):', `${totalBeamLength.toFixed(2)} m`],
        ['Total blocks (all):', `${totalBlocks} pcs`],
    ];

    (doc as any).autoTable({
        startY: currentY,
        body: totalsBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { cellWidth: 'auto' }
        }
    });

    doc.save(`SI-LATECH-Aggregated-Report-${reportNumber}.pdf`);
    setAggregatedDialogOpen(false);
  };


  const [uploadState, uploadFormAction] = useActionState(handlePlanUpload, { message: '' });
  const [quoteState, quoteFormAction] = useActionState(handleGenerateQuote, { message: '' });
  
  const uploadDialogCloseRef = useRef<HTMLButtonElement>(null);
  const [isQuoteResultOpen, setQuoteResultOpen] = useState(false);

  useEffect(() => {
    if (uploadState.message && uploadState.data) {
      toast({
        title: 'Success',
        description: uploadState.message,
      });
      if (uploadState.data?.floors) {
        const allRooms = uploadState.data.floors.flatMap(floor => 
            floor.rooms.map(room => ({...room, name: `${floor.floorName} - ${room.name}`}))
        );
        setRooms(allRooms);
      }
      uploadDialogCloseRef.current?.click();
    }
    if (uploadState.error) {
      toast({
        title: 'Upload Error',
        description: uploadState.error,
        variant: 'destructive',
      });
    }
  }, [uploadState, toast, setRooms]);

  useEffect(() => {
    if (quoteState.message && quoteState.data) {
      toast({
        title: 'Success',
        description: quoteState.message,
      });
      setQuoteResultOpen(true);
    }
    if (quoteState.error) {
      toast({
        title: 'Quote Error',
        description: quoteState.error,
        variant: 'destructive',
      });
    }
  }, [quoteState, toast]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Project Actions</CardTitle>
          <CardDescription>
            Generate documents, use AI to analyze plans, or get a quote.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Button variant="secondary" className="w-full" onClick={() => setInvoiceDialogOpen(true)}>
            <Download /> Download Invoice
          </Button>
          
          <Button variant="outline" className="w-full" onClick={() => setScheduleDialogOpen(true)}>
            <List /> Material Schedule
          </Button>

          <Button variant="outline" className="w-full" onClick={() => setBreakdownDialogOpen(true)}>
              <FileDown /> Detailed Report
          </Button>
          
          <Button variant="outline" className="w-full" onClick={() => setAggregatedDialogOpen(true)}>
              <Warehouse /> Aggregated Report
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Upload /> Upload Plan (AI)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Analyze Building Plan</DialogTitle>
                <DialogDescription>
                  Upload a PDF or image of your building plan. Our AI will analyze
                  it and automatically populate the room dimensions.
                </DialogDescription>
              </DialogHeader>
              <form action={uploadFormAction} className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="planFile">Plan File</Label>
                  <Input id="planFile" name="planFile" type="file" required accept=".pdf,image/*"/>
                </div>
                <DialogFooter>
                  <DialogClose ref={uploadDialogCloseRef} asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <SubmitButton>
                    <Wand2 /> Analyze
                  </SubmitButton>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="accent" className="w-full">
                <FileText /> Generate Quote (AI)
              </Button>
            </DialogTrigger>
            <DialogContent>
               <form action={quoteFormAction}>
                  <DialogHeader>
                    <DialogTitle>Generate Monetary Quote</DialogTitle>
                    <DialogDescription>
                      Enter your region to get an AI-generated quote based on the
                      calculated material quantities.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-4">
                    <Label htmlFor="region">Region</Label>
                    <Input id="region" name="region" placeholder="e.g., Nairobi, Kenya" required/>
                    {quoteState?.error && <p className="text-sm text-destructive mt-1">{quoteState.error}</p>}
                  </div>
                  {/* Hidden inputs to pass totals */}
                  <input type="hidden" name="blocks" value={totals.totalBlocks} />
                  <input type="hidden" name="beamLength" value={totals.totalBeamLength} />
                  <input type="hidden" name="concreteVolume" value={totals.totalConcreteVolume} />
                  <input type="hidden" name="brcRolls" value={totals.brc.rollsNeeded} />
                  <DialogFooter>
                     <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                     <SubmitButton><Wand2/> Generate</SubmitButton>
                  </DialogFooter>
               </form>
            </DialogContent>
          </Dialog>

          {/* Dialog to show quote result */}
          <Dialog open={isQuoteResultOpen} onOpenChange={setQuoteResultOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Your Generated Quote</DialogTitle>
                <DialogDescription>
                  Here is the estimated quote based on your project details and region.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4 rounded-md border bg-muted p-4">
                <Textarea
                    readOnly
                    value={quoteState.data?.quote || 'No quote available.'}
                    className="h-64 font-code text-sm"
                />
              </div>
              <DialogFooter>
                <Button onClick={() => setQuoteResultOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>

      <ClientInfoDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        onGenerateClick={handleDownloadInvoice}
        title="Download Invoice"
        description="Please fill in client details for the invoice."
      />
      <ClientInfoDialog
        open={isScheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onGenerateClick={handleDownloadMaterialSchedule}
        title="Download Material Schedule"
        description="Please fill in client details for the schedule."
      />
      <ClientInfoDialog
        open={isBreakdownDialogOpen}
        onOpenChange={setBreakdownDialogOpen}
        onGenerateClick={handleDownloadBreakdownReport}
        title="Download Detailed Breakdown Report"
        description="Please fill in client details for the report."
      />
       <ClientInfoDialog
        open={isAggregatedDialogOpen}
        onOpenChange={setAggregatedDialogOpen}
        onGenerateClick={handleDownloadAggregatedBreakdown}
        title="Download Aggregated Beams & Blocks Report"
        description="Please fill in client details for the report."
      />
    </>
  );
}
