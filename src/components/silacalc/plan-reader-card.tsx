'use client';

import React, { useState } from 'react';
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
import { HardHat, Loader2, UploadCloud, Wand2, Eye, Trash2, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCalculator } from '@/context/calculator-context';
import { analyzePlan } from '@/ai/flows/analyze-plan-flow';
import { BuildingBlock, ApartmentGroup } from '@/lib/calculator';

const compressImage = (dataUri: string, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUri;
    img.onload = () => {
      // If it's a PDF, we don't compress via canvas (canvas only supports images)
      if (dataUri.startsWith('data:application/pdf')) {
        resolve(dataUri);
        return;
      }

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions to maintain aspect ratio
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
  const { setRooms, setBuildingBlocks } = useCalculator();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Review Modal States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [parsedRooms, setParsedRooms] = useState<any[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast({
        title: 'File Selected',
        description: `"${selectedFile.name}" is ready for AI blueprint analysis.`,
      });

      // Keep reference to image URI for visual rendering
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
    }
  };

  const handleAnalyze = async () => {
    if (!file || !imageUri) {
      toast({
        title: 'No File Selected',
        description: 'Please upload a floor plan image or PDF.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: 'Analyzing Blueprint...',
      description: 'The AI plan reader is scanning rooms, dimensions, and corridors. Please wait.',
    });

    try {
      // Compress the image client-side to prevent Next.js Server Action body limit errors (1MB)
      const compressedUri = await compressImage(imageUri);
      const result = await analyzePlan({ photoDataUri: compressedUri });

      if (result.success && result.rooms && result.rooms.length > 0) {
        setParsedRooms(result.rooms);
        setIsReviewOpen(true);
        toast({
          title: 'Blueprint Parsed',
          description: `Detected ${result.rooms.length} room spaces. Please review coordinates and dimensions.`,
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

  // Inline edit handlers for the review window
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
        boundingBox: [400, 400, 600, 600] // Centered default bounding box
      }
    ]);
  };

  // Group rooms and import into the main calculator context
  const handleImport = () => {
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

      // Group rooms by block name and apartment name
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
          // Sort rooms in this apartment by sequence
          aptEntry.rooms.sort((a, b) => a._seq - b._seq);

          // Assign the generated ids to the rooms
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

      // Clean up the temporary fields
      const cleanedRooms = tempRooms.map(({ _blockName, _aptName, _seq, ...rest }) => rest);

      setRooms(cleanedRooms);
      setBuildingBlocks(buildingBlocks);
      setIsReviewOpen(false);
      
      toast({
        title: 'Calculator Populated',
        description: `Successfully imported ${cleanedRooms.length} verified rooms and ${buildingBlocks.length} building block(s).`,
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
        {/* Decorative premium ambient glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="pb-4 relative z-10">
          <CardTitle className="font-headline text-2xl text-slate-100 flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <UploadCloud size={24} className={isProcessing ? 'animate-bounce' : ''} />
            </div>
            AI Plan Reader
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-2 leading-relaxed">
            Upload any house plan or floor blueprint (PDF, JPG, PNG). Our intelligent neural plan reader will parse room layout boundaries, structural spans, and dimensions, prompting you to review before population.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="plan-file" className="font-bold text-slate-300 text-sm flex justify-between items-center">
              <span>Blueprint Document</span>
              {file && <span className="text-xs text-sky-400 font-semibold truncate max-w-[200px]">{file.name}</span>}
            </Label>
            <div className="relative group/input">
              <Input
                id="plan-file"
                type="file"
                className="bg-slate-800/50 border border-slate-700/80 text-slate-200 placeholder-slate-500 shadow-inner rounded-xl h-12 flex items-center px-4 file:bg-sky-500 file:text-white file:border-none file:px-3 file:py-1 file:rounded-md file:mr-3 file:font-semibold file:cursor-pointer hover:border-slate-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,application/pdf"
                disabled={isProcessing}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 relative z-10">
          <Button 
            onClick={handleAnalyze} 
            disabled={isProcessing || !file}
            className={`w-full font-bold h-12 shadow-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              file 
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white transform active:scale-[0.98]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin text-sky-200" size={20} />
                <span>Analyzing CAD Geometry...</span>
              </>
            ) : (
              <>
                <Wand2 size={20} />
                <span>Extract & Review Blueprint</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Blueprint Parsing Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-6 rounded-2xl overflow-hidden border-slate-200 bg-white">
          <DialogHeader className="pb-3 border-b border-slate-100 shrink-0">
            <DialogTitle className="font-headline text-2xl font-black text-slate-900 flex items-center gap-2">
              <HardHat className="text-primary" size={22} />
              AI Blueprint Review Window
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Verify the parsed rooms and coordinate outlines below. You can tweak names, adjust dimensions, or delete erroneous detections.
            </DialogDescription>
          </DialogHeader>

          {/* Core Content Body (Split Grid) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 overflow-hidden">
            
            {/* Left Column: Visual blueprint with overlays */}
            <div className="lg:col-span-6 flex flex-col h-full min-h-0">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 block">
                Plan Bounding Box Overlay
              </span>
              <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center min-h-[250px] shadow-inner">
                {imageUri && (
                  <div className="relative max-w-full max-h-full aspect-square w-full h-full flex items-center justify-center p-2">
                    {/* Floor Plan Image */}
                    <img 
                      src={imageUri} 
                      alt="Floor Plan Preview" 
                      className="max-w-full max-h-full object-contain pointer-events-none select-none" 
                    />
                    
                    {/* SVG Bounding Boxes Overlay */}
                    <svg 
                      className="absolute inset-0 w-full h-full pointer-events-none" 
                      viewBox="0 0 1000 1000"
                      preserveAspectRatio="none"
                    >
                      {parsedRooms.map((room, idx) => {
                        if (!room.boundingBox) return null;
                        const [ymin, xmin, ymax, xmax] = room.boundingBox;
                        const isHovered = hoveredIndex === idx;
                        
                        return (
                          <g key={idx}>
                            {/* Bounding Box Rect */}
                            <rect
                              x={xmin}
                              y={ymin}
                              width={xmax - xmin}
                              height={ymax - ymin}
                              fill={isHovered ? 'rgba(14, 165, 233, 0.28)' : 'rgba(14, 165, 233, 0.08)'}
                              stroke={isHovered ? '#0ea5e9' : '#0ea5e9/70'}
                              strokeWidth={isHovered ? 4 : 2}
                              rx="8"
                              className="transition-all duration-200"
                            />
                            {/* Tiny label on overlay */}
                            <foreignObject
                              x={xmin + 4}
                              y={ymin + 4}
                              width={Math.max(80, xmax - xmin - 8)}
                              height="24"
                            >
                              <div className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold truncate w-fit max-w-full ${
                                isHovered 
                                  ? 'bg-primary text-white shadow-xs' 
                                  : 'bg-white/90 text-slate-800 border border-slate-200'
                              }`}>
                                {idx + 1}. {room.name}
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
                          : 'border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      {/* Name input */}
                      <div className="col-span-5 space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase">Room Label</Label>
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
