'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCalculator } from '@/context/calculator-context';
import { PlanReaderCard } from './plan-reader-card';
import { OrderModal } from './order-modal';
import { 
  TrendingUp, 
  Layers, 
  Construction, 
  Calendar, 
  Scale, 
  Coins, 
  Download, 
  Sliders, 
  Info,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Bulk densities and factors matching SilaCalc core calculator
const DENSITIES = {
  cement: 1440,      // kg/m³
  sand: 1600,        // kg/m³
  ballast: 1500,     // kg/m³
  cementBagWeight: 50,
  dryVolumeFactor: 1.54,
};

export function ComparisonTab() {
  const { 
    rooms, 
    totals, 
    pricingRates, 
    settings,
    projectName,
    clientName,
    projectLocation,
    addRoom,
    updateRoom,
    deleteRoom,
    displayUnit,
    setDisplayUnit
  } = useCalculator();

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Mode: 'project' (active rooms) or 'estimate' (quick sample slider)
  const hasActiveProject = rooms && rooms.length > 0;
  const [calculationMode, setCalculationMode] = useState<'project' | 'estimate'>(
    hasActiveProject ? 'project' : 'estimate'
  );

  // Quick Estimate Sample Area slider (m²)
  const [sampleArea, setSampleArea] = useState<number>(100);

  // Settings Accordion/Toggle
  const [showRatesSettings, setShowRatesSettings] = useState<boolean>(false);

  // Local state for editable rates
  const [localRates, setLocalRates] = useState({
    // Standard rates loaded from context or set to default
    cementRate: pricingRates?.cementRate || 800,
    sandRate: pricingRates?.sandRate || 3000,
    ballastRate: pricingRates?.ballastRate || 3200,
    brcRate: pricingRates?.brcRate || 25000,
    beamRate: settings?.beamType === 'tbeam' 
      ? (pricingRates?.beamTbeamRate || 950) 
      : (pricingRates?.beamFlatRate || 520),
    blockRate: settings?.beamType === 'tbeam' 
      ? (pricingRates?.blockTbeamRate || 95) 
      : (pricingRates?.blockFlatRate || 85),
    
    // Traditional-specific rates (Kenyan averages)
    traditionalSteelRate: 130,        // KSh/kg for Y10 rebars
    traditionalShutteringRate: 800,    // KSh/m² for plywood and timber framing hire
    traditionalLaborRate: 800,       // KSh/m² for steel binding, formwork, casting (double reinforcement standard)
    silatechLaborRate: 300,          // KSh/m² (extremely fast and simple, half of traditional)
    propRentalRate: 100,             // KSh/prop for rental/use instead of full purchase cost
  });

  const handleRateChange = (key: keyof typeof localRates, value: number) => {
    setLocalRates(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Sync calculation mode automatically when rooms are added or removed
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      setCalculationMode('project');
    } else {
      setCalculationMode('estimate');
    }
  }, [rooms?.length]);

  // ───────────────────────────────────────────────────────────────────────────
  // CALCULATIONS ENGINE
  // ───────────────────────────────────────────────────────────────────────────
  const comparisonData = useMemo(() => {
    // 1. Determine active area
    const area = calculationMode === 'project' ? totals.totalArea : sampleArea;

    if (area <= 0) {
      return {
        area: 0,
        traditional: { concreteVol: 0, cementBags: 0, sandT: 0, ballastT: 0, steelKg: 0, props: 0, plywoodM2: 0, days: 0, concreteCost: 0, steelCost: 0, timberCost: 0, laborCost: 0, totalCost: 0 },
        silatech: { beamsM: 0, blocksPcs: 0, concreteVol: 0, cementBags: 0, sandT: 0, ballastT: 0, BRCrolls: 0, props: 0, plywoodM2: 0, days: 0, beamsCost: 0, blocksCost: 0, concreteCost: 0, brcCost: 0, timberCost: 0, laborCost: 0, totalCost: 0 },
        savings: { cost: 0, costPercent: 0, cementBags: 0, sandT: 0, ballastT: 0, steelKg: 0, plywoodM2: 0, props: 0, concreteVol: 0, days: 0 }
      };
    }

    // ─── A. TRADITIONAL SYSTEM CALCULATIONS (150mm Solid Concrete Slab) ───
    const tradThickness = 0.15; // 150mm
    const tradConcreteVol = area * tradThickness;
    const tradDryVol = tradConcreteVol * DENSITIES.dryVolumeFactor;
    
    // Class 20 Concrete mix (1:2:4 ratio, 10% wastage)
    const tradCementBags = Math.ceil((tradDryVol * (1/7) * DENSITIES.cement * 1.10) / DENSITIES.cementBagWeight);
    const tradSandT = (tradDryVol * (2/7) * DENSITIES.sand * 1.10) / 1000;
    const tradBallastT = (tradDryVol * (4/7) * DENSITIES.ballast * 1.10) / 1000;

    // Steel Reinforcement: Double-layer structural reinforcement grid + beams (standard for solid slabs)
    const tradSteelKg = area * 22.0; // 22 kg per m²
    
    // Shuttering & Props
    const tradPlywoodM2 = area;
    const tradProps = Math.ceil(area / 0.64); // 0.8m x 0.8m grid spacing for dense wet slab props
    const tradDays = 28 + Math.ceil(area / 25); // 28 days curing hold + prep time

    // Costs
    const tradConcreteCost = (tradCementBags * localRates.cementRate) + 
                            (tradSandT * localRates.sandRate) + 
                            (tradBallastT * localRates.ballastRate);
    const tradSteelCost = tradSteelKg * localRates.traditionalSteelRate;
    const tradTimberCost = area * localRates.traditionalShutteringRate;
    const tradLaborCost = area * localRates.traditionalLaborRate;
    const tradTotalCost = tradConcreteCost + tradSteelCost + tradTimberCost + tradLaborCost;


    // ─── B. SI-LATECH SYSTEM CALCULATIONS ───
    let silaBeamsM = 0;
    let silaBlocksPcs = 0;
    let silaConcreteVol = 0;
    let silaCementBags = 0;
    let silaSandT = 0;
    let silaBallastT = 0;
    let silaBRCrolls = 0;
    let silaProps = 0;

    if (calculationMode === 'project') {
      // Pull actual quantities from context
      silaBeamsM = totals.totalInvoiceBeamLength;
      silaBlocksPcs = totals.totalBlocks;
      silaConcreteVol = totals.totalConcreteVolume; // topping + beams ribs
      silaCementBags = totals.totalCementBags;
      silaSandT = totals.totalSandTonnes;
      silaBallastT = totals.totalBallastTonnes;
      silaBRCrolls = totals.brc?.rollsNeeded || 0;
      silaProps = totals.timber?.totalProps || 0;
    } else {
      // Estimate based on area
      silaBeamsM = area * 2.4; // avg 2.4m of beam per m²
      silaBlocksPcs = area * 10.5; // avg 10.5 blocks per m²
      
      // Wet concrete is 50mm topping + rib joints (total ~55mm)
      silaConcreteVol = area * 0.055;
      const silaDryVol = silaConcreteVol * DENSITIES.dryVolumeFactor;
      
      // Mix ratio 1:2:4, 10% wastage
      silaCementBags = Math.ceil((silaDryVol * (1/7) * DENSITIES.cement * 1.10) / DENSITIES.cementBagWeight);
      silaSandT = (silaDryVol * (2/7) * DENSITIES.sand * 1.10) / 1000;
      silaBallastT = (silaDryVol * (4/7) * DENSITIES.ballast * 1.10) / 1000;
      
      silaBRCrolls = Math.ceil(area / 115.2); // BRC Mesh A98 roll covers 115.2m²
      silaProps = Math.ceil(silaBeamsM / 1.5); // Minimal prop line every 1.5m under beams
    }

    const silaPlywoodM2 = 0; // Precast blocks act as deck formwork
    const silaDays = 3 + Math.ceil(area / 60); // 2 days laying/pouring + 3 days initial setup

    // Costs
    const silaBeamsCost = silaBeamsM * localRates.beamRate;
    const silaBlocksCost = silaBlocksPcs * localRates.blockRate;
    const silaConcreteCost = (silaCementBags * localRates.cementRate) + 
                            (silaSandT * localRates.sandRate) + 
                            (silaBallastT * localRates.ballastRate);
    const silaBrcCost = silaBRCrolls * localRates.brcRate;
    // Shuttering & props for SI-LATECH is prop rental/use rate (e.g. KSh 100/pc)
    const silaTimberCost = silaProps * localRates.propRentalRate; 
    const silaLaborCost = area * localRates.silatechLaborRate;

    const silaTotalCost = silaBeamsCost + silaBlocksCost + silaConcreteCost + silaBrcCost + silaTimberCost + silaLaborCost;


    // ─── C. SAVINGS ───
    const costSavings = tradTotalCost - silaTotalCost;
    const costSavingsPercent = tradTotalCost > 0 ? (costSavings / tradTotalCost) * 100 : 0;
    
    const cementSaved = Math.max(0, tradCementBags - silaCementBags);
    const sandSaved = Math.max(0, tradSandT - silaSandT);
    const ballastSaved = Math.max(0, tradBallastT - silaBallastT);
    const steelSaved = Math.max(0, tradSteelKg); // 100% structural rebar saved from site
    const plywoodSaved = Math.max(0, tradPlywoodM2 - silaPlywoodM2);
    const propsSaved = Math.max(0, tradProps - silaProps);
    const concreteVolSaved = Math.max(0, tradConcreteVol - silaConcreteVol);
    const daysSaved = Math.max(0, tradDays - silaDays);

    return {
      area,
      traditional: {
        concreteVol: tradConcreteVol,
        cementBags: tradCementBags,
        sandT: tradSandT,
        ballastT: tradBallastT,
        steelKg: tradSteelKg,
        props: tradProps,
        plywoodM2: tradPlywoodM2,
        days: tradDays,
        concreteCost: tradConcreteCost,
        steelCost: tradSteelCost,
        timberCost: tradTimberCost,
        laborCost: tradLaborCost,
        totalCost: tradTotalCost
      },
      silatech: {
        beamsM: silaBeamsM,
        blocksPcs: silaBlocksPcs,
        concreteVol: silaConcreteVol,
        cementBags: silaCementBags,
        sandT: silaSandT,
        ballastT: silaBallastT,
        BRCrolls: silaBRCrolls,
        props: silaProps,
        plywoodM2: silaPlywoodM2,
        days: silaDays,
        beamsCost: silaBeamsCost,
        blocksCost: silaBlocksCost,
        concreteCost: silaConcreteCost,
        brcCost: silaBrcCost,
        timberCost: silaTimberCost,
        laborCost: silaLaborCost,
        totalCost: silaTotalCost
      },
      savings: {
        cost: costSavings,
        costPercent: costSavingsPercent,
        cementBags: cementSaved,
        sandT: sandSaved,
        ballastT: ballastSaved,
        steelKg: steelSaved,
        plywoodM2: plywoodSaved,
        props: propsSaved,
        concreteVol: concreteVolSaved,
        days: daysSaved
      }
    };
  }, [calculationMode, sampleArea, totals, pricingRates, settings, localRates]);

  // ───────────────────────────────────────────────────────────────────────────
  // PDF SAVINGS REPORT GENERATION
  // ───────────────────────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const primaryColor = '#095388'; // Brand Blue
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportId = `SAVE-${String(Date.now()).slice(-6)}`;

    // Draw branding header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text('SI-LATECH', 14, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Slab Savings & Technology Comparison Report', 55, 20);

    doc.setDrawColor(220);
    doc.line(14, 25, 196, 25);

    // Meta details
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${reportDate}`, 14, 33);
    doc.text(`Report ID: ${reportId}`, 14, 38);
    doc.text(`Project Name: ${projectName || 'Quick Savings Estimate'}`, 14, 43);
    doc.text(`Slab Area: ${comparisonData.area.toFixed(2)} m²`, 14, 48);

    if (calculationMode === 'project' && clientName) {
      doc.text(`Client Name: ${clientName}`, 145, 33);
      if (projectLocation) doc.text(`Location: ${projectLocation}`, 145, 38);
    }

    // Savings Summary Card (Highlight)
    doc.setFillColor(240, 249, 255); // light sky blue background
    doc.rect(14, 55, 182, 28, 'F');
    doc.setDrawColor(186, 230, 253);
    doc.rect(14, 55, 182, 28, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor('#0369a1'); // darker blue
    doc.text('ESTIMATED SAVINGS SUMMARY', 20, 62);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Financial Savings: KSh ${comparisonData.savings.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${comparisonData.savings.costPercent.toFixed(1)}% Saved)`, 20, 70);
    doc.text(`Time Saved: ${comparisonData.savings.days} Days of Construction Hold Avoided`, 20, 77);

    // --- Table 1: Material Quantities Comparison ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('1. Structural Material Quantities Comparison', 14, 95);

    const quantHeaders = ['Material Item', 'Traditional Solid Slab', 'SI-LATECH Slab', 'Material Saved', '% Saved'];
    const quantRows = [
      ['Wet Concrete Volume', `${comparisonData.traditional.concreteVol.toFixed(1)} m³`, `${comparisonData.silatech.concreteVol.toFixed(1)} m³`, `${comparisonData.savings.concreteVol.toFixed(1)} m³`, `${(comparisonData.savings.concreteVol / comparisonData.traditional.concreteVol * 100).toFixed(1)}%`],
      ['Cement (50kg bags)', `${comparisonData.traditional.cementBags} bags`, `${comparisonData.silatech.cementBags} bags`, `${comparisonData.savings.cementBags} bags`, `${(comparisonData.savings.cementBags / comparisonData.traditional.cementBags * 100).toFixed(1)}%`],
      ['River Sand', `${comparisonData.traditional.sandT.toFixed(1)} tonnes`, `${comparisonData.silatech.sandT.toFixed(1)} tonnes`, `${comparisonData.savings.sandT.toFixed(1)} tonnes`, `${(comparisonData.savings.sandT / comparisonData.traditional.sandT * 100).toFixed(1)}%`],
      ['Ballast (Aggregate)', `${comparisonData.traditional.ballastT.toFixed(1)} tonnes`, `${comparisonData.silatech.ballastT.toFixed(1)} tonnes`, `${comparisonData.savings.ballastT.toFixed(1)} tonnes`, `${(comparisonData.savings.ballastT / comparisonData.traditional.ballastT * 100).toFixed(1)}%`],
      ['Structural Steel (Site)', `${comparisonData.traditional.steelKg.toFixed(0)} kg`, '0 kg', `${comparisonData.traditional.steelKg.toFixed(0)} kg`, '100%'],
      ['Anti-crack Steel Mesh', '0 rolls', `${comparisonData.silatech.BRCrolls} rolls`, '-', '-'],
      ['Plywood Formwork', `${comparisonData.traditional.plywoodM2.toFixed(0)} m²`, '0 m²', `${comparisonData.traditional.plywoodM2.toFixed(0)} m²`, '100%'],
      ['Shuttering Props', `${comparisonData.traditional.props} props`, `${comparisonData.silatech.props} props`, `${comparisonData.savings.props} props`, `${(comparisonData.savings.props / comparisonData.traditional.props * 100).toFixed(1)}%`],
      ['Construction Duration', `${comparisonData.traditional.days} days`, `${comparisonData.silatech.days} days`, `${comparisonData.savings.days} days`, `${(comparisonData.savings.days / comparisonData.traditional.days * 100).toFixed(1)}%`]
    ];

    (doc as any).autoTable({
      head: [quantHeaders],
      body: quantRows,
      startY: 100,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold', textColor: '#15803d' },
        4: { halign: 'center' }
      }
    });

    // --- Table 2: Financial Cost Comparison ---
    let finalY = (doc as any).lastAutoTable.finalY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('2. Financial Cost Comparison (KSh)', 14, finalY + 12);

    const costHeaders = ['Cost Component', 'Traditional Solid Slab', 'SI-LATECH Slab', 'Net Cost Variance'];
    const costRows = [
      ['Concrete Materials', `KSh ${comparisonData.traditional.concreteCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `KSh ${comparisonData.silatech.concreteCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `Saved KSh ${(comparisonData.traditional.concreteCost - comparisonData.silatech.concreteCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
      ['Structural Steel (Rebars/BRC)', `KSh ${comparisonData.traditional.steelCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `KSh ${comparisonData.silatech.brcCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `Saved KSh ${(comparisonData.traditional.steelCost - comparisonData.silatech.brcCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
      ['Plywood & Timber Shuttering', `KSh ${comparisonData.traditional.timberCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `KSh ${comparisonData.silatech.timberCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `Saved KSh ${(comparisonData.traditional.timberCost - comparisonData.silatech.timberCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
      ['Labor Charges (Formwork/Casting)', `KSh ${comparisonData.traditional.laborCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `KSh ${comparisonData.silatech.laborCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `Saved KSh ${(comparisonData.traditional.laborCost - comparisonData.silatech.laborCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
      ['Precast Beams & Blocks', 'KSh 0', `KSh ${(comparisonData.silatech.beamsCost + comparisonData.silatech.blocksCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `Cost KSh -${(comparisonData.silatech.beamsCost + comparisonData.silatech.blocksCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
      [
        { content: 'GRAND TOTAL COST', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: `KSh ${comparisonData.traditional.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: `KSh ${comparisonData.silatech.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: `Saved KSh ${comparisonData.savings.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [21, 128, 61] } }
      ]
    ];

    (doc as any).autoTable({
      head: [costHeaders],
      body: costRows,
      startY: finalY + 16,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Disclaimer
    finalY = (doc as any).lastAutoTable.finalY;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text('Note: Material quantities and costs are estimates based on standard builder parameters and custom input unit rates.', 14, finalY + 12);
    doc.text('SI-LATECH precast beam costs are calculated using retail billing counts which include standard waste markups and commissions.', 14, finalY + 16);

    doc.save(`SI-LATECH-Savings-Report-${reportId}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ─── Mode and Header Row ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-[#095388] h-5 w-5" />
            Traditional vs. SI-LATECH Slab Comparison
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Compare material quantities, time schedules, and financial costs side-by-side.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveProject && (
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
              <button
                onClick={() => setCalculationMode('project')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  calculationMode === 'project'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Project Layout ({totals.totalArea.toFixed(1)} m²)
              </button>
              <button
                onClick={() => setCalculationMode('estimate')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  calculationMode === 'estimate'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Quick Estimate Slider
              </button>
            </div>
          )}
          
          <Button 
            onClick={handleDownloadPDF} 
            disabled={comparisonData.area <= 0}
            className="bg-[#095388] hover:bg-[#07426d] text-white flex items-center gap-2 shadow-sm font-bold text-xs h-10 px-4"
          >
            <Download className="h-4 w-4" /> Download PDF Report
          </Button>
        </div>
      </div>

      {/* ─── Main Split-Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: AI Plan Reader & Manual Room Layout Manager */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Plan Reader */}
          <PlanReaderCard />
          
          {/* Room Layout Manager */}
          <Card className="border border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Room Layout Manager</CardTitle>
                <CardDescription className="text-[10px]">Add or edit room sizes to recalculate comparison</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Unit Switcher */}
                <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-black text-slate-600">
                  <button
                    type="button"
                    onClick={() => setDisplayUnit('m')}
                    className={`px-2 py-1 rounded-md transition-colors uppercase tracking-wider ${displayUnit === 'm' ? 'bg-[#095388] text-white shadow-xs' : 'hover:bg-slate-300/40 text-slate-500'}`}
                  >
                    Metres
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayUnit('ft')}
                    className={`px-2 py-1 rounded-md transition-colors uppercase tracking-wider ${displayUnit === 'ft' ? 'bg-[#095388] text-white shadow-xs' : 'hover:bg-slate-300/40 text-slate-500'}`}
                  >
                    Feet
                  </button>
                </div>

                <Button 
                  onClick={addRoom} 
                  className="h-8 text-xs bg-[#095388] hover:bg-[#07426d] font-bold text-white flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Room
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
              {rooms.length === 0 ? (
                <div className="text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">No custom rooms added yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Adjust the quick slider on the right or click "Add Room" to start building your layout.</p>
                </div>
              ) : (
                rooms.map((room) => (
                  <div key={room.id} className="p-3 bg-slate-50/30 border border-slate-100 rounded-xl space-y-2.5 relative hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                        className="font-bold text-slate-800 text-xs bg-transparent border-none focus:outline-none focus:ring-b focus:ring-primary w-2/3 py-0.5 focus:bg-white focus:px-1.5 focus:rounded"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRoom(room.id)}
                        className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Length ({displayUnit})</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={displayUnit === 'ft' ? (room.length * 3.28084).toFixed(2) : room.length}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const meters = displayUnit === 'ft' ? val / 3.28084 : val;
                            updateRoom(room.id, 'length', meters);
                          }}
                          className="h-8 mt-1 font-semibold text-slate-700"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Width ({displayUnit})</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={displayUnit === 'ft' ? (room.width * 3.28084).toFixed(2) : room.width}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const meters = displayUnit === 'ft' ? val / 3.28084 : val;
                            updateRoom(room.id, 'width', meters);
                          }}
                          className="h-8 mt-1 font-semibold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Download Quote Button */}
          <Button
            onClick={() => setIsOrderModalOpen(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold shadow-md h-12 text-sm flex items-center justify-center gap-2 rounded-xl transition-transform active:scale-98"
          >
            <Download size={18} /> Proceed to Download Quote
          </Button>
        </div>
        
        {/* Right Column: Comparative Charts & Detailed Savings Table */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Estimate Slider Panel */}
          {calculationMode === 'estimate' && (
            <Card className="border border-slate-200 shadow-xs bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="area-slider" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Sliders className="h-4 w-4 text-[#095388]" />
                        Estimate Floor Slab Area:
                      </Label>
                      <span className="text-lg font-black text-[#095388] bg-sky-50 px-3 py-1 rounded-lg border border-sky-100">
                        {sampleArea} m²
                      </span>
                    </div>
                    <input
                      id="area-slider"
                      type="range"
                      min="20"
                      max="500"
                      step="5"
                      value={sampleArea}
                      onChange={(e) => setSampleArea(parseInt(e.target.value) || 20)}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#095388]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>20 m² (Small SQ)</span>
                      <span>100 m² (Avg. 3-Bed House)</span>
                      <span>250 m² (Large Villa)</span>
                      <span>500 m² (Commercial/Apartments)</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-12 bg-slate-200 hidden md:block" />

                  <div className="flex flex-col gap-1 w-full md:w-48">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Manual Input (m²)</span>
                    <Input
                      type="number"
                      value={sampleArea}
                      onChange={(e) => setSampleArea(Math.max(1, parseInt(e.target.value) || 0))}
                      className="font-bold text-slate-700 h-10 focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hero Summary Badge Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Net Savings */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute right-2 -bottom-2 text-emerald-400/20 opacity-30 select-none pointer-events-none">
                <Coins size={120} />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-100">Total Slab Savings</span>
                <p className="text-2xl font-black mt-1">
                  KSh {comparisonData.savings.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full w-max backdrop-blur-xs flex items-center gap-1">
                <CheckCircle size={12} /> Save {comparisonData.savings.costPercent.toFixed(1)}% of slab budget
              </span>
            </div>

            {/* Time Saved */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute right-2 -bottom-2 text-indigo-400/20 opacity-30 select-none pointer-events-none">
                <Calendar size={120} />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-100">Speed Advantage</span>
                <p className="text-2xl font-black mt-1">{comparisonData.savings.days} Days Saved</p>
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full w-max backdrop-blur-xs">
                Build walls above immediately
              </span>
            </div>

            {/* Concrete Saved */}
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute right-2 -bottom-2 text-sky-400/20 opacity-30 select-none pointer-events-none">
                <Layers size={120} />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-100">Concrete Mixed on Site</span>
                <p className="text-2xl font-black mt-1">-{comparisonData.savings.concreteVol.toFixed(1)} m³</p>
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full w-max backdrop-blur-xs">
                Save {comparisonData.savings.cementBags} bags of Cement
              </span>
            </div>

            {/* Weight Reduction */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute right-2 -bottom-2 text-amber-400/20 opacity-30 select-none pointer-events-none">
                <Scale size={120} />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-100">Structural Weight</span>
                <p className="text-2xl font-black mt-1">36% Lighter</p>
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full w-max backdrop-blur-xs">
                Reduces foundation stress
              </span>
            </div>
          </div>

          {/* Detailed Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Concrete Card */}
            <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                    <Layers size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">Concrete & Aggregates</CardTitle>
                    <CardDescription className="text-[10px]">On-site mixing volume comparison</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 space-y-4 text-xs text-slate-600">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span>Traditional Slab (150mm)</span>
                  <strong className="text-slate-800 text-sm">{comparisonData.traditional.concreteVol.toFixed(1)} m³</strong>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span>SI-LATECH Slab (50mm + ribs)</span>
                  <strong className="text-slate-800 text-sm">{comparisonData.silatech.concreteVol.toFixed(1)} m³</strong>
                </div>
                
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 space-y-2 mt-2">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Material Savings:</span>
                    <span>Save {((comparisonData.traditional.concreteVol - comparisonData.silatech.concreteVol) / comparisonData.traditional.concreteVol * 100).toFixed(0)}%</span>
                  </div>
                  <Separator className="bg-emerald-200/50" />
                  <ul className="space-y-1 font-medium list-disc pl-4 text-[11px]">
                    <li>Cement: **Save {comparisonData.savings.cementBags} bags**</li>
                    <li>River Sand: **Save {comparisonData.savings.sandT.toFixed(1)} tonnes**</li>
                    <li>Ballast: **Save {comparisonData.savings.ballastT.toFixed(1)} tonnes**</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Steel Card */}
            <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Construction size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">Steel Reinforcement</CardTitle>
                    <CardDescription className="text-[10px]">Site handling and assembly weight</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 space-y-4 text-xs text-slate-600">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span>Traditional Slab (Y10 Grid)</span>
                  <strong className="text-slate-800 text-sm">{comparisonData.traditional.steelKg.toFixed(0)} kg</strong>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span>SI-LATECH Slab (BRC A98 Mesh)</span>
                  <strong className="text-slate-800 text-sm">{comparisonData.silatech.BRCrolls > 0 ? `${comparisonData.silatech.BRCrolls} rolls (~165 kg)` : '0 kg'}</strong>
                </div>
                
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 space-y-2 mt-2">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Material Savings:</span>
                    <span>Save 75%+</span>
                  </div>
                  <Separator className="bg-emerald-200/50" />
                  <p className="text-[11px] font-medium leading-relaxed">
                    **Saved {comparisonData.savings.steelKg.toFixed(0)} kg** of Y10 rebar reinforcement. 
                    All structural reinforcing is built into SI-LATECH beams at the factory. 
                    No days spent binding or welding steel on site.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timber Card */}
            <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">Timber Formwork & Props</CardTitle>
                    <CardDescription className="text-[10px]">Shuttering board area and support poles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 space-y-4 text-xs text-slate-600">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span>Traditional Shuttering (Plywood)</span>
                  <strong className="text-slate-800 text-sm">{comparisonData.traditional.plywoodM2.toFixed(0)} m²</strong>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span>SI-LATECH Slab Shuttering</span>
                  <strong className="text-slate-800 text-sm">0 m² (Blocks act as deck)</strong>
                </div>
                
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 space-y-2 mt-2">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Formwork Savings:</span>
                    <span>Save 80%+</span>
                  </div>
                  <Separator className="bg-emerald-200/50" />
                  <ul className="space-y-1 font-medium list-disc pl-4 text-[11px]">
                    <li>Plywood Sheets: **Save 100%** (no marine plywood needed)</li>
                    <li>Support Props: **Save {comparisonData.savings.props} props**</li>
                    <li>Saves environment and timber costs dramatically.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Cost Comparison Table */}
          <Card className="border border-slate-200 shadow-xs bg-white">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins size={18} className="text-emerald-500" />
                  Financial Cost Comparison
                </CardTitle>
                <CardDescription className="text-xs">Estimate based on current pricing rates.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRatesSettings(!showRatesSettings)}
                className="text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 h-8"
              >
                <Sliders size={14} /> {showRatesSettings ? 'Hide' : 'Configure'} Cost Rates
              </Button>
            </CardHeader>

            {/* Collapsible Rates Config Panel */}
            {showRatesSettings && (
              <CardContent className="bg-slate-50/50 border-b border-slate-100 p-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 font-headline flex items-center gap-1">
                  <Sliders size={12} /> Adjust Unit Rates (KSh)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">Cement (per 50kg bag)</Label>
                    <Input 
                      type="number" 
                      value={localRates.cementRate} 
                      onChange={(e) => handleRateChange('cementRate', parseFloat(e.target.value) || 0)}
                      className="h-9 mt-1 text-slate-700 font-semibold" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">River Sand (per Tonne)</Label>
                    <Input 
                      type="number" 
                      value={localRates.sandRate} 
                      onChange={(e) => handleRateChange('sandRate', parseFloat(e.target.value) || 0)}
                      className="h-9 mt-1 text-slate-700 font-semibold" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">Ballast (per Tonne)</Label>
                    <Input 
                      type="number" 
                      value={localRates.ballastRate} 
                      onChange={(e) => handleRateChange('ballastRate', parseFloat(e.target.value) || 0)}
                      className="h-9 mt-1 text-slate-700 font-semibold" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">Traditional Steel Rebar (per kg)</Label>
                    <Input 
                      type="number" 
                      value={localRates.traditionalSteelRate} 
                      onChange={(e) => handleRateChange('traditionalSteelRate', parseFloat(e.target.value) || 0)}
                      className="h-9 mt-1 text-slate-700 font-semibold" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">Traditional Shuttering (per m²)</Label>
                    <Input 
                      type="number" 
                      value={localRates.traditionalShutteringRate} 
                      onChange={(e) => handleRateChange('traditionalShutteringRate', parseFloat(e.target.value) || 0)}
                      className="h-9 mt-1 text-slate-700 font-semibold" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">Traditional Labor (per m²)</Label>
                    <Input 
                      type="number" 
                      value={localRates.traditionalLaborRate} 
                      onChange={(e) => handleRateChange('traditionalLaborRate', parseFloat(e.target.value) || 0)}
                      className="h-9 mt-1 text-slate-700 font-semibold" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">SI-LATECH Labor (per m²)</Label>
                    <Input 
                      type="number" 
                      value={localRates.silatechLaborRate} 
                      onChange={(e) => handleRateChange('silatechLaborRate', parseFloat(e.target.value) || 0)}
                      className="h-9 mt-1 text-slate-700 font-semibold" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500">SI-LATECH Prop Rental (per pc)</Label>
                    <Input 
                      type="number" 
                      value={localRates.propRentalRate} 
                      onChange={(e) => handleRateChange('propRentalRate', parseFloat(e.target.value) || 0)}
                      className="h-9 mt-1 text-slate-700 font-semibold" 
                    />
                  </div>
                  <div className="flex items-end text-[10px] text-slate-400 font-medium pb-2 flex-wrap">
                    <Info size={12} className="mr-1 text-sky-500" /> Precast Beam and Block rates are inherited from main settings.
                  </div>
                </div>
              </CardContent>
            )}

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                    <th className="p-4 pl-6">Cost Component</th>
                    <th className="p-4 text-right">Traditional Solid Slab</th>
                    <th className="p-4 text-right">SI-LATECH Slab</th>
                    <th className="p-4 text-right pr-6">Cost Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  
                  {/* Concrete Materials */}
                  <tr>
                    <td className="p-4 pl-6 font-medium">Concrete Ingredients (Cement, Sand, Ballast)</td>
                    <td className="p-4 text-right">KSh {comparisonData.traditional.concreteCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right">KSh {comparisonData.silatech.concreteCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right pr-6 font-semibold text-emerald-600">
                      KSh {(comparisonData.traditional.concreteCost - comparisonData.silatech.concreteCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>

                  {/* Steel Reinforcement */}
                  <tr>
                    <td className="p-4 pl-6 font-medium">Site Steel Reinforcement (Rebar grids / BRC mesh)</td>
                    <td className="p-4 text-right">KSh {comparisonData.traditional.steelCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right">KSh {comparisonData.silatech.brcCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right pr-6 font-semibold text-emerald-600">
                      KSh {(comparisonData.traditional.steelCost - comparisonData.silatech.brcCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>

                  {/* Shuttering / Formwork */}
                  <tr>
                    <td className="p-4 pl-6 font-medium">Timber & Formwork Shuttering (Plywood, support joists)</td>
                    <td className="p-4 text-right">KSh {comparisonData.traditional.timberCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right">KSh {comparisonData.silatech.timberCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right pr-6 font-semibold text-emerald-600">
                      KSh {(comparisonData.traditional.timberCost - comparisonData.silatech.timberCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>

                  {/* Labor Charges */}
                  <tr>
                    <td className="p-4 pl-6 font-medium">Site Labor Costs (Carpentry, steel binding, casting)</td>
                    <td className="p-4 text-right">KSh {comparisonData.traditional.laborCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right">KSh {comparisonData.silatech.laborCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right pr-6 font-semibold text-emerald-600">
                      KSh {(comparisonData.traditional.laborCost - comparisonData.silatech.laborCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>

                  {/* Precast Beams & Blocks (Sila exclusive) */}
                  <tr>
                    <td className="p-4 pl-6 font-medium">Precast Concrete Beams & Hollow Blocks</td>
                    <td className="p-4 text-right text-slate-400">KSh 0</td>
                    <td className="p-4 text-right">KSh {(comparisonData.silatech.beamsCost + comparisonData.silatech.blocksCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right pr-6 text-red-500 font-semibold">
                      -KSh {(comparisonData.silatech.beamsCost + comparisonData.silatech.blocksCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>

                  {/* Grand Total Row */}
                  <tr className="bg-slate-50 font-bold text-slate-800 text-sm">
                    <td className="p-4 pl-6 font-extrabold uppercase">Grand Total Cost</td>
                    <td className="p-4 text-right">KSh {comparisonData.traditional.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right text-primary">KSh {comparisonData.silatech.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-right pr-6 text-emerald-600 bg-emerald-50 border-l border-emerald-100 font-black">
                      KSh {comparisonData.savings.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100/60 p-4 flex gap-1.5 text-[10px] text-slate-400 font-medium">
              <AlertCircle size={12} className="text-slate-500 mt-0.5" />
              <span>
                Note: All prices shown for the SI-LATECH system are calculated using invoice values which automatically include standard waste markups and commissions.
              </span>
            </CardFooter>
          </Card>
          
        </div>
        
      </div>

      {/* Order Modal Portal */}
      <OrderModal open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen} />
      
    </div>
  );
}
