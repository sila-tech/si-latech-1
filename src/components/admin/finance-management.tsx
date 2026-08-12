'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock, Download, FileText, Pencil, Trash2, HandCoins, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinanceAiSmartFiller, FinanceAiAuditModal } from './finance-ai-helper';

export function FinanceManagement({ isSuperAdmin = true }: { isSuperAdmin?: boolean }) {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState(isSuperAdmin ? 'income' : 'facilitation_request');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statementPeriod, setStatementPeriod] = useState('all');

    // States for editing
    const [editingRecord, setEditingRecord] = useState<any | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editReason, setEditReason] = useState('');
    const [editType, setEditType] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

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
            // Get admin name from session storage
            let adminName = 'Admin';
            try {
                const stored = sessionStorage.getItem('sila-admin-auth');
                if (stored && stored !== btoa('Sila4927')) {
                    adminName = JSON.parse(stored).name || 'Admin';
                } else if (stored === btoa('Sila4927')) {
                    adminName = 'Super Admin';
                }
            } catch (e) {}

            await addDoc(collection(firestore, 'finances'), {
                type,
                amount: parseFloat(amount),
                reason,
                requestedBy: adminName,
                status: isSuperAdmin ? 'approved' : 'pending',
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

    const startEdit = (record: any) => {
        setEditingRecord(record);
        setEditAmount(record.amount?.toString() || '');
        setEditReason(record.reason || '');
        setEditType(record.type || 'income');
        setEditStatus(record.status || 'pending');
    };

    const handleUpdateRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;
        if (!editAmount || !editReason) {
            toast({ title: 'Error', description: 'Amount and reason are required.', variant: 'destructive' });
            return;
        }

        setIsUpdating(true);
        try {
            await updateDoc(doc(firestore, 'finances', editingRecord.id), {
                amount: parseFloat(editAmount),
                reason: editReason,
                type: editType,
                status: editStatus
            });
            toast({ title: 'Success', description: 'Financial record updated.' });
            setEditingRecord(null);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update record.', variant: 'destructive' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteRecord = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this financial record? This cannot be undone.')) {
            return;
        }
        try {
            await deleteDoc(doc(firestore, 'finances', id));
            toast({ title: 'Deleted', description: 'Financial record deleted successfully.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not delete record.', variant: 'destructive' });
        }
    };

    const totals = {
        income: 0,
        expenses: 0,
        pending: 0,
        staffLoansIssued: 0,
        staffLoansRepaid: 0,
        outstandingLoans: 0
    };

    finances?.forEach(f => {
        const amt = f.amount || 0;
        if (f.type === 'income') {
            totals.income += amt;
        } else if (f.type === 'loan_repayment') {
            if (f.status === 'approved') {
                totals.income += amt;
                totals.staffLoansRepaid += amt;
            }
        } else if (f.type === 'staff_loan') {
            if (f.status === 'approved') {
                totals.expenses += amt;
                totals.staffLoansIssued += amt;
            } else if (f.status === 'pending') {
                totals.pending += amt;
            }
        } else if (f.status === 'approved') {
            totals.expenses += amt;
        } else if (f.status === 'pending') {
            totals.pending += amt;
        }
    });

    totals.outstandingLoans = Math.max(0, totals.staffLoansIssued - totals.staffLoansRepaid);

    const ledgerAsc = finances ? [...finances].filter(f => f.type === 'income' || f.type === 'loan_repayment' || f.status === 'approved').reverse() : [];
    let currentBalance = 0;
    const ledgerEntries = ledgerAsc.map(f => {
        const isCredit = f.type === 'income' || f.type === 'loan_repayment';
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
    const staffLoanRecords = finances ? finances.filter((f: any) => f.type === 'staff_loan' || f.type === 'loan_repayment') : [];

    const filterLedgerByPeriod = (entries: any[]) => {
        if (statementPeriod === 'all') return entries;
        const now = new Date();
        return entries.filter(entry => {
            if (!entry.createdAt?.seconds) return false;
            const entryDate = new Date(entry.createdAt.seconds * 1000);
            if (statementPeriod === 'this_month') {
                return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
            }
            if (statementPeriod === 'last_month') {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return entryDate.getMonth() === lastMonth.getMonth() && entryDate.getFullYear() === lastMonth.getFullYear();
            }
            return true;
        });
    };

    const downloadCSV = () => {
        const headers = ['Date', 'Description', 'User', 'Debit (KSh)', 'Credit (KSh)', 'Running Balance (KSh)'];
        const filteredForDownload = filterLedgerByPeriod(displayLedger);
        const rows = filteredForDownload.map(entry => {
            const dateStr = entry.createdAt?.seconds ? format(new Date(entry.createdAt.seconds * 1000), 'dd/MM/yyyy') : 'N/A';
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
        link.setAttribute("download", `bank_statement_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('SI-LATECH Bank Statement', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 30);
        
        const tableColumn = ["Date", "Description", "User", "Debit (KSh)", "Credit (KSh)", "Balance (KSh)"];
        const filteredForDownload = filterLedgerByPeriod(displayLedger);
        const tableRows = filteredForDownload.map(entry => {
            const dateStr = entry.createdAt?.seconds ? format(new Date(entry.createdAt.seconds * 1000), 'dd/MM/yyyy') : 'N/A';
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="border border-green-200 bg-green-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-2"><ArrowUpRight size={16}/> Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl sm:text-3xl font-black text-green-700">KSh {totals.income.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-red-200 bg-red-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2"><ArrowDownRight size={16}/> Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl sm:text-3xl font-black text-red-700">KSh {totals.expenses.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-purple-200 bg-purple-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2"><HandCoins size={16}/> Outstanding Loans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl sm:text-3xl font-black text-purple-700">KSh {totals.outstandingLoans.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-amber-200 bg-amber-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2"><Clock size={16}/> Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl sm:text-3xl font-black text-amber-700">KSh {totals.pending.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">{isSuperAdmin ? 'Log Transaction' : 'Request Facilitation'}</CardTitle>
                        <CardDescription>{isSuperAdmin ? 'Manually record income, loan, or expense.' : 'Submit a request for facilitation funds or loan.'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSuperAdmin && (
                            <FinanceAiSmartFiller
                                onApplyParsedRecord={({ type: t, amount: a, reason: r }) => {
                                    setType(t);
                                    setAmount(a.toString());
                                    setReason(r);
                                }}
                            />
                        )}
                        <form onSubmit={handleAddRecord} className="space-y-4">
                            {isSuperAdmin && (
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Income (Money Received)</SelectItem>
                                            <SelectItem value="staff_loan">Staff Loan / Salary Advance</SelectItem>
                                            <SelectItem value="loan_repayment">Staff Loan Repayment</SelectItem>
                                            <SelectItem value="facilitation_request">Facilitation Request</SelectItem>
                                            <SelectItem value="advertisement">Advertisement Expense</SelectItem>
                                            <SelectItem value="other_expense">Other Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Amount (KSh)</Label>
                                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description / Reason</Label>
                                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isSuperAdmin ? "e.g. Salary advance for Technician John" : "e.g. Transport to site"} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                {isSuperAdmin ? 'Save Record' : 'Submit Request'}
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
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="bank">Mini Bank (Ledger)</TabsTrigger>
                                <TabsTrigger value="history">Pending & History</TabsTrigger>
                                <TabsTrigger value="staff_loans">Staff Loans</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="bank" className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label className="whitespace-nowrap text-xs text-slate-500">Period:</Label>
                                        <Select value={statementPeriod} onValueChange={setStatementPeriod}>
                                            <SelectTrigger className="h-8 w-32 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all" className="text-xs">All Time</SelectItem>
                                                <SelectItem value="this_month" className="text-xs">This Month</SelectItem>
                                                <SelectItem value="last_month" className="text-xs">Last Month</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-end gap-2 flex-wrap">
                                         {isSuperAdmin && (
                                             <FinanceAiAuditModal pendingRequests={finances?.filter((f: any) => f.status === 'pending') || []} />
                                         )}
                                        <Button variant="outline" size="sm" onClick={downloadCSV}>
                                            <Download size={16} className="mr-2"/> Excel (CSV)
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={downloadPDF}>
                                            <FileText size={16} className="mr-2"/> PDF
                                        </Button>
                                    </div>
                                </div>
                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto overflow-x-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead className="text-right text-red-600">Debit</TableHead>
                                                    <TableHead className="text-right text-green-600">Credit</TableHead>
                                                    <TableHead className="text-right font-bold">Balance</TableHead>
                                                    <TableHead className="text-center w-[80px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {displayLedger.length === 0 ? (
                                                    <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">No ledger records found.</TableCell></TableRow>
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
                                                            <TableCell className="text-center">
                                                                <div className="flex justify-center gap-1">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-7 w-7 text-slate-500 hover:text-slate-900" 
                                                                        onClick={() => startEdit(entry)}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={14} />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" 
                                                                        onClick={() => handleDeleteRecord(entry.id)}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history">
                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto overflow-x-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>User</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead className="text-center">Status / Action</TableHead>
                                                    <TableHead className="text-center w-[80px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {finances?.length === 0 ? (
                                                    <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">No records found.</TableCell></TableRow>
                                                ) : (
                                                    finances?.map(f => (
                                                        <TableRow key={f.id}>
                                                            <TableCell className="text-xs text-slate-500">
                                                                {f.createdAt?.seconds ? format(new Date(f.createdAt.seconds * 1000), 'dd MMM, h:mm a') : 'N/A'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className={f.type === 'income' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}>
                                                                    {f.type === 'income' ? 'Income' : 'Expense'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-medium text-sm max-w-[200px] truncate" title={f.reason}>{f.reason}</TableCell>
                                                            <TableCell className="text-xs text-slate-500">{f.requestedBy}</TableCell>
                                                            <TableCell className="text-right font-bold">
                                                                KSh {f.amount?.toLocaleString() || '0'}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {f.status === 'pending' ? (
                                                                    isSuperAdmin ? (
                                                                        <div className="flex gap-2 justify-center">
                                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs" onClick={() => handleUpdateStatus(f.id, 'approved')}>Approve</Button>
                                                                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleUpdateStatus(f.id, 'rejected')}>Reject</Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
                                                                    )
                                                                ) : (
                                                                    <Badge variant="outline" className={f.status === 'approved' ? 'text-green-600 border-green-200' : 'text-slate-500'}>
                                                                        {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex justify-center gap-1">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-7 w-7 text-slate-500 hover:text-slate-900" 
                                                                        onClick={() => startEdit(f)}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={14} />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" 
                                                                        onClick={() => handleDeleteRecord(f.id)}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="staff_loans" className="space-y-4">
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Staff Loan Ledger Summary</h4>
                                        <p className="text-xs text-purple-700 font-medium mt-0.5">
                                            Issued: <span className="font-bold">KSh {totals.staffLoansIssued.toLocaleString()}</span>  |  
                                            Repaid: <span className="font-bold text-emerald-700">KSh {totals.staffLoansRepaid.toLocaleString()}</span>  |  
                                            Balance Due: <span className="font-bold text-purple-900">KSh {totals.outstandingLoans.toLocaleString()}</span>
                                        </p>
                                    </div>
                                    {isSuperAdmin && (
                                        <Button 
                                            size="sm" 
                                            onClick={() => { setType('loan_repayment'); setReason('Staff Loan Repayment'); }}
                                            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-8 px-3 rounded-lg shrink-0 gap-1.5"
                                        >
                                            <HandCoins size={14} /> Log Loan Repayment
                                        </Button>
                                    )}
                                </div>

                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto overflow-x-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Category / Type</TableHead>
                                                    <TableHead>Description / Purpose</TableHead>
                                                    <TableHead>Staff Member</TableHead>
                                                    <TableHead className="text-right">Amount (KSh)</TableHead>
                                                    <TableHead className="text-center">Status / Action</TableHead>
                                                    <TableHead className="text-center w-[80px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {staffLoanRecords.length === 0 ? (
                                                    <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">No staff loan records found.</TableCell></TableRow>
                                                ) : (
                                                    staffLoanRecords.map((f: any) => (
                                                        <TableRow key={f.id}>
                                                            <TableCell className="text-xs text-slate-500">
                                                                {f.createdAt?.seconds ? format(new Date(f.createdAt.seconds * 1000), 'dd MMM, h:mm a') : 'N/A'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className={
                                                                    f.type === 'loan_repayment' 
                                                                        ? 'text-emerald-700 border-emerald-300 bg-emerald-50 font-bold' 
                                                                        : 'text-purple-700 border-purple-300 bg-purple-50 font-bold'
                                                                }>
                                                                    {f.type === 'loan_repayment' ? 'Repayment' : 'Staff Loan'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-medium text-sm max-w-[200px] truncate" title={f.reason}>{f.reason}</TableCell>
                                                            <TableCell className="text-xs text-slate-700 font-semibold">{f.requestedBy || 'Admin'}</TableCell>
                                                            <TableCell className={`text-right font-bold ${f.type === 'loan_repayment' ? 'text-emerald-600' : 'text-purple-700'}`}>
                                                                {f.type === 'loan_repayment' ? `+KSh ${f.amount?.toLocaleString()}` : `-KSh ${f.amount?.toLocaleString()}`}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {f.status === 'pending' ? (
                                                                    isSuperAdmin ? (
                                                                        <div className="flex gap-1.5 justify-center">
                                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs" onClick={() => handleUpdateStatus(f.id, 'approved')}>Approve</Button>
                                                                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleUpdateStatus(f.id, 'rejected')}>Reject</Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
                                                                    )
                                                                ) : (
                                                                    <Badge variant="outline" className={f.status === 'approved' ? 'text-green-600 border-green-200 font-bold' : 'text-slate-500'}>
                                                                        {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex justify-center gap-1">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-7 w-7 text-slate-500 hover:text-slate-900" 
                                                                        onClick={() => startEdit(f)}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={14} />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" 
                                                                        onClick={() => handleDeleteRecord(f.id)}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Financial Record Dialog */}
            <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
                <DialogContent className="w-[95vw] sm:max-w-md bg-white border border-slate-200 shadow-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900">Edit Financial Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateRecord} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Type</Label>
                            <Select value={editType} onValueChange={setEditType}>
                                <SelectTrigger id="edit-type"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="income">Income (Money Received)</SelectItem>
                                    <SelectItem value="staff_loan">Staff Loan / Salary Advance</SelectItem>
                                    <SelectItem value="loan_repayment">Staff Loan Repayment</SelectItem>
                                    <SelectItem value="facilitation_request">Facilitation Request</SelectItem>
                                    <SelectItem value="advertisement">Advertisement Expense</SelectItem>
                                    <SelectItem value="other_expense">Other Expense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">Amount (KSh)</Label>
                            <Input 
                                id="edit-amount"
                                type="number" 
                                value={editAmount} 
                                onChange={(e) => setEditAmount(e.target.value)} 
                                placeholder="0" 
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-reason">Description / Reason</Label>
                            <Input 
                                id="edit-reason"
                                value={editReason} 
                                onChange={(e) => setEditReason(e.target.value)} 
                                placeholder="Reason" 
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
                            <Button type="submit" disabled={isUpdating} className="bg-primary hover:bg-primary/95 text-white">
                                {isUpdating ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
