
'use client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileQuoteBar } from '@/components/mobile-quote-bar';
import { CalculatorShell } from '@/components/silacalc/calculator-shell';
import { ConcreteCalculator } from '@/components/silacalc/concrete-calculator';
import { ComparisonTab } from '@/components/silacalc/comparison-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Construction, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
        <div className="container mx-auto max-w-7xl">
          <Tabs defaultValue="beam-block" className="space-y-6">
            <div className="flex justify-center sm:justify-start">
              <TabsList className="bg-slate-200/60 p-1 rounded-xl border border-slate-200">
                <TabsTrigger 
                  value="beam-block" 
                  className="rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
                >
                  <Layers className="h-4 w-4" /> Beam & Block Slab
                </TabsTrigger>
                <TabsTrigger 
                  value="concrete-slab" 
                  className="rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
                >
                  <Construction className="h-4 w-4" /> Concrete Slab
                </TabsTrigger>
                <TabsTrigger 
                  value="savings-compare" 
                  className="rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" /> Compare & Savings
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
      </main>
      <Footer />
      <MobileQuoteBar />
    </div>
  );
}

