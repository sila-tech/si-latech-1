'use client';

import React, { useState } from 'react';
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
  ShoppingCart,
  Coins
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { useCalculator } from '@/context/calculator-context';
import { Switch } from '@/components/ui/switch';
import { OrderModal } from './order-modal';
import { useFirebase } from '@/firebase';
import { saveGeneratedQuote } from '@/lib/firestore';

export function TotalsCard() {
  const { 
    rooms,
    totals, 
    settings, 
    perRoomCalculations,
    costEstimationEnabled,
    setCostEstimationEnabled,
    pricingRates,
    setPricingRates,
    projectName,
    clientName,
    clientContact,
    projectLocation,
    contactPerson,
    saveProject
  } = useCalculator();

  const { firestore } = useFirebase();

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const {
    totalArea,
    totalBlocks,
    totalInvoiceBeamLength,
    totalCementBags,
    totalSandTonnes,
    totalBallastTonnes,
    brc,
    timber,
    totalLintelLength,
  } = totals;

  const rawLintelLength = (totals as any).rawLintelLength || totalLintelLength;
  const sharedWallDeduction = (totals as any).sharedWallDeduction || 0;

  // Material rates and costs
  const beamRate = settings.beamType === 'tbeam' ? pricingRates.beamTbeamRate : pricingRates.beamFlatRate;
  const blockRate = settings.beamType === 'tbeam' ? pricingRates.blockTbeamRate : pricingRates.blockFlatRate;

  const beamsCost = totalInvoiceBeamLength * beamRate;
  const blocksCost = totalBlocks * blockRate;
  const cementCost = totalCementBags * pricingRates.cementRate;
  const sandCost = totalSandTonnes * pricingRates.sandRate;
  const ballastCost = totalBallastTonnes * pricingRates.ballastRate;
  const brcCost = (brc?.rollsNeeded || 0) * pricingRates.brcRate;
  const propsCost = (timber?.totalProps || 0) * pricingRates.propRate;

  const grandTotal = beamsCost + blocksCost + cementCost + sandCost + ballastCost + brcCost + propsCost;

  const handleWhatsAppShare = () => {
    if (!firestore) return;

    const invoiceNumber = `SILA-WA-${String(Date.now()).slice(-6)}`;
    const displayProjectName = projectName?.trim() || `WhatsApp Quote (${totalArea.toFixed(2)} m²)`;
    const displayClientName = clientName?.trim() || "WhatsApp Lead";

    saveGeneratedQuote(firestore, {
      invoiceNumber,
      clientName: displayClientName,
      projectName: displayProjectName,
      projectLocation: projectLocation || '',
      clientContact: clientContact || '',
      contactPerson: contactPerson || '',
      grandTotal,
      totals,
      rooms,
      items: {
        blocks: totalBlocks,
        beamsLength: totalInvoiceBeamLength
      }
    }).then(() => {
      saveProject({
        name: displayProjectName,
        clientName: displayClientName,
        clientContact: clientContact || '',
        projectLocation: projectLocation || '',
        contactPerson: contactPerson || ''
      });
    }).catch((err) => {
      console.error("Failed to auto-save project on WhatsApp share:", err);
    });
  };

  return (
    <>
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

        <CardContent className="p-6 space-y-5">
          
          {/* Cost Estimation Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">💰 Cost Estimation</span>
              <span className="text-[10px] text-slate-400">Pre-populated average Kenyan market rates</span>
            </div>
            <Switch 
              checked={costEstimationEnabled} 
              onCheckedChange={setCostEstimationEnabled} 
            />
          </div>

          {/* Live Material Quantities & Custom Rates */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-headline">
              Required Quantities Breakdown
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Slab Area */}
              <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-xs hover:border-slate-200 transition-colors">
                <span className="text-slate-600 flex items-center gap-2 font-medium">
                  <Layers size={16} className="text-sky-500" /> Total Slab Area
                </span>
                <strong className="text-slate-900 font-bold">{totalArea.toFixed(2)} m²</strong>
              </div>

              {/* Concrete Beams */}
              <div className="flex flex-col p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-xs hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2 font-medium">
                    <Ruler size={16} className="text-indigo-500" /> Concrete Beams (Invoice)
                  </span>
                  <strong className="text-slate-900 font-bold">{totalInvoiceBeamLength.toFixed(1)} m</strong>
                </div>
                {costEstimationEnabled && (
                  <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-100/60 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Rate: KSh</span>
                      <input 
                        type="number"
                        value={beamRate}
                        onChange={(e) => setPricingRates(prev => ({
                          ...prev,
                          [settings.beamType === 'tbeam' ? 'beamTbeamRate' : 'beamFlatRate']: parseFloat(e.target.value) || 0
                        }))}
                        className="w-16 px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-slate-400">/m</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">KSh {beamsCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Concrete Blocks */}
              <div className="flex flex-col p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-xs hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2 font-medium">
                    <BrickWall size={16} className="text-emerald-500" /> Standard Blocks (Invoice)
                  </span>
                  <strong className="text-slate-900 font-bold">{totalBlocks.toLocaleString()} pcs</strong>
                </div>
                {costEstimationEnabled && (
                  <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-100/60 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Rate: KSh</span>
                      <input 
                        type="number"
                        value={blockRate}
                        onChange={(e) => setPricingRates(prev => ({
                          ...prev,
                          [settings.beamType === 'tbeam' ? 'blockTbeamRate' : 'blockFlatRate']: parseFloat(e.target.value) || 0
                        }))}
                        className="w-16 px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-slate-400">/pc</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">KSh {blocksCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Cement */}
              <div className="flex flex-col p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-xs hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2 font-medium">
                    <Coins size={16} className="text-amber-500" /> Cement (50kg Bags)
                  </span>
                  <strong className="text-slate-900 font-bold">{totalCementBags} bags</strong>
                </div>
                {costEstimationEnabled && (
                  <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-100/60 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Rate: KSh</span>
                      <input 
                        type="number"
                        value={pricingRates.cementRate}
                        onChange={(e) => setPricingRates(prev => ({
                          ...prev,
                          cementRate: parseFloat(e.target.value) || 0
                        }))}
                        className="w-16 px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-slate-400">/bag</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">KSh {cementCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Sand & Ballast */}
              <div className="flex flex-col p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-xs hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2 font-medium">
                    <FolderSync size={16} className="text-rose-500" /> Sand & Ballast
                  </span>
                  <strong className="text-slate-900 font-bold">{totalSandTonnes.toFixed(1)}t / {totalBallastTonnes.toFixed(1)}t</strong>
                </div>
                {costEstimationEnabled && (
                  <div className="flex flex-col gap-2 text-xs mt-2 pt-2 border-t border-slate-100/60 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Sand Rate: KSh</span>
                        <input 
                          type="number"
                          value={pricingRates.sandRate}
                          onChange={(e) => setPricingRates(prev => ({
                            ...prev,
                            sandRate: parseFloat(e.target.value) || 0
                          }))}
                          className="w-16 px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-slate-400">/t</span>
                      </div>
                      <span className="font-semibold text-slate-600">KSh {sandCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Ballast Rate: KSh</span>
                        <input 
                          type="number"
                          value={pricingRates.ballastRate}
                          onChange={(e) => setPricingRates(prev => ({
                            ...prev,
                            ballastRate: parseFloat(e.target.value) || 0
                          }))}
                          className="w-16 px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-slate-400">/t</span>
                      </div>
                      <span className="font-semibold text-slate-600">KSh {ballastCost.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* BRC Mesh */}
              <div className="flex flex-col p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-xs hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2 font-medium">
                    <ShoppingBag size={16} className="text-cyan-500" /> BRC Mesh rolls
                  </span>
                  <strong className="text-slate-900 font-bold">{brc?.rollsNeeded || 0} rolls</strong>
                </div>
                {costEstimationEnabled && (
                  <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-100/60 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Rate: KSh</span>
                      <input 
                        type="number"
                        value={pricingRates.brcRate}
                        onChange={(e) => setPricingRates(prev => ({
                          ...prev,
                          brcRate: parseFloat(e.target.value) || 0
                        }))}
                        className="w-20 px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-slate-400">/roll</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">KSh {brcCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Timber Props */}
              <div className="flex flex-col p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-xs hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2 font-medium">
                    <TrendingUp size={16} className="text-slate-600" /> Support Props Required
                  </span>
                  <strong className="text-slate-900 font-bold">{timber?.totalProps || 0} pcs</strong>
                </div>
                {costEstimationEnabled && (
                  <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-100/60 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Rate: KSh</span>
                      <input 
                        type="number"
                        value={pricingRates.propRate}
                        onChange={(e) => setPricingRates(prev => ({
                          ...prev,
                          propRate: parseFloat(e.target.value) || 0
                        }))}
                        className="w-16 px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-slate-400">/pc</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">KSh {propsCost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shared Wall Deduction Lintel Summary */}
          {sharedWallDeduction > 0 && (
            <>
              <Separator className="bg-slate-100" />
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Lintel Steel (Adjusted)</h4>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Raw</p>
                    <p className="text-xs font-bold text-slate-600">{rawLintelLength.toFixed(1)}m</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                    <p className="text-[9px] text-red-400 font-bold uppercase">Deducted</p>
                    <p className="text-xs font-bold text-red-600">−{sharedWallDeduction.toFixed(1)}m</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                    <p className="text-[9px] text-emerald-500 font-bold uppercase">Net</p>
                    <p className="text-xs font-bold text-emerald-700">{totalLintelLength.toFixed(1)}m</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">Steel quantities calculated on net lintel length</p>
              </div>
            </>
          )}

          {costEstimationEnabled && (
            <>
              <Separator className="bg-slate-100" />
              {/* Grand Total cost display banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Estimated Grand Total Cost</span>
                <span className="text-2xl font-black text-emerald-600 block mt-0.5">KSh {grandTotal.toLocaleString()}</span>
                <span className="text-[9px] text-emerald-500 mt-1 block">Subject to transport costs and final site measurements</span>
              </div>
            </>
          )}

          <Separator className="bg-slate-100" />

          {/* Order Materials Lead Button */}
          {totalArea > 0 && (
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#f59e0b] hover:bg-[#d97706] text-white text-sm font-black rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <ShoppingCart size={16} />
              Order Materials from SI-LATECH
            </button>
          )}

          <div className="flex gap-2.5 text-[11px] text-slate-500 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
            <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Technical specifications automatically update in real-time. Toggle "Cost Estimation" to display custom pricing and calculate comprehensive building estimates.
            </p>
          </div>

          <Separator className="bg-slate-100" />

          {/* WhatsApp Share */}
          {totalArea > 0 && (
            <a
              href={`https://wa.me/254141981315?text=${encodeURIComponent(
                `Hello SI-LATECH, here is my project summary:

📐 Total Slab Area: ${totalArea.toFixed(2)} m²
🧱 Blocks Needed: ${totalBlocks.toLocaleString()} pcs
📏 Beam Length: ${totalInvoiceBeamLength.toFixed(1)} m
🏗️ Cement: ${totalCementBags} bags (50kg)
🪨 Sand: ${totalSandTonnes.toFixed(1)}t | Ballast: ${totalBallastTonnes.toFixed(1)}t
📦 BRC Mesh: ${brc?.rollsNeeded || 0} rolls
🛠️ Props: ${timber?.totalProps || 0} pcs
${costEstimationEnabled ? `💰 Estimated Cost: KSh ${grandTotal.toLocaleString()}` : ''}

Please send me an official quote and pricing. Thank you.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppShare}
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
      
      {/* Lead capture modal */}
      <OrderModal 
        open={isOrderModalOpen} 
        onOpenChange={setIsOrderModalOpen} 
      />
    </>
  );
}
