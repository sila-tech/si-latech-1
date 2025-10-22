
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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Calculator />
          Quick Quote Generator
        </CardTitle>
        <CardDescription>
          Generate a full project estimate from a single total area value. This will replace any existing rooms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="total-area">Total Project Area (m²)</Label>
        <Input
          id="total-area"
          type="number"
          value={area}
          onChange={(e) => setArea(parseFloat(e.target.value) || '')}
          placeholder="e.g., 150"
          min="0"
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} className="w-full">
          <Wand2 />
          Generate Estimate
        </Button>
      </CardFooter>
    </Card>
  );
}
