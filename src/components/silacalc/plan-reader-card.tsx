
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
      title: 'Analyzing Plan...',
      description: 'The AI is reading the floor plan. This may take a moment.',
    });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
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
            title: 'Analysis Complete',
            description: `Successfully extracted ${newRooms.length} rooms from the plan.`,
          });
        } else {
          throw new Error('No rooms were detected in the plan.');
        }
      };

      reader.onerror = () => {
         throw new Error('Failed to read the uploaded file.');
      }
      
    } catch (error) {
      console.error('Plan analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative group">
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-xl transition-all border-2 border-dashed border-slate-200">
            <div className="bg-white px-6 py-3 rounded-full shadow-lg border border-slate-100 transform rotate-[-2deg]">
                <span className="text-sm font-black text-slate-900 tracking-widest uppercase">Coming Soon</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-tighter">Under Construction</p>
        </div>

        <Card className="border-none shadow-sm opacity-40 grayscale-[0.5]">
        <CardHeader>
            <CardTitle className="font-headline text-2xl text-slate-900 flex items-center gap-2">
            <HardHat size={24} />
            AI Plan Reader
            </CardTitle>
            <CardDescription>
            Upload a floor plan (PDF, JPG, PNG) and the AI will automatically detect rooms and their dimensions. This will replace any existing rooms.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="plan-file" className="font-bold text-slate-900">Floor Plan File</Label>
                <Input
                id="plan-file"
                type="file"
                className="bg-[#eff3f8] border-none shadow-none cursor-not-allowed"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,application/pdf"
                disabled={true}
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full bg-[#707c8b] hover:bg-[#5a6470] text-white font-bold cursor-not-allowed" disabled={true}>
            <Wand2 className="mr-2" />
            Analyze Plan
            </Button>
        </CardFooter>
        </Card>
    </div>
  );
}
