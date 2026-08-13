'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    Loader2, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight, 
    Clock, 
    Download, 
    FileText, 
    Pencil, 
    Trash2, 
    HandCoins, 
    BarChart2, 
    Landmark, 
    PlusCircle, 
    TrendingUp, 
    ChevronDown,
    Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FinanceAiSmartFiller, FinanceAiAuditModal } from './finance-ai-helper';

export interface FinanceManagementProps {
    isSuperAdmin?: boolean;
    activeSubTab?: string;
    onSubTabChange?: (tab: string) => void;
}

export function FinanceManagement({ 
    isSuperAdmin = true,
    activeSubTab = 'overview',
    onSubTabChange
}: FinanceManagementProps) {
    const [subTab, setSubTab] = useState(activeSubTab);
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

    useEffect(() => {
        if (activeSubTab) {
            setSubTab(activeSubTab);
        }
    }, [activeSubTab]);

    const handleTabChange = (tab: string) => {
        setSubTab(tab);
        if (onSubTabChange) {
            onSubTabChange(tab);
        }
    };

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

            // Switch to mini bank or history after adding
            if (type === 'income' || type === 'loan_repayment') {
                handleTabChange('bank');
            } else if (type === 'staff_loan') {
                handleTabChange('staff_loans');
            } else if (!isSuperAdmin) {
                handleTabChange('pending_requests');
            }
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

    const totals = useMemo(() => {
        const res = {
            income: 0,
            expenses: 0,
            pending: 0,
            pendingCount: 0,
            staffLoansIssued: 0,
            staffLoansRepaid: 0,
            outstandingLoans: 0
        };

        finances?.forEach(f => {
            const amt = f.amount || 0;
            if (f.type === 'income') {
                res.income += amt;
            } else if (f.type === 'loan_repayment') {
                if (f.status === 'approved') {
                    res.income += amt;
                    res.staffLoansRepaid += amt;
                }
            } else if (f.type === 'staff_loan') {
                if (f.status === 'approved') {
                    res.expenses += amt;
                    res.staffLoansIssued += amt;
                } else if (f.status === 'pending') {
                    res.pending += amt;
                    res.pendingCount += 1;
                }
            } else if (f.status === 'approved') {
                res.expenses += amt;
            } else if (f.status === 'pending') {
                res.pending += amt;
                res.pendingCount += 1;
            }
        });

        res.outstandingLoans = Math.max(0, res.staffLoansIssued - res.staffLoansRepaid);
        return res;
    }, [finances]);

    const ledgerEntries = useMemo(() => {
        const ledgerAsc = finances ? [...finances].filter(f => f.type === 'income' || f.type === 'loan_repayment' || f.status === 'approved').reverse() : [];
        let currentBalance = 0;
        const entries = ledgerAsc.map(f => {
            const isCredit = f.type === 'income' || f.type === 'loan_repayment';
            const amt = f.amount || 0;
            const debit = !isCredit ? amt : 0;
            const credit = isCredit ? amt : 0;
            currentBalance += credit - debit;
            return {
                ...f,
                debit,
                credit,
                balance: currentBalance
            };
        });
        return [...entries].reverse();
    }, [finances]);

    const pendingRequestsList = useMemo(() => {
        return finances ? finances.filter((f: any) => f.status === 'pending') : [];
    }, [finances]);

    const staffLoanRecords = useMemo(() => {
        return finances ? finances.filter((f: any) => f.type === 'staff_loan' || f.type === 'loan_repayment') : [];
    }, [finances]);

    // Income vs Expenses Chart Data (Smooth Curved Dual Area)
    const chartData = useMemo(() => {
        if (!finances || finances.length === 0) return [];

        const dateMap: { [dateStr: string]: { date: string; timestamp: number; income: number; expenses: number } } = {};
        const sortedFinances = [...finances].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

        sortedFinances.forEach((f) => {
            if (!f.createdAt?.seconds) return;
            const dateObj = new Date(f.createdAt.seconds * 1000);
            const dateStr = format(dateObj, 'dd MMM');
            const timestamp = dateObj.getTime();

            if (!dateMap[dateStr]) {
                dateMap[dateStr] = { date: dateStr, timestamp, income: 0, expenses: 0 };
            }

            const amt = Number(f.amount) || 0;
            if (f.type === 'income' || (f.type === 'loan_repayment' && f.status === 'approved')) {
                dateMap[dateStr].income += amt;
            } else if (f.status === 'approved' || f.type === 'staff_loan') {
                dateMap[dateStr].expenses += amt;
            }
        });

        return Object.values(dateMap).sort((a, b) => a.timestamp - b.timestamp);
    }, [finances]);

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
        const filteredForDownload = filterLedgerByPeriod(ledgerEntries);
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
        const filteredForDownload = filterLedgerByPeriod(ledgerEntries);
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
            {/* Header & Sub-Navigation Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
                <div>
                    <h2 className="text-2xl font-black font-headline text-slate-900 tracking-tight">Finances &amp; Ledger</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Cashflow analytics, bank statement, staff loan tracking &amp; approvals.</p>
                </div>

                {/* Sub-tab Navigation Selector (Dropdown for mobile + Pill buttons for desktop) */}
                <div className="flex items-center gap-2">
                    {/* Mobile Dropdown Select */}
                    <div className="md:hidden w-full">
                        <Select value={subTab} onValueChange={handleTabChange}>
                            <SelectTrigger className="w-full bg-slate-100 border-slate-200 text-xs font-bold h-10 rounded-xl">
                                <SelectValue placeholder="Select Finance Section" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="overview" className="text-xs font-medium">📈 Overview &amp; Graph</SelectItem>
                                <SelectItem value="bank" className="text-xs font-medium">🏦 Mini Bank (Ledger)</SelectItem>
                                <SelectItem value="manual_record" className="text-xs font-medium">📝 Manual Record Form</SelectItem>
                                <SelectItem value="pending_requests" className="text-xs font-medium">⏳ Pending Requests ({totals.pendingCount})</SelectItem>
                                <SelectItem value="staff_loans" className="text-xs font-medium">💳 Staff Loans Ledger</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Desktop Navigation Tabs */}
                    <div className="hidden md:flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                        <button
                            onClick={() => handleTabChange('overview')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                subTab === 'overview'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <BarChart2 size={14} /> Overview &amp; Graph
                        </button>
                        <button
                            onClick={() => handleTabChange('bank')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                subTab === 'bank'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <Landmark size={14} /> Mini Bank
                        </button>
                        <button
                            onClick={() => handleTabChange('manual_record')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                subTab === 'manual_record'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <PlusCircle size={14} /> Manual Record
                        </button>
                        <button
                            onClick={() => handleTabChange('pending_requests')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                                subTab === 'pending_requests'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <Clock size={14} /> Pending
                            {totals.pendingCount > 0 && (
                                <span className="ml-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                                    {totals.pendingCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('staff_loans')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                subTab === 'staff_loans'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <HandCoins size={14} /> Staff Loans
                        </button>
                    </div>
                </div>
            </div>

            {/* Financial Summary Cards (Always Visible at Top of Finance) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-green-200 bg-green-50/60 shadow-xs hover:shadow-sm transition-all rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><ArrowUpRight size={16}/> Total Income</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl sm:text-3xl font-black text-green-700 tabular-nums">KSh {totals.income.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-red-200 bg-red-50/60 shadow-xs hover:shadow-sm transition-all rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><ArrowDownRight size={16}/> Total Expenses</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl sm:text-3xl font-black text-red-700 tabular-nums">KSh {totals.expenses.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-purple-200 bg-purple-50/60 shadow-xs hover:shadow-sm transition-all rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><HandCoins size={16}/> Outstanding Loans</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl sm:text-3xl font-black text-purple-700 tabular-nums">KSh {totals.outstandingLoans.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-amber-200 bg-amber-50/60 shadow-xs hover:shadow-sm transition-all rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Clock size={16}/> Pending Requests</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl sm:text-3xl font-black text-amber-700 tabular-nums">KSh {totals.pending.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* TAB CONTENT 1: OVERVIEW & INCOME VS EXPENSES GRAPH */}
            {subTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Income vs Expenses Curved Graph */}
                    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-[#095388]" /> Income vs Expenses Trend
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        Smooth cash flow analytics over historical recording dates
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-1.5 text-sky-600">
                                        <span className="h-3 w-3 rounded-full bg-sky-500 inline-block shadow-xs"></span>
                                        Income
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <span className="h-3 w-3 rounded-full bg-slate-700 inline-block shadow-xs"></span>
                                        Expenses
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 pb-4">
                            {chartData.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                                    <BarChart2 className="h-10 w-10 text-slate-300 mb-2" />
                                    <p className="font-semibold text-slate-600">No financial transactions recorded yet.</p>
                                    <p className="text-slate-400 mt-0.5">Use the Manual Record tab to log income or expenses.</p>
                                </div>
                            ) : (
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.65} />
                                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                                                </linearGradient>
                                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#334155" stopOpacity={0.7} />
                                                    <stop offset="95%" stopColor="#334155" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis 
                                                tick={{ fontSize: 11, fill: '#64748b' }} 
                                                axisLine={false} 
                                                tickLine={false}
                                                tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                                                formatter={(value: any) => [`KSh ${Number(value).toLocaleString()}`, '']}
                                            />
                                            <Area type="monotone" dataKey="income" name="Income" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGradient)" />
                                            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#334155" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Activity Table */}
                    <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold text-slate-900">Recent Financial Activity</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => handleTabChange('bank')} className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                                View Full Bank Ledger →
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Requested By</TableHead>
                                        <TableHead className="text-right">Amount (KSh)</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!finances || finances.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8 italic">No financial activity recorded yet.</TableCell></TableRow>
                                    ) : (
                                        finances.slice(0, 5).map((f: any) => (
                                            <TableRow key={f.id} className="hover:bg-slate-50/80">
                                                <TableCell className="text-xs text-slate-500">
                                                    {f.createdAt?.seconds ? format(new Date(f.createdAt.seconds * 1000), 'dd MMM, h:mm a') : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={f.type === 'income' ? 'text-green-700 border-green-200 bg-green-50 font-bold' : 'text-red-700 border-red-200 bg-red-50 font-bold'}>
                                                        {f.type === 'income' ? 'Income' : f.type === 'staff_loan' ? 'Staff Loan' : f.type === 'loan_repayment' ? 'Repayment' : 'Expense'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium text-xs text-slate-900 max-w-[220px] truncate" title={f.reason}>{f.reason}</TableCell>
                                                <TableCell className="text-xs text-slate-500">{f.requestedBy || 'Admin'}</TableCell>
                                                <TableCell className={`text-right font-black text-xs ${f.type === 'income' || f.type === 'loan_repayment' ? 'text-green-600' : 'text-slate-900'}`}>
                                                    KSh {f.amount?.toLocaleString() || '0'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={f.status === 'approved' ? 'text-green-700 border-green-200 font-bold' : f.status === 'pending' ? 'text-amber-700 border-amber-200 bg-amber-50 font-bold' : 'text-slate-500'}>
                                                        {f.status ? f.status.charAt(0).toUpperCase() + f.status.slice(1) : 'Approved'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB CONTENT 2: MINI BANK (LEDGER) */}
            {subTab === 'bank' && (
                <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden animate-in fade-in duration-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-emerald-600" /> Mini Bank Running Ledger
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Complete audit trail of all approved credits, debits, and running cash balances.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                                <div className="flex items-center gap-2">
                                    <Label className="whitespace-nowrap text-xs text-slate-500 font-semibold">Period:</Label>
                                    <Select value={statementPeriod} onValueChange={setStatementPeriod}>
                                        <SelectTrigger className="h-8 w-32 text-xs font-bold rounded-lg border-slate-200 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="all" className="text-xs">All Time</SelectItem>
                                            <SelectItem value="this_month" className="text-xs">This Month</SelectItem>
                                            <SelectItem value="last_month" className="text-xs">Last Month</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline" size="sm" onClick={downloadCSV} className="h-8 text-xs font-bold border-slate-200">
                                    <Download size={14} className="mr-1.5 text-emerald-600"/> Excel (CSV)
                                </Button>
                                <Button variant="outline" size="sm" onClick={downloadPDF} className="h-8 text-xs font-bold border-slate-200">
                                    <FileText size={14} className="mr-1.5 text-red-600"/> PDF Statement
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#095388]" /></div>
                        ) : (
                            <div className="max-h-[550px] overflow-y-auto overflow-x-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-2xs border-b">
                                        <TableRow>
                                            <TableHead className="text-xs uppercase font-bold text-slate-600">Date</TableHead>
                                            <TableHead className="text-xs uppercase font-bold text-slate-600">Description</TableHead>
                                            <TableHead className="text-right text-xs uppercase font-bold text-red-600">Debit (KSh)</TableHead>
                                            <TableHead className="text-right text-xs uppercase font-bold text-green-600">Credit (KSh)</TableHead>
                                            <TableHead className="text-right text-xs uppercase font-bold text-slate-900">Running Balance</TableHead>
                                            <TableHead className="text-center w-[90px] text-xs uppercase font-bold text-slate-600">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ledgerEntries.length === 0 ? (
                                            <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-12 italic">No ledger records found for this period.</TableCell></TableRow>
                                        ) : (
                                            ledgerEntries.map((entry: any) => (
                                                <TableRow key={entry.id} className="hover:bg-slate-50/90 transition-colors border-b">
                                                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                                        {entry.createdAt?.seconds ? format(new Date(entry.createdAt.seconds * 1000), 'dd MMM yyyy, h:mm a') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-xs text-slate-900">
                                                        {entry.reason}
                                                        <div className="text-[10px] text-slate-400 font-normal">Logged by: {entry.requestedBy}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600 font-bold text-xs">
                                                        {entry.debit > 0 ? `-${entry.debit.toLocaleString()}` : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600 font-bold text-xs">
                                                        {entry.credit > 0 ? `+${entry.credit.toLocaleString()}` : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-slate-900 text-xs tabular-nums">
                                                        KSh {entry.balance.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex justify-center gap-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-7 w-7 text-slate-500 hover:text-slate-900" 
                                                                onClick={() => startEdit(entry)}
                                                                title="Edit Record"
                                                            >
                                                                <Pencil size={14} />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" 
                                                                onClick={() => handleDeleteRecord(entry.id)}
                                                                title="Delete Record"
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
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT 3: MANUAL RECORD & FACILITATION FORM */}
            {subTab === 'manual_record' && (
                <div className="max-w-2xl mx-auto animate-in fade-in duration-200 space-y-6">
                    <Card className="border border-slate-200 shadow-md bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/60 border-b border-slate-100 p-5">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <PlusCircle className="h-5 w-5 text-emerald-600" />
                                {isSuperAdmin ? 'Log Financial Transaction' : 'Submit Facilitation Request'}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                {isSuperAdmin 
                                    ? 'Manually record income, staff loans, repayments, or company expenses.' 
                                    : 'Submit request for site facilitation funds or staff advances for admin approval.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {isSuperAdmin && (
                                <FinanceAiSmartFiller
                                    onApplyParsedRecord={({ type: t, amount: a, reason: r }) => {
                                        setType(t);
                                        setAmount(a.toString());
                                        setReason(r);
                                    }}
                                />
                            )}
                            <form onSubmit={handleAddRecord} className="space-y-5">
                                {isSuperAdmin && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700">Transaction Type</Label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs font-semibold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                <SelectItem value="income">🟢 Income (Money Received)</SelectItem>
                                                <SelectItem value="staff_loan">🟣 Staff Loan / Salary Advance</SelectItem>
                                                <SelectItem value="loan_repayment">🔹 Staff Loan Repayment</SelectItem>
                                                <SelectItem value="facilitation_request">🟡 Facilitation Request</SelectItem>
                                                <SelectItem value="advertisement">🔴 Advertisement Expense</SelectItem>
                                                <SelectItem value="other_expense">🔴 Other Expense</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Amount (KSh)</Label>
                                    <Input 
                                        type="number" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)} 
                                        placeholder="e.g. 15000" 
                                        className="h-10 rounded-xl border-slate-200 text-sm font-semibold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Description / Reason</Label>
                                    <Input 
                                        value={reason} 
                                        onChange={(e) => setReason(e.target.value)} 
                                        placeholder={isSuperAdmin ? "e.g. Client deposit for Ruiru Project slab" : "e.g. Transport and lunch for technician"} 
                                        className="h-10 rounded-xl border-slate-200 text-sm"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-11 rounded-xl shadow-sm" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                    {isSuperAdmin ? 'Save Record' : 'Submit Request'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB CONTENT 4: PENDING REQUESTS */}
            {subTab === 'pending_requests' && (
                <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden animate-in fade-in duration-200">
                    <CardHeader className="bg-amber-50/40 border-b border-amber-100 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-amber-600" /> Pending Approval Requests
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500">
                                    Facilitation and advance requests awaiting Super Admin authorization.
                                </CardDescription>
                            </div>
                            {isSuperAdmin && (
                                <FinanceAiAuditModal pendingRequests={pendingRequestsList} />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#095388]" /></div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 border-b">
                                        <TableRow>
                                            <TableHead className="text-xs uppercase font-bold text-slate-600">Date</TableHead>
                                            <TableHead className="text-xs uppercase font-bold text-slate-600">Type</TableHead>
                                            <TableHead className="text-xs uppercase font-bold text-slate-600">Description</TableHead>
                                            <TableHead className="text-xs uppercase font-bold text-slate-600">Requested By</TableHead>
                                            <TableHead className="text-right text-xs uppercase font-bold text-slate-900">Amount (KSh)</TableHead>
                                            <TableHead className="text-center text-xs uppercase font-bold text-slate-600">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingRequestsList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-slate-400 py-12 italic">
                                                    No pending facilitation or loan requests.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pendingRequestsList.map((f: any) => (
                                                <TableRow key={f.id} className="hover:bg-slate-50 border-b">
                                                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                                        {f.createdAt?.seconds ? format(new Date(f.createdAt.seconds * 1000), 'dd MMM yyyy, h:mm a') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50 font-bold text-xs">
                                                            {f.type === 'staff_loan' ? 'Staff Loan' : 'Facilitation'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-xs text-slate-900">{f.reason}</TableCell>
                                                    <TableCell className="text-xs text-slate-600 font-semibold">{f.requestedBy}</TableCell>
                                                    <TableCell className="text-right font-black text-amber-700 text-xs tabular-nums">
                                                        KSh {f.amount?.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isSuperAdmin ? (
                                                            <div className="flex gap-2 justify-center">
                                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs px-3 rounded-lg" onClick={() => handleUpdateStatus(f.id, 'approved')}>
                                                                    Approve
                                                                </Button>
                                                                <Button size="sm" variant="destructive" className="h-8 text-xs font-bold px-3 rounded-lg" onClick={() => handleUpdateStatus(f.id, 'rejected')}>
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Badge className="bg-amber-100 text-amber-900 border-amber-200">Pending Review</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT 5: STAFF LOANS */}
            {subTab === 'staff_loans' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                        <div>
                            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Staff Loan Ledger Summary</h4>
                            <p className="text-xs text-purple-800 font-medium mt-1">
                                Total Issued: <span className="font-bold">KSh {totals.staffLoansIssued.toLocaleString()}</span>  |  
                                Repaid: <span className="font-bold text-emerald-700">KSh {totals.staffLoansRepaid.toLocaleString()}</span>  |  
                                Balance Due: <span className="font-black text-purple-900">KSh {totals.outstandingLoans.toLocaleString()}</span>
                            </p>
                        </div>
                        {isSuperAdmin && (
                            <Button 
                                size="sm" 
                                onClick={() => { 
                                    setType('loan_repayment'); 
                                    setReason('Staff Loan Repayment'); 
                                    handleTabChange('manual_record');
                                }}
                                className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0 gap-1.5 shadow-xs"
                            >
                                <HandCoins size={14} /> Log Loan Repayment
                            </Button>
                        )}
                    </div>

                    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                            <CardTitle className="text-base font-bold text-slate-900">Staff Loan Records</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#095388]" /></div>
                            ) : (
                                <div className="max-h-[500px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50 border-b">
                                            <TableRow>
                                                <TableHead className="text-xs uppercase font-bold text-slate-600">Date</TableHead>
                                                <TableHead className="text-xs uppercase font-bold text-slate-600">Category</TableHead>
                                                <TableHead className="text-xs uppercase font-bold text-slate-600">Description / Purpose</TableHead>
                                                <TableHead className="text-xs uppercase font-bold text-slate-600">Staff Member</TableHead>
                                                <TableHead className="text-right text-xs uppercase font-bold text-slate-900">Amount (KSh)</TableHead>
                                                <TableHead className="text-center text-xs uppercase font-bold text-slate-600">Status</TableHead>
                                                <TableHead className="text-center w-[90px] text-xs uppercase font-bold text-slate-600">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {staffLoanRecords.length === 0 ? (
                                                <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-12 italic">No staff loan or repayment records found.</TableCell></TableRow>
                                            ) : (
                                                staffLoanRecords.map((f: any) => (
                                                    <TableRow key={f.id} className="hover:bg-slate-50 border-b">
                                                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                                            {f.createdAt?.seconds ? format(new Date(f.createdAt.seconds * 1000), 'dd MMM yyyy, h:mm a') : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={
                                                                f.type === 'loan_repayment' 
                                                                    ? 'text-emerald-700 border-emerald-300 bg-emerald-50 font-bold text-xs' 
                                                                    : 'text-purple-700 border-purple-300 bg-purple-50 font-bold text-xs'
                                                            }>
                                                                {f.type === 'loan_repayment' ? 'Repayment' : 'Staff Loan'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-xs text-slate-900">{f.reason}</TableCell>
                                                        <TableCell className="text-xs text-slate-700 font-semibold">{f.requestedBy || 'Admin'}</TableCell>
                                                        <TableCell className={`text-right font-black text-xs tabular-nums ${f.type === 'loan_repayment' ? 'text-emerald-600' : 'text-purple-700'}`}>
                                                            {f.type === 'loan_repayment' ? `+KSh ${f.amount?.toLocaleString()}` : `-KSh ${f.amount?.toLocaleString()}`}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={f.status === 'approved' ? 'text-emerald-700 border-emerald-200 font-bold text-xs' : 'text-amber-700 border-amber-200 bg-amber-50 font-bold text-xs'}>
                                                                {f.status ? f.status.charAt(0).toUpperCase() + f.status.slice(1) : 'Approved'}
                                                            </Badge>
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
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Edit Financial Record Dialog */}
            <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
                <DialogContent className="w-[95vw] sm:max-w-md bg-white border border-slate-200 shadow-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900">Edit Financial Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateRecord} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-type" className="text-xs font-bold text-slate-700">Type</Label>
                            <Select value={editType} onValueChange={setEditType}>
                                <SelectTrigger id="edit-type" className="h-10 rounded-xl border-slate-200 text-xs font-semibold"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white">
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
                            <Label htmlFor="edit-amount" className="text-xs font-bold text-slate-700">Amount (KSh)</Label>
                            <Input 
                                id="edit-amount" 
                                type="number" 
                                value={editAmount} 
                                onChange={(e) => setEditAmount(e.target.value)} 
                                className="h-10 rounded-xl border-slate-200 text-sm font-semibold" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-reason" className="text-xs font-bold text-slate-700">Description / Reason</Label>
                            <Input 
                                id="edit-reason" 
                                value={editReason} 
                                onChange={(e) => setEditReason(e.target.value)} 
                                className="h-10 rounded-xl border-slate-200 text-sm" 
                            />
                        </div>
                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-status" className="text-xs font-bold text-slate-700">Status</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger id="edit-status" className="h-10 rounded-xl border-slate-200 text-xs font-semibold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditingRecord(null)} className="h-10 rounded-xl border-slate-200 font-semibold text-xs">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl text-xs px-5">
                                {isUpdating ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
