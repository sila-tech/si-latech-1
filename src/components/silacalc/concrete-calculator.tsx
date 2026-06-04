'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Download, Construction, Ruler, Layers, Scale, Sparkles, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Ratios and Bulk Densities from existing settings context
const DENSITIES = {
  cement: 1440,      // kg/m³
  sand: 1600,        // kg/m³
  ballast: 1500,     // kg/m³
  cementBagWeight: 50, // kg
  dryVolumeFactor: 1.54,
  wheelbarrowsPerTonne: 6,
  brcRollWidth: 2.4,
  brcRollLength: 48,
};

type ClientInfo = {
  clientName: string;
  projectName: string;
  projectLocation: string;
  clientContact: string;
  contactPerson: string;
};

// Watermark image loading
let fadedLogoBase64 = '';
if (typeof window !== 'undefined') {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 0.025; // 2.5% opacity for perfect faded watermark look
        ctx.drawImage(img, 0, 0);
        fadedLogoBase64 = canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.error('Failed to pre-fade watermark logo:', e);
    }
  };
  img.src = '/logo.png';
}

export function ConcreteCalculator() {
  const { toast } = useToast();

  // Inputs state
  const [length, setLength] = useState<number>(10);
  const [width, setWidth] = useState<number>(10);
  const [thickness, setThickness] = useState<number>(150); // in mm
  const [wastage, setWastage] = useState<number>(10); // in %
  const [mixPreset, setMixPreset] = useState<string>('class20');
  
  // Custom Mix Ratio parts
  const [customCement, setCustomCement] = useState<number>(1);
  const [customSand, setCustomSand] = useState<number>(2);
  const [customBallast, setCustomBallast] = useState<number>(4);

  // Client info state for PDF download
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: '',
    projectName: '',
    projectLocation: '',
    clientContact: '',
    contactPerson: '',
  });
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Handle mix preset changes
  useEffect(() => {
    if (mixPreset === 'class20') {
      setCustomCement(1);
      setCustomSand(2);
      setCustomBallast(4);
    } else if (mixPreset === 'class25') {
      setCustomCement(1);
      setCustomSand(1.5);
      setCustomBallast(3);
    } else if (mixPreset === 'class30') {
      setCustomCement(1);
      setCustomSand(1);
      setCustomBallast(2);
    }
  }, [mixPreset]);

  // Calculations
  const calculations = useMemo(() => {
    const L = Math.max(0, length);
    const W = Math.max(0, width);
    const H = Math.max(0, thickness / 1000); // convert mm to m
    const W_factor = 1 + (Math.max(0, wastage) / 100);

    const area = L * W;
    const wetVolume = area * H;
    const dryVolume = wetVolume * DENSITIES.dryVolumeFactor;

    const cRatio = Math.max(0, customCement);
    const sRatio = Math.max(0, customSand);
    const bRatio = Math.max(0, customBallast);
    const totalParts = cRatio + sRatio + bRatio;

    if (totalParts === 0 || area === 0 || H === 0) {
      return {
        area,
        wetVolume,
        dryVolume: 0,
        cementBags: 0,
        sandTonnes: 0,
        sandWheelbarrows: 0,
        ballastTonnes: 0,
        ballastWheelbarrows: 0,
        brcRolls: 0,
      };
    }

    // Volumetric proportions
    const vCement = (cRatio / totalParts) * dryVolume;
    const vSand = (sRatio / totalParts) * dryVolume;
    const vBallast = (bRatio / totalParts) * dryVolume;

    // Mass in kg with wastage
    const mCement = vCement * DENSITIES.cement * W_factor;
    const mSand = vSand * DENSITIES.sand * W_factor;
    const mBallast = vBallast * DENSITIES.ballast * W_factor;

    // Output quantities
    const cementBags = Math.ceil(mCement / DENSITIES.cementBagWeight);
    const sandTonnes = mSand / 1000;
    const ballastTonnes = mBallast / 1000;

    const sandWheelbarrows = Math.ceil(sandTonnes * DENSITIES.wheelbarrowsPerTonne);
    const ballastWheelbarrows = Math.ceil(ballastTonnes * DENSITIES.wheelbarrowsPerTonne);

    // BRC Mesh rolls (2.4m * 48m = 115.2 m² per roll)
    const brcAreaPerRoll = DENSITIES.brcRollWidth * DENSITIES.brcRollLength;
    const brcRolls = Math.ceil(area / brcAreaPerRoll);

    return {
      area,
      wetVolume,
      dryVolume,
      cementBags,
      sandTonnes,
      sandWheelbarrows,
      ballastTonnes,
      ballastWheelbarrows,
      brcRolls,
    };
  }, [length, width, thickness, wastage, customCement, customSand, customBallast]);

  // Scaled dimensions for the SVG 3D visualizer
  const svgVisuals = useMemo(() => {
    const maxVal = Math.max(length, width);
    if (maxVal === 0) return { lScale: 0, wScale: 0, tScale: 0 };
    
    // Scale inputs to fit comfortably inside a 400x220 container
    const lScale = Math.min(130, Math.max(30, (length / maxVal) * 110));
    const wScale = Math.min(130, Math.max(30, (width / maxVal) * 110));
    const tScale = Math.min(30, Math.max(4, (thickness / 300) * 20));

    return { lScale, wScale, tScale };
  }, [length, width, thickness]);

  // PDF download generation
  const handleDownload = () => {
    const doc = new jsPDF();
    const primaryColor = '#095388'; // Brand Blue
    const docDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `CONC-${String(Date.now()).slice(-6)}`;

    // Add watermark
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      try {
        if (fadedLogoBase64) {
          doc.addImage(fadedLogoBase64, 'PNG', 45, 90, 120, 120, undefined, 'FAST');
        } else {
          doc.addImage('/logo.png', 'PNG', 45, 90, 120, 120, undefined, 'FAST');
        }
      } catch (e) {}
    }

    // Header branding
    try {
      doc.addImage('/logo.png', 'PNG', 14, 8, 18, 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(primaryColor);
      doc.text('SI-LATECH', 35, 20);
    } catch (e) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(primaryColor);
      doc.text('SI-LATECH', 14, 22);
    }

    // Contacts (right aligned)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Head Office: Juja, Kenya', 140, 16);
    doc.text('Tel: +254 701 792088', 140, 21);
    doc.text('Email: info.silatechsolutions@gmail.com', 140, 26);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('@si-latech, a better simpler and cost effective way to build.', 14, 34);

    let currentY = 46;

    // Customer & Site details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text('CLIENT DETAILS:', 14, currentY);
    doc.text('ESTIMATE INFO:', 120, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client Name: ${clientInfo.clientName || 'Valued Customer'}`, 14, currentY);
    doc.text(`Estimate No: #${invoiceNumber}`, 120, currentY);
    currentY += 5;
    doc.text(`Contact: ${clientInfo.clientContact || 'N/A'}`, 14, currentY);
    doc.text(`Date: ${docDate}`, 120, currentY);
    currentY += 5;
    doc.text(`Project Name: ${clientInfo.projectName || 'General Construction'}`, 14, currentY);
    currentY += 5;
    doc.text(`Site Location: ${clientInfo.projectLocation || 'N/A'}`, 14, currentY);
    if (clientInfo.contactPerson) {
      currentY += 5;
      doc.text(`Site Contact: ${clientInfo.contactPerson}`, 14, currentY);
    }

    currentY += 12;

    // Slab Dimensions Sub-header
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text(`SLAB DIMENSIONS:`, 14, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Length: ${length.toFixed(2)} m  |  Width: ${width.toFixed(2)} m  |  Thickness: ${thickness} mm`, 14, currentY);
    currentY += 5;
    doc.text(`Total Area: ${calculations.area.toFixed(2)} sq.m  |  Wet Concrete Volume: ${calculations.wetVolume.toFixed(3)} cu.m`, 14, currentY);
    currentY += 8;

    // Mix Proportions Sub-header
    const mixText = mixPreset === 'class20' ? 'Class 20 (1:2:4)' : 
                    mixPreset === 'class25' ? 'Class 25 (1:1.5:3)' : 
                    mixPreset === 'class30' ? 'Class 30 (1:1:2)' : 'Custom Mix';
    doc.text(`Mix Design: ${mixText}  |  Dry Volume Factor: 1.54  |  Wastage Allowance: ${wastage}%`, 14, currentY);
    currentY += 8;

    // Table rows setup
    const tableRows = [
      [
        'Cement (50kg bags)', 
        calculations.cementBags.toString(), 
        'Bags', 
        `Standard 50kg bags. Mix ratio: ${customCement} parts.`
      ],
      [
        'Sand', 
        calculations.sandTonnes.toFixed(2), 
        'Tonnes', 
        `River sand. Approx. ${calculations.sandWheelbarrows} wheelbarrows. Mix ratio: ${customSand} parts.`
      ],
      [
        'Ballast / Coarse Aggregate', 
        calculations.ballastTonnes.toFixed(2), 
        'Tonnes', 
        `Crushed stones. Approx. ${calculations.ballastWheelbarrows} wheelbarrows. Mix ratio: ${customBallast} parts.`
      ],
      [
        'BRC Mesh A98', 
        calculations.brcRolls.toString(), 
        'Rolls', 
        `2.4m x 48m reinforcement fabric rolls for structural integrity.`
      ]
    ];

    (doc as any).autoTable({
      head: [['MATERIAL DESCRIPTION', 'QUANTITY', 'UNIT', 'APPLICATION NOTES']],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9.5, cellPadding: 4 },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' },
        2: { halign: 'center' }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;

    // Call-to-action note
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#D32F2F');
    doc.text('Notice: Material quantities are estimates. Verify on site before placing orders.', 14, finalY);

    finalY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Need professional advice or want to order concrete materials, beams, or hollow blocks?', 14, finalY);
    finalY += 5;
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Call or WhatsApp us at +254 701 792088 today!', 14, finalY);

    doc.save(`SI-LATECH-Concrete-Estimate-${invoiceNumber}.pdf`);
    setIsDownloadOpen(false);
    toast({
      title: "PDF Downloaded",
      description: "Concrete materials estimate downloaded successfully.",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setClientInfo(prev => ({ ...prev, [id]: value }));
  };

  // 3D Isometric View points calculation based on scaled coordinates
  const { lScale, wScale, tScale } = svgVisuals;
  const x0 = 200, y0 = 150; // Center origin of drawing area

  // Vertices calculation
  const p0 = { x: x0, y: y0 }; // Bottom-center (Front edge bottom)
  const p1 = { x: x0 + lScale * 0.866, y: y0 + lScale * 0.5 }; // Bottom-right
  const p2 = { x: x0 - wScale * 0.866, y: y0 + wScale * 0.5 }; // Bottom-left
  const p3 = { x: x0 + (lScale - wScale) * 0.866, y: y0 + (lScale + wScale) * 0.5 }; // Bottom-back

  // Top layer vertices (shifted straight up by thickness)
  const t0 = { x: p0.x, y: p0.y - tScale };
  const t1 = { x: p1.x, y: p1.y - tScale };
  const t2 = { x: p2.x, y: p2.y - tScale };
  const t3 = { x: p3.x, y: p3.y - tScale };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Inputs Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500 text-white p-2 rounded-lg">
                <Construction className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 font-headline">Slab Dimensions</CardTitle>
                <CardDescription className="text-xs">Specify the length, width, and concrete depth of the area.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Dimensions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="length" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-sky-500" /> Length (meters)
                </Label>
                <Input
                  id="length"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-medium"
                />
                <span className="text-[11px] text-slate-500 font-medium block">
                  ≈ {(length * 3.28084).toFixed(1)} feet
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="width" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-sky-500 rotate-90" /> Width (meters)
                </Label>
                <Input
                  id="width"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-medium"
                />
                <span className="text-[11px] text-slate-500 font-medium block">
                  ≈ {(width * 3.28084).toFixed(1)} feet
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thickness" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-sky-500" /> Thickness (mm)
                </Label>
                <Input
                  id="thickness"
                  type="number"
                  min="10"
                  step="5"
                  value={thickness}
                  onChange={(e) => setThickness(parseFloat(e.target.value) || 0)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-medium"
                />
                <span className="text-[11px] text-slate-500 font-medium block">
                  = {(thickness / 1000).toFixed(3)} meters
                </span>
              </div>
            </div>

            {/* Thickness presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[100, 150, 200, 250].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setThickness(t)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${
                    thickness === t 
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t} mm
                </button>
              ))}
            </div>

            <Separator />

            {/* Mix design section */}
            <div className="space-y-4">
              <Label className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Scale className="h-5 w-5 text-sky-500" /> Concrete Mix Design & Wastage
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mix Preset Selection */}
                <div className="space-y-2">
                  <Label htmlFor="mixPreset" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mix Ratios</Label>
                  <select
                    id="mixPreset"
                    value={mixPreset}
                    onChange={(e) => setMixPreset(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  >
                    <option value="class20">Class 20 (1:2:4) - Standard Slab</option>
                    <option value="class25">Class 25 (1:1.5:3) - Structural</option>
                    <option value="class30">Class 30 (1:1:2) - Heavy Load</option>
                    <option value="custom">Custom Mix Proportions</option>
                  </select>
                </div>

                {/* Wastage */}
                <div className="space-y-2">
                  <Label htmlFor="wastage" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wastage Factor (%)</Label>
                  <Input
                    id="wastage"
                    type="number"
                    min="0"
                    max="50"
                    value={wastage}
                    onChange={(e) => setWastage(parseFloat(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-medium"
                  />
                </div>
              </div>

              {/* Custom Mix Ratio Inputs */}
              {mixPreset === 'custom' && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-3 duration-300">
                  <div className="space-y-1.5">
                    <Label htmlFor="customCement" className="text-xs text-slate-600 font-bold">Cement parts</Label>
                    <Input
                      id="customCement"
                      type="number"
                      step="0.1"
                      value={customCement}
                      onChange={(e) => setCustomCement(parseFloat(e.target.value) || 0)}
                      className="bg-white border-slate-200 h-9 text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customSand" className="text-xs text-slate-600 font-bold">Sand parts</Label>
                    <Input
                      id="customSand"
                      type="number"
                      step="0.1"
                      value={customSand}
                      onChange={(e) => setCustomSand(parseFloat(e.target.value) || 0)}
                      className="bg-white border-slate-200 h-9 text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customBallast" className="text-xs text-slate-600 font-bold">Ballast parts</Label>
                    <Input
                      id="customBallast"
                      type="number"
                      step="0.1"
                      value={customBallast}
                      onChange={(e) => setCustomBallast(parseFloat(e.target.value) || 0)}
                      className="bg-white border-slate-200 h-9 text-center font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3D Visualizer Card */}
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b py-3">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-sky-500" /> Slab 3D Visualizer
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-6 bg-slate-900/5 select-none">
            {length > 0 && width > 0 ? (
              <svg width="100%" height="220" viewBox="0 0 400 240" className="max-w-md filter drop-shadow-md overflow-visible">
                {/* Grid guidelines for helper */}
                <path d="M 50 150 L 200 65 L 350 150" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="2" strokeDasharray="3,3" />

                {/* Back Top/Bottom Wireframes (Hidden parts dashed) */}
                <path d={`M ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p1.x} ${p1.y}`} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
                <path d={`M ${t2.x} ${t2.y} L ${t3.x} ${t3.y} L ${t1.x} ${t1.y}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1={p3.x} y1={p3.y} x2={t3.x} y2={t3.y} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />

                {/* Front Left Face */}
                <polygon
                  points={`${p2.x},${p2.y} ${t2.x},${t2.y} ${t0.x},${t0.y} ${p0.x},${p0.y}`}
                  fill="#64748b"
                  stroke="#475569"
                  strokeWidth="1.5"
                />

                {/* Front Right Face */}
                <polygon
                  points={`${p0.x},${p0.y} ${t0.x},${t0.y} ${t1.x},${t1.y} ${p1.x},${p1.y}`}
                  fill="#475569"
                  stroke="#334155"
                  strokeWidth="1.5"
                />

                {/* Top Concrete Surface */}
                <polygon
                  points={`${t0.x},${t0.y} ${t1.x},${t1.y} ${t3.x},${t3.y} ${t2.x},${t2.y}`}
                  fill="#cbd5e1"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />

                {/* Structural Texture Lines on Concrete Top */}
                <path 
                  d={`M ${(t0.x + t2.x)/2} ${(t0.y + t2.y)/2} L ${(t1.x + t3.x)/2} ${(t1.y + t3.y)/2}`}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <path 
                  d={`M ${(t0.x + t1.x)/2} ${(t0.y + t1.y)/2} L ${(t2.x + t3.x)/2} ${(t2.y + t3.y)/2}`}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />

                {/* Labels & Dim Lines */}
                {/* Length Label (Right side) */}
                <text 
                  x={(p0.x + p1.x) / 2 + 10} 
                  y={(p0.y + p1.y) / 2 + 15} 
                  fill="#334155" 
                  fontSize="11" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  Length: {length.toFixed(1)}m
                </text>

                {/* Width Label (Left side) */}
                <text 
                  x={(p0.x + p2.x) / 2 - 10} 
                  y={(p0.y + p2.y) / 2 + 15} 
                  fill="#334155" 
                  fontSize="11" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  Width: {width.toFixed(1)}m
                </text>

                {/* Thickness Label */}
                <line x1={p0.x - 15} y1={p0.y} x2={p0.x - 15} y2={t0.y} stroke="#e2e8f0" strokeWidth="1" />
                <line x1={p0.x - 18} y1={p0.y} x2={p0.x - 12} y2={p0.y} stroke="#cbd5e1" strokeWidth="1" />
                <line x1={p0.x - 18} y1={t0.y} x2={p0.x - 12} y2={t0.y} stroke="#cbd5e1" strokeWidth="1" />
                <text 
                  x={p0.x - 22} 
                  y={(p0.y + t0.y) / 2 + 4} 
                  fill="#ef4444" 
                  fontSize="10" 
                  fontWeight="black" 
                  textAnchor="end"
                >
                  {thickness}mm
                </text>
              </svg>
            ) : (
              <p className="text-sm text-slate-400 italic">Please enter positive dimensions for preview.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Column */}
      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="font-headline text-lg text-slate-100 flex items-center gap-2">
              Slab Material Summary
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">Based on mix and wastage factors.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Primary Volume / Area */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Slab Area</span>
                <p className="text-xl font-black text-slate-100 mt-1">{calculations.area.toFixed(2)} m²</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Concrete Volume</span>
                <p className="text-xl font-black text-sky-400 mt-1">{calculations.wetVolume.toFixed(3)} m³</p>
              </div>
            </div>

            <Separator className="bg-slate-800" />

            {/* Real-time materials results list */}
            <div className="space-y-4">
              {/* Cement */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-sky-500/20 text-sky-400 p-2 rounded-lg font-bold text-xs uppercase">CEM</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">Cement (50kg bags)</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Standard structural grade</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-100">{calculations.cementBags}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">bags</span>
                </div>
              </div>

              {/* Sand */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg font-bold text-xs uppercase">SND</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">Sand</h4>
                    <p className="text-[10px] text-slate-500 font-medium">≈ {calculations.sandWheelbarrows} wheelbarrows</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-100">{calculations.sandTonnes.toFixed(2)}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">tonnes</span>
                </div>
              </div>

              {/* Ballast */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg font-bold text-xs uppercase">BLS</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">Ballast / Aggregate</h4>
                    <p className="text-[10px] text-slate-500 font-medium">≈ {calculations.ballastWheelbarrows} wheelbarrows</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-100">{calculations.ballastTonnes.toFixed(2)}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">tonnes</span>
                </div>
              </div>

              {/* BRC */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 text-red-400 p-2 rounded-lg font-bold text-xs uppercase">BRC</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">BRC Mesh A98</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Fabric roll (2.4m x 48m)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-100">{calculations.brcRolls}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">rolls</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-950 border-t border-slate-800/80 p-4">
            <Button
              onClick={() => setIsDownloadOpen(true)}
              className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold h-12 shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              disabled={calculations.area === 0}
            >
              <Download className="h-5 w-5" /> Download Estimate Receipt
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Customer Information Dialog for PDF Download */}
      <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
        <DialogContent className="max-w-md bg-white text-slate-800 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Download className="h-5 w-5 text-sky-500" /> Download Estimate Receipt
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide project details to personalize the materials receipt. Or leave blank to download.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-xs font-bold text-slate-600">Client Name</Label>
                <Input 
                  id="clientName" 
                  value={clientInfo.clientName} 
                  onChange={handleInputChange} 
                  placeholder="e.g. John Doe"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientContact" className="text-xs font-bold text-slate-600">Client Contact</Label>
                <Input 
                  id="clientContact" 
                  value={clientInfo.clientContact} 
                  onChange={handleInputChange} 
                  placeholder="e.g. +254 7..."
                  className="h-10 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="projectName" className="text-xs font-bold text-slate-600">Project / Site Name</Label>
              <Input 
                id="projectName" 
                value={clientInfo.projectName} 
                onChange={handleInputChange} 
                placeholder="e.g. Residential Slab Casting"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="projectLocation" className="text-xs font-bold text-slate-600">Project Location</Label>
              <Input 
                id="projectLocation" 
                value={clientInfo.projectLocation} 
                onChange={handleInputChange} 
                placeholder="e.g. Juja, Kiambu"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPerson" className="text-xs font-bold text-slate-600">Site Contact Person</Label>
              <Input 
                id="contactPerson" 
                value={clientInfo.contactPerson} 
                onChange={handleInputChange} 
                placeholder="e.g. Site Supervisor"
                className="h-10 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="font-bold border-slate-200">Cancel</Button>
            </DialogClose>
            <Button onClick={handleDownload} className="bg-sky-500 hover:bg-sky-600 text-white font-bold">
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
