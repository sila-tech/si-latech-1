'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, Play, Building, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-white py-16 md:py-24 lg:py-28">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/beam-block-real.jpg"
          alt="SI-LATECH Precast Beam and Block Slab Construction in Kenya"
          fill
          priority
          className="object-cover object-center opacity-30 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/85 to-slate-900/60" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline, CTAs, Social Proof */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-amber-400 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Kenya's #1 Beam & Block Estimator</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Cut Floor Slab Costs by <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">30%</span> — No Heavy Machinery Needed
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Get instant material estimates for precast beam and block systems. Trusted by 500+ contractors across Kenya for faster, lighter, and stronger slabs.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-6 text-base rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
              >
                <a href="#calculator" className="flex items-center justify-center gap-2">
                  Get Free Estimate
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-white font-semibold px-6 py-6 text-base rounded-xl backdrop-blur-sm transition-all"
              >
                <a href="#projects" className="flex items-center justify-center gap-2">
                  View Completed Projects
                </a>
              </Button>
            </div>

            {/* Social Proof Trust Bar */}
            <div className="pt-6 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300 font-medium">
                <div className="flex items-center gap-1.5 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>500+ Projects Quoted</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>3+ Years in Business</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <Building className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Up to 30% Cost Savings</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-800/40 p-2 shadow-2xl backdrop-blur-sm">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                <Image
                  src="/beam-block-finished.jpg"
                  alt="SI-LATECH Finished Beam and Block Slab Layout"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                {/* Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Live System Preview</p>
                    <p className="text-sm font-semibold text-white">Precast Rib & Hollow Block Floor</p>
                  </div>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
                    title="See how it works"
                  >
                    <Play className="h-4 w-4 fill-slate-950 ml-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
