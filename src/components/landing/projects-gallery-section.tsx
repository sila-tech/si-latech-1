'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Maximize2, Clock, CheckCircle2, Layers, Info } from 'lucide-react';

const projects = [
  {
    image: '/beam-block-real.jpg',
    title: 'Kiambu Residential Villa',
    location: 'Ruiru, Kiambu',
    area: '120 m²',
    timeSaved: 'Installed in 2 Days',
    tag: 'Flat Beam System',
  },
  {
    image: '/beam-block-finished.jpg',
    title: 'Nairobi Commercial Extension',
    location: 'Westlands, Nairobi',
    area: '280 m²',
    timeSaved: 'Installed in 4 Days',
    tag: 'T-Beam System',
  },
];

const legendItems = [
  { id: '1', title: 'Flat Precast Beam', desc: 'Pre-stressed high-strength concrete ribbed beam.' },
  { id: '2', title: 'Hollow Concrete Block', desc: 'Lightweight infill block creating air cavities for thermal & acoustic insulation.' },
  { id: '3', title: '400mm Spacing', desc: 'Standard clear distance between beam centers for maximum load distribution.' },
  { id: '4', title: 'Temporary Timber Props', desc: '3x2 timber runners supporting beams during concrete topping pour.' },
];

export function ProjectsGallerySection() {
  return (
    <section className="py-16 md:py-24 bg-slate-900 text-white border-b border-slate-800" id="projects">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400">
            Real Site Success
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Completed Projects & Installation Grid
          </h3>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            See our precast beam and block slabs installed across residential and commercial sites in Kenya.
          </p>
        </div>

        {/* Annotated Installation Diagram Feature (High Legibility Fix) */}
        <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/80 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">System Blueprint</span>
              <h4 className="text-xl font-bold text-white">Annotated Slab Installation Grid</h4>
            </div>
            <span className="text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full">
              Verified Structural Layout
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Image Container with Numbered Callout Pin Overlays */}
            <div className="lg:col-span-7 relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
              <Image
                src="/beam-block-real.jpg"
                alt="SI-LATECH Annotated Beam & Block Installation"
                fill
                className="object-cover brightness-95"
              />
              <div className="absolute inset-0 bg-slate-950/20" />

              {/* Pin 1: Precast Beam */}
              <div className="absolute top-[35%] left-[25%] flex items-center gap-2 bg-slate-950/90 border border-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xl backdrop-blur-md">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black">1</span>
                <span>Precast Beam</span>
              </div>

              {/* Pin 2: Hollow Block */}
              <div className="absolute top-[52%] left-[50%] flex items-center gap-2 bg-slate-950/90 border border-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xl backdrop-blur-md">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-black">2</span>
                <span>Hollow Block</span>
              </div>

              {/* Pin 3: 400mm Spacing */}
              <div className="absolute top-[25%] right-[15%] flex items-center gap-2 bg-slate-950/90 border border-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xl backdrop-blur-md">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black">3</span>
                <span>400mm Spacing</span>
              </div>

              {/* Pin 4: Timber Support */}
              <div className="absolute bottom-[20%] left-[35%] flex items-center gap-2 bg-slate-950/90 border border-purple-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xl backdrop-blur-md">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center font-black">4</span>
                <span>Timber Runner</span>
              </div>
            </div>

            {/* Legend Below / Beside Image */}
            <div className="lg:col-span-5 space-y-3">
              <h5 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-400" />
                Installation Legend
              </h5>

              <div className="space-y-3">
                {legendItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      {item.id}
                    </span>
                    <div>
                      <h6 className="text-sm font-bold text-white">{item.title}</h6>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Site Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((proj, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/80 shadow-xl transition-all duration-300 hover:border-amber-500/50"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={proj.image}
                  alt={proj.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {proj.tag}
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                  <h4 className="text-xl font-bold text-white">{proj.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-md backdrop-blur-md border border-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      {proj.location}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-md backdrop-blur-md border border-slate-700">
                      <Maximize2 className="h-3.5 w-3.5 text-blue-400" />
                      {proj.area}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-md backdrop-blur-md border border-slate-700">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      {proj.timeSaved}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
