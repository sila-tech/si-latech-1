
'use client';

import React, { useEffect } from 'react';
import { RoomCard } from './room-card';
import { ActionsCard } from './actions-card';
import { SettingsCard } from './settings-card';
import { TotalsCard } from './totals-card';
import { PlusCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalculator } from '@/context/calculator-context';
import { QuickQuoteCard } from './quick-quote-card';
import { PlanReaderCard } from './plan-reader-card';
import { ProcessGuide, TechnicalGuide } from './installation-guide';
import type { ProjectData } from '@/context/calculator-context';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function TechAdvantages() {
  const advantages = [
    "Cost Effective: Save up to 30% compared to traditional solid slabs.",
    "Fast Construction: No curing time required before continuing work above.",
    "No Formwork: Eliminates the need for expensive timber shuttering.",
    "Superior Insulation: Hollow blocks provide excellent thermal and acoustic insulation.",
    "Clean & Safe Site: Less messy concrete pouring, resulting in a cleaner and safer workspace."
  ];

  return (
    <div className="mb-12 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
      <div className="p-8 pb-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 font-headline text-center">Why Choose SI-LATECH?</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {advantages.map((adv, i) => {
            const [bold, rest] = adv.split(':');
            return (
              <li key={i} className="flex items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mr-3 mt-0.5" />
                <span className="text-slate-700 leading-relaxed text-sm">
                  <strong className="text-slate-900 block mb-1">{bold}</strong>{rest}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col lg:flex-row border-t border-slate-200 bg-slate-900">
        
        {/* Image 1: Installation */}
        <div className="lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-700">
          <div className="relative h-[350px] w-full">
            <Image 
              src="/beam-block-real.jpg" 
              alt="SI-LATECH Beam and Block Floor System Installation" 
              fill 
              className="object-cover brightness-90"
            />
            {/* Annotations */}
            <div className="absolute top-[35%] left-[15%] md:left-[20%] flex flex-col items-center pointer-events-none drop-shadow-lg">
               <div className="bg-primary text-white text-xs px-2 py-1 rounded shadow-md font-bold">Flat Precast Beam</div>
               <div className="w-0.5 h-10 bg-primary"></div>
               <div className="w-2 h-2 rounded-full bg-primary border-2 border-white"></div>
            </div>
            <div className="absolute top-[50%] left-[45%] md:left-[55%] flex flex-col items-center pointer-events-none drop-shadow-lg">
               <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-md font-bold">Hollow Concrete Block</div>
               <div className="w-0.5 h-12 bg-blue-600"></div>
               <div className="w-2 h-2 rounded-full bg-blue-600 border-2 border-white"></div>
            </div>
            <div className="absolute top-[40%] right-[10%] md:right-[20%] flex flex-col items-center pointer-events-none drop-shadow-lg">
               <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded shadow-md font-bold mb-1">400mm Spacing</div>
               <div className="flex items-center w-24">
                  <div className="w-2 h-2 border-t-2 border-l-2 border-amber-500 rotate-[-45deg]"></div>
                  <div className="flex-1 h-0.5 bg-amber-500"></div>
                  <div className="w-2 h-2 border-t-2 border-r-2 border-amber-500 rotate-[45deg]"></div>
               </div>
            </div>
            <div className="absolute bottom-[10%] left-[30%] md:left-[40%] flex flex-col items-center pointer-events-none drop-shadow-lg">
               <div className="w-2 h-2 rounded-full bg-emerald-500 border-2 border-white mb-0"></div>
               <div className="w-0.5 h-6 bg-emerald-500"></div>
               <div className="bg-emerald-500 text-white text-xs px-2 py-1 rounded shadow-md font-bold">3x2 Timber Runner</div>
            </div>
          </div>
          <div className="p-4 text-sm text-slate-300">
            <p className="font-semibold text-primary mb-1">Installation Grid:</p>
            <p>Flat beams spaced at 400mm supporting hollow blocks. Temporarily supported by 3x2 timber and props at 0.6m intervals.</p>
          </div>
        </div>

        {/* Image 2: Finished */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="relative h-[350px] w-full">
            <Image 
              src="/beam-block-finished.jpg" 
              alt="SI-LATECH Finished Beam and Block Layout" 
              fill 
              className="object-cover"
            />
          </div>
          <div className="p-4 text-sm text-slate-300">
            <p className="font-semibold text-primary mb-1">Fully Laid Out Floor:</p>
            <p>The completed layout ready for the BRC mesh and 50mm concrete topping. A clean, precise, and highly efficient structural slab.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export function CalculatorShell({ initialProjectData }: { initialProjectData?: ProjectData | null }) {
  const { rooms, perRoomCalculations, addRoom, updateRoom, deleteRoom, loadProjectData, settings, setSettings } = useCalculator();

  // Load initial data when the component mounts or when initialProjectData changes
  useEffect(() => {
    loadProjectData(initialProjectData || null);
  }, [initialProjectData, loadProjectData]);


  return (
    <div id="calculator" className="container mx-auto max-w-7xl mt-8 px-4">
      <TechAdvantages />
      <ProcessGuide />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          
          {/* Beam Type Selector Card */}
          <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg font-bold text-slate-900 font-headline">Select Concrete Beam System</CardTitle>
              <CardDescription className="text-xs">Choose the structural beam system before inputting measurements.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Flat Beam Option */}
                <div 
                  onClick={() => setSettings(prev => ({ ...prev, beamType: 'flat' }))}
                  className={`cursor-pointer rounded-xl p-5 border-2 transition-all duration-300 relative select-none ${
                    settings.beamType !== 'tbeam' 
                      ? 'border-primary bg-sky-50/10 shadow-sm ring-1 ring-primary/10' 
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">Flat Beam System</h3>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Standard Residential</p>
                    </div>
                    {settings.beamType !== 'tbeam' && (
                      <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">ACTIVE</span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">Best for regular spans and cost-efficient residential floor systems.</p>
                  </div>
                </div>

                {/* T-Beam Option */}
                <div 
                  onClick={() => setSettings(prev => ({ ...prev, beamType: 'tbeam' }))}
                  className={`cursor-pointer rounded-xl p-5 border-2 transition-all duration-300 relative select-none ${
                    settings.beamType === 'tbeam' 
                      ? 'border-primary bg-sky-50/10 shadow-sm ring-1 ring-primary/10' 
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">T-Beam System</h3>
                      <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mt-0.5">Heavy Duty Span</p>
                    </div>
                    {settings.beamType === 'tbeam' && (
                      <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">ACTIVE</span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">Ideal for heavy loads, commercial spans, and industrial floor systems.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button onClick={addRoom} variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10 hover:text-primary h-12 font-bold">
              <PlusCircle className="mr-2" /> Add Room
            </Button>
            
            <Button 
                onClick={() => {
                    const realBtn = document.getElementById('real-invoice-btn');
                    if (realBtn) realBtn.click();
                }} 
                className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-white font-black shadow-md h-12"
            >
                <Download className="mr-2 h-5 w-5" /> Download Quote
            </Button>
          </div>

          <div className="space-y-8 pt-8 border-t border-slate-100">
            <QuickQuoteCard />
            <PlanReaderCard />
            <ActionsCard />
          </div>
        </div>

        <div className="space-y-8 lg:col-span-1">
          <SettingsCard />
          <TotalsCard />
        </div>
      </div>
      <TechnicalGuide />
    </div>
  );
}
