
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
import { HardHat, Loader2, UploadCloud, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCalculator } from '@/context/calculator-context';
import { analyzePlan, AnalyzePlanOutput } from '@/ai/flows/analyze-plan-flow';

export function PlanReaderCard() {
  const { setRooms } = useCalculator();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast({
        title: 'File Selected',
        description: `"${selectedFile.name}" is ready for AI blueprint analysis.`,
      });
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
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
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const result = await analyzePlan({ photoDataUri: base64Data });

          if (result && result.rooms.length > 0) {
            const newRooms = result.rooms.map(room => ({
              id: crypto.randomUUID(),
              name: room.name,
              length: room.length,
              width: room.width,
            }));
            setRooms(newRooms);
            toast({
              title: 'Blueprint Parsed Successfully',
              description: `Extracted ${newRooms.length} rooms and populated the calculator.`,
            });
          } else {
            throw new Error('No rooms were detected in the floor plan. Please ensure dimensions are visible.');
          }
        } catch (err) {
          console.error('Plan analysis failed:', err);
          toast({
            title: 'Blueprint Analysis Failed',
            description: err instanceof Error ? err.message : 'An unknown error occurred.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setIsProcessing(false);
        toast({
          title: 'File Read Failed',
          description: 'Failed to read the uploaded file.',
          variant: 'destructive',
        });
      };
      
    } catch (error) {
      setIsProcessing(false);
      console.error('Plan analysis failed:', error);
    }
  };

  return (
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
          Upload any house plan or floor blueprint (PDF, JPG, PNG). Our intelligent neural plan reader will parse room layout boundaries, structural spans, and dimensions to instantly populate your calculator.
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
              <span>Extract & Populate Calculator</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
