
'use client';

import React, { useState, useMemo } from 'react';
import type {
  Room,
  CalculationDefaults,
  RoomCalculation,
  ConcreteCalculation,
  BrcCalculation,
  AggregatedRoomGroup,
} from '@/lib/calculator';
import {
  DEFAULTS,
  calcRoomBlocksAndBeams,
  calcConcrete,
  calcBRC,
  getAggregatedRoomBreakdown,
} from '@/lib/calculator';
import { RoomCard } from './room-card';
import { ActionsCard } from './actions-card';
import { SettingsCard } from './settings-card';
import { TotalsCard } from './totals-card';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PerRoomCalculation = {
  room: Room;
  roomCalcs: RoomCalculation;
  concreteCalcs: ConcreteCalculation;
  brcCalcs: BrcCalculation;
};

export function CalculatorShell() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Living room', length: 5, width: 4.5 },
    { id: '2', name: 'Bedroom 1', length: 4, width: 3.8 },
    { id: '3', name: 'Kitchen', length: 4.5, width: 5 },
  ]);
  const [settings, setSettings] = useState<CalculationDefaults>(DEFAULTS);

  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        id: crypto.randomUUID(),
        name: `Room ${rooms.length + 1}`,
        length: 4,
        width: 3,
      },
    ]);
  };

  const updateRoom = (id: string, key: 'name' | 'length' | 'width', value: string | number) => {
    setRooms(
      rooms.map((room) =>
        room.id === id ? { ...room, [key]: value } : room
      )
    );
  };

  const deleteRoom = (id: string) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };
  
  const setRoomsFromPlan = (planRooms: { name: string; length: number; width: number }[]) => {
    const newRooms: Room[] = planRooms.map(room => ({
      id: crypto.randomUUID(),
      name: room.name,
      length: Number(room.length.toFixed(2)),
      width: Number(room.width.toFixed(2)),
    }));
    setRooms(newRooms);
  };

  const perRoomCalculations: PerRoomCalculation[] = useMemo(() => {
    return rooms.map((r) => {
      const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings);
      const concreteCalcs = calcConcrete(roomCalcs, settings);
      const brcCalcs = calcBRC(concreteCalcs.area, settings);
      return { room: r, roomCalcs, concreteCalcs, brcCalcs };
    });
  }, [rooms, settings]);

  const aggregatedBreakdown: AggregatedRoomGroup[] = useMemo(() => {
    return getAggregatedRoomBreakdown(rooms, settings);
  }, [rooms, settings]);


  const totals = useMemo(() => {
    const initialTotals = {
      totalArea: 0,
      totalBlocks: 0,
      totalBeamLength: 0,
      totalConcreteVolume: 0,
      totalCementBags: 0,
      totalSandTonnes: 0,
      totalBallastTonnes: 0,
      totalSandWheelbarrows: 0,
      totalBallastWheelbarrows: 0,
      wastagePercentage: settings.wastagePercentage,
    };

    const aggregated = perRoomCalculations.reduce((acc, p) => {
      acc.totalArea += p.concreteCalcs.area;
      acc.totalBlocks += p.roomCalcs.totalBlocks;
      acc.totalBeamLength += p.roomCalcs.totalBeamLength;
      acc.totalConcreteVolume += p.concreteCalcs.totalConcrete;
      acc.totalCementBags += p.concreteCalcs.cementBags;
      acc.totalSandTonnes += p.concreteCalcs.sandTonnes;
      acc.totalBallastTonnes += p.concreteCalcs.ballastTonnes;
      acc.totalSandWheelbarrows += p.concreteCalcs.sandWheelbarrows;
      acc.totalBallastWheelbarrows += p.concreteCalcs.ballastWheelbarrows;
      return acc;
    }, initialTotals);
    
    const brc = calcBRC(aggregated.totalArea, settings);

    return {
      ...aggregated,
      brc,
    };
  }, [perRoomCalculations, settings]);

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <ActionsCard 
            totals={totals} 
            setRooms={setRoomsFromPlan} 
            perRoomCalculations={perRoomCalculations}
            aggregatedBreakdown={aggregatedBreakdown}
            rooms={rooms}
          />
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight font-headline">Rooms</h2>
            {rooms.map((room, i) => (
              <RoomCard
                key={room.id}
                room={room}
                calculations={perRoomCalculations[i]}
                updateRoom={updateRoom}
                deleteRoom={deleteRoom}
              />
            ))}
          </div>
          
          <Button onClick={addRoom} variant="outline" className="w-full">
            <PlusCircle className="mr-2" /> Add Room
          </Button>
        </div>

        <div className="space-y-8 lg:col-span-1">
          <SettingsCard settings={settings} setSettings={setSettings} />
          <TotalsCard totals={totals} />
        </div>
      </div>
    </div>
  );
}
