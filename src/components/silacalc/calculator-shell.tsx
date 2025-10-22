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
    { id: '1', name: 'Master Bedroom', length: 3.8, width: 3.8 },
    { id: '2', name: 'Walk-in Closet', length: 1.7, width: 2.2 },
    { id: '3', name: 'Pantry', length: 2.0, width: 2.2 },
    { id: '4', name: 'Laundry', length: 2.0, width: 2.4 },
    { id: '5', name: 'Rear Porch', length: 3.2, width: 1.5 },
    { id: '6', name: 'Open Kitchen', length: 3.2, width: 3.4 },
    { id: '7', name: 'Dining', length: 3.6, width: 3.4 },
    { id: '8', name: 'Bedroom 02', length: 3.0, width: 4.0 },
    { id: '9', name: 'Bedroom 03', length: 3.6, width: 3.4 },
    { id: '10', name: 'Lobby (by Bedrooms)', length: 2.2, width: 1.0 },
    { id: '11', name: 'Bedroom 01', length: 3.1, width: 3.6 },
    { id: '12', name: 'Lounge', length: 5.0, width: 4.5 },
    { id: '13', name: 'Study Room', length: 2.0, width: 3.3 },
    { id: '14', name: 'Entry Porch', length: 5.0, width: 2.0 },
    { id: '15', name: 'Lobby (Main)', length: 3.8, width: 1.0 },
  ]);
  const [settings, setSettings] = useState<CalculationDefaults>(DEFAULTS);
  const [lintelLength, setLintelLength] = useState<number>(0);


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
      totalConcreteVolume: 0, // This will be total WET concrete
      totalCementBags: 0,
      totalSandTonnes: 0,
      totalBallastTonnes: 0,
      // The wheelbarrow counts are illustrative and summed up.
      totalSandWheelbarrows: 0, 
      totalBallastWheelbarrows: 0,
      wastagePercentage: settings.wastagePercentage,
    };

    const aggregated = perRoomCalculations.reduce((acc, p) => {
      acc.totalArea += p.concreteCalcs.area;
      acc.totalBlocks += p.roomCalcs.totalBlocks;
      acc.totalBeamLength += p.roomCalcs.totalBeamLength;
      acc.totalConcreteVolume += p.concreteCalcs.wetVolume;
      acc.totalCementBags += p.concreteCalcs.cementBags;
      acc.totalSandTonnes += p.concreteCalcs.sandTonnes;
      acc.totalBallastTonnes += p.concreteCalcs.ballastTonnes;
      acc.totalSandWheelbarrows += p.concreteCalcs.sandWheelbarrows;
      acc.totalBallastWheelbarrows += p.concreteCalcs.ballastWheelbarrows;
      return acc;
    }, initialTotals);
    
    const brc = calcBRC(aggregated.totalArea, settings);

    // Rounding totals for display
    aggregated.totalCementBags = Math.ceil(aggregated.totalCementBags);
    aggregated.totalSandWheelbarrows = Math.ceil(aggregated.totalSandWheelbarrows);
    aggregated.totalBallastWheelbarrows = Math.ceil(aggregated.totalBallastWheelbarrows);


    return {
      ...aggregated,
      brc,
      lintelLength,
    };
  }, [perRoomCalculations, settings, lintelLength]);

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <ActionsCard 
            totals={totals} 
            setRooms={setRoomsFromPlan}
            setLintelLength={setLintelLength}
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
