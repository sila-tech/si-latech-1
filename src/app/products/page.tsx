'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Box, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Phone, 
  MessageCircle, 
  Calculator, 
  ShieldCheck, 
  Truck, 
  Scale, 
  Clock, 
  Layers, 
  ExternalLink,
  Sparkles,
  Zap,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { ProductItem, DEFAULT_PRODUCTS } from '@/lib/products-data';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(
    () => query(collection(firestore, 'products'), orderBy('order', 'asc')),
    [firestore]
  );
  const { data: dbProducts } = useCollection<ProductItem>(productsQuery);

  const productsList: ProductItem[] = (dbProducts && dbProducts.length > 0)
    ? dbProducts
    : DEFAULT_PRODUCTS;

  const filteredProducts = activeTab === 'all'
    ? productsList
    : productsList.filter(p => p.category === activeTab);

  const getWhatsAppOrderUrl = (productName: string, price: string) => {
    const text = `Hello SI-LATECH, I am viewing your product catalog and would like to order: ${productName} (${price}). Please provide delivery timeline and a formal quotation.`;
    return `https://wa.me/254741557960?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        {/* Page Hero */}
        <section className="bg-slate-900 text-white py-16 md:py-20 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto max-w-7xl relative z-10 space-y-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} /> Back to Home &amp; Calculator
            </Link>

            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-400">
                <Box className="h-4 w-4 text-amber-400" />
                <span>Ruiru Factory Direct Storefront</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                SI-LATECH Precast Beams, Blocks &amp; Floor Slab Systems
              </h1>
              <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
                Explore Kenya's most comprehensive catalog of precision precast concrete beams, hollow infill blocks, and turnkey slab construction materials. High structural strength, factory-controlled quality, and transparent factory-direct pricing.
              </p>
            </div>

            {/* Quick stats pills */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl">
                <span className="text-xs text-slate-400 block font-medium">Flat Beam Rate</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">KES 545 <span className="text-xs font-normal text-slate-400">/ m</span></span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl">
                <span className="text-xs text-slate-400 block font-medium">T-Beam Rate</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">KES 1,200 <span className="text-xs font-normal text-slate-400">/ m</span></span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl">
                <span className="text-xs text-slate-400 block font-medium">Hollow Blocks</span>
                <span className="text-xl sm:text-2xl font-black text-white">KES 90 - 100 <span className="text-xs font-normal text-slate-400">/ pc</span></span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl">
                <span className="text-xs text-slate-400 block font-medium">Concrete Strength</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">C50/60 <span className="text-xs font-normal text-slate-400">Prestressed</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Product Showcases */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-7xl space-y-16">
            
            {/* System 1: Prestressed Flat Beam System */}
            <div id="flat-beam" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 lg:p-12">
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      <span>Standard Residential Solution</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                      Precast Concrete Flat Beam System
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                      Engineered specifically for residential bungalows, maisonettes, and apartments with spans up to 4.0 meters. Lightweight ribs allow manual placement without expensive cranes or hoists.
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Beam Price</span>
                      <span className="text-3xl font-black text-slate-900">KES 545</span>
                      <span className="text-xs text-slate-600 ml-1.5 font-medium">/ linear meter</span>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Compatible Block</span>
                      <span className="text-xl font-black text-amber-600">KES 90</span>
                      <span className="text-xs text-slate-600 ml-1.5 font-medium">/ piece</span>
                    </div>
                    <div>
                      <Button asChild className="bg-[#25D366] hover:bg-[#1fbb57] text-white font-bold rounded-xl shadow-sm">
                        <a 
                          href={getWhatsAppOrderUrl('Precast Flat Beam System', 'KES 545/m')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <MessageCircle size={18} />
                          Order via WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Technical Specifications List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block font-medium">Safe Span Range</span>
                      <span className="text-slate-900 font-bold text-sm">Up to 4.0 Meters</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block font-medium">Concrete Grade</span>
                      <span className="text-slate-900 font-bold text-sm">C45/50 High Early Strength</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block font-medium">Internal Reinforcement</span>
                      <span className="text-slate-900 font-bold text-sm">Prestressed High-Tensile Wire</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block font-medium">Finished Slab Depth</span>
                      <span className="text-slate-900 font-bold text-sm">150mm - 170mm (with screed)</span>
                    </div>
                  </div>

                  {/* Key Advantages */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">System Advantages</h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span><strong>Minimal Timber Propping:</strong> Requires temporary support props at only 0.6m spacing during screed casting.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span><strong>Flush Soffit Finish:</strong> Ceiling underside is uniform and ready for direct plaster skim coat.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span><strong>Crane-Free Handling:</strong> 2–3 site workers can comfortably carry and place each beam by hand.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Link to calculator */}
                  <div className="pt-2">
                    <Button asChild variant="outline" className="rounded-xl border-slate-300 font-bold">
                      <Link href="/#calculator" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-amber-600" />
                        Estimate Flat Beam Quantities in SilaCalc
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
                    <Image
                      src="/beam-block-real.jpg"
                      alt="SI-LATECH Precast Flat Beam and Block System Site Installation"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl text-white border border-slate-800">
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-0.5">Live Construction Site</p>
                      <p className="text-xs text-slate-200">Residential Flat Beam installation in progress with infill blocks positioned.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System 2: Heavy Duty Prestressed T-Beam System */}
            <div id="t-beam" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 lg:p-12">
                <div className="lg:col-span-6 order-2 lg:order-1">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
                    <Image
                      src="/beam-block-system.png"
                      alt="SI-LATECH Prestressed Concrete T-Beam Profile & Structure"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl text-white border border-slate-800">
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-0.5">Heavy-Duty Engineering</p>
                      <p className="text-xs text-slate-200">Engineered inverted T-section beam for high structural loads and expansive bays.</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      <span>Heavy Duty • Commercial &amp; Long Span</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                      Prestressed Concrete T-Beam System
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                      Our flagship structural prestressed concrete T-beam is designed for longer spans up to 6.5m+ and demanding commercial floor loads. Manufactured with high-strength C50/60 concrete and high-tensile prestressed strands.
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Beam Price</span>
                      <span className="text-3xl font-black text-slate-900">KES 1,200</span>
                      <span className="text-xs text-slate-600 ml-1.5 font-medium">/ linear meter</span>
                      <span className="text-xs text-emerald-600 font-bold block mt-0.5">KES 2,800 – 3,500 / m² slab</span>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Compatible Block</span>
                      <span className="text-xl font-black text-amber-600">KES 100</span>
                      <span className="text-xs text-slate-600 ml-1.5 font-medium">/ piece</span>
                    </div>
                    <div>
                      <Button asChild className="bg-[#25D366] hover:bg-[#1fbb57] text-white font-bold rounded-xl shadow-sm">
                        <a 
                          href={getWhatsAppOrderUrl('Prestressed Concrete T-Beam System', 'KES 1,200/m')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <MessageCircle size={18} />
                          Order via WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Technical Specifications List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block font-medium">Safe Span Range</span>
                      <span className="text-slate-900 font-bold text-sm">3.5m to 6.5m+ Clear Spans</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block font-medium">Concrete Grade</span>
                      <span className="text-slate-900 font-bold text-sm">C50/60 Prestressed Strength</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block font-medium">Prestressing Tendons</span>
                      <span className="text-slate-900 font-bold text-sm">High-Tensile 7-Wire Strands</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 block font-medium">Finished Slab Depth</span>
                      <span className="text-slate-900 font-bold text-sm">180mm - 200mm</span>
                    </div>
                  </div>

                  {/* Key Advantages */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">System Advantages</h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span><strong>NO Formwork Needed:</strong> Fully self-supporting prestressed T-beams eliminate timber formwork, shuttering, and propping entirely.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                        <span><strong>Expansive Column-Free Spaces:</strong> Accommodates large open living rooms, commercial offices &amp; retail floors up to 6.5m+ clear spans.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                        <span><strong>Superior Load Capacity:</strong> Engineered to withstand heavy dead &amp; live loads with zero structural deflection.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                        <span><strong>Interlocking Block Flanges:</strong> T-beam profile securely grips the hollow infill blocks for enhanced structural diaphragm action.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Link to calculator */}
                  <div className="pt-2">
                    <Button asChild variant="outline" className="rounded-xl border-slate-300 font-bold">
                      <Link href="/#calculator" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-amber-600" />
                        Estimate T-Beam Quantities in SilaCalc
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* System 3: Hollow Concrete Infill Blocks Comparison */}
            <div id="blocks" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 lg:p-12 space-y-8 scroll-mt-24">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <Badge variant="outline" className="border-amber-500 text-amber-700 font-bold">
                  Precision Infill Units
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Lightweight Hollow Concrete Infill Blocks
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Our hollow blocks act as lightweight void formers between precast beams, drastically reducing dead load while creating natural thermal and acoustic insulation barriers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Flat Block Card */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 hover:shadow-md transition-all space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-bold text-amber-600 tracking-wider">For Flat Beam Slabs</span>
                      <h3 className="text-xl font-bold text-slate-900">Flat Beam Infill Block</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900">KES 90</span>
                      <span className="text-xs text-slate-500 block">per piece</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Designed with shallow rebates to rest flush against 545/m Flat Beams, producing a seamless, uniform ceiling soffit ready for skimming.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Dimensions (L × W × H)</span>
                      <span className="text-slate-900 font-bold">400 × 200 × 120 mm</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Unit Weight</span>
                      <span className="text-slate-900 font-bold">~ 10 – 12 kg</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Blocks per Square Meter</span>
                      <span className="text-slate-900 font-bold">Approx. 7 – 8 pcs / m²</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 font-medium">Primary Application</span>
                      <span className="text-slate-900 font-bold">Bungalows &amp; Residential</span>
                    </div>
                  </div>

                  <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs py-5">
                    <a 
                      href={getWhatsAppOrderUrl('Flat Beam Hollow Infill Blocks', 'KES 90/pc')}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Order Flat Blocks via WhatsApp
                    </a>
                  </Button>
                </div>

                {/* T-Block Card */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 hover:shadow-md transition-all space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">For T-Beam Slabs</span>
                      <h3 className="text-xl font-bold text-slate-900">T-Beam Infill Block</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900">KES 100</span>
                      <span className="text-xs text-slate-500 block">per piece</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Engineered with deep interlocking side shoulders that sit firmly on the bottom flange of T-Beams, maximizing mechanical interlocking under structural screed loads.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Dimensions (L × W × H)</span>
                      <span className="text-slate-900 font-bold">400 × 200 × 150 mm</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Unit Weight</span>
                      <span className="text-slate-900 font-bold">~ 12 – 14 kg</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Blocks per Square Meter</span>
                      <span className="text-slate-900 font-bold">Approx. 7 – 8 pcs / m²</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 font-medium">Primary Application</span>
                      <span className="text-slate-900 font-bold">Multi-Story &amp; Long Spans</span>
                    </div>
                  </div>

                  <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs py-5">
                    <a 
                      href={getWhatsAppOrderUrl('T-Beam Hollow Infill Blocks', 'KES 100/pc')}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Order T-Blocks via WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Dynamic Storefront Catalog Grid (Updated in Real-time by Admins) */}
            <div className="space-y-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-800">
                    <Box className="h-3.5 w-3.5 text-amber-600" />
                    <span>Live Factory Inventory &amp; Items</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Complete Material Catalog ({filteredProducts.length} Items)
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
                    Browse all precast beams, hollow blocks, wire fabric, and slab packages manufactured and supplied directly by SI-LATECH.
                  </p>
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'beams', label: 'Beams' },
                    { id: 'blocks', label: 'Blocks' },
                    { id: 'packages', label: 'Packages' },
                    { id: 'accessories', label: 'Accessories' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        activeTab === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group"
                  >
                    <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as any).src = '/beam-block-system.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                          <Box className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      
                      {product.badge && (
                        <div className="absolute top-3 left-3">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full shadow-xs ${product.badgeColor || 'bg-amber-500 text-slate-950 font-bold'}`}>
                            {product.badge}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-300 block">Factory Rate</span>
                          <span className="text-xl font-black text-white">{product.price}</span>
                          <span className="text-[10px] text-slate-300 ml-1">{product.unit}</span>
                        </div>
                        <Badge variant="outline" className="border-white/30 text-white text-[10px] uppercase font-bold bg-white/10 backdrop-blur-xs">
                          {product.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                          {product.name}
                        </h4>
                        {product.description && (
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        {product.highlight && (
                          <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5 font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{product.highlight}</span>
                          </div>
                        )}
                      </div>

                      {product.specs && product.specs.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1 text-xs">
                          {product.specs.slice(0, 2).map((s, idx) => (
                            <div key={idx} className="flex justify-between text-slate-600 text-[11px]">
                              <span className="text-slate-500">{s.label}:</span>
                              <span className="font-bold text-slate-900">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <Button asChild size="sm" className="w-full bg-[#25D366] hover:bg-[#1fbb57] text-white font-bold rounded-xl text-xs py-4">
                          <a 
                            href={getWhatsAppOrderUrl(product.name, product.price)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Order WA
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="w-full border-slate-300 font-bold rounded-xl text-xs py-4">
                          <Link href="/#calculator" className="flex items-center justify-center gap-1">
                            <Calculator className="h-3.5 w-3.5 text-amber-600" />
                            Calculate
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side-by-Side Comparison Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 lg:p-12 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Flat Beam vs. T-Beam vs. Solid Cast Slab
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Compare metrics to choose the perfect floor slab configuration for your structural engineering drawings.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 font-bold text-slate-900">Metric / Feature</th>
                      <th className="py-3 px-4 font-bold text-blue-700">Flat Beam System</th>
                      <th className="py-3 px-4 font-bold text-amber-700">T-Beam System</th>
                      <th className="py-3 px-4 font-bold text-slate-600">Traditional Cast Slab</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900">Beam Unit Price</td>
                      <td className="py-3 px-4 font-bold text-slate-900">KES 545 / meter</td>
                      <td className="py-3 px-4 font-bold text-slate-900">KES 1,200 / meter</td>
                      <td className="py-3 px-4 text-slate-500">N/A (Full timber formwork)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900">Infill Block Price</td>
                      <td className="py-3 px-4 font-bold text-slate-900">KES 90 / pc</td>
                      <td className="py-3 px-4 font-bold text-slate-900">KES 100 / pc</td>
                      <td className="py-3 px-4 text-slate-500">None (100% solid concrete)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900">Recommended Spans</td>
                      <td className="py-3 px-4 text-slate-700">Safe for Spans ≤ 4.0m</td>
                      <td className="py-3 px-4 font-bold text-amber-700">Up to 6.5m+ Clear Spans</td>
                      <td className="py-3 px-4 text-slate-700">Varies (requires drop beams)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900">Estimated Slab Cost</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">~ KES 1,950 - 2,100 / m²</td>
                      <td className="py-3 px-4 font-bold text-slate-900">KES 2,800 – 3,500 / m²</td>
                      <td className="py-3 px-4 text-rose-600 font-bold">KES 4,000 – 4,800 / m²</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900">Dead Load Weight</td>
                      <td className="py-3 px-4 text-slate-700">~ 180 kg/m² (Lightweight)</td>
                      <td className="py-3 px-4 text-slate-700">~ 220 kg/m² (Balanced)</td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">~ 360 kg/m² (Heavy)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900">Formwork &amp; Timber Needed</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">Minimal propping (props @ 0.6m)</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">NO FORMWORK NEEDED (Self-Supporting)</td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">Full 100% Timber Shuttering &amp; Props</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900">Construction Speed</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">3 - 4 Days Ready to Pour</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">3 - 5 Days Ready to Pour</td>
                      <td className="py-3 px-4 text-slate-600">2 - 3 Weeks (curing + formwork)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery & Ordering FAQ */}
            <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 space-y-8">
              <div className="max-w-3xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Logistics &amp; Supply</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Direct Factory Delivery Across Kenya
                </h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  We transport and offload precast beams and blocks straight to your building site. Whether building in Nairobi, Kiambu, Machakos, Nakuru, Eldoret, Kisumu, or Mombasa, our logistics fleet ensures on-time site arrival.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <h4 className="font-bold text-white text-base">Direct Site Offloading</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Delivered on flatbed trucks and carefully handled onto your perimeter ring beams or site storage.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <h4 className="font-bold text-white text-base">Custom Cut to Drawings</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Send us your architectural or structural plans; our engineers cut beam lengths to exact millimetre tolerances.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-bold text-white text-base">Engineer Certified (C50)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Complete batch test certificates and structural calculation schedules provided on request.
                  </p>
                </div>
              </div>

              {/* Action Banner */}
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-lg">Ready to purchase materials or need a formal quote?</h4>
                  <p className="text-xs text-slate-400">Chat directly with our technical sales engineers right now.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button asChild className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl py-6 px-6">
                    <a href="tel:+254741557960" className="flex items-center gap-2">
                      <Phone size={18} />
                      Call: +254 741 557 960
                    </a>
                  </Button>
                  <Button asChild className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1fbb57] text-white font-bold rounded-xl py-6 px-6">
                    <a 
                      href="https://wa.me/254741557960?text=Hello%20SI-LATECH,%20I%20would%20like%20to%20order%20precast%20beams%20and%20blocks%20for%20my%20project."
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle size={18} />
                      WhatsApp Sales
                    </a>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
