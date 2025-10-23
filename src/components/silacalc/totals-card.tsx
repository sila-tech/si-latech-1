
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Beaker, BrickWall, MoveHorizontal, DollarSign, Hammer } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useCalculator } from '@/context/calculator-context';


export function TotalsCard() {
  const { totals } = useCalculator();
  const {
    totalArea,
    totalBlocks,
    totalActualBeamLength,
    totalInvoiceBeamLength,
    totalLintelLength,
    totalConcreteVolume,
    totalCementBags,
    totalSandTonnes,
    totalBallastTonnes,
    wastagePercentage,
    brc,
    lintel,
    timber,
    lintelSteel,
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
              <MoveHorizontal className="w-4 h-4" /> Actual Beam Length
            </span>
            <span className="font-semibold">{totalActualBeamLength.toFixed(2)} m</span>
          </li>
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
                    <Beaker className="w-4 h-4" /> Total Slab Concrete
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
        
        {totalLintelLength > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-dashed-bottom-code"><path d="M21 15V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7"/><path d="M9 22v-3.5a2.5 2.5 0 0 1 5 0V22"/><path d="M10 10l-2 2 2 2"/><path d="m14 10 2 2-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 21h1"/><path d="M14 21h1"/><path d="M19 21a2 2 0 0 0 2-2"/></svg>
                      Lintel Concrete ({lintel.totalLintelLength.toFixed(2)} m)
                  </span>
                  <span className="font-semibold">
                      {lintel.wetVolume.toFixed(3)} m³
                  </span>
              </div>
              <ul className="space-y-1 pl-6 text-xs">
                  <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cement (50kg bags)</span>
                      <span className="font-semibold">{lintel.cementBags} bags</span>
                  </li>
                  <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sand</span>
                      <span className="font-semibold">{lintel.sandTonnes.toFixed(2)} tonnes</span>
                  </li>
                  <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ballast / Aggregate</span>
                      <span className="font-semibold">{lintel.ballastTonnes.toFixed(2)} tonnes</span>
                  </li>
              </ul>
            </div>
             <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-construction"><rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v-4"/><path d="M12 14v-4"/><path d="M7 14v-4"/><path d="M17 18v4"/><path d="M12 18v4"/><path d="M7 18v4"/></svg>
                      Lintel Steel
                  </span>
              </div>
              <ul className="space-y-1 pl-6 text-xs">
                  <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">D{lintelSteel.longitudinal.diameter} Bars</span>
                      <span className="font-semibold">{lintelSteel.longitudinal.barsToOrder} pcs</span>
                  </li>
                  <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">D{lintelSteel.stirrups.diameter} Bars (Stirrups)</span>
                      <span className="font-semibold">{lintelSteel.stirrups.barsToOrder} pcs</span>
                  </li>
              </ul>
            </div>
          </>
        )}

        <Separator />
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                 <span className="text-muted-foreground flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-amber-500" /> Timber & Props
                </span>
            </div>
            <ul className="space-y-1 pl-6 text-xs">
                <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total 3x2 Length</span>
                    <span className="font-semibold">{timber.total3x2m.toFixed(2)}m ({timber.total3x2ft.toFixed(2)} ft)</span>
                </li>
                <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total 6x1 Length</span>
                    <span className="font-semibold">{timber.total6x1m.toFixed(2)}m ({timber.total6x1ft.toFixed(2)} ft)</span>
                </li>
                <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Props</span>
                    <span className="font-semibold">{timber.totalProps} pcs</span>
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
