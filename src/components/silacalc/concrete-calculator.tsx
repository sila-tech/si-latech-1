'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Download, Construction, Ruler, Layers, Scale, Sparkles, Box, Info } from 'lucide-react';
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

  // Structure Type Selection
  const [structureType, setStructureType] = useState<'slab' | 'beam' | 'column' | 'general'>('slab');

  // Dimension Unit System
  const [unit, setUnit] = useState<'m' | 'ft' | 'mm'>('m');

  // Slab inputs
  const [length, setLength] = useState<number>(10);
  const [width, setWidth] = useState<number>(10);
  const [thickness, setThickness] = useState<number>(150); // mm

  // Beam / Lintel inputs
  const [beamLength, setBeamLength] = useState<number>(20);
  const [beamWidth, setBeamWidth] = useState<number>(200);   // mm
  const [beamHeight, setBeamHeight] = useState<number>(300); // mm

  // Column / Pillar inputs
  const [columnQty, setColumnQty] = useState<number>(10);
  const [columnWidth, setColumnWidth] = useState<number>(200);  // mm
  const [columnDepth, setColumnDepth] = useState<number>(200);  // mm
  const [columnHeight, setColumnHeight] = useState<number>(3.0); // m

  // General Volume inputs
  const [generalVolume, setGeneralVolume] = useState<number>(5.0); // m³

  // Shared settings
  const [wastage, setWastage] = useState<number>(10); // %
  const [mixPreset, setMixPreset] = useState<string>('class20');
  
  // Custom Mix Ratio parts
  const [customCement, setCustomCement] = useState<number>(1);
  const [customSand, setCustomSand] = useState<number>(2);
  const [customBallast, setCustomBallast] = useState<number>(4);

  // Handle unit conversion to prevent losing progress
  const handleUnitChange = (newUnit: 'm' | 'ft' | 'mm') => {
    if (newUnit === unit) return;

    if (unit === 'm' && newUnit === 'ft') {
      setLength(Number((length * 3.28084).toFixed(2)));
      setWidth(Number((width * 3.28084).toFixed(2)));
      setThickness(Number((thickness / 25.4).toFixed(1)));

      setBeamLength(Number((beamLength * 3.28084).toFixed(2)));
      setBeamWidth(Number((beamWidth / 25.4).toFixed(1)));
      setBeamHeight(Number((beamHeight / 25.4).toFixed(1)));

      setColumnWidth(Number((columnWidth / 25.4).toFixed(1)));
      setColumnDepth(Number((columnDepth / 25.4).toFixed(1)));
      setColumnHeight(Number((columnHeight * 3.28084).toFixed(2)));

      setGeneralVolume(Number((generalVolume * 35.3147).toFixed(2)));
    } else if (unit === 'm' && newUnit === 'mm') {
      setLength(Number((length * 1000).toFixed(0)));
      setWidth(Number((width * 1000).toFixed(0)));

      setBeamLength(Number((beamLength * 1000).toFixed(0)));

      setColumnHeight(Number((columnHeight * 1000).toFixed(0)));
    } else if (unit === 'ft' && newUnit === 'm') {
      setLength(Number((length / 3.28084).toFixed(2)));
      setWidth(Number((width / 3.28084).toFixed(2)));
      setThickness(Number((thickness * 25.4).toFixed(0)));

      setBeamLength(Number((beamLength / 3.28084).toFixed(2)));
      setBeamWidth(Number((beamWidth * 25.4).toFixed(0)));
      setBeamHeight(Number((beamHeight * 25.4).toFixed(0)));

      setColumnWidth(Number((columnWidth * 25.4).toFixed(0)));
      setColumnDepth(Number((columnDepth * 25.4).toFixed(0)));
      setColumnHeight(Number((columnHeight / 3.28084).toFixed(2)));

      setGeneralVolume(Number((generalVolume / 35.3147).toFixed(2)));
    } else if (unit === 'ft' && newUnit === 'mm') {
      setLength(Number((length * 304.8).toFixed(0)));
      setWidth(Number((width * 304.8).toFixed(0)));
      setThickness(Number((thickness * 25.4).toFixed(0)));

      setBeamLength(Number((beamLength * 304.8).toFixed(0)));
      setBeamWidth(Number((beamWidth * 25.4).toFixed(0)));
      setBeamHeight(Number((beamHeight * 25.4).toFixed(0)));

      setColumnWidth(Number((columnWidth * 25.4).toFixed(0)));
      setColumnDepth(Number((columnDepth * 25.4).toFixed(0)));
      setColumnHeight(Number((columnHeight * 304.8).toFixed(0)));

      setGeneralVolume(Number((generalVolume / 35.3147).toFixed(2)));
    } else if (unit === 'mm' && newUnit === 'm') {
      setLength(Number((length / 1000).toFixed(2)));
      setWidth(Number((width / 1000).toFixed(2)));

      setBeamLength(Number((beamLength / 1000).toFixed(2)));

      setColumnHeight(Number((columnHeight / 1000).toFixed(2)));
    } else if (unit === 'mm' && newUnit === 'ft') {
      setLength(Number((length / 304.8).toFixed(2)));
      setWidth(Number((width / 304.8).toFixed(2)));
      setThickness(Number((thickness / 25.4).toFixed(1)));

      setBeamLength(Number((beamLength / 304.8).toFixed(2)));
      setBeamWidth(Number((beamWidth / 25.4).toFixed(1)));
      setBeamHeight(Number((beamHeight / 25.4).toFixed(1)));

      setColumnWidth(Number((columnWidth / 25.4).toFixed(1)));
      setColumnDepth(Number((columnDepth / 25.4).toFixed(1)));
      setColumnHeight(Number((columnHeight / 304.8).toFixed(2)));

      setGeneralVolume(Number((generalVolume * 35.3147).toFixed(2)));
    }

    setUnit(newUnit);
  };

  // Client info for quote download
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
    let wetVolume = 0;
    let area = 0;

    // Convert inputs to meters based on the selected unit
    let L_m = 0;
    let W_m = 0;
    let T_m = 0; // slab thickness in meters
    let H_m = 0; // beam height or column height in meters
    let D_m = 0; // column depth in meters

    if (unit === 'ft') {
      L_m = Math.max(0, length * 0.3048);
      W_m = Math.max(0, width * 0.3048);
      T_m = Math.max(0, thickness * 0.0254); // thickness in inches

      // beam
      const beamL_m = Math.max(0, beamLength * 0.3048);
      const beamW_m = Math.max(0, beamWidth * 0.0254); // width in inches
      const beamH_m = Math.max(0, beamHeight * 0.0254); // height in inches

      // column
      const colW_m = Math.max(0, columnWidth * 0.0254); // width in inches
      const colD_m = Math.max(0, columnDepth * 0.0254); // depth in inches
      const colH_m = Math.max(0, columnHeight * 0.3048);

      if (structureType === 'slab') {
        area = L_m * W_m;
        wetVolume = area * T_m;
      } else if (structureType === 'beam') {
        area = beamL_m * beamW_m;
        wetVolume = beamL_m * beamW_m * beamH_m;
      } else if (structureType === 'column') {
        area = colW_m * colD_m * Math.max(0, columnQty);
        wetVolume = Math.max(0, columnQty) * colW_m * colD_m * colH_m;
      } else if (structureType === 'general') {
        wetVolume = Math.max(0, generalVolume * 0.028316846592); // cubic feet to cubic meters
      }
    } else if (unit === 'mm') {
      L_m = Math.max(0, length / 1000);
      W_m = Math.max(0, width / 1000);
      T_m = Math.max(0, thickness / 1000);

      // beam
      const beamL_m = Math.max(0, beamLength / 1000);
      const beamW_m = Math.max(0, beamWidth / 1000);
      const beamH_m = Math.max(0, beamHeight / 1000);

      // column
      const colW_m = Math.max(0, columnWidth / 1000);
      const colD_m = Math.max(0, columnDepth / 1000);
      const colH_m = Math.max(0, columnHeight / 1000);

      if (structureType === 'slab') {
        area = L_m * W_m;
        wetVolume = area * T_m;
      } else if (structureType === 'beam') {
        area = beamL_m * beamW_m;
        wetVolume = beamL_m * beamW_m * beamH_m;
      } else if (structureType === 'column') {
        area = colW_m * colD_m * Math.max(0, columnQty);
        wetVolume = Math.max(0, columnQty) * colW_m * colD_m * colH_m;
      } else if (structureType === 'general') {
        wetVolume = Math.max(0, generalVolume);
      }
    } else {
      // Metric 'm'
      L_m = Math.max(0, length);
      W_m = Math.max(0, width);
      T_m = Math.max(0, thickness / 1000); // thickness is mm

      // beam
      const beamL_m = Math.max(0, beamLength);
      const beamW_m = Math.max(0, beamWidth / 1000);
      const beamH_m = Math.max(0, beamHeight / 1000);

      // column
      const colW_m = Math.max(0, columnWidth / 1000);
      const colD_m = Math.max(0, columnDepth / 1000);
      const colH_m = Math.max(0, columnHeight);

      if (structureType === 'slab') {
        area = L_m * W_m;
        wetVolume = area * T_m;
      } else if (structureType === 'beam') {
        area = beamL_m * beamW_m;
        wetVolume = beamL_m * beamW_m * beamH_m;
      } else if (structureType === 'column') {
        area = colW_m * colD_m * Math.max(0, columnQty);
        wetVolume = Math.max(0, columnQty) * colW_m * colD_m * colH_m;
      } else if (structureType === 'general') {
        wetVolume = Math.max(0, generalVolume);
      }
    }

    const W_factor = 1 + (Math.max(0, wastage) / 100);
    const dryVolume = wetVolume * DENSITIES.dryVolumeFactor;

    const cRatio = Math.max(0, customCement);
    const sRatio = Math.max(0, customSand);
    const bRatio = Math.max(0, customBallast);
    const totalParts = cRatio + sRatio + bRatio;

    if (totalParts === 0 || wetVolume === 0) {
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

    // BRC Mesh rolls (only for Slabs)
    let brcRolls = 0;
    if (structureType === 'slab') {
      const brcAreaPerRoll = DENSITIES.brcRollWidth * DENSITIES.brcRollLength;
      brcRolls = Math.ceil(area / brcAreaPerRoll);
    }

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
  }, [
    structureType,
    unit,
    length, width, thickness,
    beamLength, beamWidth, beamHeight,
    columnQty, columnWidth, columnDepth, columnHeight,
    generalVolume,
    wastage, customCement, customSand, customBallast
  ]);

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

    // Contacts
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Head Office: Juja, Kenya', 140, 16);
    doc.text('Tel: +254 141 981 315', 140, 21);
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

    // Structure info sub-header
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    
    let structureLabel = 'GENERAL CONCRETE ESTIMATE';
    let dimensionsText = '';
    
    if (structureType === 'slab') {
      structureLabel = 'STRUCTURE TYPE: CONCRETE SLAB / FLOOR';
      if (unit === 'ft') {
        const L_m = length * 0.3048;
        const W_m = width * 0.3048;
        const T_mm = thickness * 25.4;
        dimensionsText = `Length: ${length.toFixed(2)} ft (${L_m.toFixed(2)} m) | Width: ${width.toFixed(2)} ft (${W_m.toFixed(2)} m) | Thickness: ${thickness.toFixed(1)} in (${T_mm.toFixed(0)} mm) | Area: ${(length * width).toFixed(2)} sq.ft (${calculations.area.toFixed(2)} sq.m)`;
      } else if (unit === 'mm') {
        const L_m = length / 1000;
        const W_m = width / 1000;
        dimensionsText = `Length: ${length.toFixed(0)} mm (${L_m.toFixed(2)} m) | Width: ${width.toFixed(0)} mm (${W_m.toFixed(2)} m) | Thickness: ${thickness.toFixed(0)} mm | Area: ${calculations.area.toFixed(2)} sq.m`;
      } else {
        dimensionsText = `Length: ${length.toFixed(2)} m | Width: ${width.toFixed(2)} m | Thickness: ${thickness} mm | Area: ${calculations.area.toFixed(2)} sq.m`;
      }
    } else if (structureType === 'beam') {
      structureLabel = 'STRUCTURE TYPE: RING BEAM / LINTEL';
      if (unit === 'ft') {
        const L_m = beamLength * 0.3048;
        const W_mm = beamWidth * 25.4;
        const H_mm = beamHeight * 25.4;
        dimensionsText = `Total Length: ${beamLength.toFixed(2)} ft (${L_m.toFixed(2)} m) | Width: ${beamWidth.toFixed(1)} in (${W_mm.toFixed(0)} mm) | Height: ${beamHeight.toFixed(1)} in (${H_mm.toFixed(0)} mm)`;
      } else if (unit === 'mm') {
        const L_m = beamLength / 1000;
        dimensionsText = `Total Length: ${beamLength.toFixed(0)} mm (${L_m.toFixed(2)} m) | Width: ${beamWidth.toFixed(0)} mm | Height: ${beamHeight.toFixed(0)} mm`;
      } else {
        dimensionsText = `Total Length: ${beamLength.toFixed(2)} m | Width: ${beamWidth} mm | Height: ${beamHeight} mm`;
      }
    } else if (structureType === 'column') {
      structureLabel = 'STRUCTURE TYPE: COLUMNS / PILLARS';
      if (unit === 'ft') {
        const L_mm = columnWidth * 25.4;
        const W_mm = columnDepth * 25.4;
        const H_m = columnHeight * 0.3048;
        dimensionsText = `Quantity: ${columnQty} pcs | Section: ${columnWidth.toFixed(1)}x${columnDepth.toFixed(1)} in (${L_mm.toFixed(0)}x${W_mm.toFixed(0)} mm) | Height: ${columnHeight.toFixed(2)} ft (${H_m.toFixed(2)} m)`;
      } else if (unit === 'mm') {
        const H_m = columnHeight / 1000;
        dimensionsText = `Quantity: ${columnQty} pcs | Section: ${columnWidth.toFixed(0)}x${columnDepth.toFixed(0)} mm | Height: ${columnHeight.toFixed(0)} mm (${H_m.toFixed(2)} m)`;
      } else {
        dimensionsText = `Quantity: ${columnQty} pcs | Section: ${columnWidth}x${columnDepth} mm | Height: ${columnHeight.toFixed(2)} m`;
      }
    } else if (structureType === 'general') {
      structureLabel = 'STRUCTURE TYPE: GENERAL VOLUME';
      if (unit === 'ft') {
        const V_m = generalVolume * 0.028316846592;
        dimensionsText = `Direct Concrete Input Volume: ${generalVolume.toFixed(2)} cu.ft (${V_m.toFixed(2)} cu.m)`;
      } else {
        dimensionsText = `Direct Concrete Input Volume: ${generalVolume.toFixed(2)} cu.m`;
      }
    }

    doc.text(structureLabel, 14, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(dimensionsText, 14, currentY);
    currentY += 5;
    doc.text(`Wet Concrete Volume: ${calculations.wetVolume.toFixed(3)} cu.m  |  Dry Volume (1.54 Factor): ${calculations.dryVolume.toFixed(3)} cu.m`, 14, currentY);
    currentY += 8;

    // Mix Proportions Sub-header
    const mixText = mixPreset === 'class20' ? 'Class 20 (1:2:4)' : 
                    mixPreset === 'class25' ? 'Class 25 (1:1.5:3)' : 
                    mixPreset === 'class30' ? 'Class 30 (1:1:2)' : 'Custom Mix';
    doc.text(`Mix Design: ${mixText} | Wastage Allowance: ${wastage}%`, 14, currentY);
    currentY += 8;

    // Table rows setup
    const tableRows = [
      [
        'Cement (50kg bags)', 
        calculations.cementBags.toString(), 
        'Bags', 
        `Standard 50kg bags. Mix ratio parts: ${customCement}.`
      ],
      [
        'Sand', 
        calculations.sandTonnes.toFixed(2), 
        'Tonnes', 
        `River sand. Approx. ${calculations.sandWheelbarrows} wheelbarrows. Mix ratio parts: ${customSand}.`
      ],
      [
        'Ballast / Coarse Aggregate', 
        calculations.ballastTonnes.toFixed(2), 
        'Tonnes', 
        `Crushed stones. Approx. ${calculations.ballastWheelbarrows} wheelbarrows. Mix ratio parts: ${customBallast}.`
      ]
    ];

    if (structureType === 'slab') {
      tableRows.push([
        'BRC Mesh A98',
        calculations.brcRolls.toString(),
        'Rolls',
        '2.4m x 48m reinforcement fabric rolls for slab reinforcement.'
      ]);
    }

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
    doc.text('Call or WhatsApp us at +254 141 981 315 today!', 14, finalY);

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

  // Adaptive 3D Visualizer coordinates
  const renderVisualizer = () => {
    const x0 = 200, y0 = 130; // Center coordinate origin

    if (structureType === 'slab') {
      const maxVal = Math.max(length, width);
      const lScale = maxVal > 0 ? Math.min(130, Math.max(40, (length / maxVal) * 110)) : 80;
      const wScale = maxVal > 0 ? Math.min(130, Math.max(40, (width / maxVal) * 110)) : 80;
      const tScale = Math.min(25, Math.max(4, (thickness / 300) * 18));

      const p0 = { x: x0, y: y0 + 30 };
      const p1 = { x: x0 + lScale * 0.866, y: y0 + 30 + lScale * 0.5 };
      const p2 = { x: x0 - wScale * 0.866, y: y0 + 30 + wScale * 0.5 };
      const p3 = { x: x0 + (lScale - wScale) * 0.866, y: y0 + 30 + (lScale + wScale) * 0.5 };

      const t0 = { x: p0.x, y: p0.y - tScale };
      const t1 = { x: p1.x, y: p1.y - tScale };
      const t2 = { x: p2.x, y: p2.y - tScale };
      const t3 = { x: p3.x, y: p3.y - tScale };

      const lengthUnit = unit === 'ft' ? 'ft' : unit === 'mm' ? 'mm' : 'm';
      const widthUnit = unit === 'ft' ? 'ft' : unit === 'mm' ? 'mm' : 'm';
      const thicknessUnit = unit === 'ft' ? 'in' : 'mm';

      return (
        <svg width="100%" height="220" viewBox="0 0 400 240" className="max-w-md filter drop-shadow-md overflow-visible">
          {/* Back hidden outline */}
          <path d={`M ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p1.x} ${p1.y}`} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={p3.x} y1={p3.y} x2={t3.x} y2={t3.y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />

          {/* Left Wall */}
          <polygon points={`${p2.x},${p2.y} ${t2.x},${t2.y} ${t0.x},${t0.y} ${p0.x},${p0.y}`} fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Right Wall */}
          <polygon points={`${p0.x},${p0.y} ${t0.x},${t0.y} ${t1.x},${t1.y} ${p1.x},${p1.y}`} fill="#475569" stroke="#334155" strokeWidth="1.5" />
          {/* Top Wall */}
          <polygon points={`${t0.x},${t0.y} ${t1.x},${t1.y} ${t3.x},${t3.y} ${t2.x},${t2.y}`} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Labels */}
          <text x={(p0.x + p1.x) / 2 + 10} y={(p0.y + p1.y) / 2 + 15} fill="#334155" fontSize="11" fontWeight="bold" textAnchor="middle">Length: {length}{lengthUnit}</text>
          <text x={(p0.x + p2.x) / 2 - 10} y={(p0.y + p2.y) / 2 + 15} fill="#334155" fontSize="11" fontWeight="bold" textAnchor="middle">Width: {width}{widthUnit}</text>
          <text x={p0.x - 22} y={(p0.y + t0.y) / 2 + 4} fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="end">{thickness}{thicknessUnit}</text>
          <line x1={p0.x - 15} y1={p0.y} x2={p0.x - 15} y2={t0.y} stroke="#ef4444" strokeWidth="1.5" />
        </svg>
      );
    } else if (structureType === 'beam') {
      const maxL = Math.max(beamLength, 1);
      const lScale = Math.min(160, Math.max(60, (beamLength / maxL) * 140));
      const wScale = Math.min(30, Math.max(12, (beamWidth / 400) * 20));
      const hScale = Math.min(35, Math.max(12, (beamHeight / 400) * 25));

      const p0 = { x: x0 - 40, y: y0 + 30 };
      const p1 = { x: p0.x + lScale * 0.866, y: p0.y + lScale * 0.5 };
      const p2 = { x: p0.x - wScale * 0.866, y: p0.y + wScale * 0.5 };
      const p3 = { x: p0.x + (lScale - wScale) * 0.866, y: p0.y + (lScale + wScale) * 0.5 };

      const t0 = { x: p0.x, y: p0.y - hScale };
      const t1 = { x: p1.x, y: p1.y - hScale };
      const t2 = { x: p2.x, y: p2.y - hScale };
      const t3 = { x: p3.x, y: p3.y - hScale };

      const lengthUnit = unit === 'ft' ? 'ft' : unit === 'mm' ? 'mm' : 'm';
      const sizeUnit = unit === 'ft' ? 'in' : 'mm';

      return (
        <svg width="100%" height="220" viewBox="0 0 400 240" className="max-w-md filter drop-shadow-md overflow-visible">
          <path d={`M ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p1.x} ${p1.y}`} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={p3.x} y1={p3.y} x2={t3.x} y2={t3.y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />

          {/* Left/Front-width face */}
          <polygon points={`${p2.x},${p2.y} ${t2.x},${t2.y} ${t0.x},${t0.y} ${p0.x},${p0.y}`} fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Right/Longitudinal face */}
          <polygon points={`${p0.x},${p0.y} ${t0.x},${t0.y} ${t1.x},${t1.y} ${p1.x},${p1.y}`} fill="#475569" stroke="#334155" strokeWidth="1.5" />
          {/* Top surface */}
          <polygon points={`${t0.x},${t0.y} ${t1.x},${t1.y} ${t3.x},${t3.y} ${t2.x},${t2.y}`} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Labels */}
          <text x={(p0.x + p1.x) / 2 + 10} y={(p0.y + p1.y) / 2 + 18} fill="#334155" fontSize="11" fontWeight="bold" textAnchor="middle">Length: {beamLength}{lengthUnit}</text>
          <text x={(p0.x + p2.x) / 2 - 15} y={(p0.y + p2.y) / 2 + 15} fill="#334155" fontSize="10" fontWeight="bold" textAnchor="middle">W: {beamWidth}{sizeUnit}</text>
          <text x={p0.x - 12} y={(p0.y + t0.y) / 2 + 4} fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="end">{beamHeight}{sizeUnit}</text>
          <line x1={p0.x - 5} y1={p0.y} x2={p0.x - 5} y2={t0.y} stroke="#ef4444" strokeWidth="1.5" />
        </svg>
      );
    } else if (structureType === 'column') {
      const wScale = Math.min(45, Math.max(15, (columnWidth / 400) * 35));
      const dScale = Math.min(45, Math.max(15, (columnDepth / 400) * 35));
      const hScale = Math.min(140, Math.max(60, (columnHeight / 6) * 110));

      const p0 = { x: x0, y: y0 + 60 };
      const p1 = { x: p0.x + dScale * 0.866, y: p0.y + dScale * 0.5 };
      const p2 = { x: p0.x - wScale * 0.866, y: p0.y + wScale * 0.5 };
      const p3 = { x: p0.x + (dScale - wScale) * 0.866, y: p0.y + (dScale + wScale) * 0.5 };

      const t0 = { x: p0.x, y: p0.y - hScale };
      const t1 = { x: p1.x, y: p1.y - hScale };
      const t2 = { x: p2.x, y: p2.y - hScale };
      const t3 = { x: p3.x, y: p3.y - hScale };

      const sizeUnit = unit === 'ft' ? 'in' : 'mm';
      const heightUnit = unit === 'ft' ? 'ft' : unit === 'mm' ? 'mm' : 'm';

      return (
        <svg width="100%" height="220" viewBox="0 0 400 240" className="max-w-md filter drop-shadow-md overflow-visible">
          <path d={`M ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p1.x} ${p1.y}`} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={p3.x} y1={p3.y} x2={t3.x} y2={t3.y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />

          {/* Left front pillar side */}
          <polygon points={`${p2.x},${p2.y} ${t2.x},${t2.y} ${t0.x},${t0.y} ${p0.x},${p0.y}`} fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Right front pillar side */}
          <polygon points={`${p0.x},${p0.y} ${t0.x},${t0.y} ${t1.x},${t1.y} ${p1.x},${p1.y}`} fill="#475569" stroke="#334155" strokeWidth="1.5" />
          {/* Top pillar cap */}
          <polygon points={`${t0.x},${t0.y} ${t1.x},${t1.y} ${t3.x},${t3.y} ${t2.x},${t2.y}`} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Labels */}
          <text x={(p0.x + p1.x) / 2 + 10} y={(p0.y + p1.y) / 2 + 15} fill="#334155" fontSize="9" fontWeight="bold" textAnchor="middle">D: {columnDepth}{sizeUnit}</text>
          <text x={(p0.x + p2.x) / 2 - 10} y={(p0.y + p2.y) / 2 + 15} fill="#334155" fontSize="9" fontWeight="bold" textAnchor="middle">W: {columnWidth}{sizeUnit}</text>
          <text x={p0.x - 15} y={(p0.y + t0.y) / 2 + 4} fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="end">H: {columnHeight}{heightUnit}</text>
          <line x1={p0.x - 7} y1={p0.y} x2={p0.x - 7} y2={t0.y} stroke="#ef4444" strokeWidth="1.5" />
          <text x={x0} y={230} fill="#64748b" fontSize="11" fontWeight="black" textAnchor="middle">Quantity: {columnQty} Columns</text>
        </svg>
      );
    } else {
      // General Cube Visualizer
      const size = 70;
      const p0 = { x: x0, y: y0 + 35 };
      const p1 = { x: p0.x + size * 0.866, y: p0.y + size * 0.5 };
      const p2 = { x: p0.x - size * 0.866, y: p0.y + size * 0.5 };
      const p3 = { x: p0.x, y: p0.y + size };

      const t0 = { x: p0.x, y: p0.y - size };
      const t1 = { x: p1.x, y: p1.y - size };
      const t2 = { x: p2.x, y: p2.y - size };
      const t3 = { x: p3.x, y: p3.y - size };

      const volumeUnit = unit === 'ft' ? ' ft³' : ' m³';

      return (
        <svg width="100%" height="220" viewBox="0 0 400 240" className="max-w-md filter drop-shadow-md overflow-visible">
          <polygon points={`${p2.x},${p2.y} ${t2.x},${t2.y} ${t0.x},${t0.y} ${p0.x},${p0.y}`} fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          <polygon points={`${p0.x},${p0.y} ${t0.x},${t0.y} ${t1.x},${t1.y} ${p1.x},${p1.y}`} fill="#475569" stroke="#334155" strokeWidth="1.5" />
          <polygon points={`${t0.x},${t0.y} ${t1.x},${t1.y} ${t3.x},${t3.y} ${t2.x},${t2.y}`} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
          <text x={x0} y={y0 + 20} fill="#1e293b" fontSize="12" fontWeight="black" textAnchor="middle">Volume: {generalVolume.toFixed(2)}{volumeUnit}</text>
        </svg>
      );
    }
  };

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
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-slate-900 font-headline">Concrete Structure Type</CardTitle>
                <CardDescription className="text-xs">Select what you are concreting to adjust calculations.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Structure Switcher Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'slab', label: 'Slab / Floor' },
                { type: 'beam', label: 'Ring Beam / Lintel' },
                { type: 'column', label: 'Column / Pillar' },
                { type: 'general', label: 'Custom Volume' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setStructureType(item.type as any)}
                  className={`py-3 px-2 text-xs font-black rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                    structureType === item.type
                      ? 'border-sky-500 bg-sky-50/30 text-sky-700 shadow-xs'
                      : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-white'
                  }`}
                >
                  <Box className={`h-4.5 w-4.5 ${structureType === item.type ? 'text-sky-500' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              ))}
            </div>

            <Separator />

            {/* Unit Selector Toggle */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Dimension Unit System</Label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start inline-flex">
                {[
                  { id: 'm', label: 'Metric (m / mm)' },
                  { id: 'ft', label: 'Imperial (ft / in)' },
                  { id: 'mm', label: 'Millimeters (mm)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleUnitChange(item.id as any)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                      unit === item.id
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Dynamic Dimension Fields depending on structure type */}
            {structureType === 'slab' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Slab Dimensions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="length" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Ruler className="h-4 w-4 text-sky-500" /> Length ({unit === 'ft' ? 'feet' : unit === 'mm' ? 'mm' : 'meters'})
                    </Label>
                    <Input
                      id="length"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={length}
                      onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(length * 0.3048).toFixed(2)} meters` 
                        : unit === 'mm' 
                          ? `≈ ${(length / 1000).toFixed(2)} meters` 
                          : `≈ ${(length * 3.28084).toFixed(1)} feet`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="width" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Ruler className="h-4 w-4 text-sky-500 rotate-90" /> Width ({unit === 'ft' ? 'feet' : unit === 'mm' ? 'mm' : 'meters'})
                    </Label>
                    <Input
                      id="width"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={width}
                      onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(width * 0.3048).toFixed(2)} meters` 
                        : unit === 'mm' 
                          ? `≈ ${(width / 1000).toFixed(2)} meters` 
                          : `≈ ${(width * 3.28084).toFixed(1)} feet`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thickness" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-sky-500" /> Thickness ({unit === 'ft' ? 'inches' : 'mm'})
                    </Label>
                    <Input
                      id="thickness"
                      type="number"
                      min="0.1"
                      step={unit === 'ft' ? '0.5' : '5'}
                      value={thickness}
                      onChange={(e) => setThickness(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(thickness * 25.4).toFixed(1)} mm` 
                        : `= ${(thickness / 1000).toFixed(3)} meters`}
                    </span>
                  </div>
                </div>
                
                {/* Presets */}
                <div className="flex gap-2">
                  {(unit === 'ft' ? [4, 5, 6, 8] : [100, 150, 200, 250]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setThickness(t)}
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        thickness === t 
                          ? 'bg-sky-500 text-white border-sky-500' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t} {unit === 'ft' ? 'in' : 'mm'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {structureType === 'beam' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Ring Beam / Lintel Dimensions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="beamLength" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Ruler className="h-4 w-4 text-sky-500" /> Total Length ({unit === 'ft' ? 'feet' : unit === 'mm' ? 'mm' : 'meters'})
                    </Label>
                    <Input
                      id="beamLength"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={beamLength}
                      onChange={(e) => setBeamLength(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(beamLength * 0.3048).toFixed(2)} meters` 
                        : unit === 'mm' 
                          ? `≈ ${(beamLength / 1000).toFixed(2)} meters` 
                          : `≈ ${(beamLength * 3.28084).toFixed(1)} feet`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beamWidth" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Ruler className="h-4 w-4 text-sky-500 rotate-90" /> Width ({unit === 'ft' ? 'inches' : 'mm'})
                    </Label>
                    <Input
                      id="beamWidth"
                      type="number"
                      min="0.1"
                      step={unit === 'ft' ? '0.5' : '10'}
                      value={beamWidth}
                      onChange={(e) => setBeamWidth(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(beamWidth * 25.4).toFixed(1)} mm` 
                        : `= ${(beamWidth / 1000).toFixed(3)} m`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beamHeight" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-sky-500" /> Height ({unit === 'ft' ? 'inches' : 'mm'})
                    </Label>
                    <Input
                      id="beamHeight"
                      type="number"
                      min="0.1"
                      step={unit === 'ft' ? '0.5' : '10'}
                      value={beamHeight}
                      onChange={(e) => setBeamHeight(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(beamHeight * 25.4).toFixed(1)} mm` 
                        : `= ${(beamHeight / 1000).toFixed(3)} m`}
                    </span>
                  </div>
                </div>
                {/* Presets */}
                <div className="flex gap-2">
                  {(unit === 'ft' 
                    ? ['6x6', '6x9', '8x8', '8x12'] 
                    : ['200x200', '200x300', '150x225', '150x300']
                  ).map((dim) => {
                    const [w, h] = dim.split('x').map(Number);
                    return (
                      <button
                        key={dim}
                        type="button"
                        onClick={() => {
                          setBeamWidth(w);
                          setBeamHeight(h);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-full border ${
                          beamWidth === w && beamHeight === h
                            ? 'bg-sky-500 text-white border-sky-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {w}x{h} {unit === 'ft' ? 'in' : 'mm'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {structureType === 'column' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Column / Pillar Dimensions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="columnQty" className="text-sm font-bold text-slate-700">Quantity (pcs)</Label>
                    <Input
                      id="columnQty"
                      type="number"
                      min="1"
                      value={columnQty}
                      onChange={(e) => setColumnQty(parseInt(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="columnWidth" className="text-sm font-bold text-slate-700">Width ({unit === 'ft' ? 'inches' : 'mm'})</Label>
                    <Input
                      id="columnWidth"
                      type="number"
                      min="0.1"
                      step={unit === 'ft' ? '0.5' : '10'}
                      value={columnWidth}
                      onChange={(e) => setColumnWidth(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(columnWidth * 25.4).toFixed(1)} mm` 
                        : `= ${(columnWidth / 1000).toFixed(3)} m`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="columnDepth" className="text-sm font-bold text-slate-700">Depth ({unit === 'ft' ? 'inches' : 'mm'})</Label>
                    <Input
                      id="columnDepth"
                      type="number"
                      min="0.1"
                      step={unit === 'ft' ? '0.5' : '10'}
                      value={columnDepth}
                      onChange={(e) => setColumnDepth(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(columnDepth * 25.4).toFixed(1)} mm` 
                        : `= ${(columnDepth / 1000).toFixed(3)} m`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="columnHeight" className="text-sm font-bold text-slate-700">Height ({unit === 'ft' ? 'feet' : unit === 'mm' ? 'mm' : 'meters'})</Label>
                    <Input
                      id="columnHeight"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={columnHeight}
                      onChange={(e) => setColumnHeight(parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {unit === 'ft' 
                        ? `≈ ${(columnHeight * 0.3048).toFixed(2)} meters` 
                        : unit === 'mm' 
                          ? `≈ ${(columnHeight / 1000).toFixed(2)} meters` 
                          : `≈ ${(columnHeight * 3.28084).toFixed(1)} feet`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {structureType === 'general' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Direct Volume Input</h3>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="generalVolume" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Box className="h-4 w-4 text-sky-500" /> Concrete Volume ({unit === 'ft' ? 'cu.ft' : 'm³'})
                  </Label>
                  <Input
                    id="generalVolume"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={generalVolume}
                    onChange={(e) => setGeneralVolume(parseFloat(e.target.value) || 0)}
                    className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold text-lg"
                  />
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {unit === 'ft'
                      ? `≈ ${(generalVolume * 0.0283168).toFixed(2)} cubic meters. Ratios will apply directly.`
                      : `≈ ${(generalVolume * 35.3147).toFixed(1)} cubic feet. Ratios will apply directly.`}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            {/* Mix Design & Wastage section */}
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
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  >
                    <option value="class20">Class 20 (1:2:4) - Standard Slab/Beams</option>
                    <option value="class25">Class 25 (1:1.5:3) - Structural Columns</option>
                    <option value="class30">Class 30 (1:1:2) - Heavy Load Foundations</option>
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
                    className="bg-slate-50 border-slate-200 focus-visible:ring-sky-500 h-10 font-semibold"
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
            <CardTitle className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-sky-500" /> Structure 3D Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-6 bg-slate-900/5 select-none">
            {renderVisualizer()}
          </CardContent>
        </Card>
      </div>

      {/* Results Column */}
      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="font-headline text-lg text-slate-100 flex items-center gap-2">
              Estimation Summary
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">Volume and ingredients quantities.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Primary Volume & Area */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Wet Volume</span>
                <p className="text-lg font-black text-sky-400 mt-1">{calculations.wetVolume.toFixed(3)} m³</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Dry Volume</span>
                <p className="text-lg font-black text-slate-100 mt-1">{calculations.dryVolume.toFixed(3)} m³</p>
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
                    <p className="text-[10px] text-slate-500 font-medium">Standard 50kg bag packing</p>
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
                    <h4 className="text-xs font-bold text-slate-400">Sand (Fine Aggregate)</h4>
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
                    <h4 className="text-xs font-bold text-slate-400">Ballast (Aggregate)</h4>
                    <p className="text-[10px] text-slate-500 font-medium">≈ {calculations.ballastWheelbarrows} wheelbarrows</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-100">{calculations.ballastTonnes.toFixed(2)}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">tonnes</span>
                </div>
              </div>

              {/* BRC Mesh - Slab only */}
              {structureType === 'slab' && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/20 text-red-400 p-2 rounded-lg font-bold text-xs uppercase">BRC</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400">BRC Mesh A98</h4>
                      <p className="text-[10px] text-slate-500 font-medium">2.4m x 48m fabric rolls</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-100">{calculations.brcRolls}</span>
                    <span className="text-xs font-semibold text-slate-400 ml-1">rolls</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-950 border-t border-slate-800/80 p-4">
            <Button
              onClick={() => setIsDownloadOpen(true)}
              className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold h-12 shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              disabled={calculations.wetVolume === 0}
            >
              <Download className="h-5 w-5" /> Download Materials Receipt
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
                placeholder="e.g. Residential Construction"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="projectLocation" className="text-xs font-bold text-slate-600">Project Location</Label>
              <Input 
                id="projectLocation" 
                value={clientInfo.projectLocation} 
                onChange={handleInputChange} 
                placeholder="e.g. Karen, Nairobi"
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
