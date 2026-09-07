
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calculator,
  Wand2,
  Layers,
  ShieldCheck,
  Building2,
  Info,
  Check,
} from 'lucide-react';
import { subdivideAreaToRooms, calculateProjectTotals } from '@/lib/calculator';
import { useToast } from '@/hooks/use-toast';
import { useCalculator } from '@/context/calculator-context';

export function QuickQuoteCard() {
  const { setRooms, settings, setSettings, pricingRates } = useCalculator();
  const [area, setArea] = useState<number | ''>('');
  const [maxSpan, setMaxSpan] = useState<number>(4.0);
  const [selectedBeamType, setSelectedBeamType] = useState<'flat' | 'tbeam'>(
    settings.beamType === 'tbeam' ? 'tbeam' : 'flat'
  );
  const { toast } = useToast();

  // Subdivide the area into structural bays of <= maxSpan (<= 4.0m)
  const generatedRooms = useMemo(() => {
    if (typeof area !== 'number' || area <= 0) return [];
    return subdivideAreaToRooms(area, maxSpan, Math.min(maxSpan, 3.8));
  }, [area, maxSpan]);

  // Calculate Flat Beam totals for preview
  const flatTotals = useMemo(() => {
    if (generatedRooms.length === 0) return null;
    return calculateProjectTotals(generatedRooms, { ...settings, beamType: 'flat' });
  }, [generatedRooms, settings]);

  // Calculate T-Beam totals for preview
  const tbeamTotals = useMemo(() => {
    if (generatedRooms.length === 0) return null;
    return calculateProjectTotals(generatedRooms, { ...settings, beamType: 'tbeam' });
  }, [generatedRooms, settings]);

  // Cost estimates for preview
  const flatCost = useMemo(() => {
    if (!flatTotals) return 0;
    const beamRate = pricingRates.beamFlatRate || 545;
    const blockRate = pricingRates.blockFlatRate || 90;
    const cementRate = pricingRates.cementRate || 800;
    const sandRate = pricingRates.sandRate || 3000;
    const ballastRate = pricingRates.ballastRate || 3200;
    const brcRate = pricingRates.brcRate || 25000;

    return (
      flatTotals.totalInvoiceBeamLength * beamRate +
      flatTotals.totalBlocks * blockRate +
      flatTotals.totalCementBags * cementRate +
      flatTotals.totalSandTonnes * sandRate +
      flatTotals.totalBallastTonnes * ballastRate +
      (flatTotals.brc?.rollsNeeded || 0) * brcRate
    );
  }, [flatTotals, pricingRates]);

  const tbeamCost = useMemo(() => {
    if (!tbeamTotals) return 0;
    const beamRate = pricingRates.beamTbeamRate || 1200;
    const blockRate = pricingRates.blockTbeamRate || 100;
    const cementRate = pricingRates.cementRate || 800;
    const sandRate = pricingRates.sandRate || 3000;
    const ballastRate = pricingRates.ballastRate || 3200;
    const brcRate = pricingRates.brcRate || 25000;

    return (
      tbeamTotals.totalInvoiceBeamLength * beamRate +
      tbeamTotals.totalBlocks * blockRate +
      tbeamTotals.totalCementBags * cementRate +
      tbeamTotals.totalSandTonnes * sandRate +
      tbeamTotals.totalBallastTonnes * ballastRate +
      (tbeamTotals.brc?.rollsNeeded || 0) * brcRate
    );
  }, [tbeamTotals, pricingRates]);

  const handleApplyEstimate = (beamTypeToApply: 'flat' | 'tbeam' = selectedBeamType) => {
    if (typeof area !== 'number' || area <= 0) {
      toast({
        title: 'Invalid Area',
        description: 'Please enter a valid, positive number for the area.',
        variant: 'destructive',
      });
      return;
    }

    if (generatedRooms.length === 0) {
      toast({
        title: 'Calculation Error',
        description: 'Unable to subdivide area into structural bays.',
        variant: 'destructive',
      });
      return;
    }

    // Set the chosen beam system in project settings
    setSettings((prev) => ({ ...prev, beamType: beamTypeToApply }));

    // Apply the subdivided bays to the main room list
    setRooms(generatedRooms);

    toast({
      title: 'Estimate Applied Successfully',
      description: `${area} m² subdivided into ${generatedRooms.length} bays (max ${maxSpan}m span) using ${
        beamTypeToApply === 'tbeam' ? 'T-Beam' : 'Flat Beam'
      } system.`,
    });
  };

  const typicalBay = generatedRooms.length > 0 ? generatedRooms[0] : null;

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-headline text-2xl text-slate-900 flex items-center gap-2">
            <Calculator size={24} className="text-[#f59e0b]" />
            Quick Quote & Modular Area Estimator
          </CardTitle>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <ShieldCheck size={14} /> ≤ 4.0m Structural Subdividing
          </span>
        </div>
        <CardDescription>
          When clients provide total square metres, this tool automatically subdivides the slab into realistic
          structural bays (≤ 4.0m spans) supported by ring beams or walls—ensuring safe Flat Beam and
          single-rib T-Beam quotes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total-area" className="font-bold text-slate-900 flex items-center justify-between">
              <span>Total Floor Area (m²)</span>
              {typeof area === 'number' && area > 0 && (
                <span className="text-xs text-amber-700 font-semibold">
                  {generatedRooms.length} bay{generatedRooms.length > 1 ? 's' : ''} calculated
                </span>
              )}
            </Label>
            <Input
              id="total-area"
              type="number"
              value={area}
              onChange={(e) => setArea(parseFloat(e.target.value) || '')}
              placeholder="e.g., 100, 150, 240"
              min="1"
              step="1"
              className="bg-[#eff3f8] border-slate-200 text-base font-semibold h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-900 flex items-center justify-between">
              <span>Max Side Span (Limit)</span>
              <span className="text-xs text-slate-500 font-normal">Limits room spans</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[3.5, 3.8, 4.0].map((span) => (
                <button
                  key={span}
                  type="button"
                  onClick={() => setMaxSpan(span)}
                  className={`h-11 rounded-lg text-xs font-bold transition-all border ${
                    maxSpan === span
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-[#eff3f8] text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {span.toFixed(1)}m Max
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subdivision Explanation & Structural Confirmation */}
        {generatedRooms.length > 0 && typicalBay && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <Info size={18} className="text-amber-700 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                Subdivided into {generatedRooms.length} structural panel{generatedRooms.length > 1 ? 's' : ''} (approx.{' '}
                {typicalBay.length}m × {typicalBay.width}m each).
              </p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                By maintaining spans ≤ {maxSpan}m, precast <strong>Flat Beams</strong> remain within safe deflection
                limits, and <strong>T-Beams</strong> use standard single-rib configurations (multiplier = 1).
              </p>
            </div>
          </div>
        )}

        {/* Side-by-Side Live Quote Comparison */}
        {generatedRooms.length > 0 && flatTotals && tbeamTotals && (
          <div className="space-y-3">
            <Label className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers size={14} /> Compare Systems for this Area
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Flat Beam Option */}
              <div
                onClick={() => setSelectedBeamType('flat')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  selectedBeamType === 'flat'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 mb-1">
                      Standard Domestic
                    </span>
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                      <Building2 size={16} className="text-emerald-700" />
                      Flat Beam System
                    </h4>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      selectedBeamType === 'flat'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedBeamType === 'flat' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div className="mt-3 text-2xl font-black text-slate-900">
                  KES {Math.round(flatCost).toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">(est. materials)</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Beams (Billed):</span>
                    <strong className="text-slate-800">{flatTotals.totalInvoiceBeamLength.toFixed(1)} m</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Blocks:</span>
                    <strong className="text-slate-800">{flatTotals.totalBlocks.toLocaleString()} pcs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cement Topping:</span>
                    <strong className="text-slate-800">{flatTotals.totalCementBags} bags</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Props Required:</span>
                    <strong className="text-slate-800">{flatTotals.timber?.totalProps || 0} props</strong>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-emerald-800 bg-emerald-100/50 p-2 rounded-lg">
                  ✓ Ideal for spans ≤ 4.0m. Lighter and budget-friendly.
                </div>
              </div>

              {/* T-Beam Option */}
              <div
                onClick={() => setSelectedBeamType('tbeam')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  selectedBeamType === 'tbeam'
                    ? 'border-[#095388] bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-100 text-[#095388] mb-1">
                      Heavy Duty & Commercial
                    </span>
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                      <Building2 size={16} className="text-[#095388]" />
                      T-Beam System
                    </h4>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      selectedBeamType === 'tbeam'
                        ? 'bg-[#095388] border-[#095388] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedBeamType === 'tbeam' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div className="mt-3 text-2xl font-black text-slate-900">
                  KES {Math.round(tbeamCost).toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">(est. materials)</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Beams (Billed):</span>
                    <strong className="text-slate-800">{tbeamTotals.totalInvoiceBeamLength.toFixed(1)} m</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Blocks:</span>
                    <strong className="text-slate-800">{tbeamTotals.totalBlocks.toLocaleString()} pcs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cement Topping:</span>
                    <strong className="text-slate-800">{tbeamTotals.totalCementBags} bags</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Props Required:</span>
                    <strong className="text-slate-800">{tbeamTotals.timber?.totalProps || 0} props</strong>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-[#095388] bg-blue-100/50 p-2 rounded-lg">
                  ✓ High rigidity and heavy load capacity. Single rib layout for spans ≤ 4.2m.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          onClick={() => handleApplyEstimate(selectedBeamType)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 shadow-md flex items-center justify-center gap-2"
        >
          <Wand2 size={18} />
          {generatedRooms.length > 0
            ? `Apply ${selectedBeamType === 'tbeam' ? 'T-Beam' : 'Flat Beam'} Estimate (${generatedRooms.length} Bays)`
            : 'Generate Estimate'}
        </Button>
      </CardFooter>
    </Card>
  );
}
