
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Beaker, BrickWall, MoveHorizontal } from 'lucide-react';
import { Separator } from '../ui/separator';

type TotalsCardProps = {
  totals: {
    totalArea: number;
    totalBlocks: number;
    totalBeamLength: number;
    lintelLength: number;
    totalConcreteVolume: number;
    totalCementBags: number;
    totalSandTonnes: number;
    totalBallastTonnes: number;
    wastagePercentage: number;
    brc: {
      rollsNeeded: number;
      areaPerRoll: number;
    };
  };
};

export function TotalsCard({ totals }: TotalsCardProps) {
  const {
    totalArea,
    totalBlocks,
    totalBeamLength,
    lintelLength,
    totalConcreteVolume,
    totalCementBags,
    totalSandTonnes,
    totalBallastTonnes,
    wastagePercentage,
    brc,
  } = totals;
  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="font-headline">Project Totals</CardTitle>
        <CardDescription>
          Summary of all required materials.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 9V7a2 2 0 0 0-2-2h-3"/><path d="M4 15v2a2 2 0 0 0 2 2h3"/><path d="M20 15v2a2 2 0 0 1-2 2h-3"/><path d="M4 9V7a2 2 0 0 1 2-2h3"/><rect width="6" height="6" x="9" y="9"/></svg>
            <span className="font-medium">Total Area</span>
          </div>
          <span className="font-bold text-lg">{totalArea.toFixed(2)} m²</span>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <BrickWall className="w-4 h-4" /> Total Blocks
            </span>
            <span className="font-semibold">{totalBlocks} pcs</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <MoveHorizontal className="w-4 h-4" /> Total Flat Beam Length
            </span>
            <span className="font-semibold">{totalBeamLength.toFixed(2)} m</span>
          </li>
          {lintelLength > 0 && (
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-dashed-bottom-code"><path d="M21 15V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7"/><path d="M9 22v-3.5a2.5 2.5 0 0 1 5 0V22"/><path d="M10 10l-2 2 2 2"/><path d="m14 10 2 2-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 21h1"/><path d="M14 21h1"/><path d="M19 21a2 2 0 0 0 2-2"/></svg>
                Lintel Beam Length
              </span>
              <span className="font-semibold">{lintelLength.toFixed(2)} m</span>
            </li>
          )}
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                BRC Rolls
            </span>
            <span className="font-semibold">{brc.rollsNeeded} rolls</span>
          </li>
        </ul>

        <Separator />

        <div className="space-y-2">
            <div className="flex items-center justify-between">
                 <span className="text-muted-foreground flex items-center gap-2">
                    <Beaker className="w-4 h-4" /> Total Wet Concrete
                </span>
                <span className="font-semibold">
                    {totalConcreteVolume.toFixed(3)} m³
                </span>
            </div>
            <ul className="space-y-1 pl-6 text-xs">
                <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cement (50kg bags)</span>
                    <span className="font-semibold">{totalCementBags} bags</span>
                </li>
                <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sand</span>
                    <span className="font-semibold">{totalSandTonnes.toFixed(2)} tonnes</span>
                </li>
                <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ballast / Aggregate</span>
                    <span className="font-semibold">{totalBallastTonnes.toFixed(2)} tonnes</span>
                </li>
            </ul>
        </div>
        
        <p className="text-xs text-muted-foreground text-center pt-2">
            BRC roll covers {brc.areaPerRoll.toFixed(2)} m² per roll. Concrete materials include {wastagePercentage}% wastage.
        </p>
      </CardContent>
    </Card>
  );
}
