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
  
  const isLengthShorter = length <= width;
  const beamLength = shorter;
  const spanLength = longer;
  
  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-slate-900">{roomName}</h4>
          <p className="text-xs text-slate-500">{width.toFixed(2)}m × {length.toFixed(2)}m</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-primary uppercase">
            {showInternal ? `${layout.beamCount} Actual Beams` : `${calc.invoiceBeamCount} Beams`}
          </p>
          <p className="text-xs font-bold text-[#f59e0b] uppercase">{calc.totalBlocks} Blocks</p>
          {showInternal && (
            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
               (+{calc.profitBeams} Profit Beams)
            </p>
          )}
        </div>
      </div>
      
      <div className="relative bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner flex items-center justify-center p-8" style={{ height: '350px' }}>
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
            // Beams start at one spacing interval from the wall
            const pos = (layout.beamSpacing + i * layout.unitSpan) * scale;
            const bWidth = layout.beamWidth * scale;
            
            return (
              <g key={i}>
                {/* Beam */}
                {isLengthShorter ? (
                   <rect x={20 + pos} y="20" width={bWidth} height={svgHeight} fill="#475569" rx="1" />
                ) : (
                   <rect x="20" y={20 + pos} width={svgWidth} height={bWidth} fill="#475569" rx="1" />
                )}
              </g>
            );
          })}

          {/* Block Indicator Groups */}
          {Array.from({ length: layout.beamCount + 1 }).map((_, i) => {
            // Block rows are between supports (Wall-Beam, Beam-Beam, or Beam-Wall)
            const rowCenterPos = (i * layout.unitSpan + layout.beamSpacing / 2) * scale;
            
            return (
              <g key={`row-${i}`}>
                {Array.from({ length: layout.blocksPerRow }).map((_, j) => {
                  const blockPos = (j * (calc.shorter / layout.blocksPerRow) + (calc.shorter / layout.blocksPerRow) / 2) * scale;
                  
                  return (
                    <rect 
                      key={j}
                      x={isLengthShorter ? 20 + rowCenterPos - 8 : 20 + blockPos - 8}
                      y={isLengthShorter ? 20 + blockPos - 8 : 20 + rowCenterPos - 8}
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
                x={isLengthShorter ? 20 + (spanLength * scale) - 5 : 20 + (svgWidth / 2)}
                y={isLengthShorter ? 20 + (svgHeight / 2) : 20 + (spanLength * scale) - 5}
                fontSize="10" fill="#ef4444" fontWeight="bold" textAnchor="middle"
                transform={isLengthShorter ? `rotate(-90, ${20 + (spanLength * scale) - 5}, ${20 + (svgHeight / 2)})` : ''}
              >
                GAP: {(layout.gapAtEnd * 1000).toFixed(0)}mm
              </text>
            </g>
          )}
        </svg>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Installation Tip</p>
          <p className="text-xs text-slate-600 mt-1">
            {layout.needsExtraBeam 
              ? "End gap requires an extra beam for support." 
              : "End gap is small. Use a half-block or infill."}
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Layout Specs</p>
          <p className="text-xs text-slate-600 mt-1">
            {showInternal ? (
              <>
                Beams: {layout.beamCount} × {shorter.toFixed(2)}m
                <br />
                Blocks: {calc.totalBlocks} pcs
              </>
            ) : (
              <>
                Total Area: {(length * width).toFixed(2)} m²
                <br />
                Invoiced Beams: {calc.invoiceBeamCount} pcs
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
