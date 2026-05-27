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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const ledgerAsc = finances ? [...finances].filter(f => f.type === 'income' || f.status === 'approved').reverse() : [];
    let currentBalance = 0;
    const ledgerEntries = ledgerAsc.map(f => {
        const isCredit = f.type === 'income';
        const amount = f.amount || 0;
        const debit = !isCredit ? amount : 0;
        const credit = isCredit ? amount : 0;
        currentBalance += credit - debit;
        return {
            ...f,
            debit,
            credit,
            balance: currentBalance
        };
    });
    const displayLedger = [...ledgerEntries].reverse();

    const downloadCSV = () => {
        const headers = ['Date', 'Description', 'User', 'Debit (KSh)', 'Credit (KSh)', 'Running Balance (KSh)'];
        const rows = displayLedger.map(entry => {
            const dateStr = entry.createdAt?.seconds ? format(new Date(entry.createdAt.seconds * 1000), 'dd MMM yyyy, h:mm a') : 'N/A';
            return [
                `"${dateStr}"`,
                `"${entry.reason.replace(/"/g, '""')}"`,
                `"${entry.requestedBy}"`,
                entry.debit,
                entry.credit,
                entry.balance
            ].join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bank_statement_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('SI-LATECH Bank Statement', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, h:mm a')}`, 14, 30);
        
        const tableColumn = ["Date", "Description", "User", "Debit (KSh)", "Credit (KSh)", "Balance (KSh)"];
        const tableRows = displayLedger.map(entry => {
            const dateStr = entry.createdAt?.seconds ? format(new Date(entry.createdAt.seconds * 1000), 'dd MMM yyyy HH:mm') : 'N/A';
            return [
                dateStr,
                entry.reason,
                entry.requestedBy,
                entry.debit > 0 ? entry.debit.toLocaleString() : '-',
                entry.credit > 0 ? entry.credit.toLocaleString() : '-',
                entry.balance.toLocaleString()
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] }
        });

        doc.save(`bank_statement_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
    };

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
                        <CardTitle className="text-lg">Financial Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="bank" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="bank">Mini Bank (Ledger)</TabsTrigger>
                                <TabsTrigger value="history">Pending & History</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="bank" className="space-y-4">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={downloadCSV}>
                                        <Download size={16} className="mr-2"/> Excel (CSV)
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={downloadPDF}>
                                        <FileText size={16} className="mr-2"/> PDF
                                    </Button>
                                </div>
                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right text-red-600">Debit</TableHead>
                                                <TableHead className="text-right text-green-600">Credit</TableHead>
                                                <TableHead className="text-right font-bold">Balance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayLedger.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">No ledger records found.</TableCell></TableRow>
                                            ) : (
                                                displayLedger.map((entry: any) => (
                                                    <TableRow key={entry.id}>
                                                        <TableCell className="text-xs text-slate-500">
                                                            {entry.createdAt?.seconds ? format(new Date(entry.createdAt.seconds * 1000), 'dd MMM, h:mm a') : 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-sm">
                                                            {entry.reason}
                                                            <div className="text-[10px] text-slate-400">By: {entry.requestedBy}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600">{entry.debit > 0 ? `-${entry.debit.toLocaleString()}` : '-'}</TableCell>
                                                        <TableCell className="text-right text-green-600">{entry.credit > 0 ? `+${entry.credit.toLocaleString()}` : '-'}</TableCell>
                                                        <TableCell className="text-right font-bold">KSh {entry.balance.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </TabsContent>

                            <TabsContent value="history">
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
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
