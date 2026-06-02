'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { 
    collection, 
    query, 
    orderBy, 
    addDoc, 
    setDoc,
    getDoc,
    serverTimestamp, 
    doc, 
    updateDoc,
    arrayUnion,
    increment
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, DollarSign, Plus, Check, X, Search, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function InvestorManagement() {
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [amount, setAmount] = useState('');
    const [investmentType, setInvestmentType] = useState('Individual');
    const [interestRate, setInterestRate] = useState('30.0');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const firestore = useFirestore();
    const { toast } = useToast();

    // Fetch Customers
    const customersQuery = useMemoFirebase(
        () => query(collection(firestore, 'customers')),
        [firestore]
    );
    const { data: customers, isLoading: customersLoading } = useCollection<any>(customersQuery);

    // Fetch Investors
    const investorsQuery = useMemoFirebase(
        () => query(collection(firestore, 'investors'), orderBy('updatedAt', 'desc')),
        [firestore]
    );
    const { data: investors, isLoading: investorsLoading } = useCollection<any>(investorsQuery);

    // Fetch Pending Applications
    const applicationsQuery = useMemoFirebase(
        () => query(collection(firestore, 'investmentApplications'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: applications, isLoading: applicationsLoading } = useCollection<any>(applicationsQuery);

    const getAdminName = () => {
        let adminName = 'Admin';
        try {
            const stored = sessionStorage.getItem('sila-admin-auth');
            if (stored && stored !== btoa('Sila4927')) {
                adminName = JSON.parse(stored).name || 'Admin';
            } else if (stored === btoa('Sila4927')) {
                adminName = 'Super Admin';
            }
        } catch (e) {}
        return adminName;
    };

    const handleAddInvestment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId || !amount) {
            toast({ title: 'Error', description: 'Customer and amount are required.', variant: 'destructive' });
            return;
        }

        const selectedCust = customers?.find(c => c.id === selectedCustomerId);
        if (!selectedCust) {
            toast({ title: 'Error', description: 'Selected customer not found.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const amtVal = parseFloat(amount);
            const rateVal = parseFloat(interestRate);
            const adminName = getAdminName();
            const depositId = `DEP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            const investorDocRef = doc(firestore, 'investors', selectedCustomerId);
            const investorSnap = await getDoc(investorDocRef);

            const depositEntry = {
                depositId: depositId,
                amount: amtVal,
                date: new Date(),
                status: 'approved'
            };

            if (!investorSnap.exists()) {
                // Initialize investor profile
                await setDoc(investorDocRef, {
                    uid: selectedCustomerId,
                    name: selectedCust.name || 'Member',
                    email: selectedCust.email || '',
                    phone: selectedCust.phone || '',
                    investmentType: investmentType,
                    totalInvestment: amtVal,
                    totalWithdrawn: 0.0,
                    currentBalance: amtVal,
                    interestRate: rateVal,
                    status: 'active',
                    deposits: [depositEntry],
                    withdrawals: [],
                    interestEntries: [],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            } else {
                // Update existing investor profile
                await updateDoc(investorDocRef, {
                    deposits: arrayUnion(depositEntry),
                    totalInvestment: increment(amtVal),
                    currentBalance: increment(amtVal),
                    updatedAt: serverTimestamp()
                });
            }

            // Sync to global finances collection as Income
            await addDoc(collection(firestore, 'finances'), {
                type: 'income',
                amount: amtVal,
                reason: `Manual Investment Top Up: ${selectedCust.name || 'Member'}`,
                requestedBy: adminName,
                status: 'approved',
                createdAt: serverTimestamp()
            });

            toast({ title: 'Success', description: `Added KSh ${amtVal.toLocaleString()} investment for ${selectedCust.name}` });
            setAmount('');
            setSelectedCustomerId('');
        } catch (error) {
            console.error('Error adding investment:', error);
            toast({ title: 'Error', description: 'Failed to record investment.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveApplication = async (app: any) => {
        try {
            const amtVal = parseFloat(app.amount);
            const adminName = getAdminName();
            const depositId = `DEP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            const investorDocRef = doc(firestore, 'investors', app.uid);
            const investorSnap = await getDoc(investorDocRef);

            const depositEntry = {
                depositId: depositId,
                amount: amtVal,
                date: new Date(),
                status: 'approved'
            };

            if (!investorSnap.exists()) {
                await setDoc(investorDocRef, {
                    uid: app.uid,
                    name: app.name || 'Member',
                    email: app.email || '',
                    phone: app.phone || '',
                    investmentType: app.type || 'Individual',
                    totalInvestment: amtVal,
                    totalWithdrawn: 0.0,
                    currentBalance: amtVal,
                    interestRate: 30.0,
                    status: 'active',
                    deposits: [depositEntry],
                    withdrawals: [],
                    interestEntries: [],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            } else {
                await updateDoc(investorDocRef, {
                    deposits: arrayUnion(depositEntry),
                    totalInvestment: increment(amtVal),
                    currentBalance: increment(amtVal),
                    updatedAt: serverTimestamp()
                });
            }

            // Update application status
            await updateDoc(doc(firestore, 'investmentApplications', app.id), {
                status: 'approved',
                updatedAt: serverTimestamp()
            });

            // Sync to global finances collection as Income
            await addDoc(collection(firestore, 'finances'), {
                type: 'income',
                amount: amtVal,
                reason: `Investment App Approved: ${app.name || 'Member'}`,
                requestedBy: adminName,
                status: 'approved',
                createdAt: serverTimestamp()
            });

            toast({ title: 'Application Approved', description: `Approved investment of KSh ${amtVal.toLocaleString()} for ${app.name}` });
        } catch (error) {
            console.error('Error approving application:', error);
            toast({ title: 'Error', description: 'Could not approve application.', variant: 'destructive' });
        }
    };

    const handleRejectApplication = async (app: any) => {
        try {
            await updateDoc(doc(firestore, 'investmentApplications', app.id), {
                status: 'rejected',
                updatedAt: serverTimestamp()
            });
            toast({ title: 'Application Rejected', description: `Investment application for ${app.name} has been rejected.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not reject application.', variant: 'destructive' });
        }
    };

    const filteredInvestors = investors?.filter(i => {
        const matchesSearch = (i.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (i.phone || '').includes(searchQuery);
        return matchesSearch;
    });

    const pendingApplications = applications?.filter(app => app.status === 'pending');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-headline text-slate-900 flex items-center gap-2">
                    <TrendingUp className="text-primary" /> Investor Portal Management
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to Log New Investment */}
                <Card className="lg:col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Add Manual Investment</CardTitle>
                        <CardDescription>Log a manual cash/transfer investment deposit for a customer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddInvestment} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer">Select Customer</Label>
                                {customersLoading ? (
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Loader2 className="animate-spin h-3.5 w-3.5" /> Loading customers...
                                    </div>
                                ) : (
                                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                        <SelectTrigger id="customer">
                                            <SelectValue placeholder="Choose customer..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers?.map((cust: any) => (
                                                <SelectItem key={cust.id} value={cust.id}>
                                                    {cust.name} ({cust.phone || 'No phone'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Investment Amount (KSh)</Label>
                                <Input 
                                    id="amount"
                                    type="number" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                    placeholder="0" 
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={investmentType} onValueChange={setInvestmentType}>
                                        <SelectTrigger id="type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Individual">Individual</SelectItem>
                                            <SelectItem value="Group">Group</SelectItem>
                                            <SelectItem value="Chama">Chama</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rate">APR (%)</Label>
                                    <Input 
                                        id="rate"
                                        type="number" 
                                        step="0.1" 
                                        value={interestRate} 
                                        onChange={(e) => setInterestRate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
                                Add Investment
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Dashboard Tabs for Portfolios & Pending */}
                <Card className="lg:col-span-2 border-slate-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Portfolios & Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="portfolios" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="portfolios">Active Investors ({investors?.length || 0})</TabsTrigger>
                                <TabsTrigger value="applications" className="relative">
                                    Pending Apps
                                    {pendingApplications && pendingApplications.length > 0 && (
                                        <span className="ml-2 bg-red-500 text-white text-[10px] font-black rounded-full h-4 w-4 inline-flex items-center justify-center animate-pulse">
                                            {pendingApplications.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                            
                            {/* TAB 1: Active Portfolios */}
                            <TabsContent value="portfolios" className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search investors by name or phone..." 
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {investorsLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto overflow-x-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead>Investor</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Balance</TableHead>
                                                    <TableHead className="text-right">Total Invested</TableHead>
                                                    <TableHead className="text-center">Last Updated</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!filteredInvestors || filteredInvestors.length === 0 ? (
                                                    <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">No active investors found.</TableCell></TableRow>
                                                ) : (
                                                    filteredInvestors.map((inv: any) => (
                                                        <TableRow key={inv.id}>
                                                            <TableCell>
                                                                <div className="font-bold text-sm text-slate-900">{inv.name}</div>
                                                                <div className="text-[10px] text-slate-500">{inv.phone || 'No phone'}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className="text-xs bg-sky-50 text-sky-700">
                                                                    {inv.investmentType || 'Individual'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right font-black text-slate-900">
                                                                KSh {inv.currentBalance?.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-slate-500 text-xs">
                                                                KSh {inv.totalInvestment?.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-center text-xs text-slate-500">
                                                                {inv.updatedAt?.seconds ? format(new Date(inv.updatedAt.seconds * 1000), 'dd MMM, h:mm a') : 'N/A'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB 2: Pending Applications from Android App */}
                            <TabsContent value="applications" className="space-y-4">
                                {applicationsLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto overflow-x-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead>Applicant</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Requested Amt</TableHead>
                                                    <TableHead className="text-center">Date Submitted</TableHead>
                                                    <TableHead className="text-center">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!pendingApplications || pendingApplications.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-slate-400 py-12 italic">
                                                            No pending investment applications.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    pendingApplications.map((app: any) => (
                                                        <TableRow key={app.id}>
                                                            <TableCell>
                                                                <div className="font-bold text-sm text-slate-900">{app.name}</div>
                                                                <div className="text-[10px] text-slate-500">{app.phone || 'No phone'}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">
                                                                    {app.type || 'Individual'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right font-black text-primary">
                                                                KSh {app.amount?.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-center text-xs text-slate-500">
                                                                {app.createdAt?.seconds ? format(new Date(app.createdAt.seconds * 1000), 'dd MMM yyyy') : 'N/A'}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex gap-2 justify-center">
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="bg-green-600 hover:bg-green-700 h-7 text-xs px-2"
                                                                        onClick={() => handleApproveApplication(app)}
                                                                    >
                                                                        <Check size={14} className="mr-1" /> Approve
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="destructive"
                                                                        className="h-7 text-xs px-2"
                                                                        onClick={() => handleRejectApplication(app)}
                                                                    >
                                                                        <X size={14} className="mr-1" /> Reject
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
        </div>
    );
}
