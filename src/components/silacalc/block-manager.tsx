'use client';

import React, { useState } from 'react';
import { useCalculator } from '@/context/calculator-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PlusCircle,
  Trash2,
  Building2,
  Home,
  ChevronDown,
  ChevronRight,
  Link2,
  Unlink,
  Info,
} from 'lucide-react';
import type { BuildingBlock } from '@/lib/calculator';

function RoomBadge({
  roomId,
  blockId,
  aptId,
  onUnassign,
}: {
  roomId: string;
  blockId: string;
  aptId: string;
  onUnassign: (blockId: string, aptId: string, roomId: string) => void;
}) {
  const { rooms } = useCalculator();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-sky-200">
      {room.name}
      <button
        onClick={() => onUnassign(blockId, aptId, roomId)}
        className="ml-0.5 text-sky-400 hover:text-red-500 transition-colors"
        title="Remove from apartment"
      >
        ×
      </button>
    </span>
  );
}

function ApartmentRow({
  blockId,
  apt,
}: {
  blockId: string;
  apt: BuildingBlock['apartments'][number];
}) {
  const {
    rooms,
    updateApartmentName,
    deleteApartment,
    assignRoomToApartment,
    unassignRoomFromApartment,
  } = useCalculator();
  const [showPicker, setShowPicker] = useState(false);

  // Rooms not yet in this apartment
  const assignedInBlock = new Set(apt.roomIds);
  const availableRooms = rooms.filter(r => !assignedInBlock.has(r.id));

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Apartment header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
        <Home size={13} className="text-slate-400 shrink-0" />
        <Input
          value={apt.name}
          onChange={e => updateApartmentName(blockId, apt.id, e.target.value)}
          className="h-6 text-xs font-semibold border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent flex-1"
          placeholder="Apartment name"
        />
        <button
          onClick={() => deleteApartment(blockId, apt.id)}
          className="text-slate-300 hover:text-red-400 transition-colors ml-auto"
          title="Delete apartment"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Room pills */}
      <div className="px-3 py-2 flex flex-wrap gap-1.5 min-h-[36px]">
        {apt.roomIds.length === 0 ? (
          <span className="text-[11px] text-slate-400 italic">No rooms assigned</span>
        ) : (
          apt.roomIds.map(rid => (
            <RoomBadge
              key={rid}
              roomId={rid}
              blockId={blockId}
              aptId={apt.id}
              onUnassign={unassignRoomFromApartment}
            />
          ))
        )}
      </div>

      {/* Add room picker */}
      <div className="px-3 pb-2">
        {showPicker ? (
          <div className="border border-slate-200 rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto mt-1">
            {availableRooms.length === 0 ? (
              <p className="text-[11px] text-slate-400 p-2 italic">All rooms already assigned</p>
            ) : (
              availableRooms.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    assignRoomToApartment(blockId, apt.id, r.id);
                    setShowPicker(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-sky-50 hover:text-sky-700 transition-colors border-b border-slate-50 last:border-0"
                >
                  {r.name}
                  {r.length > 0 && r.width > 0 && (
                    <span className="ml-1 text-slate-400">({r.length}m × {r.width}m)</span>
                  )}
                </button>
              ))
            )}
            <button
              onClick={() => setShowPicker(false)}
              className="w-full text-center text-[10px] text-slate-400 py-1.5 border-t border-slate-100 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 mt-1 transition-colors"
          >
            <Link2 size={11} /> Assign room
          </button>
        )}
      </div>
    </div>
  );
}

function BlockCard({ block }: { block: BuildingBlock }) {
  const { updateBlockName, deleteBlock, addApartmentToBlock } = useCalculator();
  const [collapsed, setCollapsed] = useState(false);

  const totalRooms = block.apartments.reduce((s, a) => s + a.roomIds.length, 0);

  return (
    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50">
      {/* Block header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-white">
        <Building2 size={15} className="text-sky-400 shrink-0" />
        <Input
          value={block.name}
          onChange={e => updateBlockName(block.id, e.target.value)}
          className="h-6 text-sm font-bold border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent text-white placeholder:text-slate-400 flex-1"
          placeholder="Block name"
        />
        <span className="text-[10px] text-slate-400 shrink-0">
          {block.apartments.length} apt{block.apartments.length !== 1 ? 's' : ''} · {totalRooms} room{totalRooms !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>
        <button
          onClick={() => deleteBlock(block.id)}
          className="text-slate-400 hover:text-red-400 transition-colors"
          title="Delete block"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Apartments */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          {block.apartments.map(apt => (
            <ApartmentRow key={apt.id} blockId={block.id} apt={apt} />
          ))}
          <button
            onClick={() => addApartmentToBlock(block.id)}
            className="w-full text-[11px] text-slate-500 hover:text-sky-700 font-semibold border border-dashed border-slate-300 hover:border-sky-400 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle size={12} /> Add Apartment
          </button>
        </div>
      )}
    </div>
  );
}

export function BlockManagerPanel() {
  const { buildingBlocks, addBlock, totals, rooms } = useCalculator();
  const { sharedWallDeduction, rawLintelLength, totalLintelLength } = totals as any;

  const assignedRoomIds = new Set(
    buildingBlocks.flatMap(b => b.apartments.flatMap(a => a.roomIds))
  );
  const unassignedCount = rooms.filter(r => !assignedRoomIds.has(r.id)).length;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex gap-2.5 text-[11px] text-sky-700 items-start bg-sky-50 p-3 rounded-lg border border-sky-200">
        <Info size={14} className="text-sky-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-0.5">How Shared Wall Deduction Works</p>
          <p className="text-slate-600 leading-relaxed">
            Group rooms into <strong>apartments</strong> and apartments into <strong>blocks</strong>.
            Adjacent rooms in the same apartment share an <em>internal wall</em>.
            Adjacent apartments in the same block share a <em>party wall</em>.
            Rooms in different blocks share <strong>no</strong> walls.
            All shared walls are automatically deducted from the lintel length used to calculate steel.
          </p>
        </div>
      </div>

      {/* Deduction summary */}
      {buildingBlocks.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white border border-slate-200 rounded-lg p-2">
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Raw Lintel</p>
            <p className="text-sm font-bold text-slate-700">{(rawLintelLength || 0).toFixed(1)}m</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <p className="text-[10px] text-red-500 font-semibold uppercase">Deducted</p>
            <p className="text-sm font-bold text-red-600">−{(sharedWallDeduction || 0).toFixed(1)}m</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
            <p className="text-[10px] text-emerald-600 font-semibold uppercase">Net Lintel</p>
            <p className="text-sm font-bold text-emerald-700">{(totalLintelLength || 0).toFixed(1)}m</p>
          </div>
        </div>
      )}

      {/* Unassigned rooms warning */}
      {buildingBlocks.length > 0 && unassignedCount > 0 && (
        <div className="flex gap-2 text-[11px] text-amber-700 items-center bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          <Unlink size={13} className="shrink-0" />
          <span><strong>{unassignedCount} room{unassignedCount !== 1 ? 's' : ''}</strong> not assigned to any apartment — counted with full perimeter.</span>
        </div>
      )}

      {/* Block list */}
      <div className="space-y-3">
        {buildingBlocks.map(block => (
          <BlockCard key={block.id} block={block} />
        ))}
      </div>

      {/* Add block button */}
      <Button
        variant="outline"
        onClick={addBlock}
        className="w-full border-dashed border-slate-300 hover:border-sky-400 hover:text-sky-700 text-slate-500 text-xs font-bold h-10"
      >
        <Building2 size={14} className="mr-2" /> Add Building Block
      </Button>
    </div>
  );
}
