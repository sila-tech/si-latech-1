
'use client';

import React, { useState, useMemo } from 'react';
import type {
  Room,
  CalculationDefaults,
  RoomCalculation,
  ConcreteCalculation,
  BrcCalculation,
  AggregatedRoomGroup,
  LintelCalculation,
  TimberAndPropsCalculation,
  LintelSteelCalculation,
} from '@/lib/calculator';
import {
  DEFAULTS,
  calcRoomBlocksAndBeams,
  calcConcrete,
  calcBRC,
  calcLintelConcrete,
  getAggregatedRoomBreakdown,
  calcTimberAndProps,
  calcLintelSteel,
} from '@/lib/calculator';
import { RoomCard } from './room-card';
import { ActionsCard } from './actions-card';
import { SettingsCard } from './settings-card';
import { TotalsCard } from './totals-card';
import { QuickQuoteCard } from './quick-quote-card';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PerRoomCalculation = {
  room: Room;
  roomCalcs: RoomCalculation;
  concreteCalcs: ConcreteCalculation;
  brcCalcs: BrcCalculation;
  timberCalcs: TimberAndPropsCalculation;
};

export type ProjectTotals = {
  totalArea: number;
  totalBlocks: number;
  totalActualBeamLength: number;
  totalInvoiceBeamLength: number;
  totalProfitBeamLength: number;
  totalBeamProfitValue: number;
  totalBlockCommission: number;
  totalProjectProfit: number;
  totalLintelLength: number;
  totalConcreteVolume: number;
  totalCementBags: number;
  totalSandTonnes: number;
  totalBallastTonnes: number;
  wastagePercentage: number;
  brc: BrcCalculation;
  lintel: LintelCalculation;
  timber: {
    total3x2pieces: number;
    total3x2m: number;
    total3x2ft: number;
    total6x1m: number;
    total6x1ft: number;
    totalProps: number;
  };
  lintelSteel: LintelSteelCalculation;
};

export function CalculatorShell() {
  const [rooms, setRooms] = useState<Room[]>([]);
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
    const BEAM_PRICE_PER_METER = 545; // TODO: Make configurable
    return rooms.map((r) => {
      const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, BEAM_PRICE_PER_METER);
      const concreteCalcs = calcConcrete(roomCalcs, settings);
      const brcCalcs = calcBRC(concreteCalcs.area, settings);
      const timberCalcs = calcTimberAndProps(r, settings);
      return { room: r, roomCalcs, concreteCalcs, brcCalcs, timberCalcs };
    });
  }, [rooms, settings]);

  const aggregatedBreakdown: AggregatedRoomGroup[] = useMemo(() => {
    return getAggregatedRoomBreakdown(rooms, settings);
  }, [rooms, settings]);


  const totals: ProjectTotals = useMemo(() => {
    const initialTotals = {
      totalArea: 0,
      totalBlocks: 0,
      totalActualBeamLength: 0,
      totalInvoiceBeamLength: 0,
      totalProfitBeamLength: 0,
      totalBeamProfitValue: 0,
      totalBlockCommission: 0,
      totalProjectProfit: 0,
      totalConcreteVolume: 0,
      totalCementBags: 0,
      totalSandTonnes: 0,
      totalBallastTonnes: 0,
      wastagePercentage: settings.wastagePercentage,
      timber: {
        total3x2pieces: 0,
        total3x2m: 0,
        total3x2ft: 0,
        total6x1m: 0,
        total6x1ft: 0,
        totalProps: 0,
      }
    };
    
    const totalLintelLength = rooms.reduce((sum, room) => {
        return sum + 2 * (room.length + room.width);
    }, 0);

    const aggregated = perRoomCalculations.reduce((acc, p) => {
      acc.totalArea += p.concreteCalcs.area;
      acc.totalBlocks += p.roomCalcs.totalBlocks;
      acc.totalActualBeamLength += p.roomCalcs.actualTotalBeamLength;
      acc.totalInvoiceBeamLength += p.roomCalcs.invoiceTotalBeamLength;
      acc.totalConcreteVolume += p.concreteCalcs.wetVolume;
      acc.totalCementBags += p.concreteCalcs.cementBags;
      acc.totalSandTonnes += p.concreteCalcs.sandTonnes;
      acc.totalBallastTonnes += p.concreteCalcs.ballastTonnes;
      
      acc.totalBeamProfitValue += p.roomCalcs.beamProfitValue;
      acc.totalBlockCommission += p.roomCalcs.blockCommission;
      acc.totalProjectProfit += p.roomCalcs.totalRoomProfit;

      acc.timber.total3x2pieces += p.timberCalcs.pieces3x2;
      acc.timber.total3x2m += p.timberCalcs.total3x2m;
      acc.timber.total3x2ft += p.timberCalcs.total3x2ft;
      acc.timber.total6x1m += p.timberCalcs.total6x1m;
      acc.timber.total6x1ft += p.timberCalcs.total6x1ft;
      
      return acc;
    }, initialTotals);
    
    aggregated.totalProfitBeamLength = aggregated.totalInvoiceBeamLength - aggregated.totalActualBeamLength;
    
    if (settings.propSpacing > 0) {
      aggregated.timber.totalProps = Math.ceil(aggregated.timber.total3x2m / settings.propSpacing);
    }

    const brc = calcBRC(aggregated.totalArea, settings);
    const lintel = calcLintelConcrete(totalLintelLength, settings);
    const lintelSteel = calcLintelSteel(totalLintelLength, settings);
    aggregated.totalCementBags = Math.ceil(aggregated.totalCementBags);

    return {
      ...aggregated,
      brc,
      totalLintelLength,
      lintel,
      lintelSteel,
    };
  }, [perRoomCalculations, settings, rooms]);

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
          
          <QuickQuoteCard setRooms={setRooms} />

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
