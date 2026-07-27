'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { LayoutGrid, Calculator, FileCheck, FileText, CheckCircle2, ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SampleQuoteModal } from './sample-quote-modal';

const steps = [
  {
    number: '01',
    icon: LayoutGrid,
    title: 'Add Rooms & Dimensions',
    description: 'Enter room length and width for each section of your floor slab layout.',
    badge: 'Step 1',
  },
  {
    number: '02',
    icon: Calculator,
    title: 'Instant Quantities',
    description: 'See live material requirements for beams, hollow blocks, cement, sand & BRC mesh instantly.',
    badge: 'Step 2',
  },
  {
    number: '03',
    icon: FileCheck,
    title: 'Download Official Quote',
    description: 'Generate an itemized PDF estimate or share directly with your client on WhatsApp.',
    badge: 'Step 3',
  },
];

const installationSteps = [
  'Beam & Block Delivery',
  'Manual Beam Placement',
  'Hollow Block Laying',
  'BRC Mesh & Topping Concrete',
];

export function HowItWorksSection() {
  const [sampleModalOpen, setSampleModalOpen] = useState(false);

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200" id="how-it-works">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-3">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-600">
            Simple 3-Step Process
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            How SilaCalc Works
          </h3>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            From dimensions to an official material quote in under 60 seconds. Designed specifically for Kenyan site conditions.
          </p>
        </div>

        {/* Content Layout: 3 steps + Media Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: 3 Steps */}
          <div className="lg:col-span-6 space-y-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shadow-amber-500/20">
                    {step.number}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-amber-600" />
                      <h4 className="text-lg font-bold text-slate-900">{step.title}</h4>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}

            {/* Action Bar: Sample Quote Trigger */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSampleModalOpen(true)}
                className="w-full sm:w-auto border-amber-500/40 text-amber-700 bg-amber-50/50 hover:bg-amber-100 font-bold px-6 py-5 rounded-xl flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5 text-amber-600" />
                See Sample Quote PDF
              </Button>

              <Button
                asChild
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-5 rounded-xl flex items-center justify-center gap-2"
              >
                <a href="#calculator">
                  Start Calculating
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Right Column: Physical Installation Process Visual */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl text-white border border-slate-800 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-bold text-base text-white">Physical Installation Flow</h4>
                  <p className="text-xs text-slate-400">On-site assembly of precast beam & block slab</p>
                </div>
                <span className="text-xs font-semibold bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30">
                  Site Guide
                </span>
              </div>

              {/* Main Media Preview Image */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700/80 group">
                <Image
                  src="/beam-block-system.png"
                  alt="SI-LATECH Physical Installation Diagram"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-xs bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">1. Beam Placement → 2. Block Laying → 3. Concrete Topping</span>
                </div>
              </div>

              {/* Step Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {installationSteps.map((stepText, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/50">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-slate-300 font-medium">{stepText}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Sample Quote Modal */}
      <SampleQuoteModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
    </section>
  );
}
