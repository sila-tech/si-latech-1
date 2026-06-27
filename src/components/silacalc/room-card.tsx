
import React, { useState, useEffect } from 'react';
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
import { Trash2, Beaker, BrickWall, MoveHorizontal, Hammer, Eye, EyeOff } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useCalculator } from '@/context/calculator-context';
import { RoomLayoutVisualizer } from './room-layout-visualizer';

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
  const { displayUnit } = useCalculator();

  const [localLength, setLocalLength] = useState('');
  const [localWidth, setLocalWidth] = useState('');
  const [showVisualizer, setShowVisualizer] = useState(true);

  // Sync inputs with room data from props, avoiding overwriting while user edits
  useEffect(() => {
    const currentVal = parseFloat(localLength) || 0;
    const expectedVal = displayUnit === 'ft' ? room.length * 3.28084 : room.length;
    if (
      Math.abs(currentVal - expectedVal) > 0.01 ||
      (room.length === 0 && localLength !== '') ||
      (room.length > 0 && localLength === '')
    ) {
      if (displayUnit === 'ft') {
        setLocalLength(room.length > 0 ? (room.length * 3.28084).toFixed(2) : '');
      } else {
        setLocalLength(room.length > 0 ? String(room.length) : '');
      }
    }
  }, [room.length, displayUnit]);

  useEffect(() => {
    const currentVal = parseFloat(localWidth) || 0;
    const expectedVal = displayUnit === 'ft' ? room.width * 3.28084 : room.width;
    if (
      Math.abs(currentVal - expectedVal) > 0.01 ||
      (room.width === 0 && localWidth !== '') ||
      (room.width > 0 && localWidth === '')
    ) {
      if (displayUnit === 'ft') {
        setLocalWidth(room.width > 0 ? (room.width * 3.28084).toFixed(2) : '');
      } else {
        setLocalWidth(room.width > 0 ? String(room.width) : '');
      }
    }
  }, [room.width, displayUnit]);

  const handleLengthChange = (val: string) => {
    setLocalLength(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const meters = displayUnit === 'ft' ? num / 3.28084 : num;
      updateRoom(room.id, 'length', meters);
    } else if (val === '') {
      updateRoom(room.id, 'length', 0);
    }
  };

  const handleWidthChange = (val: string) => {
    setLocalWidth(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const meters = displayUnit === 'ft' ? num / 3.28084 : num;
      updateRoom(room.id, 'width', meters);
    } else if (val === '') {
      updateRoom(room.id, 'width', 0);
    }
  };

  const hasDimensions = room.length > 0 && room.width > 0;

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-xs hover:shadow-sm transition-all duration-300 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 p-4 border-b border-slate-100">
        <CardTitle className="flex-grow">
          <Input
            value={room.name}
            onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
            className="text-base font-black font-headline border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent focus:bg-white focus:px-2 focus:py-1 focus:border focus:border-slate-200 rounded-lg text-slate-800"
          />
        </CardTitle>
        <Button
          onClick={() => deleteRoom(room.id)}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Room</span>
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        <div className={hasDimensions ? "grid grid-cols-1 gap-6 lg:grid-cols-12" : "grid grid-cols-1 gap-4"}>
          {/* Inputs Section */}
          <div className={hasDimensions ? "space-y-4 lg:col-span-5 flex flex-col justify-between" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-1.5">
                <Label htmlFor={`length-${room.id}`} className="font-bold text-xs text-slate-600 uppercase tracking-wider">
                  Length ({displayUnit === 'ft' ? 'feet' : 'meters'})
                </Label>
                <Input
                  id={`length-${room.id}`}
                  type="text"
                  inputMode="decimal"
                  value={localLength}
                  onChange={(e) => handleLengthChange(e.target.value)}
                  className="w-full font-bold bg-slate-50/50 border-slate-200 focus-visible:ring-primary rounded-xl h-11"
                  placeholder={displayUnit === 'ft' ? 'e.g. 32.8' : 'e.g. 10.0'}
                />
                <span className="text-[10px] text-slate-400 font-medium block h-4">
                  {room.length > 0 && (
                    displayUnit === 'ft' 
                      ? `≈ ${room.length.toFixed(2)} meters` 
                      : `≈ ${(room.length * 3.28084).toFixed(1)} feet`
                  )}
                </span>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor={`width-${room.id}`} className="font-bold text-xs text-slate-600 uppercase tracking-wider">
                  Width ({displayUnit === 'ft' ? 'feet' : 'meters'})
                </Label>
                <Input
                  id={`width-${room.id}`}
                  type="text"
                  inputMode="decimal"
                  value={localWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-full font-bold bg-slate-50/50 border-slate-200 focus-visible:ring-primary rounded-xl h-11"
                  placeholder={displayUnit === 'ft' ? 'e.g. 32.8' : 'e.g. 10.0'}
                />
                <span className="text-[10px] text-slate-400 font-medium block h-4">
                  {room.width > 0 && (
                    displayUnit === 'ft' 
                      ? `≈ ${room.width.toFixed(2)} meters` 
                      : `≈ ${(room.width * 3.28084).toFixed(1)} feet`
                  )}
                </span>
              </div>
            </div>

            {hasDimensions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVisualizer(!showVisualizer)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold border-slate-200 text-slate-600 rounded-xl h-9 hover:bg-slate-50 transition-all mt-2 lg:mt-0"
              >
                {showVisualizer ? (
                  <>
                    <EyeOff size={14} /> Hide Visual Layout
                  </>
                ) : (
                  <>
                    <Eye size={14} /> Show Visual Layout
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Visualizer Section */}
          {hasDimensions && showVisualizer && (
            <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 animate-in fade-in duration-200">
              <RoomLayoutVisualizer calc={roomCalcs} roomName={room.name} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
