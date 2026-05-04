
'use client';

import { useState, useMemo } from 'react';
import { useAdminData } from '@/context/AdminDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, HandCoins, Phone, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminLoansPage() {
    const { loans, loansLoading } = useAdminData();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLoans = useMemo(() => {
        if (!loans) return [];
        return loans.filter(l => 
            (l.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.accountNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [loans, searchQuery]);

    if (loansLoading) {
        return <div className="flex items-center justify-center p-12">Loading loans data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black font-headline text-primary tracking-tight">Loan Management</h1>
                    <p className="text-muted-foreground">Monitor and manage all customer credit facilities.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by customer or account..." 
                        className="pl-8" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Loans</CardTitle>
                    <CardDescription>A comprehensive list of all loan applications and active disbursements.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Account No</TableHead>
                                    <TableHead>Principal (Ksh)</TableHead>
                                    <TableHead>Repayable (Ksh)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!filteredLoans || filteredLoans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                                            No loans found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLoans.map((l) => (
                                        <TableRow key={l.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell>
                                                <div className="font-bold">{l.customerName}</div>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Phone size={10} /> {l.customerPhone}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-primary">
                                                {l.accountNumber || 'N/A'}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {(l.principalAmount || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-bold text-green-700">
                                                {(l.totalRepayableAmount || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    l.status === 'active' ? 'default' : 
                                                    l.status === 'paid' ? 'outline' : 
                                                    l.status === 'application' ? 'secondary' : 'destructive'
                                                } className="uppercase text-[9px]">
                                                    {l.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-[10px] flex items-center gap-1 text-muted-foreground">
                                                    <Calendar size={10} />
                                                    {l.createdAt?.seconds ? format(new Date(l.createdAt.seconds * 1000), 'dd MMM yyyy') : 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8">
                                                    Details <ArrowRight size={14} className="ml-1" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
