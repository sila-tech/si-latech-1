'use client';

import { Header } from '@/components/header';
import { HeroSection } from '@/components/landing/hero-section';
import { ProductsSection } from '@/components/landing/products-section';
import { Footer } from '@/components/footer';
import { MobileQuoteBar } from '@/components/mobile-quote-bar';
import { CalculatorShell } from '@/components/silacalc/calculator-shell';
import { ConcreteCalculator } from '@/components/silacalc/concrete-calculator';
import { ComparisonTab } from '@/components/silacalc/comparison-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Construction, TrendingUp, Calculator as CalcIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* 1. Ultra-clean Header */}
      <Header />

      {/* 2. Premium Hero (Focused strictly on Marketplace & Estimator) */}
      <HeroSection />

      {/* 3. The Marketplace Section (#marketplace) */}
      <ProductsSection />

      {/* 4. The Material Calculator Section (#calculator) */}
      <section id="calculator" className="py-16 md:py-24 bg-[#f8fafc] border-b border-slate-200 scroll-mt-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/25 px-3.5 py-1 text-xs font-bold text-amber-800">
              <CalcIcon className="h-3.5 w-3.5 text-amber-600" />
              <span>SilaCalc Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
              Slab Material Estimator
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Input room dimensions or upload your structural drawings to compute beam quantities, blocks, BRC mesh, and concrete screed.
            </p>
          </div>

          <Tabs defaultValue="beam-block" className="space-y-6">
            <div className="flex justify-center w-full overflow-x-auto pb-2 scrollbar-none">
              <TabsList className="bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs inline-flex shrink-0">
                <TabsTrigger 
                  value="beam-block" 
                  className="rounded-xl px-4 sm:px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:shadow-xs flex items-center gap-2"
                >
                  <Layers className="h-4 w-4" /> Beam &amp; Block Slab
                </TabsTrigger>
                <TabsTrigger 
                  value="concrete-slab" 
                  className="rounded-xl px-4 sm:px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-xs flex items-center gap-2"
                >
                  <Construction className="h-4 w-4" /> Solid Concrete Slab
                </TabsTrigger>
                <TabsTrigger 
                  value="savings-compare" 
                  className="rounded-xl px-4 sm:px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xs flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" /> Cost Comparison
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="beam-block" className="mt-0 outline-none">
              <CalculatorShell initialProjectData={null} />
            </TabsContent>
            
            <TabsContent value="concrete-slab" className="mt-0 outline-none">
              <ConcreteCalculator />
            </TabsContent>

            <TabsContent value="savings-compare" className="mt-0 outline-none">
              <ComparisonTab />
            </TabsContent>
          </Tabs>

        </div>
      </section>

      {/* 5. Minimal, Elegant Footer & Mobile Sticky Bar */}
      <Footer />
      <MobileQuoteBar />
    </div>
  );
}
