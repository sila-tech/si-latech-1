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

export function ActionsCard({ totals, setRooms }: ActionsCardProps) {
  const { toast } = useToast();
  const [isInvoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: '',
    projectName: '',
    projectLocation: '',
    clientContact: '',
    contactPerson: '',
  });

  const handleDownloadInvoice = () => {
    const { totalBlocks, totalBeamLength, brc } = totals;
    const doc = new jsPDF();
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `SILA-${String(Date.now()).slice(-6)}`;

    // Pricing constants
    const BLOCK_PRICE = 85;
    const BEAM_PRICE_PER_METER = 545;
    const BRC_PRICE_PER_ROLL = 3800; // Assuming 'sheet' in prompt means 'roll'
    const VAT_RATE = 0.16;

    // Calculations
    const blocksTotal = totalBlocks * BLOCK_PRICE;
    const beamsTotal = totalBeamLength * BEAM_PRICE_PER_METER;
    const brcTotal = brc.rollsNeeded * BRC_PRICE_PER_ROLL;
    const subtotal = blocksTotal + beamsTotal + brcTotal;
    const vat = subtotal * VAT_RATE;
    const grandTotal = subtotal + vat;

    // --- PDF Styling and Layout ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Beam & Block Slab Quotation / Tax Invoice', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Head Office: Nairobi, Kenya', 14, 30);
    doc.text('Tel: +254 741 557960', 14, 35);
    doc.text('Email: info@silatech.co.ke', 14, 40);
    doc.text('VAT Registration No.: P051XXXXXXX', 14, 45);

    // Invoice To / Ship To sections
    const invoiceToX = 14;
    const shipToX = 110;
    const startY = 55;
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE TO', invoiceToX, startY);
    doc.text('SHIP / SITE TO', shipToX, startY);

    doc.setFont('helvetica', 'normal');
    doc.text(`Client Name: ${clientInfo.clientName}`, invoiceToX, startY + 5);
    doc.text(`Project Name: ${clientInfo.projectName}`, invoiceToX, startY + 10);
    doc.text(`Location: ${clientInfo.projectLocation}`, invoiceToX, startY + 15);
    doc.text(`Contact: ${clientInfo.clientContact}`, invoiceToX, startY + 20);

    doc.text(`Site Name: ${clientInfo.projectName}`, shipToX, startY + 5);
    doc.text(`Address: ${clientInfo.projectLocation}`, shipToX, startY + 10);
    doc.text(`Contact Person: ${clientInfo.contactPerson}`, shipToX, startY + 15);
    
    // Invoice metadata
    doc.text(`Invoice No.: ${invoiceNumber}`, invoiceToX, startY + 30);
    doc.text(`Date: ${invoiceDate}`, invoiceToX, startY + 35);
    doc.text('Terms: Due on Receipt', invoiceToX, startY + 40);
    doc.text(`Due Date: ${invoiceDate}`, invoiceToX, startY + 45);

    // Invoice Table
    const tableColumn = ['DATE', 'DESCRIPTION', 'VAT', 'QTY', 'UNIT', 'RATE (KSH)', 'AMOUNT (KSH)'];
    const tableRows = [
      [invoiceDate, 'Beam & Block Slab Works – Blocks', '16% S', totalBlocks, 'pcs', BLOCK_PRICE.toFixed(2), blocksTotal.toFixed(2)],
      [invoiceDate, 'Flat Beams (in metres)', '16% S', totalBeamLength.toFixed(2), 'm', BEAM_PRICE_PER_METER.toFixed(2), beamsTotal.toFixed(2)],
      [invoiceDate, 'BRC Mesh A98', '16% S', brc.rollsNeeded, 'roll', BRC_PRICE_PER_ROLL.toFixed(2), brcTotal.toFixed(2)],
    ];

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: startY + 55,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
    });

    // Totals Section
    const finalY = (doc as any).lastAutoTable.finalY;
    const totalsX = 140;
    doc.setFontSize(10);
    doc.text('SUBTOTAL: ', totalsX, finalY + 10, { align: 'right' });
    doc.text(`Ksh ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 200, finalY + 10, { align: 'right' });
    doc.text('VAT @16%: ', totalsX, finalY + 15, { align: 'right' });
    doc.text(`Ksh ${vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 200, finalY + 15, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL: ', totalsX, finalY + 20, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 200, finalY + 20, { align: 'right' });
    
    doc.text('BALANCE DUE: ', totalsX, finalY + 25, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 200, finalY + 25, { align: 'right' });


    // VAT Summary
    let yPos = finalY + 40;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('VAT SUMMARY', 14, yPos);
    doc.autoTable({
      head: [['RATE', 'VAT (Ksh)', 'NET (Ksh)']],
      body: [['16%', vat.toFixed(2), subtotal.toFixed(2)]],
      startY: yPos + 2,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
    });

    // Payment Details
    yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 14, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    doc.text('Payment via: Company Cheque / Bank Transfer / M-PESA Paybill', 14, yPos);
    yPos += 5;
    doc.text('Bank: [Your Bank Name]', 14, yPos);
    doc.text('Account Name: Silatech Construction Limited', 14, yPos + 5);
    doc.text('Account Number: [Your Account No.]', 14, yPos + 10);
    doc.text('Paybill: [Your Paybill No.]', 14, yPos + 15);
    doc.text('Branch: [Branch Name]', 14, yPos + 20);
    doc.text('Currency: KES', 14, yPos + 25);


    doc.save(`SI-LATECH-Invoice-${invoiceNumber}.pdf`);
    setInvoiceDialogOpen(false); // Close dialog after download
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
          Generate invoices, use AI to analyze plans, or get a quote.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Download /> Download Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Client Information</DialogTitle>
              <DialogDescription>
                Please fill in the client details for the invoice.
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
              <Button onClick={handleDownloadInvoice}>Generate & Download</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
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
            <Button variant="accent">
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
