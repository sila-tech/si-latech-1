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
} from 'lucide-react';
import { handlePlanUpload, handleGenerateQuote } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type ActionsCardProps = {
  totals: {
    totalArea: number;
    totalBlocks: number;
    totalBeamLength: number;
    totalConcreteVolume: number;
    totalCementBags: number;
    totalSandTonnes: number;
    totalBallastTonnes: number;
    brc: { rollsNeeded: number };
  };
  setRooms: (rooms: { name: string; length: number; width: number }[]) => void;
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

const ClientInfoDialog = ({ onGenerateClick }: { onGenerateClick: (clientInfo: ClientInfo) => void }) => {
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: '',
    projectName: '',
    projectLocation: '',
    clientContact: '',
    contactPerson: '',
  });

  const handleGenerate = () => {
    onGenerateClick(clientInfo);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Client Information</DialogTitle>
        <DialogDescription>
          Please fill in the client details for the document.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input id="clientName" value={clientInfo.clientName} onChange={(e) => setClientInfo({...clientInfo, clientName: e.target.value})} placeholder="e.g., John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientContact">Client Contact</Label>
            <Input id="clientContact" value={clientInfo.clientContact} onChange={(e) => setClientInfo({...clientInfo, clientContact: e.target.value})} placeholder="e.g., +254 7..."/>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input id="projectName" value={clientInfo.projectName} onChange={(e) => setClientInfo({...clientInfo, projectName: e.target.value})} placeholder="e.g., Residential House"/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectLocation">Project Location</Label>
          <Input id="projectLocation" value={clientInfo.projectLocation} onChange={(e) => setClientInfo({...clientInfo, projectLocation: e.target.value})} placeholder="e.g., Karen, Nairobi" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Site Contact Person</Label>
          <Input id="contactPerson" value={clientInfo.contactPerson} onChange={(e) => setClientInfo({...clientInfo, contactPerson: e.target.value})} placeholder="e.g., Site Foreman" />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </DialogClose>
        <Button onClick={handleGenerate}>Generate & Download</Button>
      </DialogFooter>
    </>
  );
};


export function ActionsCard({ totals, setRooms }: ActionsCardProps) {
  const { toast } = useToast();
  const [isInvoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  

  const handleDownloadInvoice = (clientInfo: ClientInfo) => {
    const { totalBlocks, totalBeamLength } = totals;
    const doc = new jsPDF();
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `SILA-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB'; // HSL(217, 91%, 60%)

    // Pricing constants
    const BLOCK_PRICE = 85;
    const BEAM_PRICE_PER_METER = 545;
    const VAT_RATE = 0.16;

    // Calculations
    const blocksTotal = totalBlocks * BLOCK_PRICE;
    const beamsTotal = totalBeamLength * BEAM_PRICE_PER_METER;
    const subtotal = blocksTotal + beamsTotal;
    const vat = subtotal * VAT_RATE;
    const grandTotal = subtotal + vat;

    // --- PDF Styling and Layout ---
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
    doc.text('Head Office: Nairobi, Kenya', 145, 20);
    doc.text('Tel: +254 741 557960', 145, 25);
    doc.text('Email: info@silatech.co.ke', 145, 30);
    doc.text('VAT Registration No.: P051XXXXXXX', 145, 35);

    // Invoice To / Ship To sections
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
    
    // Invoice metadata
    doc.setFont('helvetica', 'normal');
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


    // Invoice Table
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

    // Totals Section
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
    
    // Balance due has a box around it
    doc.setFillColor(240,240,240);
    doc.roundedRect(totalsX - 60, finalY + 27, 85, 10, 3, 3, 'F');
    doc.text('BALANCE DUE: ', totalsX, finalY + 33, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 33, { align: 'right' });


    // VAT Summary
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

    // Notes Section
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
    setInvoiceDialogOpen(false); // Close dialog after download
  };

  const handleDownloadMaterialSchedule = (clientInfo: ClientInfo) => {
    const { totalConcreteVolume, totalCementBags, totalSandTonnes, totalBallastTonnes, brc } = totals;
    const doc = new jsPDF();
    const scheduleDate = new Date().toLocaleDateString('en-GB');
    const scheduleNumber = `MAT-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    // --- PDF Styling and Layout ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text('SI-LATECH', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Slab Materials Schedule', 14, 30);
    
    // Client and Project Info
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('PROJECT DETAILS', 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client: ${clientInfo.clientName}`, 14, 51);
    doc.text(`Project: ${clientInfo.projectName}`, 14, 56);
    doc.text(`Location: ${clientInfo.projectLocation}`, 14, 61);

    // Schedule metadata
    doc.text(`Schedule No.: ${scheduleNumber}`, 145, 51);
    doc.text(`Date: ${scheduleDate}`, 145, 56);

    // Materials Table
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
    
    // Notes Section
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
    setScheduleDialogOpen(false); // Close dialog after download
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
      if (uploadState.data?.roomDimensions) {
        setRooms(uploadState.data.roomDimensions);
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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Project Actions</CardTitle>
        <CardDescription>
          Generate documents, use AI to analyze plans, or get a quote.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-row gap-4">
        
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full">
              <Download /> Download Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <ClientInfoDialog onGenerateClick={handleDownloadInvoice} />
          </DialogContent>
        </Dialog>
        
        <Dialog open={isScheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <List /> Material Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <ClientInfoDialog onGenerateClick={handleDownloadMaterialSchedule} />
          </DialogContent>
        </Dialog>

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
  );
}
