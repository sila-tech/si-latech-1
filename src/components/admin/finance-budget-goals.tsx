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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Check,
  Calendar,
  CalendarDays,
  CalendarRange,
  Zap,
  Clock
} from 'lucide-react';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subMonths 
} from 'date-fns';

export type TimeHorizon = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ViewPeriod = TimeHorizon | 'last_month' | 'all';

export interface HorizonTargets {
  marketingBudget: number;
  salariesBudget: number;
  operationsBudget: number;
  quotesGoal: number;
  conversionRateGoal: number; // percentage, e.g. 25
  revenueGoal: number; // KSh (paid contract volume)
  closedDealsGoal: number;
}

export interface FinanceTargetsConfig {
  daily: HorizonTargets;
  weekly: HorizonTargets;
  monthly: HorizonTargets;
  yearly: HorizonTargets;
  updatedAt?: any;
}

export const DEFAULT_MONTHLY_TARGETS: HorizonTargets = {
  marketingBudget: 120000,
  salariesBudget: 350000,
  operationsBudget: 200000,
  quotesGoal: 40,
  conversionRateGoal: 25,
  closedDealsGoal: 10,
  revenueGoal: 3500000,
};

export const DEFAULT_DAILY_TARGETS: HorizonTargets = {
  marketingBudget: 4000,
  salariesBudget: 12000,
  operationsBudget: 7000,
  quotesGoal: 2,
  conversionRateGoal: 25,
  closedDealsGoal: 1,
  revenueGoal: 120000,
};

export const DEFAULT_WEEKLY_TARGETS: HorizonTargets = {
  marketingBudget: 28000,
  salariesBudget: 80000,
  operationsBudget: 50000,
  quotesGoal: 10,
  conversionRateGoal: 25,
  closedDealsGoal: 3,
  revenueGoal: 800000,
};

export const DEFAULT_YEARLY_TARGETS: HorizonTargets = {
  marketingBudget: 1440000,
  salariesBudget: 4200000,
  operationsBudget: 2400000,
  quotesGoal: 480,
  conversionRateGoal: 25,
  closedDealsGoal: 120,
  revenueGoal: 42000000,
};

export const DEFAULT_TARGETS_CONFIG: FinanceTargetsConfig = {
  daily: DEFAULT_DAILY_TARGETS,
  weekly: DEFAULT_WEEKLY_TARGETS,
  monthly: DEFAULT_MONTHLY_TARGETS,
  yearly: DEFAULT_YEARLY_TARGETS,
};

interface FinanceBudgetGoalsProps {
  isSuperAdmin?: boolean;
}

export function FinanceBudgetGoals({ isSuperAdmin = true }: FinanceBudgetGoalsProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<TimeHorizon>('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState<ViewPeriod>('monthly');

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

  // Read full targets config with backward compatibility
  const targetsConfig: FinanceTargetsConfig = useMemo(() => {
    const found = settingsList?.find((s: any) => s.id === 'finance_targets');
    if (!found) return DEFAULT_TARGETS_CONFIG;

    // Read monthly targets (supports nested monthly or flat legacy keys)
    const monthly: HorizonTargets = {
      marketingBudget: Number(found.monthly?.marketingBudget ?? found.marketingBudget) || DEFAULT_MONTHLY_TARGETS.marketingBudget,
      salariesBudget: Number(found.monthly?.salariesBudget ?? found.salariesBudget) || DEFAULT_MONTHLY_TARGETS.salariesBudget,
      operationsBudget: Number(found.monthly?.operationsBudget ?? found.operationsBudget) || DEFAULT_MONTHLY_TARGETS.operationsBudget,
      quotesGoal: Number(found.monthly?.quotesGoal ?? found.quotesGoal) || DEFAULT_MONTHLY_TARGETS.quotesGoal,
      conversionRateGoal: Number(found.monthly?.conversionRateGoal ?? found.conversionRateGoal) || DEFAULT_MONTHLY_TARGETS.conversionRateGoal,
      closedDealsGoal: Number(found.monthly?.closedDealsGoal ?? found.closedDealsGoal) || DEFAULT_MONTHLY_TARGETS.closedDealsGoal,
      revenueGoal: Number(found.monthly?.revenueGoal ?? found.revenueGoal) || DEFAULT_MONTHLY_TARGETS.revenueGoal,
    };

    // Read daily (fallback to calculated from monthly if not set)
    const daily: HorizonTargets = {
      marketingBudget: Number(found.daily?.marketingBudget) || Math.round(monthly.marketingBudget / 30),
      salariesBudget: Number(found.daily?.salariesBudget) || Math.round(monthly.salariesBudget / 30),
      operationsBudget: Number(found.daily?.operationsBudget) || Math.round(monthly.operationsBudget / 30),
      quotesGoal: Number(found.daily?.quotesGoal) || Math.max(1, Math.round(monthly.quotesGoal / 30)),
      conversionRateGoal: Number(found.daily?.conversionRateGoal) || monthly.conversionRateGoal,
      closedDealsGoal: Number(found.daily?.closedDealsGoal) || Math.max(1, Math.round(monthly.closedDealsGoal / 30)),
      revenueGoal: Number(found.daily?.revenueGoal) || Math.round(monthly.revenueGoal / 30),
    };

    // Read weekly (fallback to calculated from monthly if not set)
    const weekly: HorizonTargets = {
      marketingBudget: Number(found.weekly?.marketingBudget) || Math.round(monthly.marketingBudget / 4.3),
      salariesBudget: Number(found.weekly?.salariesBudget) || Math.round(monthly.salariesBudget / 4.3),
      operationsBudget: Number(found.weekly?.operationsBudget) || Math.round(monthly.operationsBudget / 4.3),
      quotesGoal: Number(found.weekly?.quotesGoal) || Math.max(1, Math.round(monthly.quotesGoal / 4.3)),
      conversionRateGoal: Number(found.weekly?.conversionRateGoal) || monthly.conversionRateGoal,
      closedDealsGoal: Number(found.weekly?.closedDealsGoal) || Math.max(1, Math.round(monthly.closedDealsGoal / 4.3)),
      revenueGoal: Number(found.weekly?.revenueGoal) || Math.round(monthly.revenueGoal / 4.3),
    };

    // Read yearly (fallback to calculated from monthly if not set)
    const yearly: HorizonTargets = {
      marketingBudget: Number(found.yearly?.marketingBudget) || (monthly.marketingBudget * 12),
      salariesBudget: Number(found.yearly?.salariesBudget) || (monthly.salariesBudget * 12),
      operationsBudget: Number(found.yearly?.operationsBudget) || (monthly.operationsBudget * 12),
      quotesGoal: Number(found.yearly?.quotesGoal) || (monthly.quotesGoal * 12),
      conversionRateGoal: Number(found.yearly?.conversionRateGoal) || monthly.conversionRateGoal,
      closedDealsGoal: Number(found.yearly?.closedDealsGoal) || (monthly.closedDealsGoal * 12),
      revenueGoal: Number(found.yearly?.revenueGoal) || (monthly.revenueGoal * 12),
    };

    return { daily, weekly, monthly, yearly };
  }, [settingsList]);

  // Form states for editing targets
  const [formTargets, setFormTargets] = useState<FinanceTargetsConfig>(DEFAULT_TARGETS_CONFIG);

  const handleOpenEdit = (horizon?: TimeHorizon) => {
    setFormTargets(targetsConfig);
    if (horizon) {
      setModalActiveTab(horizon);
    } else if (selectedPeriod === 'daily' || selectedPeriod === 'weekly' || selectedPeriod === 'monthly' || selectedPeriod === 'yearly') {
      setModalActiveTab(selectedPeriod);
    } else {
      setModalActiveTab('monthly');
    }
    setIsEditModalOpen(true);
  };

  // Quick auto-scale helper: calculates daily, weekly, and yearly from monthly
  const handleAutoScaleFromMonthly = () => {
    const m = formTargets.monthly;
    setFormTargets({
      ...formTargets,
      daily: {
        marketingBudget: Math.round(m.marketingBudget / 30),
        salariesBudget: Math.round(m.salariesBudget / 30),
        operationsBudget: Math.round(m.operationsBudget / 30),
        quotesGoal: Math.max(1, Math.round(m.quotesGoal / 30)),
        conversionRateGoal: m.conversionRateGoal,
        closedDealsGoal: Math.max(1, Math.round(m.closedDealsGoal / 30)),
        revenueGoal: Math.round(m.revenueGoal / 30),
      },
      weekly: {
        marketingBudget: Math.round(m.marketingBudget / 4.3),
        salariesBudget: Math.round(m.salariesBudget / 4.3),
        operationsBudget: Math.round(m.operationsBudget / 4.3),
        quotesGoal: Math.max(1, Math.round(m.quotesGoal / 4.3)),
        conversionRateGoal: m.conversionRateGoal,
        closedDealsGoal: Math.max(1, Math.round(m.closedDealsGoal / 4.3)),
        revenueGoal: Math.round(m.revenueGoal / 4.3),
      },
      yearly: {
        marketingBudget: Math.round(m.marketingBudget * 12),
        salariesBudget: Math.round(m.salariesBudget * 12),
        operationsBudget: Math.round(m.operationsBudget * 12),
        quotesGoal: Math.round(m.quotesGoal * 12),
        conversionRateGoal: m.conversionRateGoal,
        closedDealsGoal: Math.round(m.closedDealsGoal * 12),
        revenueGoal: Math.round(m.revenueGoal * 12),
      }
    });
    toast({
      title: 'Auto-Scaled Horizons',
      description: 'Daily, Weekly, and Yearly targets have been calculated proportionally from your Monthly goals.',
    });
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(firestore, 'settings', 'finance_targets'), {
        daily: formTargets.daily,
        weekly: formTargets.weekly,
        monthly: formTargets.monthly,
        yearly: formTargets.yearly,
        // Sync top-level keys with monthly for backward compatibility
        ...formTargets.monthly,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({
        title: 'Targets Updated',
        description: 'Daily, weekly, monthly, and yearly goals and budgets saved successfully.',
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

  // Date range definitions
  const now = new Date();

  const timeRanges = useMemo(() => {
    return {
      daily: {
        start: startOfDay(now).getTime(),
        end: endOfDay(now).getTime(),
        label: `Today (${format(now, 'EEE, d MMM')})`,
      },
      weekly: {
        start: startOfWeek(now, { weekStartsOn: 1 }).getTime(),
        end: endOfWeek(now, { weekStartsOn: 1 }).getTime(),
        label: `This Week (${format(startOfWeek(now, { weekStartsOn: 1 }), 'd MMM')} – ${format(endOfWeek(now, { weekStartsOn: 1 }), 'd MMM')})`,
      },
      monthly: {
        start: startOfMonth(now).getTime(),
        end: endOfMonth(now).getTime(),
        label: `This Month (${format(now, 'MMMM yyyy')})`,
      },
      yearly: {
        start: startOfYear(now).getTime(),
        end: endOfYear(now).getTime(),
        label: `This Year (${format(now, 'yyyy')})`,
      },
      last_month: {
        start: startOfMonth(subMonths(now, 1)).getTime(),
        end: endOfMonth(subMonths(now, 1)).getTime(),
        label: `Last Month (${format(subMonths(now, 1), 'MMMM yyyy')})`,
      },
    };
  }, [now]);

  // Check if a timestamp falls within the selected period
  const isWithinPeriod = (timestampSec?: number) => {
    if (!timestampSec) return false;
    const ms = timestampSec * 1000;
    if (selectedPeriod === 'all') return true;
    if (selectedPeriod === 'daily') {
      return ms >= timeRanges.daily.start && ms <= timeRanges.daily.end;
    }
    if (selectedPeriod === 'weekly') {
      return ms >= timeRanges.weekly.start && ms <= timeRanges.weekly.end;
    }
    if (selectedPeriod === 'monthly') {
      return ms >= timeRanges.monthly.start && ms <= timeRanges.monthly.end;
    }
    if (selectedPeriod === 'yearly') {
      return ms >= timeRanges.yearly.start && ms <= timeRanges.yearly.end;
    }
    if (selectedPeriod === 'last_month') {
      return ms >= timeRanges.last_month.start && ms <= timeRanges.last_month.end;
    }
    return true;
  };

  // Determine active target configuration for the selected view
  const activeTargets: HorizonTargets = useMemo(() => {
    if (selectedPeriod === 'daily') return targetsConfig.daily;
    if (selectedPeriod === 'weekly') return targetsConfig.weekly;
    if (selectedPeriod === 'yearly') return targetsConfig.yearly;
    if (selectedPeriod === 'all') return targetsConfig.yearly;
    // monthly & last_month use monthly targets
    return targetsConfig.monthly;
  }, [targetsConfig, selectedPeriod]);

  // Period label for titles
  const periodTitle = useMemo(() => {
    switch (selectedPeriod) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      case 'last_month': return 'Last Month';
      case 'all': return 'All Time';
    }
  }, [selectedPeriod]);

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

      // Marketing & Ads
      if (t === 'advertisement' || r.includes('marketing') || r.includes('facebook') || r.includes('ads') || r.includes('ad ') || r.includes('flyer') || r.includes('tiktok')) {
        marketingSpent += amt;
      }
      // Salaries / Advances / Field Facilitation
      else if (t === 'salary' || t === 'staff_loan' || t === 'facilitation_request' || r.includes('salary') || r.includes('advance') || r.includes('allowance') || r.includes('wage')) {
        salariesSpent += amt;
      }
      // Other Operational Expenses
      else if (t === 'other_expense' || (t !== 'income' && t !== 'loan_repayment')) {
        operationsSpent += amt;
      }
    });

    const totalBudget = activeTargets.marketingBudget + activeTargets.salariesBudget + activeTargets.operationsBudget;
    const totalSpent = marketingSpent + salariesSpent + operationsSpent;

    return {
      marketing: {
        budget: activeTargets.marketingBudget,
        spent: marketingSpent,
        pct: activeTargets.marketingBudget > 0 ? Math.round((marketingSpent / activeTargets.marketingBudget) * 100) : 0,
        remaining: activeTargets.marketingBudget - marketingSpent,
      },
      salaries: {
        budget: activeTargets.salariesBudget,
        spent: salariesSpent,
        pct: activeTargets.salariesBudget > 0 ? Math.round((salariesSpent / activeTargets.salariesBudget) * 100) : 0,
        remaining: activeTargets.salariesBudget - salariesSpent,
      },
      operations: {
        budget: activeTargets.operationsBudget,
        spent: operationsSpent,
        pct: activeTargets.operationsBudget > 0 ? Math.round((operationsSpent / activeTargets.operationsBudget) * 100) : 0,
        remaining: activeTargets.operationsBudget - operationsSpent,
      },
      total: {
        budget: totalBudget,
        spent: totalSpent,
        pct: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        remaining: totalBudget - totalSpent,
      }
    };
  }, [finances, activeTargets, selectedPeriod]);

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
    const conversionDenominator = quotesCount > 0 ? quotesCount : periodProjects.length;
    const actualConversionRate = conversionDenominator > 0 
      ? Math.round((closedProjects.length / conversionDenominator) * 100) 
      : 0;

    // CRITICAL USER REQUIREMENT:
    // "only amount paid that should be tallied at contract volume."
    // Strictly tally verified payments received (Income records) within the active timeframe
    let paidContractVolume = 0;
    finances?.forEach((f: any) => {
      if (f.status === 'rejected') return;
      if (!isWithinPeriod(f.createdAt?.seconds)) return;
      if (f.type === 'income') {
        paidContractVolume += Number(f.amount) || 0;
      }
    });

    return {
      quotesCount,
      quotesTotalValue,
      quotesProgress: activeTargets.quotesGoal > 0 ? Math.min(100, Math.round((quotesCount / activeTargets.quotesGoal) * 100)) : 0,
      
      conversionRate: actualConversionRate,
      conversionProgress: activeTargets.conversionRateGoal > 0 ? Math.min(100, Math.round((actualConversionRate / activeTargets.conversionRateGoal) * 100)) : 0,
      
      closedDeals: closedProjects.length,
      closedDealsProgress: activeTargets.closedDealsGoal > 0 ? Math.min(100, Math.round((closedProjects.length / activeTargets.closedDealsGoal) * 100)) : 0,

      // Paid Contract Volume
      paidContractVolume,
      revenueProgress: activeTargets.revenueGoal > 0 ? Math.min(100, Math.round((paidContractVolume / activeTargets.revenueGoal) * 100)) : 0,
    };
  }, [quotes, projects, finances, activeTargets, selectedPeriod]);

  // Helper for budget status badge
  const getBudgetStatusBadge = (pct: number) => {
    if (pct > 100) {
      return <Badge variant="destructive" className="text-[10px] font-extrabold uppercase gap-1"><AlertTriangle size={12} /> Over Budget</Badge>;
    }
    if (pct >= 80) {
      return <Badge className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase gap-1"><AlertTriangle size={12} /> Nearing Limit ({pct}%)</Badge>;
    }
    return <Badge className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase gap-1"><CheckCircle2 size={12} /> Healthy ({pct}%)</Badge>;
  };

  // Helper to render form fields for any horizon tab
  const renderHorizonFormFields = (hKey: TimeHorizon, hLabel: string) => {
    const data = formTargets[hKey];
    const updateField = (field: keyof HorizonTargets, val: number) => {
      setFormTargets({
        ...formTargets,
        [hKey]: {
          ...formTargets[hKey],
          [field]: val,
        }
      });
    };

    return (
      <div className="space-y-4 py-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#095388] flex items-center gap-1.5">
              <DollarSign size={14} /> {hLabel} Expense Budgets (KSh)
            </h4>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Marketing &amp; Advertising Budget</Label>
            <Input
              type="number"
              value={data.marketingBudget}
              onChange={(e) => updateField('marketingBudget', Number(e.target.value) || 0)}
              className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
              placeholder="e.g. 120000"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Salaries &amp; Staff Advances Budget</Label>
            <Input
              type="number"
              value={data.salariesBudget}
              onChange={(e) => updateField('salariesBudget', Number(e.target.value) || 0)}
              className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
              placeholder="e.g. 350000"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Operations &amp; Miscellaneous Budget</Label>
            <Input
              type="number"
              value={data.operationsBudget}
              onChange={(e) => updateField('operationsBudget', Number(e.target.value) || 0)}
              className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
              placeholder="e.g. 200000"
              required
            />
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
            <Target size={14} /> {hLabel} Sales &amp; Paid Contract Goals
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Quotes Generated Goal</Label>
              <Input
                type="number"
                value={data.quotesGoal}
                onChange={(e) => updateField('quotesGoal', Number(e.target.value) || 0)}
                className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                placeholder="e.g. 40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Target Conversion Rate (%)</Label>
              <Input
                type="number"
                value={data.conversionRateGoal}
                onChange={(e) => updateField('conversionRateGoal', Number(e.target.value) || 0)}
                className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                placeholder="e.g. 25"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Target Won / Active Sites</Label>
              <Input
                type="number"
                value={data.closedDealsGoal}
                onChange={(e) => updateField('closedDealsGoal', Number(e.target.value) || 0)}
                className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                placeholder="e.g. 10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Target Paid Volume (KSh)</Label>
              <Input
                type="number"
                value={data.revenueGoal}
                onChange={(e) => updateField('revenueGoal', Number(e.target.value) || 0)}
                className="h-9 rounded-xl border-slate-200 text-xs font-semibold"
                placeholder="e.g. 3500000"
                required
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium italic">
            * Note: Contract volume strictly tallies verified payments received (excludes unpaid quotes).
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Multi-Horizon Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#095388] flex items-center justify-center border border-sky-100">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight font-headline">
              Budget &amp; Performance Goals
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track daily, weekly, monthly &amp; yearly budgets, quote conversion, and verified paid contract volume.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Horizon Period Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 overflow-x-auto max-w-full">
            <button
              onClick={() => setSelectedPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedPeriod === 'daily'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock size={13} className={selectedPeriod === 'daily' ? 'text-[#095388]' : 'text-slate-400'} />
              Daily (Today)
            </button>
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedPeriod === 'weekly'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays size={13} className={selectedPeriod === 'weekly' ? 'text-[#095388]' : 'text-slate-400'} />
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedPeriod === 'monthly'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={13} className={selectedPeriod === 'monthly' ? 'text-[#095388]' : 'text-slate-400'} />
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedPeriod === 'yearly'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange size={13} className={selectedPeriod === 'yearly' ? 'text-[#095388]' : 'text-slate-400'} />
              Yearly
            </button>
            <button
              onClick={() => setSelectedPeriod('last_month')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedPeriod === 'last_month'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedPeriod === 'all'
                  ? 'bg-white text-[#095388] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Set Targets & Budgets Button */}
          <Button
            onClick={() => handleOpenEdit()}
            className="bg-[#095388] hover:bg-[#073f67] text-white font-bold text-xs h-9 px-3.5 rounded-xl gap-1.5 shadow-sm transition-all hover:scale-[1.02] shrink-0"
          >
            <SlidersHorizontal size={14} /> Set Targets &amp; Budgets
          </Button>
        </div>
      </div>

      {/* SECTION 1: DEPARTMENT BUDGET METRICS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
              {periodTitle} Department Budgets
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(selectedPeriod === 'daily' || selectedPeriod === 'weekly' || selectedPeriod === 'yearly' ? selectedPeriod : 'monthly')}
              className="text-xs text-[#095388] hover:bg-sky-50 h-7 px-2 font-bold gap-1 rounded-lg"
            >
              <SlidersHorizontal size={12} /> Edit Budgets
            </Button>
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
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{periodTitle} Budget</span>
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
                    Salaries &amp; Advances
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
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{periodTitle} Budget</span>
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
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{periodTitle} Budget</span>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
              {periodTitle} Sales Targets &amp; Conversion Rates
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(selectedPeriod === 'daily' || selectedPeriod === 'weekly' || selectedPeriod === 'yearly' ? selectedPeriod : 'monthly')}
              className="text-xs text-purple-700 hover:bg-purple-50 h-7 px-2 font-bold gap-1 rounded-lg"
            >
              <SlidersHorizontal size={12} /> Set Goals
            </Button>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Tracking quotes, conversions, won projects, and strictly received payments
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
                <span className="text-xs font-semibold text-slate-500">Target: {activeTargets.quotesGoal} quotes</span>
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
                  {goalsStats.conversionRate >= activeTargets.conversionRateGoal ? 'Target Met' : `${goalsStats.conversionProgress}%`}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-700 tabular-nums">{goalsStats.conversionRate}%</span>
                <span className="text-xs font-semibold text-slate-500">Target: {activeTargets.conversionRateGoal}%</span>
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
                <span className="text-xs font-semibold text-slate-500">Target: {activeTargets.closedDealsGoal} sites</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={goalsStats.closedDealsProgress} className="h-2 bg-blue-50 [&>div]:bg-blue-600" />
              <p className="text-[10px] text-slate-400 font-medium">
                Running, expected deposits, and delivered slabs
              </p>
            </div>
          </Card>

          {/* Goal 4: PAID Contract Volume (Strictly Amount Paid) */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5" title="Only actual payments received are tallied"><TrendingUp size={15} className="text-amber-600" /> Contract Volume (Paid)</span>
                <span className="text-amber-600 font-black">{goalsStats.revenueProgress}%</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                  KSh {goalsStats.paidContractVolume >= 1000000 ? `${(goalsStats.paidContractVolume / 1000000).toFixed(2)}M` : goalsStats.paidContractVolume.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Target: {activeTargets.revenueGoal >= 1000000 ? `${(activeTargets.revenueGoal / 1000000).toFixed(1)}M` : activeTargets.revenueGoal.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={goalsStats.revenueProgress} className="h-2 bg-amber-50 [&>div]:bg-amber-500" />
              <p className="text-[10px] text-slate-400 font-medium">
                {goalsStats.paidContractVolume >= activeTargets.revenueGoal 
                  ? '🎉 Target achieved! Verified client payments.'
                  : `KSh ${Math.max(0, activeTargets.revenueGoal - goalsStats.paidContractVolume).toLocaleString()} remaining (payments only)`}
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
                {periodTitle} Financial Insights
              </span>
            </div>
            <p className="text-sm font-medium text-slate-100 leading-relaxed max-w-3xl">
              {goalsStats.conversionRate >= activeTargets.conversionRateGoal
                ? `Conversion performance is excellent at ${goalsStats.conversionRate}%, meeting or surpassing your ${activeTargets.conversionRateGoal}% goal.`
                : `Current conversion is at ${goalsStats.conversionRate}% against your ${activeTargets.conversionRateGoal}% target. Consider assigning sales staff directly to quotes within 24–48 hours.`}
              {' '}
              {budgetStats.marketing.pct > 100 
                ? `Marketing spend has exceeded budget by KSh ${Math.abs(budgetStats.marketing.remaining).toLocaleString()}.` 
                : `Marketing budget has KSh ${budgetStats.marketing.remaining.toLocaleString()} remaining.`}
              {' '}
              Verified paid contract inflows stand at KSh {goalsStats.paidContractVolume.toLocaleString()}.
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

      {/* Target Configuration Modal with Daily, Weekly, Monthly, Yearly Tabs */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg bg-white text-slate-900 border-slate-200 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#095388]" />
              Configure Financial Targets &amp; Budgets
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Set customized targets for Daily, Weekly, Monthly, and Yearly timeframes.
            </DialogDescription>
          </DialogHeader>

          {/* Auto-Scale Helper Toolbar */}
          <div className="bg-sky-50/70 border border-sky-100 p-3 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#095388]">
              <Zap size={15} className="text-amber-500 shrink-0" />
              <span className="font-medium text-[11px]">
                Have monthly figures? Auto-calculate Daily (/30), Weekly (/4.3), and Yearly (x12) in 1 click.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoScaleFromMonthly}
              className="bg-white hover:bg-sky-100 text-[#095388] border-sky-200 text-xs font-bold h-7 px-2.5 rounded-lg shrink-0 shadow-xs"
            >
              Auto-Scale
            </Button>
          </div>

          <form onSubmit={handleSaveTargets} className="space-y-4">
            <Tabs value={modalActiveTab} onValueChange={(val) => setModalActiveTab(val as TimeHorizon)}>
              <TabsList className="grid grid-cols-4 bg-slate-100 p-1 rounded-xl h-9">
                <TabsTrigger value="daily" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#095388]">
                  Daily
                </TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#095388]">
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#095388]">
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#095388]">
                  Yearly
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daily">
                {renderHorizonFormFields('daily', 'Daily')}
              </TabsContent>
              <TabsContent value="weekly">
                {renderHorizonFormFields('weekly', 'Weekly')}
              </TabsContent>
              <TabsContent value="monthly">
                {renderHorizonFormFields('monthly', 'Monthly')}
              </TabsContent>
              <TabsContent value="yearly">
                {renderHorizonFormFields('yearly', 'Yearly')}
              </TabsContent>
            </Tabs>

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
                Save All Targets &amp; Budgets
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
