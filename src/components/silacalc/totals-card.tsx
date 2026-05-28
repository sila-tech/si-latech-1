'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  BrickWall, 
  Ruler, 
  Layers, 
  ShoppingBag, 
  Calculator, 
  TrendingUp, 
  Coins, 
  FolderSync, 
  Info,
  Calendar
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { useCalculator } from '@/context/calculator-context';

export function TotalsCard() {
  const { totals, settings } = useCalculator();
  const {
    totalArea,
    totalBlocks,
    totalInvoiceBeamLength,
    totalCementBags,
    totalSandTonnes,
    totalBallastTonnes,
    brc,
    timber,
  } = totals;

  const BEAM_PRICE_PER_METER = settings.beamType === 'tbeam' ? 1250 : 545;
  const BLOCK_PRICE = settings.beamType === 'tbeam' ? 110 : 85;

  const beamsCost = totalInvoiceBeamLength * BEAM_PRICE_PER_METER;
  const blocksCost = totalBlocks * BLOCK_PRICE;
  const grandTotalCost = beamsCost + blocksCost;

  return (
    <Card className="sticky top-24 border border-slate-200 bg-white shadow-md overflow-hidden flex flex-col rounded-xl">
      <CardHeader className="bg-slate-900 text-white pb-6">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="font-headline text-xl font-bold flex items-center gap-2">
            <Calculator size={20} className="text-sky-400" />
            Live Quotation Estimator
          </CardTitle>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${
            settings.beamType === 'tbeam' 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
          }`}>
            {settings.beamType === 'tbeam' ? 'T-Beam System' : 'Flat Beam'}
          </span>
        </div>
        <CardDescription className="text-slate-400 text-xs">
          Real-time billing and structural material assessment.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        
        {/* Estimated Price Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Coins size={14} className="text-slate-400" /> Estimated Materials Cost
            </span>
            <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded border border-sky-100">
              VAT Inclusive
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">KSh {grandTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <Separator className="bg-slate-200/50" />

          {/* Itemized pricing breakdown */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Ruler size={12} className="text-slate-400" />
                Beams ({totalInvoiceBeamLength.toFixed(1)}m @ KSh {BEAM_PRICE_PER_METER})
              </span>
              <strong className="text-slate-900 font-semibold">KSh {beamsCost.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <BrickWall size={12} className="text-slate-400" />
                Blocks ({totalBlocks.toLocaleString()} pcs @ KSh {BLOCK_PRICE})
              </span>
              <strong className="text-slate-900 font-semibold">KSh {blocksCost.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Live Material Quantities */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShoppingBag size={13} /> Required Quantities Breakdown
          </h4>
          
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <Layers size={16} className="text-sky-500" /> Total Slab Area
              </span>
              <strong className="text-slate-900 font-bold">{totalArea.toFixed(2)} m²</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <BrickWall size={16} className="text-emerald-500" /> Standard Blocks (Invoice)
              </span>
              <strong className="text-slate-900 font-bold">{totalBlocks.toLocaleString()} pcs</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <Ruler size={16} className="text-indigo-500" /> Invoiced Beams Length
              </span>
              <strong className="text-slate-900 font-bold">{totalInvoiceBeamLength.toFixed(1)} m</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <Coins size={16} className="text-amber-500" /> Cement (50kg Bags)
              </span>
              <strong className="text-slate-900 font-bold">{totalCementBags} bags</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <FolderSync size={16} className="text-rose-500" /> Sand & Ballast
              </span>
              <strong className="text-slate-900 font-bold">{totalSandTonnes.toFixed(1)}t / {totalBallastTonnes.toFixed(1)}t</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <ShoppingBag size={16} className="text-cyan-500" /> BRC Mesh rolls
              </span>
              <strong className="text-slate-900 font-bold">{brc?.rollsNeeded || 0} rolls</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-600" /> Support Props Required
              </span>
              <strong className="text-slate-900 font-bold">{timber?.totalProps || 0} pcs</strong>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        <div className="flex gap-2.5 text-[11px] text-slate-500 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Live prices dynamically update as you switch beam configurations or add room measurements. Export a PDF to see full material schedules.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
