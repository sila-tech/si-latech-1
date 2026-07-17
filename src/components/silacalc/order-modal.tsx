'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCalculator } from '@/context/calculator-context';
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Loader2, Send, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const addLogoToPdf = (doc: jsPDF, color: string) => {
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

const addPdfBackground = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        try {
            if (fadedLogoBase64) {
                doc.addImage(fadedLogoBase64, 'PNG', 45, 90, 120, 120, undefined, 'FAST');
            } else {
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
            // Skip watermark if image or GState is missing
        }
    }
};

export function OrderModal({ open, onOpenChange }: OrderModalProps) {
  const { totals, settings, clientName, clientContact, projectLocation, contactPerson, pricingRates } = useCalculator();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync inputs with context data on open
  useEffect(() => {
    if (open) {
      setName(clientName || '');
      setPhone(clientContact || '');
      setLocation(projectLocation || '');
      setNotes('');
      setIsSuccess(false);
    }
  }, [open, clientName, clientContact, projectLocation]);

  const generatePDFQuote = (clientInfo: { name: string; phone: string; location: string; notes: string }) => {
    const doc = new jsPDF();
    const primaryColor = '#095388';
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `SILA-${String(Date.now()).slice(-6)}`;

    const BLOCK_PRICE = settings.beamType === 'tbeam' ? pricingRates.blockTbeamRate : pricingRates.blockFlatRate;
    const BEAM_PRICE_PER_METER = settings.beamType === 'tbeam' ? pricingRates.beamTbeamRate : pricingRates.beamFlatRate;

    const blocksTotal = totals.totalBlocks * BLOCK_PRICE;
    const beamsTotal = totals.totalInvoiceBeamLength * BEAM_PRICE_PER_METER;
    const grandTotal = blocksTotal + beamsTotal;

    // --- Header ---
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
    doc.setTextColor(primaryColor);
    doc.text('QUOTE TO', invoiceToX, currentY);
    doc.text('SHIP / SITE TO', shipToX, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client Name: ${clientInfo.name}`, invoiceToX, currentY);
    doc.text(`Site Name: ${clientInfo.location}`, shipToX, currentY);
    currentY += 5;
    doc.text(`Project Name: ${clientInfo.notes || 'Slab Project'}`, invoiceToX, currentY);
    doc.text(`Address: ${clientInfo.location}`, shipToX, currentY);
    currentY += 5;
    doc.text(`Location: ${clientInfo.location}`, invoiceToX, currentY);
    doc.text(`Contact Person: ${clientInfo.name}`, shipToX, currentY);
    currentY += 5;
    doc.text(`Contact: ${clientInfo.phone}`, invoiceToX, currentY);
    
    const metaY = currentY + 10;
    doc.text(`Quote No.:`, 14, metaY);
    doc.text(`Date:`, 14, metaY + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoiceNumber}`, 44, metaY);
    doc.text(`${invoiceDate}`, 44, metaY + 5);

    const tableRows = [
      [
        settings.beamType === 'tbeam' ? 'Total Invoiced T-Beams (m)' : 'Total Invoiced Beams (m)',
        totals.totalInvoiceBeamLength.toFixed(2),
        BEAM_PRICE_PER_METER.toFixed(2),
        beamsTotal.toFixed(2)
      ],
      [
        settings.beamType === 'tbeam' ? 'Total Blocks for T-Beams (pcs)' : 'Total Blocks (pcs)',
        totals.totalBlocks.toString(),
        BLOCK_PRICE.toFixed(2),
        blocksTotal.toFixed(2)
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

    let finalY = (doc as any).lastAutoTable.finalY || 160;
    const totalsX = 145;
    const totalsValueX = 200;
    
    finalY += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#D32F2F');
    doc.text('NB: Transportation of all materials is to be paid for by the customer.', 14, finalY);

    finalY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.setFillColor(240,240,240);
    doc.roundedRect(totalsX - 60, finalY - 1, 85, 10, 3, 3, 'F');
    doc.text('BALANCE DUE: ', totalsX, finalY + 5, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 5, { align: 'right' });

    const approxTonnage = ((totals.totalInvoiceBeamLength * 18) + (totals.totalBlocks * 12)) / 1000;
    doc.text(`Approx. Weight: ~${approxTonnage.toFixed(2)} tonnes`, 14, finalY + 5);

    finalY += 15;

    let notesY = finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('NOTES', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    notesY += 5;
    doc.text(`1. BRC Mesh: Based on your calculations, you may require ${totals.brc?.rollsNeeded || 0} roll(s) of BRC mesh. This is not included in the total.`, 14, notesY);
    notesY += 5;
    doc.text('2. Payment: All payments for beam and blocks are to be made to Promax Kenya Ltd. Account details will be provided.', 14, notesY);
    notesY += 5;
    doc.text('3. We provide a technician paid by the client.', 14, notesY);
    notesY += 5;
    doc.text('4. Disclaimer: This quote was generated by an AI assistant based on the provided plan.', 14, notesY);
    notesY += 5;
    doc.text('It may contain errors. Please countercheck with a SI-LATECH technician for an official quote.', 14, notesY);

    addPdfBackground(doc);

    doc.save(`SI-LATECH-Quote-${invoiceNumber}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !location.trim()) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in your name, contact phone, and delivery site location.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const quoteRequestData = {
      clientName: name,
      clientContact: phone,
      deliveryLocation: location,
      notes,
      beamType: settings.beamType,
      materials: {
        totalArea: totals.totalArea,
        totalBlocks: totals.totalBlocks,
        totalBeamLength: totals.totalInvoiceBeamLength,
        cementBags: totals.totalCementBags,
        sandTonnes: totals.totalSandTonnes,
        ballastTonnes: totals.totalBallastTonnes,
        brcMeshRolls: totals.brc?.rollsNeeded || 0,
        supportProps: totals.timber?.totalProps || 0,
      },
      status: 'quote_generated',
      createdAt: serverTimestamp(),
    };

    try {
      if (firestore) {
        await addDoc(collection(firestore, 'material_quotes'), quoteRequestData);
      }
      
      // Trigger PDF Quote generation instantly
      generatePDFQuote({ name, phone, location, notes });
      
      setIsSuccess(true);
      toast({
        title: 'Quote Downloaded',
        description: 'Your official Beam & Block quote PDF has been generated and downloaded.',
      });
    } catch (error) {
      console.error('Error saving quote request:', error);
      // Still trigger PDF Quote generation even if network is failing
      generatePDFQuote({ name, phone, location, notes });
      setIsSuccess(true);
      toast({
        title: 'Quote Downloaded',
        description: 'We downloaded the quote. Storing detail locally.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppLink = () => {
    const message = `Hello SI-LATECH, I have generated a Beam & Block quote for my slab project:

👤 Name: ${name}
📞 Contact: ${phone}
📍 Site Location: ${location}
📝 Special Notes: ${notes || 'None'}

📐 Slab Area: ${totals.totalArea.toFixed(2)} m²
🏗️ Beam System: ${settings.beamType === 'tbeam' ? 'T-Beam System' : 'Flat Beam System'}

I have downloaded the quote PDF and would like to discuss delivery scheduling. Thank you!`;

    return `https://wa.me/254141981315?text=${encodeURIComponent(message)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden rounded-2xl border-slate-200">
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl font-black text-slate-900 flex items-center gap-2">
                <Download className="text-[#095388] h-5 w-5" /> Download Slab Quote
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Provide your details below to instantly generate and download your customized SI-LATECH Beam & Block slab quote.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="order-name" className="text-xs font-bold text-slate-700">
                  Your Full Name
                </Label>
                <Input
                  id="order-name"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-phone" className="text-xs font-bold text-slate-700">
                  Contact Phone Number
                </Label>
                <Input
                  id="order-phone"
                  placeholder="e.g. +254 141 981 315"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-location" className="text-xs font-bold text-slate-700">
                  Delivery Site Location
                </Label>
                <Input
                  id="order-location"
                  placeholder="e.g. Karen, Nairobi / Juja, Kiambu"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-notes" className="text-xs font-bold text-slate-700">
                  Special Notes / Accessibility Instructions
                </Label>
                <Textarea
                  id="order-notes"
                  placeholder="e.g. Spotty truck access, double-layered reinforcement required, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#095388] hover:bg-[#07426d] text-white font-bold px-6 rounded-xl flex items-center gap-1.5 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Download Quote PDF
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 font-headline mb-1">
                Quote Generated Successfully!
              </h3>
              <p className="text-sm text-slate-500 px-4">
                Your official Beam & Block quote PDF has been downloaded. To verify delivery transport rates or book a site visit, click below to chat with our engineer on WhatsApp.
              </p>
            </div>

            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-left max-w-sm space-y-2">
              <p className="font-bold text-slate-800 border-b pb-1 text-[10px] uppercase tracking-wider">
                Quote Summary
              </p>
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <span className="font-semibold text-slate-900">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Site Location:</span>
                <span className="font-semibold text-slate-900">{location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slab Area:</span>
                <span className="font-semibold text-slate-900">{totals.totalArea.toFixed(1)} m²</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full pt-4">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenChange(false)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#1fbb57] text-white text-sm font-bold rounded-xl transition-all shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.889.001 2.269.654 4.505 1.88 6.385l.115.2-1.362 4.955 5.064-1.325.192.113zm9.57-5.171c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.296-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                Continue to WhatsApp
              </a>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full py-2.5 rounded-xl font-bold text-slate-600 border-slate-200"
              >
                Close Window
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
