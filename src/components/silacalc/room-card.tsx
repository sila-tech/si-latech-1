import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Room, RoomCalculation, ConcreteCalculation, TimberAndPropsCalculation, TrapeziumData } from '@/lib/calculator';
import { Button } from '../ui/button';
import { Trash2, ChevronDown, ChevronUp, Table, Layers } from 'lucide-react';
import { useCalculator } from '@/context/calculator-context';

type RoomCardProps = {
  room: Room;
  calculations: {
    roomCalcs: RoomCalculation;
    concreteCalcs: ConcreteCalculation;
    timberCalcs: TimberAndPropsCalculation;
  };
  updateRoom: (id: string, keyOrUpdates: any, value?: any) => void;
  deleteRoom: (id: string) => void;
};

export function RoomCard({ room, calculations, updateRoom, deleteRoom }: RoomCardProps) {
  const { roomCalcs } = calculations;
  const { displayUnit } = useCalculator();

  const [localLength, setLocalLength] = useState('');
  const [localWidth, setLocalWidth] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  // Trapezium local state
  const isTrapezium = room.shape === 'trapezium' || !!room.trapezium;
  const [startSpan, setStartSpan] = useState(room.trapezium?.startSpan ? String(room.trapezium.startSpan) : '4.8');
  const [endSpan, setEndSpan] = useState(room.trapezium?.endSpan ? String(room.trapezium.endSpan) : '1.0');
  const [runLength, setRunLength] = useState(room.trapezium?.runLength ? String(room.trapezium.runLength) : '3.9');
  const [slantEdge, setSlantEdge] = useState(room.trapezium?.slantEdge ? String(room.trapezium.slantEdge) : '5.1');

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

  useEffect(() => {
    if (room.trapezium) {
      setStartSpan(String(room.trapezium.startSpan));
      setEndSpan(String(room.trapezium.endSpan));
      setRunLength(String(room.trapezium.runLength));
      if (room.trapezium.slantEdge) setSlantEdge(String(room.trapezium.slantEdge));
    }
  }, [room.trapezium]);

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

  const toggleTrapeziumMode = () => {
    if (!isTrapezium) {
      const sSpan = parseFloat(startSpan) || 4.8;
      const eSpan = parseFloat(endSpan) || 1.0;
      const rLen = parseFloat(runLength) || 3.9;
      const sEdge = parseFloat(slantEdge) || undefined;
      const trap: TrapeziumData = {
        startSpan: sSpan,
        endSpan: eSpan,
        runLength: rLen,
        slantEdge: sEdge,
      };
      updateRoom(room.id, {
        shape: 'trapezium',
        trapezium: trap,
        length: Math.max(sSpan, eSpan),
        width: rLen,
      });
      setShowSchedule(true);
    } else {
      updateRoom(room.id, {
        shape: 'rectangular',
        trapezium: undefined,
      });
      setShowSchedule(false);
    }
  };

  const handleTrapeziumFieldChange = (field: keyof TrapeziumData, val: string) => {
    if (field === 'startSpan') setStartSpan(val);
    if (field === 'endSpan') setEndSpan(val);
    if (field === 'runLength') setRunLength(val);
    if (field === 'slantEdge') setSlantEdge(val);

    const s = field === 'startSpan' ? parseFloat(val) : parseFloat(startSpan);
    const e = field === 'endSpan' ? parseFloat(val) : parseFloat(endSpan);
    const r = field === 'runLength' ? parseFloat(val) : parseFloat(runLength);
    const sl = field === 'slantEdge' ? (parseFloat(val) || undefined) : (parseFloat(slantEdge) || undefined);

    if (!isNaN(s) && !isNaN(e) && !isNaN(r)) {
      updateRoom(room.id, {
        shape: 'trapezium',
        trapezium: {
          startSpan: s,
          endSpan: e,
          runLength: r,
          slantEdge: sl,
        },
        length: Math.max(s, e),
        width: r,
      });
    }
  };

  const hasDimensions = isTrapezium
    ? (parseFloat(startSpan) > 0 && parseFloat(runLength) > 0)
    : (room.length > 0 && room.width > 0);

  const displayArea = isTrapezium && roomCalcs?.area
    ? roomCalcs.area
    : (room.length || 0) * (room.width || 0);

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-xs hover:shadow-sm transition-all duration-300 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-grow mr-2">
          <CardTitle className="flex-grow">
            <Input
              value={room.name}
              onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
              className="text-base font-black font-headline border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent focus:bg-white focus:px-2 focus:py-1 focus:border focus:border-slate-200 rounded-lg text-slate-800"
            />
          </CardTitle>
          <button
            type="button"
            onClick={toggleTrapeziumMode}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${
              isTrapezium
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle between rectangular and tapering/trapezium balcony"
          >
            <Layers size={13} />
            {isTrapezium ? 'Trapezium (Tapering)' : 'Rectangular'}
          </button>
        </div>
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
        {!isTrapezium ? (
          /* Standard Rectangular Inputs */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="w-full text-base sm:text-sm font-bold bg-slate-50/50 border-slate-200 focus-visible:ring-primary rounded-xl h-11 sm:h-12"
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
                className="w-full text-base sm:text-sm font-bold bg-slate-50/50 border-slate-200 focus-visible:ring-primary rounded-xl h-11 sm:h-12"
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
        ) : (
          /* Trapezium Tapering Balcony Inputs */
          <div className="space-y-3">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <div>
                <p className="font-bold">Trapezium Balcony / Tapering Slab</p>
                <p className="text-[11px] text-amber-700">Beams reduce in span across the run at SI-LATECH standard 550mm c/c spacing.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-600 uppercase">Start Span (m)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={startSpan}
                  onChange={(e) => handleTrapeziumFieldChange('startSpan', e.target.value)}
                  placeholder="e.g. 4.8"
                  className="font-bold text-sm bg-slate-50 rounded-lg h-10 border-slate-200"
                />
                <span className="text-[9px] text-slate-400 block">Wide end</span>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-600 uppercase">End Span (m)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={endSpan}
                  onChange={(e) => handleTrapeziumFieldChange('endSpan', e.target.value)}
                  placeholder="e.g. 1.0"
                  className="font-bold text-sm bg-slate-50 rounded-lg h-10 border-slate-200"
                />
                <span className="text-[9px] text-slate-400 block">Narrow end</span>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-600 uppercase">Run Length (m)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={runLength}
                  onChange={(e) => handleTrapeziumFieldChange('runLength', e.target.value)}
                  placeholder="e.g. 3.9"
                  className="font-bold text-sm bg-slate-50 rounded-lg h-10 border-slate-200"
                />
                <span className="text-[9px] text-slate-400 block">Perpendicular</span>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-600 uppercase">Slant Edge (m)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={slantEdge}
                  onChange={(e) => handleTrapeziumFieldChange('slantEdge', e.target.value)}
                  placeholder="e.g. 5.1"
                  className="font-bold text-sm bg-slate-50 rounded-lg h-10 border-slate-200"
                />
                <span className="text-[9px] text-slate-400 block">Railing (optional)</span>
              </div>
            </div>
          </div>
        )}

        {hasDimensions && roomCalcs && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                📐 {displayArea.toFixed(2)} m²
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                📏 {roomCalcs.invoiceBeamCount || 0} Beams ({((roomCalcs.invoiceTotalBeamLength || roomCalcs.actualTotalBeamLength || 0)).toFixed(1)}m)
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                🧱 {roomCalcs.totalBlocks || 0} Blocks
              </span>
            </div>

            {isTrapezium && roomCalcs.beamSchedule && (
              <button
                type="button"
                onClick={() => setShowSchedule(v => !v)}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-lg"
              >
                <Table size={13} />
                {showSchedule ? 'Hide Schedule' : `View Beam Schedule (${roomCalcs.beamSchedule.length} Beams)`}
                {showSchedule ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}

            {!isTrapezium && (
              <span className="text-[10px] text-slate-400 font-semibold italic">
                Bearing span: {(room.length || 0) <= (room.width || 0) ? `${(room.length || 0).toFixed(1)}m` : `${(room.width || 0).toFixed(1)}m`}
              </span>
            )}
          </div>
        )}

        {/* Detailed Beam Schedule Table for Trapezium */}
        {isTrapezium && showSchedule && roomCalcs?.beamSchedule && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tapering Precast Beam Schedule (550mm c/c)
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-1.5 px-2">Beam</th>
                    <th className="py-1.5 px-2">Position</th>
                    <th className="py-1.5 px-2">Clear Span</th>
                    <th className="py-1.5 px-2">+100mm Bearing</th>
                    <th className="py-1.5 px-2">Mfg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roomCalcs.beamSchedule.map((b) => (
                    <tr key={b.beamNumber} className="hover:bg-slate-50/80">
                      <td className="py-1 px-2 font-bold text-slate-800">Beam {b.beamNumber}</td>
                      <td className="py-1 px-2 text-slate-500">{b.position.toFixed(2)}m</td>
                      <td className="py-1 px-2 font-semibold text-slate-700">{b.clearSpan.toFixed(2)}m</td>
                      <td className="py-1 px-2 text-slate-600">{b.bearingLength.toFixed(2)}m</td>
                      <td className="py-1 px-2 font-bold text-primary">{b.mfgLength.toFixed(2)}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {roomCalcs.bayBreakdown && (
              <div className="mt-2 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700">Bays: </span>
                {roomCalcs.bayBreakdown.map((bay, idx) => (
                  <span key={bay.bayNumber} className="inline-block mr-2">
                    Bay {bay.bayNumber}: ~{bay.blocks} blks{idx < roomCalcs.bayBreakdown!.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
