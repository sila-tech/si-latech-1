'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import {
    collection,
    query,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import {
    Building2,
    Plus,
    Trash2,
    Edit2,
    Shield,
    Phone,
    Mail,
    User,
    Percent,
    ExternalLink,
    Loader2,
    KeyRound,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export interface PartnerRecord {
    id: string;
    name: string;
    email: string;
    passcode: string;
    phone?: string;
    contactPerson?: string;
    defaultProfitMargin: number;
    createdAt?: any;
}

export function PartnerManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [partners, setPartners] = useState<PartnerRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<PartnerRecord | null>(null);

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [passcode, setPasscode] = useState('');
    const [phone, setPhone] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [profitMargin, setProfitMargin] = useState<number>(15);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPartners = async () => {
        if (!firestore) return;
        setIsLoading(true);
        try {
            const ref = collection(firestore, 'partners');
            const snap = await getDocs(ref);
            const list: PartnerRecord[] = snap.docs.map(d => ({
                id: d.id,
                name: d.data().name || d.data().companyName || 'Unknown Partner',
                email: d.data().email || '',
                passcode: d.data().passcode || d.data().pin || d.data().password || '1234',
                phone: d.data().phone || d.data().contact || '',
                contactPerson: d.data().contactPerson || '',
                defaultProfitMargin: d.data().defaultProfitMargin !== undefined ? Number(d.data().defaultProfitMargin) : 15,
                createdAt: d.data().createdAt
            }));
            setPartners(list);
        } catch (err) {
            console.error('Error fetching partners:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, [firestore]);

    const handleOpenCreate = () => {
        setCompanyName('');
        setEmail('');
        setPasscode(String(Math.floor(1000 + Math.random() * 9000))); // Generate 4-digit PIN default
        setPhone('');
        setContactPerson('');
        setProfitMargin(15);
        setIsCreateModalOpen(true);
    };

    const handleCreatePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !companyName || !email || !passcode) {
            toast({ title: 'Missing Information', description: 'Company name, email/username, and passcode are required.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const cleanEmail = email.toLowerCase().trim();
            const ref = collection(firestore, 'partners');
            await addDoc(ref, {
                name: companyName.trim(),
                companyName: companyName.trim(),
                email: cleanEmail,
                username: cleanEmail,
                passcode: passcode.trim(),
                pin: passcode.trim(),
                phone: phone.trim(),
                contact: phone.trim(),
                contactPerson: contactPerson.trim(),
                defaultProfitMargin: Number(profitMargin) || 15,
                createdAt: serverTimestamp()
            });

            toast({ title: 'Partner Account Created', description: `Account for ${companyName} has been created.` });
            setIsCreateModalOpen(false);
            fetchPartners();
        } catch (err: any) {
            console.error('Error creating partner:', err);
            toast({ title: 'Creation Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEdit = (partner: PartnerRecord) => {
        setEditingPartner(partner);
        setCompanyName(partner.name);
        setEmail(partner.email);
        setPasscode(partner.passcode);
        setPhone(partner.phone || '');
        setContactPerson(partner.contactPerson || '');
        setProfitMargin(partner.defaultProfitMargin || 15);
        setIsEditModalOpen(true);
    };

    const handleUpdatePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !editingPartner) return;

        setIsSubmitting(true);
        try {
            const partnerRef = doc(firestore, 'partners', editingPartner.id);
            const cleanEmail = email.toLowerCase().trim();
            await updateDoc(partnerRef, {
                name: companyName.trim(),
                companyName: companyName.trim(),
                email: cleanEmail,
                username: cleanEmail,
                passcode: passcode.trim(),
                pin: passcode.trim(),
                phone: phone.trim(),
                contact: phone.trim(),
                contactPerson: contactPerson.trim(),
                defaultProfitMargin: Number(profitMargin) || 15,
                updatedAt: serverTimestamp()
            });

            toast({ title: 'Partner Account Updated', description: 'Changes saved successfully.' });
            setIsEditModalOpen(false);
            fetchPartners();
        } catch (err: any) {
            console.error('Error updating partner:', err);
            toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePartner = async (id: string, name: string) => {
        if (!firestore) return;
        if (!window.confirm(`Are you sure you want to delete ${name}? They will lose dashboard access.`)) return;

        try {
            await deleteDoc(doc(firestore, 'partners', id));
            toast({ title: 'Partner Deleted', description: `${name} has been removed.` });
            fetchPartners();
        } catch (err: any) {
            console.error('Delete error:', err);
            toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="text-primary" size={24} />
                        Partner Companies & Contractor Portals
                    </h2>
                    <p className="text-sm text-slate-500">
                        Create and manage partner accounts with automatic hidden 1-beam SI-LATECH profit cuts and custom client margins.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-300 font-bold text-xs h-9">
                        <Link href="/partner/login" target="_blank">
                            <ExternalLink size={14} className="mr-1" />
                            Open Partner Portal
                        </Link>
                    </Button>
                    <Button
                        onClick={handleOpenCreate}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl h-9 flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={16} />
                        Create Partner Account
                    </Button>
                </div>
            </div>

            {/* List of Partners */}
            {isLoading ? (
                <div className="flex items-center justify-center p-12 text-slate-400">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Loading partner companies...
                </div>
            ) : partners.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 rounded-2xl p-8 text-center">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl w-fit mx-auto mb-3">
                        <Building2 size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">No Partner Accounts Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                        Create partner companies to give contractors their own branded dashboard with hidden +1 beam profit for SI-LATECH.
                    </p>
                    <Button onClick={handleOpenCreate} size="sm" className="rounded-xl font-bold">
                        <Plus size={16} className="mr-1" />
                        Add First Partner Company
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partners.map(partner => (
                        <Card key={partner.id} className="border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-shadow bg-white overflow-hidden">
                            <CardHeader className="pb-3 bg-slate-50/70 border-b border-slate-100">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base font-black text-slate-900">
                                            {partner.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-mono text-slate-500">
                                            Login: {partner.email}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                                        {partner.defaultProfitMargin}% Margin
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div className="space-y-1.5 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <KeyRound size={13} className="text-slate-400" />
                                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">
                                            PIN: {partner.passcode}
                                        </span>
                                    </div>
                                    {partner.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={13} className="text-slate-400" />
                                            <span>{partner.phone}</span>
                                        </div>
                                    )}
                                    {partner.contactPerson && (
                                        <div className="flex items-center gap-2">
                                            <User size={13} className="text-slate-400" />
                                            <span>Contact: {partner.contactPerson}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                                    <Shield size={14} className="text-emerald-600 shrink-0" />
                                    <span>+1 Beam Auto-Cut baked into all calculations</span>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <Button
                                        onClick={() => handleOpenEdit(partner)}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-lg text-xs font-bold"
                                    >
                                        <Edit2 size={13} className="mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => handleDeletePartner(partner.id, partner.name)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 size={13} className="mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* CREATE PARTNER MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Building2 className="text-primary" size={20} />
                            Create Partner Company Account
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePartner} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Company Name *</Label>
                            <Input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. Apex Builders Ltd"
                                required
                                className="h-10 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Email / Username *</Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. apex or info@apex.co.ke"
                                    required
                                    className="h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Passcode / PIN *</Label>
                                <Input
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="e.g. 4821"
                                    required
                                    className="h-10 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. +254 700 000 000"
                                    className="h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Default Profit %</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={profitMargin}
                                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                                    className="h-10 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Contact Person (Optional)</Label>
                            <Input
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                placeholder="e.g. Eng. David Kimani"
                                className="h-10 rounded-xl"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={isSubmitting}
                                className="rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT PARTNER MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Building2 className="text-primary" size={20} />
                            Edit Partner Company Account
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdatePartner} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Company Name *</Label>
                            <Input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="h-10 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Email / Username *</Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Passcode / PIN *</Label>
                                <Input
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    required
                                    className="h-10 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Default Profit %</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={profitMargin}
                                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                                    className="h-10 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Contact Person</Label>
                            <Input
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="h-10 rounded-xl"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={isSubmitting}
                                className="rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
