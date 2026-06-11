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
  Info,
  Share2
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

        <div className="flex gap-2.5 text-[11px] text-slate-500 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Technical specifications automatically update in real-time as you switch beam configurations or add room measurements. Pricing details are fully visible in the generated PDF invoice.
          </p>
        </div>

        <Separator className="bg-slate-100" />

        {/* WhatsApp Share */}
        {totalArea > 0 && (
          <a
            href={`https://wa.me/254701792088?text=${encodeURIComponent(
              `Hello SI-LATECH, here is my project summary:

📐 Total Slab Area: ${totalArea.toFixed(2)} m²
🧱 Blocks Needed: ${totalBlocks.toLocaleString()} pcs
📏 Beam Length: ${totalInvoiceBeamLength.toFixed(1)} m
🏗️ Cement: ${totalCementBags} bags (50kg)
🪨 Sand: ${totalSandTonnes.toFixed(1)}t | Ballast: ${totalBallastTonnes.toFixed(1)}t
📦 BRC Mesh: ${brc?.rollsNeeded || 0} rolls

Please send me an official quote and pricing. Thank you.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#1fbb57] text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.889.001 2.269.654 4.505 1.88 6.385l.115.2-1.362 4.955 5.064-1.325.192.113zm9.57-5.171c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.296-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            Share Quote via WhatsApp
          </a>
        )}

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
