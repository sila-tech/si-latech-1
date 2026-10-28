'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Target,
    TrendingUp,
    CheckCircle2,
    Clock,
    XCircle,
    Calendar,
    ArrowUpRight,
    Award,
    Sparkles,
    Flame,
    BarChart3,
} from 'lucide-react';

interface SalesTargetsViewProps {
    salesUser: { username: string; name: string };
    projects: any[];
    customTargets?: {
        measurementsTarget?: number;
        dealsTarget?: number;
    };
}

export function SalesTargetsView({
    salesUser,
    projects = [],
    customTargets,
}: SalesTargetsViewProps) {
    // Current month filter
    const now = new Date();
    const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Aggregate metrics
    const totalProjects = projects.length;
    const booked = projects.filter((p) => p.leadStatus === 'measurement_booked' || !p.leadStatus).length;
    const measured = projects.filter((p) => p.leadStatus === 'measured').length;
    const quoted = projects.filter((p) => p.leadStatus === 'quoted').length;
    const inNegotiation = projects.filter((p) => p.leadStatus === 'negotiation').length;
    const wonProjects = projects.filter((p) => p.leadStatus === 'won' || p.conversionStatus === 'converted');
    const lostProjects = projects.filter((p) => p.leadStatus === 'lost' || p.conversionStatus === 'lost');

    const totalWonCount = wonProjects.length;
    const totalLostCount = lostProjects.length;

    // Conversion rate: won / total booked
    const conversionRate = totalProjects > 0 ? Math.round((totalWonCount / totalProjects) * 100) : 0;

    // Targets (defaults or props)
    const measurementsTarget = customTargets?.measurementsTarget || 20;
    const dealsTarget = customTargets?.dealsTarget || 8;
    const conversionGoal = 50; // 50% target conversion benchmark

    const measurementsProgress = Math.min(100, Math.round((totalProjects / measurementsTarget) * 100));
    const dealsProgress = Math.min(100, Math.round((totalWonCount / dealsTarget) * 100));
    const conversionProgress = Math.min(100, Math.round((conversionRate / conversionGoal) * 100));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline flex items-center gap-2">
                        <Target className="text-indigo-600" /> Sales Targets &amp; Conversion Analytics
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Performance benchmarks, quota progress, and deal conversion rates for <span className="font-bold text-slate-800">{currentMonthLabel}</span>.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold w-fit">
                    <Award size={15} />
                    <span>Conversion Rate: <span className="font-black text-indigo-900">{conversionRate}%</span></span>
                </div>
            </div>

            {/* Target Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Measurements Booked Target */}
                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-5 space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Measurements</p>
                            <h3 className="text-2xl font-black text-slate-900">{totalProjects} <span className="text-xs text-slate-400 font-normal">/ {measurementsTarget} Target</span></h3>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <Calendar size={18} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">Target Progress</span>
                            <span className="text-blue-600">{measurementsProgress}%</span>
                        </div>
                        <Progress value={measurementsProgress} className="h-2 bg-slate-100" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                        {totalProjects >= measurementsTarget ? '🎉 Target Achieved!' : `${measurementsTarget - totalProjects} more measurements to hit goal.`}
                    </p>
                </Card>

                {/* 2. Converted Deals Target */}
                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-5 space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Won Deals (Converted)</p>
                            <h3 className="text-2xl font-black text-slate-900">{totalWonCount} <span className="text-xs text-slate-400 font-normal">/ {dealsTarget} Target</span></h3>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">Deals Closed</span>
                            <span className="text-emerald-600">{dealsProgress}%</span>
                        </div>
                        <Progress value={dealsProgress} className="h-2 bg-slate-100" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                        {totalWonCount >= dealsTarget ? '🏆 Target Smashed!' : `${dealsTarget - totalWonCount} more closed orders to reach monthly quota.`}
                    </p>
                </Card>

                {/* 3. Conversion Rate Goal */}
                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-5 space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversion Rate Goal</p>
                            <h3 className="text-2xl font-black text-purple-700">{conversionRate}% <span className="text-xs text-slate-400 font-normal">/ {conversionGoal}% Benchmark</span></h3>
                        </div>
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <Target size={18} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">Conversion Benchmark</span>
                            <span className="text-purple-600">{conversionProgress}%</span>
                        </div>
                        <Progress value={conversionProgress} className="h-2 bg-slate-100" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                        Targeting 50%+ site measurements converted to orders.
                    </p>
                </Card>
            </div>

            {/* Pipeline Conversion Funnel */}
            <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
                <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/70">
                    <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                        <BarChart3 size={18} className="text-indigo-600" /> Conversion Funnel Stages
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                        Tracking how leads advance from booked measurement to final closed sale.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
                        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">1. Booked</p>
                            <p className="text-2xl font-black text-blue-900">{booked}</p>
                            <p className="text-[10px] text-blue-600 font-medium">Pending visit</p>
                        </div>

                        <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">2. Measured</p>
                            <p className="text-2xl font-black text-teal-900">{measured}</p>
                            <p className="text-[10px] text-teal-600 font-medium">Dimensions taken</p>
                        </div>

                        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">3. Quoted</p>
                            <p className="text-2xl font-black text-purple-900">{quoted}</p>
                            <p className="text-[10px] text-purple-600 font-medium">Quote dispatched</p>
                        </div>

                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">4. In Discussion</p>
                            <p className="text-2xl font-black text-amber-900">{inNegotiation}</p>
                            <p className="text-[10px] text-amber-600 font-medium">Active bargaining</p>
                        </div>

                        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 space-y-1 shadow-2xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">5. Closed Won</p>
                            <p className="text-2xl font-black text-emerald-950">{totalWonCount}</p>
                            <p className="text-[10px] text-emerald-700 font-bold">{conversionRate}% Conversion</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" /> Tips to Boost Conversion Rate
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                        <li>
                            <span className="font-bold text-slate-800">Deliver quotes immediately:</span> Use the mobile calculator to send client the PDF/WhatsApp quote right from the site.
                        </li>
                        <li>
                            <span className="font-bold text-slate-800">Log every conversation:</span> Record follow-up dates and notes so no lead goes cold.
                        </li>
                        <li>
                            <span className="font-bold text-slate-800">Highlight 40% cost savings:</span> Remind developers and fundis how precast slabs save up to 40% vs conventional cast-in-situ.
                        </li>
                    </ul>
                </Card>

                <Card className="border-slate-200 shadow-2xs rounded-2xl bg-white p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 size={14} className="text-indigo-600" /> Win / Loss Breakdown
                    </h4>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                            <span className="text-slate-600">Total Closed Deals</span>
                            <span className="font-bold text-emerald-700">{totalWonCount} Won</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                            <span className="text-slate-600">Lost or Abandoned</span>
                            <span className="font-bold text-red-600">{totalLostCount} Lost</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-600">Win Ratio</span>
                            <span className="font-bold text-slate-900">
                                {totalWonCount + totalLostCount > 0
                                    ? Math.round((totalWonCount / (totalWonCount + totalLostCount)) * 100)
                                    : 0}%
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
