'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, ShoppingBag, Calculator, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0a0f1d] text-white py-16 md:py-24 border-b border-slate-800">
      {/* Subtle architectural background texture */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <Image
          src="/beam-block-real.jpg"
          alt="SI-LATECH Precast Slab"
          fill
          priority
          className="object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d] via-[#0a0f1d]/90 to-[#0a0f1d]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          {/* Executive Tag */}
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/25 px-4 py-1.5 text-xs font-bold text-amber-400 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Factory Direct • Ruiru Industrial Hub</span>
          </div>

          {/* Luxury Punchy Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Precast &amp; EcoSlabs
          </h1>

          {/* Concise Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Order prestressed concrete beams, EcoSlabs &amp; hollow infill blocks directly from the manufacturer, or calculate exact materials and download your quote in seconds.
          </p>

          {/* The Two Primary Action Pillars */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-8 py-6 text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <a href="#marketplace">
                <ShoppingBag className="h-4 w-4" />
                Shop Marketplace
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white font-bold px-8 py-6 text-sm rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 hover:border-slate-600"
            >
              <a href="#calculator">
                <Calculator className="h-4 w-4 text-amber-400" />
                Calculate Slab Materials
              </a>
            </Button>
          </div>

          {/* Minimal Key Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>C50/60 Prestressed Strength</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>NO Formwork Needed on T-Beams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <span>Nationwide Site Offloading</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
