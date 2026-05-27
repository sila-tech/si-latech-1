'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function FinanceManagement() {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState('income');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const firestore = useFirestore();
    const { toast } = useToast();

    const financesQuery = useMemoFirebase(
        () => query(collection(firestore, 'finances'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: finances, isLoading } = useCollection<any>(financesQuery);

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !reason) {
            toast({ title: 'Error', description: 'Amount and reason are required.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'finances'), {
                type,
                amount: parseFloat(amount),
                reason,
                requestedBy: 'Admin',
                status: 'approved', // Admin records are auto-approved
                createdAt: serverTimestamp()
            });
            toast({ title: 'Success', description: 'Financial record added.' });
            setAmount('');
            setReason('');
        } catch (error) {
            toast({ title: 'Error', description: 'Could not add record.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await updateDoc(doc(firestore, 'finances', id), { status });
            toast({ title: 'Updated', description: `Request marked as ${status}.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
        }
    };

    const totals = {
        income: 0,
        expenses: 0,
        pending: 0
    };

    finances?.forEach(f => {
        if (f.type === 'income') totals.income += f.amount || 0;
        else if (f.status === 'approved') totals.expenses += f.amount || 0;
        else if (f.status === 'pending') totals.pending += f.amount || 0;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-headline text-slate-900">Financial Tracking</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-green-200 bg-green-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-green-700 flex items-center gap-2"><ArrowUpRight size={16}/> Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-green-700">KSh {totals.income.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-red-200 bg-red-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2"><ArrowDownRight size={16}/> Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-red-700">KSh {totals.expenses.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-amber-200 bg-amber-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-amber-700 flex items-center gap-2"><Clock size={16}/> Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-amber-700">KSh {totals.pending.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Log Transaction</CardTitle>
                        <CardDescription>Manually record income or expense.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddRecord} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Income (Money Received)</SelectItem>
                                        <SelectItem value="advertisement">Advertisement Expense</SelectItem>
                                        <SelectItem value="other_expense">Other Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Amount (KSh)</Label>
                                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description / Reason</Label>
                                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Facebook Ads" />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                Save Record
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-center">Status / Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {finances?.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">No records found.</TableCell></TableRow>
                                    ) : (
                                        finances?.map(f => (
                                            <TableRow key={f.id}>
                                                <TableCell className="text-xs text-slate-500">
                                                    {f.createdAt?.seconds ? format(new Date(f.createdAt.seconds * 1000), 'dd MMM, h:mm a') : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                                        f.type === 'income' ? 'bg-green-100 text-green-700' : 
                                                        f.type === 'facilitation_request' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {f.type.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium text-sm">{f.reason}</TableCell>
                                                <TableCell className="text-sm">{f.requestedBy}</TableCell>
                                                <TableCell className="text-right font-bold">KSh {f.amount?.toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    {f.status === 'pending' ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button size="sm" variant="outline" className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200" onClick={() => handleUpdateStatus(f.id, 'approved')}>
                                                                <CheckCircle2 size={16} />
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200" onClick={() => handleUpdateStatus(f.id, 'rejected')}>
                                                                <XCircle size={16} />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className={`text-xs font-bold ${f.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {f.status.toUpperCase()}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
