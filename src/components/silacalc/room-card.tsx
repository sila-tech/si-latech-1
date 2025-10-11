'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Room, RoomCalculation, ConcreteCalculation } from '@/lib/calculator';
import { Button } from '../ui/button';
import { Trash2, Beaker, BrickWall, MoveHorizontal } from 'lucide-react';
import { Separator } from '../ui/separator';

type RoomCardProps = {
  room: Room;
  calculations: {
    roomCalcs: RoomCalculation;
    concreteCalcs: ConcreteCalculation;
  };
  updateRoom: (id: string, key: 'name' | 'length' | 'width', value: string | number) => void;
  deleteRoom: (id: string) => void;
};

export function RoomCard({ room, calculations, updateRoom, deleteRoom }: RoomCardProps) {
  const { roomCalcs, concreteCalcs } = calculations;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
        <CardTitle className="flex-grow">
          <Input
            value={room.name}
            onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
            className="text-lg font-bold font-headline border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
          />
        </CardTitle>
        <Button
          onClick={() => deleteRoom(room.id)}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Room</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`length-${room.id}`}>Length (m)</Label>
            <Input
              id={`length-${room.id}`}
              type="number"
              value={room.length}
              onChange={(e) => updateRoom(room.id, 'length', parseFloat(e.target.value) || 0)}
              className="w-full"
              min="0"
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`width-${room.id}`}>Width (m)</Label>
            <Input
              id={`width-${room.id}`}
              type="number"
              value={room.width}
              onChange={(e) => updateRoom(room.id, 'width', parseFloat(e.target.value) || 0)}
              className="w-full"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 text-sm">
         <div className="flex items-center gap-2">
            <BrickWall className="h-5 w-5 text-primary" />
            <div>
                <div className="font-semibold">{roomCalcs.totalBlocks}</div>
                <div className="text-muted-foreground">Blocks</div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <MoveHorizontal className="h-5 w-5 text-primary" />
            <div>
                <div className="font-semibold">{roomCalcs.totalBeamLength.toFixed(2)}m</div>
                <div className="text-muted-foreground">Beams</div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            <div>
                <div className="font-semibold">{concreteCalcs.totalConcrete.toFixed(3)}m³</div>
                <div className="text-muted-foreground">Concrete</div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 9V7a2 2 0 0 0-2-2h-3"/><path d="M4 15v2a2 2 0 0 0 2 2h3"/><path d="M20 15v2a2 2 0 0 1-2 2h-3"/><path d="M4 9V7a2 2 0 0 1 2-2h3"/><rect width="6" height="6" x="9" y="9"/></svg>
            <div>
                <div className="font-semibold">{concreteCalcs.area.toFixed(2)}m²</div>
                <div className="text-muted-foreground">Area</div>
            </div>
         </div>
      </CardFooter>
    </Card>
  );
}
