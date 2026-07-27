'use client';

import React from 'react';
import { Scale, Zap, Sparkles, Flame, Volume2, HardHat, Leaf } from 'lucide-react';

const benefits = [
  {
    icon: Scale,
    title: 'Reduced Dead Load',
    description: 'Lighter slabs reduce foundation stress and overall structural load.',
    color: 'text-amber-500 bg-amber-50 border-amber-200',
  },
  {
    icon: Zap,
    title: 'Fast Construction',
    description: 'Install beams and blocks in days with minimal timber propping needed.',
    color: 'text-blue-500 bg-blue-50 border-blue-200',
  },
  {
    icon: Sparkles,
    title: 'Level Ceilings',
    description: 'Flush soffit provides a clean finish ready for direct plastering.',
    color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
  },
  {
    icon: Flame,
    title: 'Thermal Comfort',
    description: 'Natural air insulation inside hollow block cavities keeps rooms cool.',
    color: 'text-orange-500 bg-orange-50 border-orange-200',
  },
  {
    icon: Volume2,
    title: 'Acoustic Insulation',
    description: 'Superior sound dampening barriers between upper and lower floors.',
    color: 'text-purple-500 bg-purple-50 border-purple-200',
  },
  {
    icon: HardHat,
    title: 'Manual Handling',
    description: 'Lightweight components are easily carried and installed by hand without cranes.',
    color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
  },
  {
    icon: Leaf,
    title: 'Eco-Friendly System',
    description: 'Drastically cuts down on timber usage, site waste, and environmental impact.',
    color: 'text-green-500 bg-green-50 border-green-200',
  },
];

export function WhyChooseSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200" id="why-choose">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-3">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-600">
            Engineered Efficiency
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Choose SI-LATECH Beam & Block Slabs?
          </h3>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Our precast system replaces traditional solid concrete slabs with engineered ribbed beams and hollow blocks for faster, smarter, and more economical building.
          </p>
        </div>

        {/* Responsive Grid: 2 cols on mobile/tablet, 3 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
