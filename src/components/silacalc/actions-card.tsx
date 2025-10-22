
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
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
  DollarSign,
} from 'lucide-react';
import { handlePlanUpload, handleGenerateQuote, QuoteState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import type { Room, RoomCalculation, ConcreteCalculation, BrcCalculation, AggregatedRoomGroup } from '@/lib/calculator';
import type { ProjectTotals } from './calculator-shell';
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
  totals: ProjectTotals;
  setRooms: (rooms: { name: string; length: number; width: number }[]) => void;
  setLintelLength: (length: number) => void;
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


export function ActionsCard({ totals, rooms, setRooms, setLintelLength, perRoomCalculations, aggregatedBreakdown }: ActionsCardProps) {
  const { toast } = useToast();
  const [isInvoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isBreakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  const [isAggregatedDialogOpen, setAggregatedDialogOpen] = useState(false);
  const [isProfitReportDialogOpen, setProfitReportDialogOpen] = useState(false);
  
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  const handleDownloadInvoice = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `SILA-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';
    
    const BLOCK_PRICE = 85;
    const BEAM_PRICE_PER_METER = 545;
    const VAT_RATE = 0.16;

    const blocksTotal = totals.totalBlocks * BLOCK_PRICE;
    const beamsTotal = totals.totalInvoiceBeamLength * BEAM_PRICE_PER_METER;
    const subtotal = blocksTotal + beamsTotal;
    const vatAmount = subtotal * VAT_RATE;
    const grandTotal = subtotal + vatAmount;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text('SI-LATECH', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Beam & Block Slab Quotation', 14, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Head Office: Juja, Kenya', 145, 20);
    doc.text('Tel: +254 741 557960', 145, 25);
    doc.text('Email: info@silatech.co.ke', 145, 30);

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

    const tableRows = perRoomCalculations.map(p => {
      const roomBlocksTotal = p.roomCalcs.totalBlocks * BLOCK_PRICE;
      const roomBeamsTotal = p.roomCalcs.invoiceTotalBeamLength * BEAM_PRICE_PER_METER;
      const total = roomBlocksTotal + roomBeamsTotal;
      return [
        `Room: ${p.room.name}`,
        `Beams ${p.roomCalcs.shorter.toFixed(2)}m x ${p.roomCalcs.invoiceBeamCount} pcs`,
        p.roomCalcs.invoiceTotalBeamLength.toFixed(2),
        BEAM_PRICE_PER_METER.toFixed(2),
        roomBeamsTotal.toFixed(2)
      ]
    })

    const allBlocksRow = [
      'Total Blocks',
      '',
      totals.totalBlocks.toString(),
      BLOCK_PRICE.toFixed(2),
      blocksTotal.toFixed(2)
    ];


    (doc as any).autoTable({
      head: [['DESCRIPTION', 'DETAILS', 'QTY / MTRS', 'RATE (KSH)', 'AMOUNT (KSH)']],
      body: [...tableRows, allBlocksRow],
      startY: metaY + 25,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
      didParseCell: function (data: any) {
        if (data.row.raw[0] === 'Total Blocks') {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY;
    const totalsX = 145;
    const totalsValueX = 200;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    finalY += 10;
    doc.text('Subtotal: ', totalsX, finalY, { align: 'right' });
    doc.text(`Ksh ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY, { align: 'right' });
    finalY += 7;
    doc.text(`VAT (16%): `, totalsX, finalY, { align: 'right' });
    doc.text(`Ksh ${vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY, { align: 'right' });
    finalY += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240,240,240);
    doc.roundedRect(totalsX - 60, finalY - 1, 85, 10, 3, 3, 'F');
    doc.text('BALANCE DUE: ', totalsX, finalY + 5, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 5, { align: 'right' });

    let notesY = (doc as any).lastAutoTable.finalY + 10;
    notesY = Math.max(notesY, finalY + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('NOTES', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    notesY += 5;
    doc.text(`1. BRC Mesh: Based on your calculations, you may require ${totals.brc.rollsNeeded} roll(s) of BRC mesh. This is not included in the total.`, 14, notesY);
    notesY += 5;
    doc.text('2. Payment: All payments for beam and blocks are to be made to Promax Kenya Ltd. Account details will be provided.', 14, notesY);

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
      ['Sand', totalSandTonnes.toFixed(2), 'tonnes', 'Includes 10% wastage'],
      ['Ballast / Coarse Aggregate', totalBallastTonnes.toFixed(2), 'tonnes', 'Includes 10% wastage'],
      ['BRC Mesh A98', brc.rollsNeeded, 'rolls', `For a total area of ${totals.totalArea.toFixed(2)} m²`],
      ['Total Wet Concrete Volume', totalConcreteVolume.toFixed(3), 'm³', 'Excludes wastage, for mixing reference'],
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

  const handleDownloadPromaxBreakdown = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `PROMAX-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.text('Promax Customization Order', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Project Name: ${clientInfo.projectName}`, 14, 32);
    doc.text(`Date: ${reportDate}`, 14, 37);

    const tableColumn = ['ROOM NAME', 'BEAM LENGTH (m)', 'ACTUAL BEAM COUNT', 'TOTAL LENGTH (m)'];
    const tableRows = perRoomCalculations.map(p => ([
      p.room.name,
      p.roomCalcs.shorter.toFixed(2),
      p.roomCalcs.actualBeamCount,
      p.roomCalcs.actualTotalBeamLength.toFixed(2)
    ]));

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Actual Beam Length:', 14, finalY + 10);
    doc.text(`${totals.totalActualBeamLength.toFixed(2)} m`, 196, finalY + 10, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('This breakdown is for manufacturing purposes only and contains the exact beam quantities to be supplied.', 14, finalY + 20);

    doc.save(`Promax-Breakdown-${reportNumber}.pdf`);
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
    doc.text('PROJECT TOTALS (ACTUALS)', 14, currentY);
    currentY += 7;

    const totalBeams = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBeams, 0);
    const totalBeamLength = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBeamLength, 0);
    const totalBlocks = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBlocks, 0);

    const totalsBody = [
        ['Total distinct room sizes:', `${aggregatedBreakdown.length}`],
        ['Total actual beams (all groups):', `${totalBeams} beams`],
        ['Total actual beam length (all):', `${totalBeamLength.toFixed(2)} m`],
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
  
  const handleDownloadProfitReport = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `PROFIT-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#16A34A'; // Green for profit
    const BEAM_PRICE_PER_METER = 545;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.text('Internal Profit Report', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Project: ${clientInfo.projectName}`, 14, 32);
    doc.text(`Client: ${clientInfo.clientName}`, 14, 37);
    doc.text(`Date: ${reportDate}`, 145, 32);

    const tableColumn = ['ROOM NAME', 'PROFIT BEAMS', 'PROFIT LENGTH (m)', 'PROFIT VALUE (KSh)'];
    const tableRows = perRoomCalculations.map(p => {
      const profitValue = p.roomCalcs.profitBeamLength * BEAM_PRICE_PER_METER;
      return [
        p.room.name,
        p.roomCalcs.profitBeams,
        p.roomCalcs.profitBeamLength.toFixed(2),
        profitValue.toFixed(2)
      ]
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    finalY += 15;
    doc.text('Total Profit from Beams:', 14, finalY);
    doc.text(`KSh ${totals.totalProfitValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    finalY += 7;
    doc.text('Total Extra Beam Length:', 14, finalY);
    doc.text(`${totals.totalProfitBeamLength.toFixed(2)} m`, 196, finalY, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('This report is for internal use only.', 14, finalY + 15);


    doc.save(`Profit-Report-${reportNumber}.pdf`);
    setProfitReportDialogOpen(false);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFilePreview(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };
  
  const handleUploadDialogChange = (open: boolean) => {
    if (!open) {
      // Reset form when dialog closes
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      formRef.current?.reset();
    }
    setUploadDialogOpen(open);
  }

  const [quoteState, setQuoteState] = useState<QuoteState>({});
  const [isQuoteResultOpen, setQuoteResultOpen] = useState(false);

  async function handleQuoteFormSubmit(formData: FormData) {
    const result = await handleGenerateQuote(formData);
    setQuoteState(result);
    if (result.data) {
        toast({ title: 'Success', description: result.message });
        setQuoteResultOpen(true);
    } else if (result.error) {
        toast({ title: 'Quote Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handlePlanFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingPlan(true);
    
    if (!formRef.current) {
      setIsSubmittingPlan(false);
      return;
    };
    
    const formData = new FormData(formRef.current);
    const result = await handlePlanUpload(formData);
    
    if (result.data) {
        if (result.data.floors) {
          const allRooms = result.data.floors.flatMap(floor => 
              floor.rooms.map(room => ({...room, name: `${floor.floorName} - ${room.name}`}))
          );
          setRooms(allRooms);
        }
        if (result.data.lintelLength) {
          setLintelLength(result.data.lintelLength);
        }
        toast({ title: 'Success', description: result.message });
        handleUploadDialogChange(false);
    } else if (result.error) {
        toast({ title: 'Upload Error', description: result.error, variant: 'destructive' });
    }
    
    setIsSubmittingPlan(false);
  }


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Project Actions</CardTitle>
          <CardDescription>
            Generate documents, use AI to analyze plans, or get a quote.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          
          <Button variant="secondary" className="w-full" onClick={() => setInvoiceDialogOpen(true)}>
            <Download /> Customer Invoice
          </Button>
          
          <Button variant="outline" className="w-full" onClick={() => setScheduleDialogOpen(true)}>
            <List /> Material Schedule
          </Button>

          <Button variant="outline" className="w-full" onClick={() => setBreakdownDialogOpen(true)}>
              <FileDown /> Promax Breakdown
          </Button>
          
          <Button variant="outline" className="w-full" onClick={() => setAggregatedDialogOpen(true)}>
              <Warehouse /> Aggregated Report
          </Button>

          <Button variant="destructive" className="w-full col-span-2 lg:col-span-1" onClick={() => setProfitReportDialogOpen(true)}>
              <DollarSign /> Profit Report
          </Button>

          <Dialog open={isUploadDialogOpen} onOpenChange={handleUploadDialogChange}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Upload /> Upload Plan (AI)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Analyze Building Plan</DialogTitle>
                <DialogDescription>
                  Upload a PDF or image of your building plan. Our AI will analyze
                  it and automatically populate the room dimensions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePlanFormSubmit} ref={formRef} className="space-y-4">
                {filePreview && (
                  <div className="my-4 rounded-md border bg-muted p-2 max-h-[400px] overflow-auto">
                    {filePreview.startsWith('data:image') ? (
                       <Image src={filePreview} alt="Plan preview" width={550} height={300} className="w-full h-auto object-contain" />
                    ) : (
                      <iframe src={filePreview} width="100%" height="400px" title="PDF Preview">
                        <p>PDF preview is not available in your browser. You can still upload the file.</p>
                      </iframe>
                    )}
                  </div>
                )}
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="planFile">Plan File</Label>
                  <Input 
                    id="planFile" 
                    name="planFile" 
                    type="file" 
                    required 
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingPlan}>
                    {isSubmittingPlan && <Loader2 className="mr-2 animate-spin" />}
                    <Wand2 /> Analyze
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="accent" className="w-full col-span-2 lg:col-span-3">
                <FileText /> Generate Quote (AI)
              </Button>
            </DialogTrigger>
            <DialogContent>
               <form action={handleQuoteFormSubmit}>
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
                  <input type="hidden" name="beamLength" value={totals.totalInvoiceBeamLength} />
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
        title="Download Customer Invoice"
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
        onGenerateClick={handleDownloadPromaxBreakdown}
        title="Download Promax Breakdown Report"
        description="Please fill in project details for the manufacturing report."
      />
       <ClientInfoDialog
        open={isAggregatedDialogOpen}
        onOpenChange={setAggregatedDialogOpen}
        onGenerateClick={handleDownloadAggregatedBreakdown}
        title="Download Aggregated Report"
        description="Please fill in client details for the report."
      />
       <ClientInfoDialog
        open={isProfitReportDialogOpen}
        onOpenChange={setProfitReportDialogOpen}
        onGenerateClick={handleDownloadProfitReport}
        title="Download Internal Profit Report"
        description="Please fill in project details for the internal report."
      />
    </>
  );
}
