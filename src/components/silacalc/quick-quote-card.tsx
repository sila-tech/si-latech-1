
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
import { Calculator, Wand2 } from 'lucide-react';
import type { Room } from '@/lib/calculator';
import { useToast } from '@/hooks/use-toast';
import { useCalculator } from '@/context/calculator-context';

export function QuickQuoteCard() {
  const { setRooms } = useCalculator();
  const [area, setArea] = useState<number | ''>('');
  const { toast } = useToast();

  const handleGenerate = () => {
    if (typeof area !== 'number' || area <= 0) {
      toast({
        title: 'Invalid Area',
        description: 'Please enter a valid, positive number for the area.',
        variant: 'destructive',
      });
      return;
    }

    // Treat the area as a single square room
    const side = Math.sqrt(area);
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: `Project Area - ${area} m²`,
      length: Number(side.toFixed(2)),
      width: Number(side.toFixed(2)),
    };

    setRooms([newRoom]);

    toast({
      title: 'Quick Quote Generated',
      description: `Project estimate updated for a total area of ${area} m².`,
    });
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-slate-900 flex items-center gap-2">
          <Calculator size={24} />
          Quick Quote Generator
        </CardTitle>
        <CardDescription>
          Generate a full project estimate from a single total area value. This will replace any existing rooms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="total-area" className="font-bold text-slate-900">Total Project Area (m²)</Label>
            <Input
            id="total-area"
            type="number"
            value={area}
            onChange={(e) => setArea(parseFloat(e.target.value) || '')}
            placeholder="e.g., 150"
            min="0"
            className="bg-[#eff3f8] border-none shadow-none"
            />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 shadow-md">
          <Wand2 className="mr-2" />
          Generate Estimate
        </Button>
      </CardFooter>
    </Card>
  );
}
