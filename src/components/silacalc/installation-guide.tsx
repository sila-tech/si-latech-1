
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Info, Ruler, Construction, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProcessGuide() {
  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 overflow-hidden mb-8">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-slate-800">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Info className="h-6 w-6 text-primary" />
          </div>
          How to Use the Calculator
        </CardTitle>
        <CardDescription className="text-slate-500 font-medium ml-12">Get your beams and blocks estimation in 2 simple steps</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
          {[
            { step: 1, title: 'Add Rooms', desc: 'Enter length and width for each room. You can also rename them (e.g., change "Room 1" to "Kitchen") by clicking the name.', icon: '📏' },
            { step: 2, title: 'Download Quote', desc: 'Instantly generate a quote showing total beam lengths and block quantities required for your project.', icon: '📄' },
          ].map((item) => (
            <div key={item.step} className="group flex flex-col gap-2 p-5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 text-4xl opacity-5 group-hover:opacity-10 transition-opacity">
                {item.icon}
              </div>
              <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center font-black shadow-sm">
                      {item.step}
                  </span>
                  <h4 className="font-bold text-slate-800">{item.title}</h4>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TechnicalGuide() {
  return (
    <Card className="border-none shadow-2xl overflow-hidden bg-slate-900 text-white ring-1 ring-white/10 mt-12 mb-12">
      <CardHeader className="border-b border-white/10 bg-white/5 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black flex items-center gap-3 text-white">
              <div className="p-2 bg-[#f59e0b]/20 rounded-lg">
                <Construction className="h-6 w-6 text-[#f59e0b]" />
              </div>
              Technical Installation Guide
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium ml-12">Pre-cast Beam & Block Slab System Specifications</CardDescription>
          </div>
          <Button 
              onClick={() => window.print()}
              className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-black px-6 py-6 h-auto shadow-lg shadow-orange-500/20 gap-3 rounded-xl transition-transform active:scale-95"
          >
            <Download className="h-5 w-5" />
            Download Diagrams
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {/* Beam Layout */}
          <div className="p-8 space-y-6 hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-3 text-[#f59e0b] font-black text-sm uppercase tracking-widest">
              <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                <Layout className="h-4 w-4" />
              </div>
              1. Beam Layout
            </div>
            <div className="aspect-square bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden p-6 group-hover:border-[#f59e0b]/30 transition-colors">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                <rect x="20" y="20" width="160" height="160" fill="none" stroke="#334155" strokeWidth="2" rx="4" />
                {[45, 85, 125, 165].map((x) => (
                  <g key={x}>
                    <rect x={x - 4} y="20" width="8" height="160" fill="#475569" rx="1" />
                    <line x1={x} y1="20" x2={x} y2="180" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                  </g>
                ))}
                <path d="M45 100 H85" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                <text x="65" y="90" fontSize="8" fill="#f59e0b" textAnchor="middle" fontWeight="bold">550mm</text>
                <text x="100" y="190" fontSize="7" fill="#64748b" textAnchor="middle" fontWeight="bold">SHORT SPAN DIRECTION</text>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                  </marker>
                </defs>
              </svg>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Beams must be laid parallel to the <span className="text-white font-bold">shorter span</span> of the room to ensure maximum structural integrity.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#f59e0b] font-bold bg-[#f59e0b]/10 p-2 rounded-lg border border-[#f59e0b]/20">
                  <Ruler className="h-3.5 w-3.5" />
                  Spacing: 550mm Center-to-Center
              </div>
            </div>
          </div>

          {/* Block Layout */}
          <div className="p-8 space-y-6 hover:bg-white/5 transition-colors group border-white/10">
            <div className="flex items-center gap-3 text-[#f59e0b] font-black text-sm uppercase tracking-widest">
              <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                <Ruler className="h-4 w-4" />
              </div>
              2. Block Infill
            </div>
            <div className="aspect-square bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden p-6 group-hover:border-[#f59e0b]/30 transition-colors">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                <rect x="30" y="20" width="12" height="160" fill="#334155" rx="1" />
                <rect x="158" y="20" width="12" height="160" fill="#334155" rx="1" />
                {[25, 65, 105, 145].map((y) => (
                  <g key={y}>
                      <rect x="42" y={y} width="116" height="35" fill="#475569" rx="2" />
                      <rect x="52" y={y+5} width="46" height="25" fill="#1e293b" rx="2" />
                      <rect x="102" y={y+5} width="46" height="25" fill="#1e293b" rx="2" />
                  </g>
                ))}
                <text x="100" y="115" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">BLOCK: 400x200mm</text>
              </svg>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Standard <span className="text-white font-bold">400x200mm hollow blocks</span> are used for infill. Ensure blocks are seated properly on the beam flanges.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#f59e0b] font-bold bg-[#f59e0b]/10 p-2 rounded-lg border border-[#f59e0b]/20">
                  <Info className="h-3.5 w-3.5" />
                  Block Count: ~10 blocks per m²
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-medium italic">
                @si-latech, a better simpler and cost effective way to build.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
