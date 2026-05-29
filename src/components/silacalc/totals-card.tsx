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
  FolderSync, 
  Info
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { useCalculator } from '@/context/calculator-context';

export function TotalsCard() {
  const { totals, settings, perRoomCalculations } = useCalculator();
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

  const excessRooms = perRoomCalculations.filter(p => p.roomCalcs.excessBeamCount > 0);
  const totalExcessBeams = excessRooms.reduce((sum, p) => sum + p.roomCalcs.excessBeamCount, 0);
  const totalExcessBlocks = excessRooms.reduce((sum, p) => sum + p.roomCalcs.excessBlockCount, 0);

  return (
    <Card className="sticky top-24 border border-slate-200 bg-white shadow-md overflow-hidden flex flex-col rounded-xl">
      <CardHeader className="bg-slate-900 text-white pb-6">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="font-headline text-xl font-bold flex items-center gap-2">
            <Calculator size={20} className="text-sky-400" />
            Project Totals
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
          Summary of all required structural material quantities.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        
        {/* Live Material Quantities */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-headline">
            Required Quantities Breakdown
          </h4>
          
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <Layers size={16} className="text-sky-500" /> Total Slab Area
              </span>
              <strong className="text-slate-900 font-bold">{totalArea.toFixed(2)} m²</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <BrickWall size={16} className="text-emerald-500" /> Standard Blocks (Invoice)
              </span>
              <strong className="text-slate-900 font-bold">{totalBlocks.toLocaleString()} pcs</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <Ruler size={16} className="text-indigo-500" /> Invoiced Beams Length
              </span>
              <strong className="text-slate-900 font-bold">{totalInvoiceBeamLength.toFixed(1)} m</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <CoinsIcon size={16} className="text-amber-500" /> Cement (50kg Bags)
              </span>
              <strong className="text-slate-900 font-bold">{totalCementBags} bags</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <FolderSync size={16} className="text-rose-500" /> Sand & Ballast
              </span>
              <strong className="text-slate-900 font-bold">{totalSandTonnes.toFixed(1)}t / {totalBallastTonnes.toFixed(1)}t</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <ShoppingBag size={16} className="text-cyan-500" /> BRC Mesh rolls
              </span>
              <strong className="text-slate-900 font-bold">{brc?.rollsNeeded || 0} rolls</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-sm hover:border-slate-200 transition-colors">
              <span className="text-slate-600 flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-600" /> Support Props Required
              </span>
              <strong className="text-slate-900 font-bold">{timber?.totalProps || 0} pcs</strong>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {excessRooms.length > 0 && (
          <div className="flex gap-2.5 text-[11px] text-amber-800 items-start bg-amber-50/50 p-3 rounded-lg border border-amber-200/50 my-1">
            <span className="text-amber-500 font-bold shrink-0 mt-0.5 text-sm">⚠️</span>
            <div className="leading-relaxed">
              <strong className="text-amber-900 block font-bold mb-0.5">Layout Boundary Warning</strong>
              We detected that {excessRooms.length} room(s) contain a total of <strong className="font-bold text-red-700">{totalExcessBeams} excess beam(s)</strong> and <strong className="font-bold text-red-700">{totalExcessBlocks} excess block(s)</strong> extending beyond boundaries.
              <p className="mt-1 text-[10px] text-slate-500 font-medium">Click "Download Quote" to optimize and deduct these materials.</p>
            </div>
          </div>
        )}

        <div className="flex gap-2.5 text-[11px] text-slate-500 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Technical specifications automatically update in real-time as you switch beam configurations or add room measurements. Pricing details are fully visible in the generated PDF invoice.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}

// Custom simple helper for the Coins icon to match our requirements perfectly
function CoinsIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="18" cy="18" r="4" />
      <path d="M12 18a6 6 0 0 0-6-6" />
    </svg>
  );
}
