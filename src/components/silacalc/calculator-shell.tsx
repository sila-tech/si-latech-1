
'use client';

import React, { useEffect } from 'react';
import { RoomCard } from './room-card';
import { ActionsCard } from './actions-card';
import { SettingsCard } from './settings-card';
import { TotalsCard } from './totals-card';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalculator } from '@/context/calculator-context';
import { QuickQuoteCard } from './quick-quote-card';
import { PlanReaderCard } from './plan-reader-card';
import type { ProjectData } from '@/context/calculator-context';

export function CalculatorShell({ initialProjectData }: { initialProjectData?: ProjectData | null }) {
  const { rooms, perRoomCalculations, addRoom, updateRoom, deleteRoom, loadProjectData } = useCalculator();

  // Load initial data when the component mounts or when initialProjectData changes
  useEffect(() => {
    loadProjectData(initialProjectData || null);
  }, [initialProjectData, loadProjectData]);


  return (
    <div id="calculator" className="container mx-auto max-w-7xl mt-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <ActionsCard />
          
          <PlanReaderCard />

          <QuickQuoteCard />

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
          
          <Button onClick={addRoom} variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary">
            <PlusCircle className="mr-2" /> Add Room
          </Button>
        </div>

        <div className="space-y-8 lg:col-span-1">
          <SettingsCard />
          <TotalsCard />
        </div>
      </div>
    </div>
  );
}
