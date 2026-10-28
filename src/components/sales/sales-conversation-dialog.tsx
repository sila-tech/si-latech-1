'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, PhoneCall, Calendar, CheckCircle2, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export type LeadStatus = 'measurement_booked' | 'measured' | 'quoted' | 'negotiation' | 'won' | 'lost';

interface SalesConversationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: any;
    salesUser: { username: string; name: string };
    onSuccess?: () => void;
}

export function SalesConversationDialog({
    open,
    onOpenChange,
    project,
    salesUser,
    onSuccess,
}: SalesConversationDialogProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [channel, setChannel] = useState<'call' | 'whatsapp' | 'site_visit' | 'meeting' | 'email'>('call');
    const [notes, setNotes] = useState('');
    const [nextFollowUpDate, setNextFollowUpDate] = useState('');
    const [nextAction, setNextAction] = useState('');
    const [leadStatus, setLeadStatus] = useState<LeadStatus>(project?.leadStatus || 'measured');
    const [lossReason, setLossReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync state when project changes
    React.useEffect(() => {
        if (project) {
            setLeadStatus(project.leadStatus || 'measured');
            setLossReason(project.lossReason || '');
        }
    }, [project]);

    if (!project) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please describe the conversation or meeting notes.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const conversationEntry = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                channel,
                notes: notes.trim(),
                nextFollowUpDate: nextFollowUpDate || '',
                nextAction: nextAction.trim() || '',
                statusAfter: leadStatus,
                lossReason: leadStatus === 'lost' ? lossReason.trim() : '',
                recordedBy: salesUser.name,
                recordedByUsername: salesUser.username,
            };

            const projectRef = doc(firestore, 'projects', project.id);
            const updatePayload: any = {
                leadStatus,
                updatedAt: serverTimestamp(),
                lastConversationAt: serverTimestamp(),
                lastConversationNote: notes.trim(),
                conversations: arrayUnion(conversationEntry),
            };

            if (nextFollowUpDate) {
                updatePayload.nextFollowUpDate = nextFollowUpDate;
            }

            if (leadStatus === 'won') {
                updatePayload.conversionStatus = 'converted';
                updatePayload.convertedAt = serverTimestamp();
                updatePayload.status = 'running'; // Mark active project in production
            } else if (leadStatus === 'lost') {
                updatePayload.conversionStatus = 'lost';
                updatePayload.lostAt = serverTimestamp();
                updatePayload.lossReason = lossReason.trim();
            } else {
                updatePayload.conversionStatus = 'in_progress';
            }

            await updateDoc(projectRef, updatePayload);

            // Also record in global sales_activities collection
            await addDoc(collection(firestore, 'sales_activities'), {
                projectId: project.id,
                projectName: project.name || 'Unnamed Project',
                clientName: project.clientName || 'Valued Client',
                clientContact: project.clientContact || '',
                salesRep: salesUser.username,
                salesRepName: salesUser.name,
                channel,
                notes: notes.trim(),
                nextFollowUpDate: nextFollowUpDate || '',
                nextAction: nextAction.trim() || '',
                leadStatus,
                lossReason: leadStatus === 'lost' ? lossReason.trim() : '',
                createdAt: serverTimestamp(),
            });

            toast({
                title: leadStatus === 'won' ? '🎉 Deal Won & Converted!' : 'Conversation Logged',
                description: `Updated project "${project.name}" successfully.`,
            });

            setNotes('');
            setNextFollowUpDate('');
            setNextAction('');
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to log conversation:', error);
            toast({
                title: 'Error',
                description: 'Failed to record conversation log. Please retry.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white rounded-2xl border-slate-200 p-0 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 p-5 text-white">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                                Project Interaction
                            </span>
                        </div>
                        <DialogTitle className="text-lg font-black text-white tracking-tight">
                            Log Client Conversation
                        </DialogTitle>
                        <DialogDescription className="text-xs text-white/80 line-clamp-1">
                            {project.name} &bull; {project.clientName} ({project.clientContact || 'No contact'})
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Channel Selector */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Communication Channel</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'call', label: 'Call', icon: PhoneCall },
                                { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                                { id: 'site_visit', label: 'Site Visit', icon: MapPin },
                                { id: 'meeting', label: 'Meeting', icon: User },
                            ].map((ch) => {
                                const Icon = ch.icon;
                                const isSelected = channel === ch.id;
                                return (
                                    <button
                                        type="button"
                                        key={ch.id}
                                        onClick={() => setChannel(ch.id as any)}
                                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                                            isSelected
                                                ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-2xs'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon size={16} className="mb-1" />
                                        <span>{ch.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pipeline Stage Update */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Update Lead / Conversion Stage</Label>
                        <Select value={leadStatus} onValueChange={(val: any) => setLeadStatus(val)}>
                            <SelectTrigger className="h-9 text-xs rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="measurement_booked">Measurement Booked (Pending Visit)</SelectItem>
                                <SelectItem value="measured">Site Measured (Drafting Quote)</SelectItem>
                                <SelectItem value="quoted">Quote Sent to Client</SelectItem>
                                <SelectItem value="negotiation">In Negotiation / Discussions</SelectItem>
                                <SelectItem value="won" className="text-emerald-700 font-bold">Closed Won (Deal Converted!)</SelectItem>
                                <SelectItem value="lost" className="text-red-600 font-bold">Closed Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {leadStatus === 'lost' && (
                        <div className="space-y-1.5 bg-red-50 p-3 rounded-xl border border-red-200">
                            <Label className="text-xs font-bold text-red-700 flex items-center gap-1">
                                <AlertCircle size={13} /> Why was the project lost?
                            </Label>
                            <Input
                                placeholder="e.g. Budget constraints, chose competitor, project delayed indefinitely"
                                value={lossReason}
                                onChange={(e) => setLossReason(e.target.value)}
                                className="h-8 text-xs rounded-lg bg-white"
                                required
                            />
                        </div>
                    )}

                    {leadStatus === 'won' && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span>Marking this deal as Won will increase your conversion rate and notify the operations team.</span>
                        </div>
                    )}

                    {/* Conversation Notes */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Conversation Details / Outcome *</Label>
                        <Textarea
                            placeholder="What did you discuss? Client feedback, site condition, price objections, timelines..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="text-xs rounded-xl resize-none"
                            required
                        />
                    </div>

                    {/* Next Action & Follow Up */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <Calendar size={13} className="text-purple-600" /> Next Follow-up Date
                            </Label>
                            <Input
                                type="date"
                                value={nextFollowUpDate}
                                onChange={(e) => setNextFollowUpDate(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <Clock size={13} className="text-purple-600" /> Next Action Item
                            </Label>
                            <Input
                                placeholder="e.g. Send proforma, Call contractor"
                                value={nextAction}
                                onChange={(e) => setNextAction(e.target.value)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="text-xs rounded-xl h-9"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="text-xs font-bold rounded-xl h-9 bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                            Save Conversation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
