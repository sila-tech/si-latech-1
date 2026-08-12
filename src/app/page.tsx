'use client';

import { Header } from '@/components/header';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { WhyChooseSection } from '@/components/landing/why-choose-section';
import { ProjectsGallerySection } from '@/components/landing/projects-gallery-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { ContactSection } from '@/components/landing/contact-section';
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
      {/* Sticky Header */}
      <Header />

      {/* 1. Hero Section (Above the Fold) */}
      <HeroSection />

      {/* 2. "How It Works" 3-Step Process & Media */}
      <HowItWorksSection />

      {/* 3. Interactive Calculator Section (#calculator) */}
      <section id="calculator" className="py-16 md:py-24 bg-slate-100/70 border-b border-slate-200 scroll-mt-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-700">
              <CalcIcon className="h-4 w-4 text-amber-600" />
              <span>Interactive Estimator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              SilaCalc Material & Cost Estimator
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Enter room dimensions or upload your architectural plan below to calculate exact quantities for precast beams, hollow blocks, cement, sand, ballast & BRC mesh.
            </p>
          </div>

          <Tabs defaultValue="beam-block" className="space-y-6">
            <div className="flex justify-center w-full overflow-x-auto pb-2 mobile-touch-scroll scrollbar-none">
              <TabsList className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm inline-flex shrink-0">
                <TabsTrigger 
                  value="beam-block" 
                  className="rounded-xl px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:shadow-md flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Beam &amp; Block Slab
                </TabsTrigger>
                <TabsTrigger 
                  value="concrete-slab" 
                  className="rounded-xl px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <Construction className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cast Concrete Slab
                </TabsTrigger>
                <TabsTrigger 
                  value="savings-compare" 
                  className="rounded-xl px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Compare Savings
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

      {/* 4. "Why Choose SI-LATECH?" 3-Column Visual Grid (Moved Below Calculator) */}
      <WhyChooseSection />

      {/* 5. Projects & Installation Gallery (#projects) */}
      <ProjectsGallerySection />

      {/* 6. Testimonials & Trust Badges (#testimonials) */}
      <TestimonialsSection />

      {/* 7. Dedicated Contact Section (#contact) */}
      <ContactSection />

      {/* Footer & Floating Widgets */}
      <Footer />
      <MobileQuoteBar />
    </div>
  );
}
