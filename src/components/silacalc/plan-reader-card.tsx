
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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <HardHat />
          AI Plan Reader
        </CardTitle>
        <CardDescription>
          Upload a floor plan (PDF, JPG, PNG) and the AI will automatically detect rooms and their dimensions. This will replace any existing rooms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="plan-file">Floor Plan File</Label>
        <Input
          id="plan-file"
          type="file"
          onChange={handleFileChange}
          accept="image/jpeg,image/png,application/pdf"
          disabled={isProcessing}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleAnalyze} className="w-full" disabled={isProcessing || !file}>
          {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 />}
          {isProcessing ? 'Analyzing...' : 'Analyze Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
}
