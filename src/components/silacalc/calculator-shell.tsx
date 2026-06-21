
'use client';

import React, { useEffect, useState } from 'react';
import { RoomCard } from './room-card';
import { ActionsCard } from './actions-card';
import { SettingsCard } from './settings-card';
import { TotalsCard } from './totals-card';
import { BlockManagerPanel } from './block-manager';
import { PlusCircle, Download, LayoutGrid, Star, Users, Layers, Zap, ClipboardList, FileDown, ChevronRight, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalculator } from '@/context/calculator-context';
import { QuickQuoteCard } from './quick-quote-card';
import { PlanReaderCard } from './plan-reader-card';

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

function SocialProofBanner() {
  const stats = [
    { value: '500+', label: 'Projects Quoted', icon: <Star size={18} className="text-[#f59e0b]" /> },
    { value: '3+', label: 'Years in Business', icon: <Users size={18} className="text-emerald-400" /> },
    { value: 'Up to 30%', label: 'Cost Savings', icon: <Zap size={18} className="text-sky-400" /> },
  ];
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl px-6 py-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-700">
      <p className="text-white text-sm font-semibold text-center sm:text-left">
        <span className="text-[#f59e0b] font-black">Trusted by 500+ contractors</span> across Kenya for beam & block estimates
      </p>
      <div className="flex items-center gap-6">
        {stats.map(({ value, label, icon }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              {icon}
              <span className="text-white font-black text-base">{value}</span>
            </div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 3-step How It Works banner shown above the calculator grid */
function HowItWorks() {
  const steps = [
    {
      num: 1,
      icon: <ClipboardList size={22} className="text-primary" />,
      title: 'Add Rooms',
      desc: 'Enter the length & width of each room or area. Rename them for clarity (e.g., "Living Room", "Bedroom 1").',
    },
    {
      num: 2,
      icon: <Zap size={22} className="text-amber-500" />,
      title: 'Instant Calculations',
      desc: 'Quantities for beams, blocks, cement, BRC mesh, sand & ballast update automatically in real time.',
    },
    {
      num: 3,
      icon: <FileDown size={22} className="text-emerald-500" />,
      title: 'Download Quote',
      desc: 'Generate a professional PDF quote or share your summary instantly via WhatsApp.',
    },
  ];
  return (
    <div className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">How It Works</p>
        <h2 className="text-xl font-black text-slate-900">Get your estimate in 3 simple steps</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 px-2 pb-4 pt-2">
        {steps.map(({ num, icon, title, desc }, i) => (
          <div key={num} className="flex items-start gap-4 p-4 group">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                {icon}
              </div>
              {i < steps.length - 1 && (
                <ChevronRight size={14} className="text-slate-300 mt-2 hidden sm:block rotate-90 sm:rotate-0" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black text-slate-400">STEP {num}</span>
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1">{title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Quick-access "I know my total area" shortcut above the rooms grid */
function QuickEntryToggle() {
  const [mode, setMode] = useState<'rooms' | 'quick'>('rooms');
  return (
    <div className="mb-6 flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
      <button
        onClick={() => setMode('rooms')}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
          mode === 'rooms' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        📐 Enter by Room
      </button>
      <button
        onClick={() => setMode('quick')}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
          mode === 'quick' ? 'bg-white text-[#f59e0b] shadow-sm' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        ⚡ I Know My Total Area
      </button>
    </div>
  );
}

function RoomsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
        <LayoutGrid size={32} className="text-primary" />
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-1">No Rooms Added Yet</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">
        Add each room or area of your slab. You can rename them (e.g., "Living Room", "Kitchen") and enter their dimensions.
      </p>
      <Button onClick={onAdd} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-11 rounded-xl">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Room
      </Button>
    </div>
  );
}

export function CalculatorShell({ initialProjectData }: { initialProjectData?: ProjectData | null }) {
  const { rooms, perRoomCalculations, addRoom, updateRoom, deleteRoom, loadProjectData, settings, setSettings, displayUnit, setDisplayUnit, buildingBlocks, totals } = useCalculator();

  // Toggle between "enter by room" and "quick total area" mode
  const [entryMode, setEntryMode] = useState<'rooms' | 'quick'>('rooms');
  // Toggle shared walls panel
  const [showSharedWalls, setShowSharedWalls] = useState(false);

  // Load initial data when the component mounts or when initialProjectData changes
  useEffect(() => {
    loadProjectData(initialProjectData || null);
  }, [initialProjectData, loadProjectData]);


  return (
    <div id="calculator" className="container mx-auto max-w-7xl mt-8 px-4">
      <SocialProofBanner />
      <TechAdvantages />
      <HowItWorks />
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

          {/* Entry Mode Toggle */}
          <div className="mb-2">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit mb-6">
              <button
                onClick={() => setEntryMode('rooms')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'rooms' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📐 Enter by Room
              </button>
              <button
                onClick={() => setEntryMode('quick')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'quick' ? 'bg-white text-[#f59e0b] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚡ I Know My Total Area
              </button>
            </div>

            {/* Quick Quote mode — shown inline when selected */}
            {entryMode === 'quick' && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-1">
                  <QuickQuoteCard />
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Or switch to{' '}
                  <button onClick={() => setEntryMode('rooms')} className="text-primary font-semibold hover:underline">
                    room-by-room entry
                  </button>{' '}
                  for more detailed calculations.
                </p>
              </div>
            )}
          </div>

          {/* Rooms section — always visible */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight font-headline">Rooms</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDisplayUnit('m')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                    displayUnit === 'm'
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                >
                  Meters (m)
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayUnit('ft')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                    displayUnit === 'ft'
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                >
                  Feet (ft)
                </button>
              </div>
            </div>
            {rooms.length === 0 ? (
              <RoomsEmptyState onAdd={addRoom} />
            ) : (
              rooms.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  calculations={perRoomCalculations[i]}
                  updateRoom={updateRoom}
                  deleteRoom={deleteRoom}
                />
              ))
            )}
          </div>

          {/* ─── Shared Walls / Block Manager ─── */}
          {rooms.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
              <button
                onClick={() => setShowSharedWalls(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                  <Building2 size={16} className="text-sky-500" />
                  Shared Walls (Multi-Unit / Apartment)
                  {buildingBlocks.length > 0 && (() => {
                    const deduction = (totals as any).sharedWallDeduction || 0;
                    return deduction > 0 ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        −{deduction.toFixed(1)}m deducted
                      </span>
                    ) : null;
                  })()}
                </span>
                {showSharedWalls ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </button>
              {showSharedWalls && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                  <BlockManagerPanel />
                </div>
              )}
            </div>
          )}

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
            <PlanReaderCard />
            <ActionsCard />
          </div>
        </div>

        <div className="space-y-8 lg:col-span-1">
          <SettingsCard />
          <TotalsCard />
        </div>
      </div>
    </div>
  );
}
