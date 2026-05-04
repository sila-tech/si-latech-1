
'use client';

import { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
    addInvestor, 
    applyInterestToPortfolio, 
    processWithdrawal, 
    rejectWithdrawal, 
    deleteInvestor, 
    approveDeposit, 
    rejectDeposit 
} from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, PenSquare, Trash2, Check, X, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Schemas
const addInvestorSchema = z.object({
  name: z.string().min(1, 'Investor name is required.'),
  initialInvestment: z.coerce.number().min(1, 'Initial investment must be greater than 0.'),
});

// Interfaces
interface InterestEntry {
  entryId: string;
  date: { seconds: number; nanoseconds: number } | Date;
  amount: number;
  description?: string;
}

interface Withdrawal {
  withdrawalId: string;
  date: { seconds: number; nanoseconds: number } | Date;
  amount: number;
  status: 'pending' | 'processed' | 'rejected';
}

interface Deposit {
  depositId: string;
  date: { seconds: number; nanoseconds: number } | Date;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface Investor {
  id: string;
  name: string;
  initialInvestment: number;
  currentBalance: number;
  interestRate?: number;
  createdAt: { seconds: number; nanoseconds: number };
  interestEntries?: InterestEntry[];
  withdrawals?: Withdrawal[];
  deposits?: Deposit[];
}

export function InvestorsPortfolioTab() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [addInvestorOpen, setAddInvestorOpen] = useState(false);
  const [manageInvestorOpen, setManageInvestorOpen] = useState(false);
  const [deleteInvestorOpen, setDeleteInvestorOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [investorToDelete, setInvestorToDelete] = useState<Investor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const investorsQuery = useMemoFirebase(
    () => query(collection(firestore, 'investors'), orderBy('createdAt', 'desc')),
    [firestore]
  );

  const { data: investors, isLoading: investorsLoading } = useCollection<Investor>(investorsQuery);

  const addInvestorForm = useForm<z.infer<typeof addInvestorSchema>>({
    resolver: zodResolver(addInvestorSchema),
    defaultValues: { name: '', initialInvestment: 0 },
  });

  // Handlers
  async function onAddInvestorSubmit(values: z.infer<typeof addInvestorSchema>) {
    setIsSubmitting(true);
    try {
        await addInvestor(firestore, values);
        toast({ title: 'Investor Added', description: `Portfolio for ${values.name} has been created.` });
        addInvestorForm.reset();
        setAddInvestorOpen(false);
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not add investor.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleManageClick = (investor: Investor) => {
    setSelectedInvestor(investor);
    setManageInvestorOpen(true);
  };
  
  const handleApplyInterest = async () => {
    if (!selectedInvestor || !monthlyInterest) return;
    setIsSubmitting(true);
    try {
        const description = `Monthly interest for ${format(new Date(), 'MMMM yyyy')}`;
        await applyInterestToPortfolio(firestore, selectedInvestor.id, monthlyInterest, description);
        toast({ title: 'Interest Applied', description: `Ksh ${monthlyInterest.toLocaleString()} applied successfully.`});
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not apply interest.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleProcessWithdrawal = async (withdrawalId: string) => {
    if (!selectedInvestor) return;
    setIsSubmitting(true);
    try {
      await processWithdrawal(firestore, selectedInvestor.id, withdrawalId);
      toast({ title: 'Withdrawal Processed', description: "Balance updated successfully."});
    } catch(e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleApproveDeposit = async (depositId: string) => {
    if (!selectedInvestor) return;
    setIsSubmitting(true);
    try {
        await approveDeposit(firestore, selectedInvestor.id, depositId);
        toast({ title: 'Deposit Approved', description: "Investor balance updated." });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    if (!selectedInvestor) return;
    setIsSubmitting(true);
    try {
        await rejectDeposit(firestore, selectedInvestor.id, depositId);
        toast({ title: 'Deposit Rejected' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    if (!selectedInvestor) return;
    setIsSubmitting(true);
    try {
        await rejectWithdrawal(firestore, selectedInvestor.id, withdrawalId);
        toast({ title: 'Withdrawal Rejected' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (investor: Investor) => {
    setInvestorToDelete(investor);
    setDeleteInvestorOpen(true);
  };
  
  async function confirmDelete() {
    if (!investorToDelete) return;
    setIsSubmitting(true);
    try {
        await deleteInvestor(firestore, investorToDelete.id);
        toast({ title: 'Investor Deleted' });
        setDeleteInvestorOpen(false);
        setInvestorToDelete(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const sortedInvestors = useMemo(() => {
      return investors ? [...investors].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)) : [];
  }, [investors]);
  
  const totals = useMemo(() => {
    if (!sortedInvestors) return { initial: 0, balance: 0 };
    return sortedInvestors.reduce((acc, inv) => {
        acc.initial += inv.initialInvestment;
        acc.balance += inv.currentBalance;
        return acc;
    }, { initial: 0, balance: 0 });
  }, [sortedInvestors]);

  const monthlyInterest = useMemo(() => {
    if (!selectedInvestor || !selectedInvestor.interestRate) return 0;
    return (selectedInvestor.currentBalance * (selectedInvestor.interestRate / 100));
  }, [selectedInvestor]);

  const hasInterestBeenAppliedThisMonth = useMemo(() => {
    if (!selectedInvestor?.interestEntries || selectedInvestor.interestEntries.length === 0) return false;
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    return selectedInvestor.interestEntries.some(entry => {
        const entryDate = new Date((entry.date as any).seconds * 1000);
        return entryDate >= startOfCurrentMonth && entryDate <= endOfCurrentMonth;
    });
  }, [selectedInvestor]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-headline text-primary">Investor Portfolios</h2>
          <Dialog open={addInvestorOpen} onOpenChange={setAddInvestorOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Investor
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Investment Portfolio</DialogTitle>
                    <DialogDescription>Create a new tracking account for an investor.</DialogDescription>
                </DialogHeader>
                <Form {...addInvestorForm}>
                    <form onSubmit={addInvestorForm.handleSubmit(onAddInvestorSubmit)} className="space-y-4">
                        <FormField control={addInvestorForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Investor Full Name</FormLabel><FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={addInvestorForm.control} name="initialInvestment" render={({ field }) => (
                            <FormItem><FormLabel>Initial Investment (Ksh)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 animate-spin" />}Create Portfolio</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
          </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Invested Capital</p>
                          <p className="text-2xl font-bold">Ksh {totals.initial.toLocaleString()}</p>
                      </div>
                      <Wallet className="h-8 w-8 text-primary/40" />
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-muted-foreground">Current Assets Value</p>
                          <p className="text-2xl font-bold text-green-600">Ksh {totals.balance.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500/40" />
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-sky-500/5 border-sky-500/20">
              <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Interest Accrued</p>
                          <p className="text-2xl font-bold text-sky-600">Ksh {(totals.balance - totals.initial).toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-sky-500/40" />
                  </div>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Portfolio List</CardTitle></CardHeader>
        <CardContent>
          {investorsLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : sortedInvestors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic">No investors found. Click "Add New Investor" to get started.</div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                          <TableHead>Investor Name</TableHead>
                          <TableHead className="text-right">Initial (Ksh)</TableHead>
                          <TableHead className="text-right">Current Balance (Ksh)</TableHead>
                          <TableHead className="text-right">Growth</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {sortedInvestors.map(inv => (
                          <TableRow key={inv.id}>
                              <TableCell className="font-bold">{inv.name}</TableCell>
                              <TableCell className="text-right">{inv.initialInvestment.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-black text-primary">Ksh {inv.currentBalance.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-green-600">+{((inv.currentBalance - inv.initialInvestment) / inv.initialInvestment * 100).toFixed(1)}%</TableCell>
                              <TableCell className="text-center">
                                  <Button variant="outline" size="sm" onClick={() => handleManageClick(inv)}>
                                      <PenSquare className="mr-2 h-4 w-4" /> Manage
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-destructive ml-2" onClick={() => handleDeleteClick(inv)}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Management Modal */}
      <Dialog open={manageInvestorOpen} onOpenChange={setManageInvestorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
              {selectedInvestor && (
                  <>
                      <DialogHeader>
                          <DialogTitle className="text-2xl font-headline">{selectedInvestor.name}</DialogTitle>
                          <DialogDescription>Portfolio ID: {selectedInvestor.id}</DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="pr-4 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-4">
                                <Card className="border-primary/20">
                                    <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Monthly Interest ({selectedInvestor.interestRate || 10}%)</p>
                                                <p className="font-bold">Ksh {monthlyInterest.toLocaleString()}</p>
                                            </div>
                                            {hasInterestBeenAppliedThisMonth ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700"><Check className="mr-1 h-3 w-3" /> Applied</Badge>
                                            ) : (
                                                <Button size="sm" onClick={handleApplyInterest} disabled={isSubmitting}>Apply Now</Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader><CardTitle className="text-sm">Growth History</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-64">
                                            {(!selectedInvestor.interestEntries || selectedInvestor.interestEntries.length === 0) ? (
                                                <p className="text-center text-muted-foreground text-xs py-8 italic">No entries yet</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {[...selectedInvestor.interestEntries].reverse().map(e => (
                                                        <div key={e.entryId} className="flex justify-between items-center p-2 border-b text-sm">
                                                            <div>
                                                                <p className="font-medium text-green-600">+Ksh {e.amount.toLocaleString()}</p>
                                                                <p className="text-[10px] text-muted-foreground">{format(new Date((e.date as any).seconds * 1000), 'PPP')}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-sky-500" /> Pending Deposits</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-48 text-xs">
                                            {selectedInvestor.deposits?.filter(d => d.status === 'pending').map(d => (
                                                <div key={d.depositId} className="flex items-center justify-between p-2 border rounded-md mb-2">
                                                    <div>
                                                        <p className="font-bold">Ksh {d.amount.toLocaleString()}</p>
                                                        <p className="text-[10px]">{format(new Date((d.date as any).seconds * 1000), 'PP')}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleApproveDeposit(d.depositId)} disabled={isSubmitting}><Check className="h-4 w-4" /></Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRejectDeposit(d.depositId)} disabled={isSubmitting}><X className="h-4 w-4" /></Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {selectedInvestor.deposits?.filter(d => d.status === 'pending').length === 0 && <p className="text-center py-4 italic text-muted-foreground">No pending deposits</p>}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-orange-500" /> Pending Withdrawals</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-48 text-xs">
                                            {selectedInvestor.withdrawals?.filter(w => w.status === 'pending').map(w => (
                                                <div key={w.withdrawalId} className="flex items-center justify-between p-2 border rounded-md mb-2">
                                                    <div>
                                                        <p className="font-bold">Ksh {w.amount.toLocaleString()}</p>
                                                        <p className="text-[10px]">{format(new Date((w.date as any).seconds * 1000), 'PP')}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleProcessWithdrawal(w.withdrawalId)} disabled={isSubmitting}><Check className="h-4 w-4" /></Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRejectWithdrawal(w.withdrawalId)} disabled={isSubmitting}><X className="h-4 w-4" /></Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {selectedInvestor.withdrawals?.filter(w => w.status === 'pending').length === 0 && <p className="text-center py-4 italic text-muted-foreground">No pending withdrawals</p>}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                      </ScrollArea>
                      <DialogFooter className="mt-4 border-t pt-4">
                          <DialogClose asChild><Button variant="secondary">Close Portfolio</Button></DialogClose>
                      </DialogFooter>
                  </>
              )}
          </DialogContent>
      </Dialog>

      <AlertDialog open={deleteInvestorOpen} onOpenChange={setDeleteInvestorOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete {investorToDelete?.name}'s portfolio and all history. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete Forever</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
