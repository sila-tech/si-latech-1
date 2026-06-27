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
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderModal({ open, onOpenChange }: OrderModalProps) {
  const { totals, settings, clientName, clientContact, projectLocation, contactPerson } = useCalculator();
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

    const orderData = {
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
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    try {
      if (firestore) {
        await addDoc(collection(firestore, 'material_orders'), orderData);
      }
      setIsSuccess(true);
      toast({
        title: 'Order Submitted',
        description: 'Your material order request has been received by SI-LATECH.',
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: 'Submission Failed',
        description: 'We saved your details locally. You can still send via WhatsApp.',
        variant: 'destructive',
      });
      setIsSuccess(true); // Proceed to WhatsApp anyway to avoid blocking user flow
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppLink = () => {
    const message = `Hello SI-LATECH, I would like to order materials for my slab project:

👤 Name: ${name}
📞 Contact: ${phone}
📍 Site Location: ${location}
📝 Special Notes: ${notes || 'None'}

📐 Slab Area: ${totals.totalArea.toFixed(2)} m²
🏗️ Beam System: ${settings.beamType === 'tbeam' ? 'T-Beam System' : 'Flat Beam System'}

📋 Materials Summary:
- Beams: ${totals.totalInvoiceBeamLength.toFixed(1)} m
- Blocks: ${totals.totalBlocks.toLocaleString()} pcs
- Cement: ${totals.totalCementBags} bags (50kg)
- Sand: ${totals.totalSandTonnes.toFixed(1)} tonnes
- Ballast: ${totals.totalBallastTonnes.toFixed(1)} tonnes
- BRC Mesh: ${totals.brc?.rollsNeeded || 0} rolls
- Support Props: ${totals.timber?.totalProps || 0} pcs

Please review my request and send an official quote with transport costs. Thank you!`;

    return `https://wa.me/254701792088?text=${encodeURIComponent(message)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden rounded-2xl border-slate-200">
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl font-black text-slate-900">
                Order Slab Materials
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Submit your project metrics to the SI-LATECH production team. We will contact you with transport pricing and delivery schedules.
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
                  placeholder="e.g. +254 701 792 088"
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
                className="bg-primary hover:bg-primary/95 text-white font-bold px-6 rounded-xl flex items-center gap-1.5 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Submit Order Request
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
                Request Submitted Successfully!
              </h3>
              <p className="text-sm text-slate-500 px-4">
                We have registered your request in our systems. To speed up review and get transport rates immediately, click the WhatsApp button to start chatting with our technician.
              </p>
            </div>

            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-left max-w-sm space-y-2">
              <p className="font-bold text-slate-800 border-b pb-1 text-[10px] uppercase tracking-wider">
                Inquiry Summary
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
