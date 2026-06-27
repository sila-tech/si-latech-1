'use client';

import React, { useState } from 'react';
import { PlusCircle, Download, Eye, X, MessageCircle, FileText, ShoppingCart, Calculator } from 'lucide-react';
import { useCalculator } from '@/context/calculator-context';
import { OrderModal } from './silacalc/order-modal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function MobileQuoteBar() {
  const { 
    totals, 
    settings, 
    displayUnit,
    costEstimationEnabled,
    setCostEstimationEnabled,
    pricingRates
  } = useCalculator();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
  } = totals;

  // Pricing calculations
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

  const handleDownload = () => {
    setIsDrawerOpen(false);
    const realBtn = document.getElementById('real-invoice-btn');
    if (realBtn) realBtn.click();
  };

  const getWhatsAppLink = () => {
    const message = `Hello SI-LATECH, here is my project summary:

📐 Total Slab Area: ${totalArea.toFixed(2)} m²
🏗️ Beam System: ${settings.beamType === 'tbeam' ? 'T-Beam System' : 'Flat Beam System'}

🧱 Blocks Needed: ${totalBlocks.toLocaleString()} pcs
📏 Beam Length: ${totalInvoiceBeamLength.toFixed(1)} m
🏗️ Cement: ${totalCementBags} bags (50kg)
🪨 Sand: ${totalSandTonnes.toFixed(1)}t | Ballast: ${totalBallastTonnes.toFixed(1)}t
📦 BRC Mesh: ${brc?.rollsNeeded || 0} rolls
🛠️ Props: ${timber?.totalProps || 0} pcs
${costEstimationEnabled ? `💰 Estimated Cost: Ksh ${grandTotal.toLocaleString()}` : ''}

Please send me an official quote and pricing. Thank you.`;

    return `https://wa.me/254701792088?text=${encodeURIComponent(message)}`;
  };

  if (totalArea === 0) {
    return null; // Don't show bar if no area exists yet
  }

  return (
    <>
      {/* Minimized Bottom Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-[0_-4px_25px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Area</span>
          <span className="text-base font-black text-slate-900 leading-tight">
            {totalArea.toFixed(2)} {displayUnit === 'ft' ? 'ft²' : 'm²'}
          </span>
          {costEstimationEnabled && (
            <span className="text-xs font-bold text-emerald-600">Ksh {grandTotal.toLocaleString()}</span>
          )}
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 h-11 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Eye size={15} /> Summary
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-black px-4 h-11 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            Order
          </button>
        </div>
      </div>

      {/* Floating Bottom Drawer (Summary Sheet) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
          />
          
          {/* Drawer Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-6 flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Grabber indicator */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-headline flex items-center gap-2">
                  <Calculator size={18} className="text-primary" /> Project Summary
                </h3>
                <p className="text-xs text-slate-400">Live structural estimation details</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Toggle pricing */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl mb-5">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">💰 Localized Cost Estimation</span>
                <span className="text-[10px] text-slate-400">Pre-populated average Kenyan market rates</span>
              </div>
              <Switch 
                checked={costEstimationEnabled} 
                onCheckedChange={setCostEstimationEnabled} 
              />
            </div>

            {/* Material List with Quantities & optional prices */}
            <div className="space-y-2.5 mb-6">
              {[
                { label: 'Total Slab Area', value: `${totalArea.toFixed(2)} m²`, cost: 0, showCost: false },
                { label: 'Standard Concrete Beams', value: `${totalInvoiceBeamLength.toFixed(1)} m`, cost: beamsCost },
                { label: 'Hollow Concrete Blocks', value: `${totalBlocks.toLocaleString()} pcs`, cost: blocksCost },
                { label: 'Cement Bags (50kg)', value: `${totalCementBags} bags`, cost: cementCost },
                { label: 'River Sand (Tonnes)', value: `${totalSandTonnes.toFixed(1)} t`, cost: sandCost },
                { label: 'Ballast Aggregate (Tonnes)', value: `${totalBallastTonnes.toFixed(1)} t`, cost: ballastCost },
                { label: 'BRC Mesh Rolls', value: `${brc?.rollsNeeded || 0} rolls`, cost: brcCost },
                { label: 'Timber Support Props', value: `${timber?.totalProps || 0} pcs`, cost: propsCost },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-semibold">{item.label}</span>
                    <span className="text-slate-900 font-black text-sm mt-0.5">{item.value}</span>
                  </div>
                  {costEstimationEnabled && item.showCost !== false && (
                    <span className="text-slate-900 font-bold text-sm bg-slate-100 px-2.5 py-1 rounded-lg">
                      Ksh {item.cost.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Grand Total Cost (if enabled) */}
            {costEstimationEnabled && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-6 text-center">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block">Estimated Grand Total</span>
                <span className="text-2xl font-black text-emerald-600 block mt-0.5">Ksh {grandTotal.toLocaleString()}</span>
                <span className="text-[9px] text-emerald-500 mt-1 block">Excluding transport fees & onsite labor</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-1 gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsOrderModalOpen(true);
                }}
                className="w-full h-12 bg-[#f59e0b] hover:bg-[#d97706] text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
              >
                <ShoppingCart size={18} /> Order Materials from SI-LATECH
              </button>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleDownload}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                >
                  <Download size={15} /> Download PDF
                </button>
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-11 bg-[#25D366] hover:bg-[#1fbb57] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all text-center"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Order Modal */}
      <OrderModal 
        open={isOrderModalOpen} 
        onOpenChange={setIsOrderModalOpen} 
      />
    </>
  );
}
