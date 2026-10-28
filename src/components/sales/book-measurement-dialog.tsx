'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, MapPin, Phone, User, Building, ClipboardEdit, Sparkles } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BookMeasurementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    salesUser: { username: string; name: string };
    onSuccess?: (newProjectId: string) => void;
}

export function BookMeasurementDialog({
    open,
    onOpenChange,
    salesUser,
    onSuccess,
}: BookMeasurementDialogProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [projectName, setProjectName] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [projectLocation, setProjectLocation] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [measurementDate, setMeasurementDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [leadStatus, setLeadStatus] = useState<'measurement_booked' | 'measured' | 'quoted' | 'negotiation'>('measurement_booked');
    const [estimatedArea, setEstimatedArea] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim() || !clientName.trim() || !clientContact.trim() || !projectLocation.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please provide Project Name, Client Name, Contact Number, and Location.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const initialConversation = notes.trim()
                ? [
                      {
                          id: crypto.randomUUID(),
                          date: new Date().toISOString(),
                          type: leadStatus === 'measured' ? 'site_visit' : 'call',
                          notes: notes.trim(),
                          recordedBy: salesUser.name,
                          recordedByUsername: salesUser.username,
                          nextFollowUpDate: measurementDate || '',
                          statusAfter: leadStatus,
                      },
                  ]
                : [];

            const projectData = {
                name: projectName.trim(),
                clientName: clientName.trim(),
                clientContact: clientContact.trim(),
                projectLocation: projectLocation.trim(),
                contactPerson: contactPerson.trim() || clientName.trim(),
                salesRep: salesUser.username,
                salesRepName: salesUser.name,
                assignedTo: salesUser.username,
                bookedAt: serverTimestamp(),
                measurementDate: measurementDate || null,
                leadStatus: leadStatus,
                status: 'pending',
                conversionStatus: leadStatus === 'quoted' || leadStatus === 'negotiation' ? 'in_progress' : 'pending',
                estimatedArea: estimatedArea ? parseFloat(estimatedArea) : 0,
                conversations: initialConversation,
                rooms: [],
                settings: {
                    beamType: 'flat',
                    beamSpacing: 0.55,
                    blockWidth: 0.2,
                    wastagePercentage: 10,
                    propSpacing: 1.2,
                    concreteThickness: 0.05,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(firestore, 'projects'), projectData);

            // Also record in global sales_activities collection
            if (notes.trim()) {
                await addDoc(collection(firestore, 'sales_activities'), {
                    projectId: docRef.id,
                    projectName: projectName.trim(),
                    clientName: clientName.trim(),
                    salesRep: salesUser.username,
                    salesRepName: salesUser.name,
                    type: leadStatus === 'measured' ? 'site_visit' : 'measurement_booking',
                    notes: notes.trim(),
                    nextFollowUpDate: measurementDate || '',
                    leadStatus: leadStatus,
                    createdAt: serverTimestamp(),
                });
            }

            toast({
                title: 'Measurement Booked!',
                description: `Project "${projectName}" has been registered to your sales pipeline.`,
            });

            // Reset form
            setProjectName('');
            setClientName('');
            setClientContact('');
            setProjectLocation('');
            setContactPerson('');
            setEstimatedArea('');
            setNotes('');
            setLeadStatus('measurement_booked');

            onOpenChange(false);
            if (onSuccess) onSuccess(docRef.id);
        } catch (error) {
            console.error('Failed to book measurement:', error);
            toast({
                title: 'Error',
                description: 'Failed to record measurement booking. Check your connection.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg bg-white rounded-2xl border-slate-200 p-0 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 p-5 text-white">
                    <DialogHeader>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase mb-1 w-fit">
                            <Sparkles size={11} /> New Sales Lead &amp; Measurement
                        </div>
                        <DialogTitle className="text-xl font-black text-white tracking-tight">Book Site Measurement</DialogTitle>
                        <DialogDescription className="text-xs text-white/80">
                            Register a new client measurement to track its conversion to a completed sale.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <Building size={13} className="text-emerald-600" /> Project / Site Name *
                            </Label>
                            <Input
                                placeholder="e.g. 4-Bedroom Villa Ruiru / Commercial Flats"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <User size={13} className="text-emerald-600" /> Client Name *
                            </Label>
                            <Input
                                placeholder="e.g. Eng. Kamau"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <Phone size={13} className="text-emerald-600" /> Client Phone / WhatsApp *
                            </Label>
                            <Input
                                placeholder="e.g. 0712 345 678"
                                value={clientContact}
                                onChange={(e) => setClientContact(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <MapPin size={13} className="text-emerald-600" /> Site Location *
                            </Label>
                            <Input
                                placeholder="e.g. Ruiru Mugutha, Next to St. Paul Church"
                                value={projectLocation}
                                onChange={(e) => setProjectLocation(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <User size={13} className="text-slate-400" /> Site Foreman / Contact
                            </Label>
                            <Input
                                placeholder="e.g. Dennis (Foreman)"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <Calendar size={13} className="text-emerald-600" /> Measurement Date
                            </Label>
                            <Input
                                type="date"
                                value={measurementDate}
                                onChange={(e) => setMeasurementDate(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Initial Pipeline Stage</Label>
                            <Select value={leadStatus} onValueChange={(v: any) => setLeadStatus(v)}>
                                <SelectTrigger className="h-9 text-xs rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="measurement_booked">Measurement Booked / Scheduled</SelectItem>
                                    <SelectItem value="measured">Already Measured on Site</SelectItem>
                                    <SelectItem value="quoted">Quotation Prepared</SelectItem>
                                    <SelectItem value="negotiation">In Negotiation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Estimated Slab Area (m²)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 150"
                                value={estimatedArea}
                                onChange={(e) => setEstimatedArea(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <ClipboardEdit size={13} className="text-emerald-600" /> Initial Conversation / Site Notes
                        </Label>
                        <Textarea
                            placeholder="e.g. Met client on site. Beams needed for 1st floor slab. Client interested in 6-meter span flat beams. Requested quote by tomorrow evening."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="text-xs rounded-xl resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-2 border-t border-slate-100 flex sm:justify-between items-center gap-2">
                        <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                            Assigned to <span className="font-bold text-slate-800">{salesUser.name}</span>
                        </p>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 sm:flex-none text-xs rounded-xl h-9"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 sm:flex-none text-xs font-bold rounded-xl h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                                Save &amp; Book Project
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
