'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ShoppingBag, Calculator, ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HERO_SLIDES = [
  {
    id: 'tbeam-1',
    src: '/hero-tbeams/tbeam-hero-1.webp',
    fallback: '/hero-tbeams/tbeam-hero-1.jpg',
    title: 'Precast T-Beams Suspended',
    detail: 'Zero Timber Shuttering Required',
    tag: 'No Formwork Needed',
  },
  {
    id: 'tbeam-2',
    src: '/hero-tbeams/tbeam-hero-2.webp',
    fallback: '/hero-tbeams/tbeam-hero-2.jpg',
    title: 'Hollow Infill Blocks & Conduits Laid',
    detail: 'Safe, Solid Walkable Working Deck',
    tag: 'Precast Rib & Block System',
  },
  {
    id: 'tbeam-3',
    src: '/hero-tbeams/tbeam-hero-3.webp',
    fallback: '/hero-tbeams/tbeam-hero-3.jpg',
    title: 'Structural Rib Spacing & Conduit Alignment',
    detail: 'Custom Pre-cut to Engineering Spans',
    tag: 'High-Tensile Precast Concrete',
  },
  {
    id: 'tbeam-4',
    src: '/hero-tbeams/tbeam-hero-4.webp',
    fallback: '/hero-tbeams/tbeam-hero-4.jpg',
    title: 'Completed Interlocking Slab Grid',
    detail: 'Ready for Screed Topping — Save 40%',
    tag: 'Direct Factory Supply',
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section 
      className="relative overflow-hidden bg-[#070b14] text-white py-16 md:py-24 border-b border-slate-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated Hero Background Slideshow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-40' : 'opacity-0'
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.title}
                fill
                priority={idx === 0}
                style={{ transitionDuration: '7000ms' }}
                className={`object-cover object-center transition-transform ease-out ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              />
            </div>
          );
        })}

        {/* Sophisticated Architectural Dark Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/90 via-[#070b14]/65 to-[#070b14] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/90 via-transparent to-[#070b14]/90 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070b14] to-transparent pointer-events-none" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          {/* Executive Tag */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md shadow-lg shadow-emerald-950/40">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Save up to 40% with our innovative beams &amp; blocks</span>
          </div>

          {/* Luxury Punchy Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Precast &amp; EcoSlabs
          </h1>

          {/* Concise Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Order prestressed concrete beams, EcoSlabs, hollow infill blocks, Cabros &amp; Wall Panels directly from our Ruiru factory yard, or calculate exact materials in seconds.
          </p>

          {/* The Two Primary Action Pillars */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-8 py-6 text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 flex items-center gap-2"
            >
              <a href="#marketplace">
                <ShoppingBag className="h-4 w-4" />
                Order Materials Now
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
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>C50/60 Prestressed Strength</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>NO Formwork Needed on T-Beams</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Nationwide Site Offloading</span>
            </div>
          </div>

          {/* Real Site Live Installation Indicator & Photo Controls */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <div>
                <p className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-2">
                  <span className="text-slate-400 font-normal">Real Site Photos:</span>
                  <span className="text-amber-400 font-bold">{HERO_SLIDES[currentSlide].title}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  {HERO_SLIDES[currentSlide].detail} • <span className="text-emerald-400 font-semibold">{HERO_SLIDES[currentSlide].tag}</span>
                </p>
              </div>
            </div>

            {/* Slide Navigation Buttons & Indicators */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous site photo"
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-1.5">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`transition-all duration-300 rounded-full ${
                      i === currentSlide
                        ? 'w-6 h-1.5 bg-amber-400 shadow-sm shadow-amber-400/50'
                        : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next site photo"
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

