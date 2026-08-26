'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  HardHat, 
  Loader2, 
  UploadCloud, 
  Wand2, 
  Eye, 
  Trash2, 
  Plus, 
  Check, 
  Ruler, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Scale,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCalculator } from '@/context/calculator-context';
import { useFirebase } from '@/firebase';
import { analyzePlan } from '@/ai/flows/analyze-plan-flow';
import { BuildingBlock, ApartmentGroup } from '@/lib/calculator';
import { logBlueprintActiveLearning } from '@/firebase/blueprint-learning';
import type { PlanRoomData } from '@/firebase/data-manager';

/**
 * Enhanced client-side image processor:
 * Supports high-resolution CAD extraction (up to 3200px) with high-quality antialiased canvas
 * to preserve crisp dimension numerals and witness lines.
 */
const compressImage = (dataUri: string, maxWidth = 3200, maxHeight = 3200, quality = 0.90): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUri;
    img.onload = () => {
      if (dataUri.startsWith('data:application/pdf')) {
        resolve(dataUri);
        return;
      }

      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUri);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUri = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUri);
    };

    img.onerror = () => {
      resolve(dataUri);
    };
  });
};

export function PlanReaderCard() {
  const { firestore } = useFirebase();
  const { setRooms, setBuildingBlocks, planData, setPlanData } = useCalculator();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(planData?.imageUri || null);
  const [customNote, setCustomNote] = useState('');
  
  // Scale Calibration State (2-Point measurement)
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibPoints, setCalibPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [calibDistanceM, setCalibDistanceM] = useState<number>(0.9); // Default standard door width
  const [calibrationScale, setCalibrationScale] = useState<number | null>(planData?.scalePixelsPerMeter || null);
  
  // Review Modal States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [parsedRooms, setParsedRooms] = useState<PlanRoomData[]>(planData?.parsedRooms || []);
  const [originalAiRooms, setOriginalAiRooms] = useState<PlanRoomData[]>([]);
  const [detectedScale, setDetectedScale] = useState<string | undefined>(planData?.detectedScale);
  const [detectedUnits, setDetectedUnits] = useState<string | undefined>(planData?.detectedUnits);
  const [drawingSummary, setDrawingSummary] = useState<string | undefined>();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (planData?.imageUri) {
      setImageUri(planData.imageUri);
    }
    if (planData?.parsedRooms && planData.parsedRooms.length > 0) {
      setParsedRooms(planData.parsedRooms);
    }
    if (planData?.scalePixelsPerMeter) {
      setCalibrationScale(planData.scalePixelsPerMeter);
    }
    if (planData?.detectedScale) {
      setDetectedScale(planData.detectedScale);
    }
    if (planData?.detectedUnits) {
      setDetectedUnits(planData.detectedUnits);
    }
  }, [planData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCalibPoints([]);
      setIsCalibrating(false);

      toast({
        title: 'File Selected',
        description: `"${selectedFile.name}" ready for high-accuracy neural analysis.`,
      });

      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = () => {
        const uri = reader.result as string;
        setImageUri(uri);
        setPlanData(prev => ({ ...prev, imageUri: uri }));
      };
    }
  };

  // 2-Point Calibration Click Handler
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCalibrating || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);

    if (calibPoints.length === 0) {
      setCalibPoints([{ x, y }]);
      toast({
        title: 'Point 1 Placed',
        description: 'Now click Point 2 to complete the reference distance span.',
      });
    } else if (calibPoints.length === 1) {
      const p1 = calibPoints[0];
      const p2 = { x, y };
      setCalibPoints([p1, p2]);
      
      const pixelDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (pixelDistance < 5) {
        toast({
          title: 'Points too close',
          description: 'Please select two distinct points across a wall or doorway.',
          variant: 'destructive',
        });
        setCalibPoints([]);
        return;
      }

      const calculatedScale = Math.round((pixelDistance / (calibDistanceM || 0.9)) * 10) / 10;
      setCalibrationScale(calculatedScale);
      setIsCalibrating(false);

      toast({
        title: 'Scale Calibrated Successfully!',
        description: `Locked scale at ${calculatedScale} px/m based on ${calibDistanceM}m span.`,
      });
    }
  };

  const resetCalibration = () => {
    setCalibPoints([]);
    setCalibrationScale(null);
    setIsCalibrating(false);
    toast({
      title: 'Calibration Reset',
      description: 'Scale reverted to automatic AI detection mode.',
    });
  };

  const handleAnalyze = async () => {
    if (!file || !imageUri) {
      toast({
        title: 'No File Selected',
        description: 'Please upload a floor plan image or PDF blueprint.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: 'Neural Blueprint Analysis...',
      description: 'Parsing CAD geometry, scale calibration, and room spans with Gemini.',
    });

    try {
      const compressedUri = await compressImage(imageUri);
      const result = await analyzePlan({ 
        photoDataUri: compressedUri,
        calibrationScale: calibrationScale || undefined,
        customNote: customNote.trim() || undefined,
      });

      if (result.success && result.rooms && result.rooms.length > 0) {
        setParsedRooms(result.rooms as PlanRoomData[]);
        setOriginalAiRooms(result.rooms as PlanRoomData[]);
        setDetectedScale(result.detectedScale);
        setDetectedUnits(result.detectedUnits);
        setDrawingSummary(result.summary);

        setPlanData({
          imageUri: compressedUri,
          parsedRooms: result.rooms as PlanRoomData[],
          detectedScale: result.detectedScale,
          detectedUnits: result.detectedUnits,
          scalePixelsPerMeter: calibrationScale || undefined,
        });

        setIsReviewOpen(true);
        toast({
          title: 'Blueprint Parsed with ML Precision',
          description: `Extracted ${result.rooms.length} rooms (${result.detectedScale || 'Scale auto-fitted'}). Reviewing layout.`,
        });
      } else {
        throw new Error(result.error || 'No rooms were detected in the floor plan. Please ensure dimensions are visible.');
      }
    } catch (err) {
      console.error('Plan analysis failed:', err);
      toast({
        title: 'Blueprint Analysis Failed',
        description: err instanceof Error ? err.message : 'An unexpected response was received from the server.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateParsedRoom = (index: number, key: string, value: any) => {
    setParsedRooms(prev => prev.map((r, i) => {
      if (i !== index) return r;
      return { ...r, [key]: value };
    }));
  };

  const deleteParsedRoom = (index: number) => {
    setParsedRooms(prev => prev.filter((_, i) => i !== index));
    if (hoveredIndex === index) {
      setHoveredIndex(null);
    }
  };

  const addEmptyRoom = () => {
    setParsedRooms(prev => [
      ...prev,
      {
        name: 'New Room',
        length: 4.0,
        width: 3.0,
        blockName: 'Block 1',
        apartmentName: 'Unit 1',
        sequenceInApartment: prev.length + 1,
        boundingBox: [400, 400, 600, 600],
        confidence: 1.0,
      }
    ]);
  };

  const handleImport = async () => {
    if (parsedRooms.length === 0) {
      toast({
        title: 'Empty Rooms List',
        description: 'Please add at least one room before importing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tempRooms = parsedRooms.map(room => ({
        id: crypto.randomUUID(),
        name: room.name,
        length: room.length,
        width: room.width,
        blockId: undefined as string | undefined,
        apartmentId: undefined as string | undefined,
        _blockName: room.blockName,
        _aptName: room.apartmentName,
        _seq: room.sequenceInApartment ?? 999,
      }));

      const blocksMap = new Map<string, {
        id: string;
        name: string;
        apartmentsMap: Map<string, {
          id: string;
          name: string;
          rooms: typeof tempRooms;
        }>;
      }>();

      for (const r of tempRooms) {
        if (r._blockName) {
          if (!blocksMap.has(r._blockName)) {
            blocksMap.set(r._blockName, {
              id: crypto.randomUUID(),
              name: r._blockName,
              apartmentsMap: new Map(),
            });
          }
          const blockEntry = blocksMap.get(r._blockName)!;

          if (r._aptName) {
            if (!blockEntry.apartmentsMap.has(r._aptName)) {
              blockEntry.apartmentsMap.set(r._aptName, {
                id: crypto.randomUUID(),
                name: r._aptName,
                rooms: [],
              });
            }
            blockEntry.apartmentsMap.get(r._aptName)!.rooms.push(r);
          }
        }
      }

      const buildingBlocks: BuildingBlock[] = [];
      for (const blockEntry of blocksMap.values()) {
        const apartments: ApartmentGroup[] = [];

        for (const aptEntry of blockEntry.apartmentsMap.values()) {
          aptEntry.rooms.sort((a, b) => a._seq - b._seq);

          for (const r of aptEntry.rooms) {
            r.blockId = blockEntry.id;
            r.apartmentId = aptEntry.id;
          }

          apartments.push({
            id: aptEntry.id,
            name: aptEntry.name,
            roomIds: aptEntry.rooms.map(r => r.id),
          });
        }

        buildingBlocks.push({
          id: blockEntry.id,
          name: blockEntry.name,
          apartments,
        });
      }

      const cleanedRooms = tempRooms.map(({ _blockName, _aptName, _seq, ...rest }) => rest);

      setRooms(cleanedRooms);
      setBuildingBlocks(buildingBlocks);
      setPlanData(prev => ({
        imageUri: imageUri || prev?.imageUri,
        parsedRooms: parsedRooms,
        detectedScale,
        detectedUnits,
        scalePixelsPerMeter: calibrationScale || undefined,
      }));

      // Active Learning: Log dataset sample for continuous ML improvement
      logBlueprintActiveLearning(firestore, {
        detectedScale,
        detectedUnits,
        scalePixelsPerMeter: calibrationScale || undefined,
        originalAiRooms,
        verifiedRooms: parsedRooms,
      });

      setIsReviewOpen(false);
      
      toast({
        title: 'SilaCalc Engine Synchronized',
        description: `Imported ${cleanedRooms.length} verified rooms (${buildingBlocks.length} block(s)). Geometry cached.`,
      });
    } catch (err) {
      console.error('Import grouping failed:', err);
      toast({
        title: 'Import Failed',
        description: 'Failed to organize the rooms and blocks layout.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl overflow-hidden relative transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-2xl text-slate-100 flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
                <UploadCloud size={24} className={isProcessing ? 'animate-bounce' : ''} />
              </div>
              AI Plan Reader
            </CardTitle>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-bold">
              <Sparkles size={13} className="text-sky-400" />
              <span>Multi-Stage ML Vision</span>
            </div>
          </div>
          <CardDescription className="text-slate-400 text-sm mt-2 leading-relaxed">
            Upload any house plan, CAD drawing, or blueprint (PDF, JPG, PNG). Our neural model extracts room spans, checks beam orientations, and applies geometric constraint verification.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3 relative z-10">
          <div className="space-y-1.5">
            <Label htmlFor="plan-file" className="font-bold text-slate-300 text-sm flex justify-between items-center">
              <span>Blueprint File (PDF / PNG / JPG)</span>
              {file && <span className="text-xs text-sky-400 font-semibold truncate max-w-[200px]">{file.name}</span>}
            </Label>
            <div className="relative group/input">
              <Input
                id="plan-file"
                type="file"
                className="bg-slate-800/50 border border-slate-700/80 text-slate-200 placeholder-slate-500 shadow-inner rounded-xl h-11 flex items-center px-4 file:bg-sky-500 file:text-white file:border-none file:px-3 file:py-1 file:rounded-md file:mr-3 file:font-semibold file:cursor-pointer hover:border-slate-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,application/pdf"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Interactive Scale Calibrator & Context Notes bar */}
          {imageUri && (
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={isCalibrating ? "default" : "outline"}
                    onClick={() => {
                      setIsCalibrating(!isCalibrating);
                      setCalibPoints([]);
                    }}
                    className={`h-8 text-xs font-bold rounded-lg flex items-center gap-1.5 ${
                      isCalibrating 
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black' 
                        : 'border-slate-600 bg-slate-700/40 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Ruler size={13} />
                    {isCalibrating ? 'Click 2 Points on Blueprint' : 'Calibrate Scale (2-Point)'}
                  </Button>
                  
                  {calibrationScale ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      <CheckCircle2 size={11} /> 1m ≈ {calibrationScale}px
                      <button onClick={resetCalibration} title="Reset scale" className="text-slate-400 hover:text-red-400 ml-1">
                        <RefreshCw size={10} />
                      </button>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Auto-detecting scale</span>
                  )}
                </div>

                {isCalibrating && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-300">
                    <span>Span:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={calibDistanceM}
                      onChange={(e) => setCalibDistanceM(parseFloat(e.target.value) || 0.9)}
                      className="w-16 h-6 px-1.5 bg-slate-900 border border-amber-500/60 rounded text-center text-xs font-bold text-amber-300"
                    />
                    <span>m</span>
                  </div>
                )}
              </div>

              {/* Calibration Canvas Preview */}
              {isCalibrating && (
                <div 
                  ref={imageContainerRef}
                  onClick={handleImageClick}
                  className="relative w-full h-48 bg-slate-950 rounded-lg overflow-hidden border border-amber-500/40 flex items-center justify-center cursor-crosshair select-none"
                >
                  <img src={imageUri} alt="Calibrate blueprint" className="max-w-full max-h-full object-contain pointer-events-none" />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                    {calibPoints.map((pt, idx) => (
                      <g key={idx}>
                        <circle cx={pt.x} cy={pt.y} r="12" fill={idx === 0 ? "#ef4444" : "#3b82f6"} stroke="#ffffff" strokeWidth="2" />
                        <text x={pt.x + 14} y={pt.y + 5} fill="#ffffff" fontSize="24" fontWeight="bold">P{idx + 1}</text>
                      </g>
                    ))}
                    {calibPoints.length === 2 && (
                      <line
                        x1={calibPoints[0].x}
                        y1={calibPoints[0].y}
                        x2={calibPoints[1].x}
                        y2={calibPoints[1].y}
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeDasharray="8 4"
                      />
                    )}
                  </svg>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-slate-900/90 border border-amber-500/40 rounded text-[10px] text-amber-300 font-bold">
                    {calibPoints.length === 0 ? 'Click Start Point (e.g. Door Left Edge)' : 'Click End Point (e.g. Door Right Edge)'}
                  </div>
                </div>
              )}

              {/* User Context Hint */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">Note:</span>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Optional hint (e.g. '3-bedroom bungalow ground floor')"
                  className="bg-slate-900/60 border border-slate-700/60 text-slate-200 text-xs px-2.5 py-1 rounded-md w-full focus:outline-none focus:border-sky-500 placeholder-slate-500"
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2 relative z-10 flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleAnalyze} 
            disabled={isProcessing || !file}
            className={`flex-1 font-bold h-12 shadow-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              file 
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white transform active:scale-[0.98]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin text-sky-200" size={20} />
                <span>Running Multi-Stage Vision AI...</span>
              </>
            ) : (
              <>
                <Wand2 size={20} />
                <span>Extract & Review Blueprint</span>
              </>
            )}
          </Button>
          {(imageUri || planData?.imageUri) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewOpen(true)}
              className="h-12 px-4 border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 font-bold rounded-xl flex items-center gap-2"
            >
              <Eye size={18} />
              <span>View Saved ({parsedRooms.length} Rooms)</span>
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Blueprint Parsing Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-6 rounded-2xl overflow-hidden border-slate-200 bg-white">
          <DialogHeader className="pb-3 border-b border-slate-100 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DialogTitle className="font-headline text-2xl font-black text-slate-900 flex items-center gap-2">
                <HardHat className="text-primary" size={22} />
                AI Blueprint Review Window
              </DialogTitle>
              <div className="flex items-center gap-2">
                {detectedScale && (
                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Scale size={12} className="text-primary" /> Scale: {detectedScale}
                  </span>
                )}
                {detectedUnits && (
                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                    Units: {detectedUnits}
                  </span>
                )}
              </div>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              {drawingSummary || 'Verify the parsed rooms and coordinate outlines below. Tweak labels, adjust dimensions, or delete erroneous detections.'}
            </DialogDescription>
          </DialogHeader>

          {/* Core Content Body (Split Grid) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 overflow-hidden">
            
            {/* Left Column: Visual blueprint with overlays */}
            <div className="lg:col-span-6 flex flex-col h-full min-h-0">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 block">
                Visual Coordinate Bounding Box Overlay
              </span>
              <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center min-h-[250px] shadow-inner">
                {imageUri && (
                  <div className="relative max-w-full max-h-full aspect-square w-full h-full flex items-center justify-center p-2">
                    <img 
                      src={imageUri} 
                      alt="Floor Plan Preview" 
                      className="max-w-full max-h-full object-contain pointer-events-none select-none" 
                    />
                    
                    <svg 
                      className="absolute inset-0 w-full h-full pointer-events-none" 
                      viewBox="0 0 1000 1000"
                      preserveAspectRatio="none"
                    >
                      {parsedRooms.map((room, idx) => {
                        if (!room.boundingBox) return null;
                        const [ymin, xmin, ymax, xmax] = room.boundingBox;
                        const isHovered = hoveredIndex === idx;
                        const hasWarning = room.aspectRatioWarning;
                        
                        return (
                          <g key={idx}>
                            <rect
                              x={xmin}
                              y={ymin}
                              width={xmax - xmin}
                              height={ymax - ymin}
                              fill={isHovered ? 'rgba(14, 165, 233, 0.28)' : hasWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(14, 165, 233, 0.08)'}
                              stroke={isHovered ? '#0ea5e9' : hasWarning ? '#f59e0b' : '#0ea5e9/70'}
                              strokeWidth={isHovered ? 4 : 2}
                              rx="8"
                              className="transition-all duration-200"
                            />
                            <foreignObject
                              x={xmin + 4}
                              y={ymin + 4}
                              width={Math.max(90, xmax - xmin - 8)}
                              height="26"
                            >
                              <div className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold truncate w-fit max-w-full flex items-center gap-1 ${
                                isHovered 
                                  ? 'bg-primary text-white shadow-xs' 
                                  : hasWarning 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-white/90 text-slate-800 border border-slate-200'
                              }`}>
                                {hasWarning && <AlertTriangle size={10} className="text-amber-600 shrink-0" />}
                                <span>{idx + 1}. {room.name}</span>
                              </div>
                            </foreignObject>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Scrollable list of parsed rooms */}
            <div className="lg:col-span-6 flex flex-col h-full min-h-0">
              <div className="flex justify-between items-center mb-2 shrink-0">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Detected Rooms ({parsedRooms.length})
                </span>
                <Button 
                  onClick={addEmptyRoom}
                  size="sm"
                  variant="outline"
                  className="h-8 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xs"
                >
                  <Plus size={14} className="mr-1" /> Add Room
                </Button>
              </div>

              {/* Scrollable Room Table */}
              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-2 space-y-2.5 min-h-[200px]">
                {parsedRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400">
                    <Trash2 size={24} className="mb-2 opacity-50" />
                    <p className="text-xs font-bold">No rooms detected or remaining.</p>
                    <p className="text-[10px]">Click "Add Room" to insert manually.</p>
                  </div>
                ) : (
                  parsedRooms.map((room, idx) => (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`p-3 bg-white border rounded-xl transition-all duration-150 grid grid-cols-12 gap-3 items-center ${
                        hoveredIndex === idx 
                          ? 'border-primary ring-2 ring-primary/5 bg-sky-50/5 shadow-xs' 
                          : room.aspectRatioWarning
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      {/* Name input */}
                      <div className="col-span-5 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[9px] font-black text-slate-400 uppercase">Room Label</Label>
                          {room.aspectRatioWarning && (
                            <span className="text-[8px] font-black text-amber-600 flex items-center gap-0.5" title="Bounding box aspect ratio differs from dimensions">
                              <AlertTriangle size={9} /> Check Dim
                            </span>
                          )}
                        </div>
                        <Input
                          value={room.name}
                          onChange={(e) => updateParsedRoom(idx, 'name', e.target.value)}
                          className="h-9 text-xs font-bold bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-lg"
                        />
                      </div>

                      {/* Length input */}
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase">Length (m)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          value={room.length}
                          onChange={(e) => updateParsedRoom(idx, 'length', parseFloat(e.target.value) || 0)}
                          className="h-9 text-xs font-bold bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-lg"
                        />
                      </div>

                      {/* Width input */}
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase">Width (m)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          value={room.width}
                          onChange={(e) => updateParsedRoom(idx, 'width', parseFloat(e.target.value) || 0)}
                          className="h-9 text-xs font-bold bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-lg"
                        />
                      </div>

                      {/* Delete button */}
                      <div className="col-span-1 flex justify-center pt-4">
                        <button
                          onClick={() => deleteParsedRoom(idx)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-all"
                          title="Delete room"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Block/Apartment naming toggleable block */}
                      <div className="col-span-12 grid grid-cols-2 gap-3 mt-1 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400 font-bold">Block:</span>
                          <input 
                            value={room.blockName || ''}
                            onChange={(e) => updateParsedRoom(idx, 'blockName', e.target.value)}
                            placeholder="e.g. Block 1"
                            className="bg-transparent border-b border-slate-200 font-semibold focus:outline-none focus:border-primary text-slate-700 w-full"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400 font-bold">Unit:</span>
                          <input 
                            value={room.apartmentName || ''}
                            onChange={(e) => updateParsedRoom(idx, 'apartmentName', e.target.value)}
                            placeholder="e.g. Unit A"
                            className="bg-transparent border-b border-slate-200 font-semibold focus:outline-none focus:border-primary text-slate-700 w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Dialog Footer Actions */}
          <DialogFooter className="pt-3 border-t border-slate-100 shrink-0 flex flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              className="rounded-xl font-bold border-slate-200"
            >
              Discard Changes
            </Button>
            <Button
              onClick={handleImport}
              className="bg-primary hover:bg-primary/95 text-white font-bold px-6 rounded-xl flex items-center gap-1 shadow-md"
            >
              <Check size={16} /> Import to Calculator ({parsedRooms.length} Rooms)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
