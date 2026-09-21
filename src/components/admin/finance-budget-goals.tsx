'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Megaphone, 
  Briefcase, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  Sparkles,
  PieChart,
  ArrowUpRight,
  Calculator,
  Layers,
  Percent,
  Flame,
  Check
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface FinanceTargets {
  marketingBudget: number;
  salariesBudget: number;
  operationsBudget: number;
  quotesGoal: number;
  conversionRateGoal: number; // percentage, e.g. 25
  revenueGoal: number; // KSh
  closedDealsGoal: number;
  updatedAt?: any;
}

const DEFAULT_TARGETS: FinanceTargets = {
  marketingBudget: 120000,
  salariesBudget: 350000,
  operationsBudget: 200000,
  quotesGoal: 40,
  conversionRateGoal: 25,
  revenueGoal: 3500000,
  closedDealsGoal: 10,
};

interface FinanceBudgetGoalsProps {
  isSuperAdmin?: boolean;
}

export function FinanceBudgetGoals({ isSuperAdmin = true }: FinanceBudgetGoalsProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<'this_month' | 'last_month' | 'all'>('this_month');

  // Load finance transactions
  const financesQuery = useMemoFirebase(
    () => query(collection(firestore, 'finances'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const { data: finances } = useCollection<any>(financesQuery);

  // Load quotes
  const quotesQuery = useMemoFirebase(
    () => query(collection(firestore, 'quotes'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const { data: quotes } = useCollection<any>(quotesQuery);

  // Load projects
  const projectsQuery = useMemoFirebase(
    () => query(collection(firestore, 'projects'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const { data: projects } = useCollection<any>(projectsQuery);

  // Load settings/finance_targets
  const settingsQuery = useMemoFirebase(
    () => collection(firestore, 'settings'),
    [firestore]
  );
  const { data: settingsList } = useCollection<any>(settingsQuery);

  const targets: FinanceTargets = useMemo(() => {
    const found = settingsList?.find((s: any) => s.id === 'finance_targets');
    if (found) {
      return {
        marketingBudget: Number(found.marketingBudget) || DEFAULT_TARGETS.marketingBudget,
        salariesBudget: Number(found.salariesBudget) || DEFAULT_TARGETS.salariesBudget,
        operationsBudget: Number(found.operationsBudget) || DEFAULT_TARGETS.operationsBudget,
        quotesGoal: Number(found.quotesGoal) || DEFAULT_TARGETS.quotesGoal,
        conversionRateGoal: Number(found.conversionRateGoal) || DEFAULT_TARGETS.conversionRateGoal,
        revenueGoal: Number(found.revenueGoal) || DEFAULT_TARGETS.revenueGoal,
        closedDealsGoal: Number(found.closedDealsGoal) || DEFAULT_TARGETS.closedDealsGoal,
      };
    }
    return DEFAULT_TARGETS;
  }, [settingsList]);

  // Form states for editing targets
  const [formTargets, setFormTargets] = useState<FinanceTargets>(DEFAULT_TARGETS);

  const handleOpenEdit = () => {
    setFormTargets(targets);
    setIsEditModalOpen(true);
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(firestore, 'settings', 'finance_targets'), {
        ...formTargets,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({
        title: 'Targets Updated',
        description: 'Monthly budget and conversion goals have been updated successfully.',
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error Saving Targets',
        description: err.message || 'Could not save targets to database.',
        variant: 'destructive',
      });
    }
  };

  // Month date range helper
  const now = new Date();
  const currentMonthStart = startOfMonth(now).getTime();
  const currentMonthEnd = endOfMonth(now).getTime();

  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).getTime();
  const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).getTime();

  const isWithinPeriod = (timestampSec?: number) => {
    if (!timestampSec) return false;
    const ms = timestampSec * 1000;
    if (selectedMonth === 'all') return true;
    if (selectedMonth === 'this_month') {
      return ms >= currentMonthStart && ms <= currentMonthEnd;
    }
    if (selectedMonth === 'last_month') {
      return ms >= lastMonthStart && ms <= lastMonthEnd;
    }
    return true;
  };

  // 1. Budget Spending Calculations
  const budgetStats = useMemo(() => {
    let marketingSpent = 0;
    let salariesSpent = 0;
    let operationsSpent = 0;

    finances?.forEach((f: any) => {
      if (f.status === 'rejected') return;
      if (!isWithinPeriod(f.createdAt?.seconds)) return;

      const amt = Number(f.amount) || 0;
      const t = (f.type || '').toLowerCase();
      const r = (f.reason || '').toLowerCase();

      // Check Marketing
      if (t === 'advertisement' || r.includes('marketing') || r.includes('facebook') || r.includes('ads') || r.includes('ad ') || r.includes('flyer') || r.includes('tiktok')) {
        marketingSpent += amt;
      }
      // Check Salaries / Advances / Field Facilitation
      else if (t === 'salary' || t === 'staff_loan' || t === 'facilitation_request' || r.includes('salary') || r.includes('advance') || r.includes('allowance') || r.includes('wage')) {
        salariesSpent += amt;
      }
      // Other Operational Expenses
      else if (t === 'other_expense' || (t !== 'income' && t !== 'loan_repayment')) {
        operationsSpent += amt;
      }
    });

    const totalBudget = targets.marketingBudget + targets.salariesBudget + targets.operationsBudget;
    const totalSpent = marketingSpent + salariesSpent + operationsSpent;

    return {
      marketing: {
        budget: targets.marketingBudget,
        spent: marketingSpent,
        pct: targets.marketingBudget > 0 ? Math.round((marketingSpent / targets.marketingBudget) * 100) : 0,
        remaining: targets.marketingBudget - marketingSpent,
      },
      salaries: {
        budget: targets.salariesBudget,
        spent: salariesSpent,
        pct: targets.salariesBudget > 0 ? Math.round((salariesSpent / targets.salariesBudget) * 100) : 0,
        remaining: targets.salariesBudget - salariesSpent,
      },
      operations: {
        budget: targets.operationsBudget,
        spent: operationsSpent,
        pct: targets.operationsBudget > 0 ? Math.round((operationsSpent / targets.operationsBudget) * 100) : 0,
        remaining: targets.operationsBudget - operationsSpent,
      },
      total: {
        budget: totalBudget,
        spent: totalSpent,
        pct: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        remaining: totalBudget - totalSpent,
      }
    };
  }, [finances, targets, selectedMonth]);

  // 2. Performance Goals & Conversion Calculations
  const goalsStats = useMemo(() => {
    // Quotes generated in period
    const periodQuotes = (quotes || []).filter((q: any) => isWithinPeriod(q.createdAt?.seconds));
    const quotesCount = periodQuotes.length;
    const quotesTotalValue = periodQuotes.reduce((acc, q) => acc + (Number(q.grandTotal) || 0), 0);

    // Projects in period
    const periodProjects = (projects || []).filter((p: any) => isWithinPeriod(p.createdAt?.seconds));
    const closedProjects = periodProjects.filter((p: any) => {
      const s = (p.status || '').toLowerCase();
      return s === 'running' || s === 'finished' || s === 'paid' || s === 'expected';
    });

    // Conversion rate = (closedProjects / quotesCount) * 100
    // If quotesCount is 0, fallback to comparing closed projects to total period projects
    const conversionDenominator = quotesCount > 0 ? quotesCount : periodProjects.length;
    const actualConversionRate = conversionDenominator > 0 
      ? Math.round((closedProjects.length / conversionDenominator) * 100) 
      : 0;

    // Closed deals total revenue
    const revenueClosed = closedProjects.reduce((acc, p) => {
      const val = Number(p.profit) || Number(p.grandTotal) || 0;
      return acc + val;
    }, 0);

    return {
      quotesCount,
      quotesTotalValue,
      quotesProgress: targets.quotesGoal > 0 ? Math.min(100, Math.round((quotesCount / targets.quotesGoal) * 100)) : 0,
      
      conversionRate: actualConversionRate,
      conversionProgress: targets.conversionRateGoal > 0 ? Math.min(100, Math.round((actualConversionRate / targets.conversionRateGoal) * 100)) : 0,
      
      closedDeals: closedProjects.length,
      closedDealsProgress: targets.closedDealsGoal > 0 ? Math.min(100, Math.round((closedProjects.length / targets.closedDealsGoal) * 100)) : 0,

      revenueClosed,
      revenueProgress: targets.revenueGoal > 0 ? Math.min(100, Math.round((revenueClosed / targets.revenueGoal) * 100)) : 0,
    };
  }, [quotes, projects, targets, selectedMonth]);

  // Smart financial insight pill
  const getBudgetStatusBadge = (pct: number) => {
    if (pct > 100) {
      return <Badge variant="destructive" className="text-[10px] font-extrabold uppercase gap-1"><AlertTriangle size={12} /> Over Budget</Badge>;
    }
    if (pct >= 80) {
      return <Badge className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase gap-1"><AlertTriangle size={12} /> Nearing Limit ({pct}%)</Badge>;
    }
    return <Badge className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase gap-1"><CheckCircle2 size={12} /> Healthy ({pct}%)</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#095388] flex items-center justify-center border border-sky-100">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight font-headline">
              Monthly Budget &amp; Performance Goals
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track expected vs. actual spend on Marketing &amp; Salaries, and monitor quote conversion rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setSelectedMonth('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMonth === 'this_month'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month ({format(now, 'MMM')})
            </button>
            <button
              onClick={() => setSelectedMonth('last_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMonth === 'last_month'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setSelectedMonth('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMonth === 'all'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          {isSuperAdmin && (
            <Button
              onClick={handleOpenEdit}
              className="bg-[#095388] hover:bg-[#073f67] text-white font-bold text-xs h-9 px-3.5 rounded-xl gap-1.5 shadow-xs"
            >
              <SlidersHorizontal size={14} /> Set Targets
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 1: MONTHLY BUDGET METRICS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Monthly Department Budgets
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Overall Utilized: <span className="font-black text-slate-900">{budgetStats.total.pct}%</span> (KSh {budgetStats.total.spent.toLocaleString()} / KSh {budgetStats.total.budget.toLocaleString()})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Marketing Budget */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                    <Megaphone size={14} />
                  </div>
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Marketing &amp; Ads
                  </CardTitle>
                </div>
                {getBudgetStatusBadge(budgetStats.marketing.pct)}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual Spend</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                    KSh {budgetStats.marketing.spent.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Budgeted</span>
                  <span className="text-xs font-bold text-slate-600">
                    KSh {budgetStats.marketing.budget.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Progress 
                  value={Math.min(100, budgetStats.marketing.pct)} 
                  className={`h-2 bg-slate-100 ${
                    budgetStats.marketing.pct > 100 
                      ? '[&>div]:bg-red-600' 
                      : budgetStats.marketing.pct >= 80 
                      ? '[&>div]:bg-amber-500' 
                      : '[&>div]:bg-pink-600'
                  }`}
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-500 pt-0.5">
                  <span>{budgetStats.marketing.pct}% used</span>
                  <span>
                    {budgetStats.marketing.remaining >= 0 
                      ? `KSh ${budgetStats.marketing.remaining.toLocaleString()} left` 
                      : `Over by KSh ${Math.abs(budgetStats.marketing.remaining).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Salaries & Staff Advances Budget */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Users size={14} />
                  </div>
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Salaries &amp; Staff Advances
                  </CardTitle>
                </div>
                {getBudgetStatusBadge(budgetStats.salaries.pct)}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual Spend</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                    KSh {budgetStats.salaries.spent.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Budgeted</span>
                  <span className="text-xs font-bold text-slate-600">
                    KSh {budgetStats.salaries.budget.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Progress 
                  value={Math.min(100, budgetStats.salaries.pct)} 
                  className={`h-2 bg-slate-100 ${
                    budgetStats.salaries.pct > 100 
                      ? '[&>div]:bg-red-600' 
                      : budgetStats.salaries.pct >= 80 
                      ? '[&>div]:bg-amber-500' 
                      : '[&>div]:bg-indigo-600'
                  }`}
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-500 pt-0.5">
                  <span>{budgetStats.salaries.pct}% used</span>
                  <span>
                    {budgetStats.salaries.remaining >= 0 
                      ? `KSh ${budgetStats.salaries.remaining.toLocaleString()} left` 
                      : `Over by KSh ${Math.abs(budgetStats.salaries.remaining).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Operations & General Overhead */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#095388] flex items-center justify-center border border-sky-100">
                    <Briefcase size={14} />
                  </div>
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Operations &amp; Misc
                  </CardTitle>
                </div>
                {getBudgetStatusBadge(budgetStats.operations.pct)}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual Spend</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                    KSh {budgetStats.operations.spent.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Budgeted</span>
                  <span className="text-xs font-bold text-slate-600">
                    KSh {budgetStats.operations.budget.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Progress 
                  value={Math.min(100, budgetStats.operations.pct)} 
                  className={`h-2 bg-slate-100 ${
                    budgetStats.operations.pct > 100 
                      ? '[&>div]:bg-red-600' 
                      : budgetStats.operations.pct >= 80 
                      ? '[&>div]:bg-amber-500' 
                      : '[&>div]:bg-[#095388]'
                  }`}
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-500 pt-0.5">
                  <span>{budgetStats.operations.pct}% used</span>
                  <span>
                    {budgetStats.operations.remaining >= 0 
                      ? `KSh ${budgetStats.operations.remaining.toLocaleString()} left` 
                      : `Over by KSh ${Math.abs(budgetStats.operations.remaining).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 2: PERFORMANCE GOALS & CONVERSION TRACKER */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Sales Targets &amp; Conversion Rates
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Track deal conversion from quotation through to running project
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Goal 1: Quotes Generated */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><FileText size={15} className="text-purple-600" /> Quotes Generated</span>
                <span className="text-purple-600 font-black">{goalsStats.quotesProgress}%</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900 tabular-nums">{goalsStats.quotesCount}</span>
                <span className="text-xs font-semibold text-slate-500">Target: {targets.quotesGoal} quotes</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={goalsStats.quotesProgress} className="h-2 bg-purple-50 [&>div]:bg-purple-600" />
              <p className="text-[10px] text-slate-400 font-medium">
                KSh {goalsStats.quotesTotalValue.toLocaleString()} total quoted pipeline
              </p>
            </div>
          </Card>

          {/* Goal 2: Conversion Rate */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Percent size={15} className="text-emerald-600" /> Conversion Rate</span>
                <span className="text-emerald-600 font-black">
                  {goalsStats.conversionRate >= targets.conversionRateGoal ? 'Target Met' : `${goalsStats.conversionProgress}%`}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-700 tabular-nums">{goalsStats.conversionRate}%</span>
                <span className="text-xs font-semibold text-slate-500">Target: {targets.conversionRateGoal}%</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={goalsStats.conversionProgress} className="h-2 bg-emerald-50 [&>div]:bg-emerald-600" />
              <p className="text-[10px] text-slate-400 font-medium">
                {goalsStats.closedDeals} of {goalsStats.quotesCount || (projects?.length || 0)} inquiries converted into active projects
              </p>
            </div>
          </Card>

          {/* Goal 3: Closed Project Contracts */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Briefcase size={15} className="text-blue-600" /> Active / Won Sites</span>
                <span className="text-blue-600 font-black">{goalsStats.closedDealsProgress}%</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900 tabular-nums">{goalsStats.closedDeals}</span>
                <span className="text-xs font-semibold text-slate-500">Target: {targets.closedDealsGoal} sites</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={goalsStats.closedDealsProgress} className="h-2 bg-blue-50 [&>div]:bg-blue-600" />
              <p className="text-[10px] text-slate-400 font-medium">
                Running, expected deposits, and delivered slabs
              </p>
            </div>
          </Card>

          {/* Goal 4: Target Revenue */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><TrendingUp size={15} className="text-amber-600" /> Contract Volume</span>
                <span className="text-amber-600 font-black">{goalsStats.revenueProgress}%</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                  KSh {goalsStats.revenueClosed >= 1000000 ? `${(goalsStats.revenueClosed / 1000000).toFixed(2)}M` : goalsStats.revenueClosed.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Target: {targets.revenueGoal >= 1000000 ? `${(targets.revenueGoal / 1000000).toFixed(1)}M` : targets.revenueGoal.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={goalsStats.revenueProgress} className="h-2 bg-amber-50 [&>div]:bg-amber-500" />
              <p className="text-[10px] text-slate-400 font-medium">
                KSh {Math.max(0, targets.revenueGoal - goalsStats.revenueClosed).toLocaleString()} remaining to hit target
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 3: STRATEGIC SUMMARY / RECOMMENDATION */}
      <Card className="bg-gradient-to-r from-[#07365a] via-[#095388] to-[#0d6db3] text-white border-0 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Monthly Performance Insights
              </span>
            </div>
            <p className="text-sm font-medium text-slate-100 leading-relaxed max-w-3xl">
              {goalsStats.conversionRate >= targets.conversionRateGoal
                ? `Conversion performance is excellent at ${goalsStats.conversionRate}%, surpassing your ${targets.conversionRateGoal}% goal. Keep follow-ups fast to maintain velocity.`
                : `Current conversion is at ${goalsStats.conversionRate}% against your ${targets.conversionRateGoal}% target. Consider assigning staff directly to quotes that haven't converted within 48 hours.`}
              {' '}
              {budgetStats.marketing.pct > 100 
                ? `Marketing spend has exceeded budget by KSh ${Math.abs(budgetStats.marketing.remaining).toLocaleString()}.` 
                : `Marketing budget has KSh ${budgetStats.marketing.remaining.toLocaleString()} remaining.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/15 min-w-[120px]">
              <span className="text-[10px] text-sky-200 uppercase font-bold block">Remaining Budget</span>
              <span className="text-lg font-black text-white">
                KSh {Math.max(0, budgetStats.total.remaining).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Target Configuration Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md bg-white text-slate-900 border-slate-200 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#095388]" />
              Configure Monthly Targets &amp; Budgets
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Set expected monthly expense limits and performance targets for quotes and conversions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTargets} className="space-y-4 py-2">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#095388]">1. Monthly Expense Budgets (KSh)</h4>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Marketing &amp; Advertising Budget (KSh)</Label>
                <Input
                  type="number"
                  value={formTargets.marketingBudget}
                  onChange={(e) => setFormTargets({ ...formTargets, marketingBudget: Number(e.target.value) || 0 })}
                  className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                  placeholder="e.g. 100000"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Salaries &amp; Staff Advances Budget (KSh)</Label>
                <Input
                  type="number"
                  value={formTargets.salariesBudget}
                  onChange={(e) => setFormTargets({ ...formTargets, salariesBudget: Number(e.target.value) || 0 })}
                  className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                  placeholder="e.g. 300000"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Operations &amp; Miscellaneous Budget (KSh)</Label>
                <Input
                  type="number"
                  value={formTargets.operationsBudget}
                  onChange={(e) => setFormTargets({ ...formTargets, operationsBudget: Number(e.target.value) || 0 })}
                  className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                  placeholder="e.g. 150000"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-700">2. Sales &amp; Conversion Goals</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Target Quotes / Month</Label>
                  <Input
                    type="number"
                    value={formTargets.quotesGoal}
                    onChange={(e) => setFormTargets({ ...formTargets, quotesGoal: Number(e.target.value) || 0 })}
                    className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                    placeholder="e.g. 50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Conversion Rate Target (%)</Label>
                  <Input
                    type="number"
                    value={formTargets.conversionRateGoal}
                    onChange={(e) => setFormTargets({ ...formTargets, conversionRateGoal: Number(e.target.value) || 0 })}
                    className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                    placeholder="e.g. 25"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Target Active Sites</Label>
                  <Input
                    type="number"
                    value={formTargets.closedDealsGoal}
                    onChange={(e) => setFormTargets({ ...formTargets, closedDealsGoal: Number(e.target.value) || 0 })}
                    className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                    placeholder="e.g. 10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Monthly Revenue Goal (KSh)</Label>
                  <Input
                    type="number"
                    value={formTargets.revenueGoal}
                    onChange={(e) => setFormTargets({ ...formTargets, revenueGoal: Number(e.target.value) || 0 })}
                    className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                    placeholder="e.g. 3000000"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#095388] hover:bg-[#073f67] text-white font-bold text-xs rounded-xl h-9 px-4 shadow-xs"
              >
                Save Targets
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
