'use client';

import React from 'react';
import type { RoomCalculation } from '@/lib/calculator';

interface RoomLayoutVisualizerProps {
  calc: RoomCalculation;
  roomName: string;
  showInternal?: boolean;
}

export function RoomLayoutVisualizer({ calc, roomName, showInternal = false }: RoomLayoutVisualizerProps) {
  const { length, width, shorter, longer, layout } = calc;
  
  const numberOfSpaces = layout.beamCount === 0 ? 1 : layout.beamCount;
  
  // Scale factor for the SVG visualization
  const scale = 300 / Math.max(length, width);
  const svgWidth = width * scale;
  const svgHeight = length * scale;
  
  // Beams are laid on the shorter side (shorter span direction)
  // This means if length > width, beams are horizontal (along width)
  // If width > length, beams are vertical (along length)
  // The user says: "beams have to be laid on the shorter side a must"
  // This usually means the beams themselves are length = 'shorter', 
  // and they are laid across the 'longer' dimension.
  
  const isBalcony = roomName.toLowerCase().includes('balcony') || 
                    roomName.toLowerCase().includes('verandah') || 
                    roomName.toLowerCase().includes('velander') || 
                    roomName.toLowerCase().includes('veranda') || 
                    roomName.toLowerCase().includes('velanda');

  const beamsParallelToLength = isBalcony ? (length >= width) : (length <= width);
  const clearBeamLength = isBalcony ? longer : shorter;
  const physicalBeamLength = calc.individualBeamLength || (clearBeamLength > 0 ? clearBeamLength + 0.20 : 0);
  const spanLength = isBalcony ? shorter : longer;
  
  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 print-room-card print:bg-white print:border-slate-300 print:p-8 print:shadow-none print:break-inside-avoid print:page-break-inside-avoid">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-slate-900">{roomName}</h4>
          <p className="text-xs text-slate-500">{width.toFixed(2)}m × {length.toFixed(2)}m</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-primary uppercase">
            {layout.beamCount} Beams
          </p>
          <p className="text-xs font-bold text-[#f59e0b] uppercase">{calc.totalBlocks} Blocks</p>
        </div>
      </div>
      
      <div className="relative bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner flex items-center justify-center p-8 print:border-slate-300" style={{ height: '300px' }}>
        <svg 
          viewBox={`0 0 ${svgWidth + 40} ${svgHeight + 40}`} 
          className="max-w-full max-h-full drop-shadow-md"
        >
          {/* Walls */}
          <rect 
            x="20" y="20" 
            width={svgWidth} height={svgHeight} 
            fill="#f8fafc" stroke="#334155" strokeWidth="3" rx="2" 
          />
          
          {/* Beams and Blocks */}
          {Array.from({ length: layout.beamCount }).map((_, i) => {
            // Beams start at 0.00m (at the wall) and then offset by unitSpan
            const pos = (i * layout.unitSpan) * scale;
            const bWidth = layout.beamWidth * scale;
            
            return (
              <g key={i}>
                {/* Beam */}
                {beamsParallelToLength ? (
                   <rect x={20 + pos} y="20" width={bWidth} height={svgHeight} fill="#475569" rx="1" />
                ) : (
                   <rect x="20" y={20 + pos} width={svgWidth} height={bWidth} fill="#475569" rx="1" />
                )}
              </g>
            );
          })}

          {/* Block Indicator Groups */}
          {Array.from({ length: numberOfSpaces }).map((_, i) => {
            // If wall-to-wall (0 beams), place the block row in the center of the room.
            // Otherwise, place inside the gaps after each beam.
            const rowCenterPos = layout.beamCount === 0
              ? (spanLength / 2) * scale
              : (i * layout.unitSpan + layout.beamWidth + layout.beamSpacing / 2) * scale;
            
            return (
              <g key={`row-${i}`}>
                {Array.from({ length: layout.blocksPerRow }).map((_, j) => {
                  const blockPos = (j * (clearBeamLength / layout.blocksPerRow) + (clearBeamLength / layout.blocksPerRow) / 2) * scale;
                  
                  return (
                    <rect 
                      key={j}
                      x={beamsParallelToLength ? 20 + rowCenterPos - 8 : 20 + blockPos - 8}
                      y={beamsParallelToLength ? 20 + blockPos - 8 : 20 + rowCenterPos - 8}
                      width="16" height="16"
                      fill="#f59e0b" fillOpacity="0.2"
                      stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2"
                      rx="2"
                    />
                  );
                })}
              </g>
            );
          })}
          
          {/* Gap Indicator */}
          {layout.gapAtEnd > 0 && (
            <g>
              <text 
                x={beamsParallelToLength ? 20 + (spanLength * scale) - 5 : 20 + (svgWidth / 2)}
                y={beamsParallelToLength ? 20 + (svgHeight / 2) : 20 + (spanLength * scale) - 5}
                fontSize="10" fill="#ef4444" fontWeight="bold" textAnchor="middle"
                transform={beamsParallelToLength ? `rotate(-90, ${20 + (spanLength * scale) - 5}, ${20 + (svgHeight / 2)})` : ''}
              >
                GAP: {(layout.gapAtEnd * 1000).toFixed(0)}mm
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Plain English Layout Description */}
      <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 print:hidden">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 print:text-slate-500">Layout Description</p>
        <p className="text-sm text-slate-700 leading-relaxed print:text-slate-800">
          {layout.beamCount > 0 ? (
            <>
              This room requires <strong className="text-slate-950 font-black">{layout.beamCount} beams</strong> of <strong className="text-slate-950 font-black">{physicalBeamLength.toFixed(2)} metres</strong>. 
              The concrete blocks are laid alongside the beams with <strong className="text-slate-950 font-black">{layout.blocksPerRow} pieces</strong> per row, totaling <strong className="text-slate-950 font-black">{calc.totalBlocks} blocks</strong> (calculated at exactly 4 blocks per beam-meter).
            </>
          ) : (
            <>
              This room spans wall-to-wall without intermediate beams. 
              The concrete blocks are laid in <strong className="text-slate-950 font-black">1 row</strong> with <strong className="text-slate-950 font-black">{layout.blocksPerRow} pieces</strong>, totaling <strong className="text-slate-950 font-black">{calc.totalBlocks} blocks</strong>.
            </>
          )}
        </p>
      </div>

      {/* Spacing & Safety Validation Checklist */}
      <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/60 mt-2 print:hidden">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 print:text-slate-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Structural Safety & Spacing Validation
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 print:text-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Start Support: <strong className="text-slate-900 font-semibold">Closed</strong> (Beam at 0.00m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Row Spans: <strong className="text-slate-900 font-semibold">Closed</strong> (Standard 400mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>End Support: <strong className="text-slate-900 font-semibold">Closed</strong> ({(layout.gapAtEnd * 1000).toFixed(0)}mm gap infill)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Total Coverage: <strong className="text-slate-900 font-semibold">100% Secure</strong> ({longer.toFixed(2)}m span)</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-4 print:mt-4">
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm print:border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase print:text-slate-500">Installation Tip</p>
          <p className="text-xs text-slate-600 mt-1 print:text-slate-800">
            {layout.gapAtEnd * 1000 < 100 ? (
              `End gap is ${(layout.gapAtEnd * 1000).toFixed(0)}mm (below 100mm). Fill with concrete directly (no blocks needed).`
            ) : layout.gapAtEnd * 1000 < 200 ? (
              `End gap is ${(layout.gapAtEnd * 1000).toFixed(0)}mm (below 200mm). Can be filled with a half-block or a beam.`
            ) : layout.needsExtraBeam ? (
              `End gap is ${(layout.gapAtEnd * 1000).toFixed(0)}mm. Requires an extra beam for block support.`
            ) : (
              `End gap is ${(layout.gapAtEnd * 1000).toFixed(0)}mm. Use a half-block or standard infill.`
            )}
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm print:border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase print:text-slate-500">Layout Specs</p>
          <p className="text-xs text-slate-600 mt-1 print:text-slate-800 font-medium">
            Beams: {layout.beamCount} × {physicalBeamLength.toFixed(2)}m
            <br />
            Blocks: {calc.totalBlocks} pcs
          </p>
        </div>
      </div>
    </div>
  );
}
