
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
  // Wizard Mode states
  const [wizardMode, setWizardMode] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Load initial data when the component mounts or when initialProjectData changes
  useEffect(() => {
    loadProjectData(initialProjectData || null);
  }, [initialProjectData, loadProjectData]);


  return (
    <div id="calculator-builder" className="container mx-auto max-w-7xl px-2 sm:px-4">

      {/* Mode Toggle Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs mb-6">
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-800">Calculator Mode</span>
          <span className="text-xs text-slate-400">Choose between a guided step-by-step wizard or the advanced dashboard</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit self-end sm:self-auto">
          <button
            onClick={() => setWizardMode(false)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
              !wizardMode ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚡ Advanced Dashboard
          </button>
          <button
            onClick={() => setWizardMode(true)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
              wizardMode ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🧙‍♂️ Guided Wizard
          </button>
        </div>
      </div>

      {wizardMode ? (
        // Guided Wizard Layout
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-12 space-y-6">
          {/* Steps Indicator Bar */}
          <div className="flex items-center justify-between max-w-md mx-auto mb-8 relative px-4">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 -z-10" />
            <div 
              className="absolute top-1/2 left-4 h-0.5 bg-primary -translate-y-1/2 -z-10 transition-all duration-500" 
              style={{ width: wizardStep === 1 ? '0%' : wizardStep === 2 ? '50%' : '100%' }}
            />
            
            {[
              { num: 1, label: 'Beam System' },
              { num: 2, label: 'Rooms' },
              { num: 3, label: 'Quote & Order' }
            ].map(({ num, label }) => (
              <button 
                key={num}
                onClick={() => setWizardStep(num)}
                className="flex flex-col items-center gap-2 group focus:outline-none"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border duration-300 ${
                  wizardStep === num 
                    ? 'bg-primary border-primary text-white ring-4 ring-primary/10' 
                    : wizardStep > num 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'
                }`}>
                  {num}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${
                  wizardStep === num ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
                }`}>{label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[300px] py-4">
            {/* Step 1: Beam Selection */}
            {wizardStep === 1 && (
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-slate-900 font-headline">Select Concrete Beam System</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">Choose the concrete beam spacing style for your construction slab. Flat is standard for residential homes, while T-Beam is designed for heavy-duty spans.</p>
                </div>
                
                {/* Beam Selector (Flat vs T-beam) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Flat Beam Option */}
                  <div 
                    onClick={() => setSettings(prev => ({ ...prev, beamType: 'flat' }))}
                    className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 relative select-none ${
                      settings.beamType !== 'tbeam' 
                        ? 'border-primary bg-sky-50/10 shadow-sm ring-1 ring-primary/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-lg">Flat Beam System</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Standard Residential</p>
                      </div>
                      {settings.beamType !== 'tbeam' && (
                        <span className="bg-primary text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed italic">Best for regular spans and cost-efficient residential floor systems. Spaced at standard center-to-center offsets.</p>
                  </div>

                  {/* T-Beam Option */}
                  <div 
                    onClick={() => setSettings(prev => ({ ...prev, beamType: 'tbeam' }))}
                    className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 relative select-none ${
                      settings.beamType === 'tbeam' 
                        ? 'border-primary bg-sky-50/10 shadow-sm ring-1 ring-primary/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-lg">T-Beam System</h4>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">Heavy Duty Span</p>
                      </div>
                      {settings.beamType === 'tbeam' && (
                        <span className="bg-primary text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed italic">Ideal for heavy loads, commercial spans, and industrial floor systems. Designed for maximum structural support.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button 
                    onClick={() => setWizardStep(2)}
                    className="bg-primary hover:bg-primary/95 text-white font-bold h-12 px-8 rounded-xl shadow-md"
                  >
                    Continue to Rooms <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Room Inputs */}
            {wizardStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                <div className="text-center space-y-1 mb-4">
                  <h3 className="text-xl font-black text-slate-900 font-headline">Enter Room Dimensions</h3>
                  <p className="text-sm text-slate-500">Add each room of your slab. Specify length and width to calculate beams and blocks.</p>
                </div>
                
                {/* Rooms display controls */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-xs font-bold text-slate-500">Unit System:</span>
                  <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDisplayUnit('m')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        displayUnit === 'm' ? 'bg-white text-primary shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Meters (m)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayUnit('ft')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        displayUnit === 'ft' ? 'bg-white text-primary shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Feet (ft)
                    </button>
                  </div>
                </div>

                {/* Rooms cards */}
                <div className="space-y-4">
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

                {/* Shared Walls / Block Manager */}
                {rooms.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button
                      onClick={() => setShowSharedWalls(v => !v)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <span className="flex items-center gap-2.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                        <Building2 size={16} className="text-sky-500" />
                        Shared Walls (Multi-Unit / Apartment)
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

                {/* Add room / navigation buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                  <Button onClick={addRoom} variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10 h-12 font-bold rounded-xl">
                    <PlusCircle className="mr-2" /> Add Another Room
                  </Button>
                  <div className="flex gap-3 flex-1">
                    <Button 
                      onClick={() => setWizardStep(1)} 
                      variant="ghost" 
                      className="flex-1 h-12 font-bold rounded-xl text-slate-500 border border-slate-200 hover:bg-slate-50"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={() => setWizardStep(3)} 
                      disabled={rooms.length === 0}
                      className="bg-primary hover:bg-primary/95 text-white font-bold h-12 flex-1 rounded-xl shadow-md"
                    >
                      View Summary <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-8 pt-8 border-t border-slate-100">
                  <PlanReaderCard />
                </div>
              </div>
            )}

            {/* Step 3: Summary / Quote */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
                <div className="text-center space-y-1 mb-4">
                  <h3 className="text-xl font-black text-slate-900 font-headline">Estimate Summary & Options</h3>
                  <p className="text-sm text-slate-500">Your beam and block materials invoice details are ready. You can download the PDF quote or place an order directly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: TotalsCard */}
                  <div>
                    <TotalsCard />
                  </div>
                  
                  {/* Right Column: ActionsCard & Next Steps */}
                  <div className="space-y-6">
                    <SettingsCard />
                    <ActionsCard />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <Button 
                    onClick={() => setWizardStep(2)} 
                    variant="outline" 
                    className="flex-1 h-12 font-bold rounded-xl border-slate-200 text-slate-500"
                  >
                    Back to Rooms
                  </Button>
                  <Button 
                    onClick={() => {
                      setWizardStep(1);
                      setWizardMode(false);
                    }} 
                    variant="ghost" 
                    className="flex-1 h-12 font-bold rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  >
                    Reset & Exit Wizard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Standard Advanced Dashboard Grid (Rendered if wizardMode = false)
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
                        <span className="bg-primary text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">ACTIVE</span>
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
              <Button onClick={addRoom} variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10 hover:text-primary h-12 font-bold rounded-xl">
                <PlusCircle className="mr-2" /> Add Room
              </Button>
              
              <Button 
                  onClick={() => {
                      const realBtn = document.getElementById('real-invoice-btn');
                      if (realBtn) realBtn.click();
                  }} 
                  className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-white font-black shadow-md h-12 rounded-xl"
              >
                  <Download className="mr-2 h-5 w-5" /> Download Quote
              </Button>
            </div>

            <div className="space-y-8 pt-8 border-t border-slate-100">
              <PlanReaderCard />
              <ActionsCard />
            </div>
          </div>

          <div className="space-y-8 lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
            <SettingsCard />
            <TotalsCard />
          </div>
        </div>
      )}
    </div>
  );
}
