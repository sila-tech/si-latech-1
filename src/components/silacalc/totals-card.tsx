
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
        <p className="text-sm text-muted-foreground text-center pt-2">
            Detailed material quantities and technical specifications are available on the generated <strong>Customer Invoice</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
