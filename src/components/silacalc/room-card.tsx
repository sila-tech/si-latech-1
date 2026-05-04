
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
import type { Room, RoomCalculation, ConcreteCalculation, TimberAndPropsCalculation } from '@/lib/calculator';
import { Button } from '../ui/button';
import { Trash2, Beaker, BrickWall, MoveHorizontal, Hammer } from 'lucide-react';
import { Separator } from '../ui/separator';

type RoomCardProps = {
  room: Room;
  calculations: {
    roomCalcs: RoomCalculation;
    concreteCalcs: ConcreteCalculation;
    timberCalcs: TimberAndPropsCalculation;
  };
  updateRoom: (id: string, key: 'name' | 'length' | 'width', value: string | number) => void;
  deleteRoom: (id: string) => void;
};

export function RoomCard({ room, calculations, updateRoom, deleteRoom }: RoomCardProps) {
  const { roomCalcs, concreteCalcs, timberCalcs } = calculations;

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
    </Card>
  );
}
