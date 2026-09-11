'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Box, 
  ShieldCheck, 
  ArrowRight, 
  MessageCircle, 
  Calculator, 
  Sparkles,
  Truck,
  Wrench,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalculator } from '@/context/calculator-context';

export interface ProductItem {
  id: string;
  name: string;
  category: 'beams' | 'blocks' | 'packages' | 'accessories';
  badge: string;
  badgeColor: string;
  price: string;
  unit: string;
  image: string;
  description: string;
  specs: { label: string; value: string }[];
  highlight: string;
  beamType?: 'tbeam' | 'flat';
}

const products: ProductItem[] = [
  {
    id: 't-beam',
    name: 'Prestressed Concrete T-Beam',
    category: 'beams',
    badge: 'Heavy Duty • Long Spans',
    badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    price: 'KES 1,200',
    unit: 'per linear meter',
    image: '/beam-block-system.png',
    description: 'High-strength inverted T-section precast beams engineered with high-tensile prestressed steel tendons for multi-story buildings, commercial slabs, and long spans.',
    highlight: 'Ideal for spans up to 6.5m+ with superior load-bearing capacity',
    beamType: 'tbeam',
    specs: [
      { label: 'Profile', value: 'Inverted T-Beam (150mm depth)' },
      { label: 'Concrete Grade', value: 'C50/60 High Strength' },
      { label: 'Reinforcement', value: 'Prestressed High-Tensile Strands' },
      { label: 'Recommended Spans', value: '3.5m up to 6.5m+' },
      { label: 'Compatible Blocks', value: 'T-Beam Hollow Blocks (KES 100)' },
    ],
  },
  {
    id: 'flat-beam',
    name: 'Prestressed Concrete Flat Beam',
    category: 'beams',
    badge: 'Residential Best-Seller',
    badgeColor: 'bg-blue-600 text-white font-bold',
    price: 'KES 545',
    unit: 'per linear meter',
    image: '/beam-block-real.jpg',
    description: 'Ultra cost-effective, compact precast flat beams tailored for residential homes, bungalows, and multi-unit developments with spans up to 4.0 meters. Lightweight for easy manual handling.',
    highlight: 'Lightweight & crane-free manual installation on site',
    beamType: 'flat',
    specs: [
      { label: 'Profile', value: 'Ribbed Flat Beam (120mm depth)' },
      { label: 'Concrete Grade', value: 'C45/50 High Strength' },
      { label: 'Reinforcement', value: 'Prestressed High-Tensile Wire' },
      { label: 'Recommended Spans', value: 'Safe for Spans ≤ 4.0m' },
      { label: 'Compatible Blocks', value: 'Flat Beam Hollow Blocks (KES 90)' },
    ],
  },
  {
    id: 't-block',
    name: 'T-Beam Hollow Infill Block',
    category: 'blocks',
    badge: 'Precision Interlock',
    badgeColor: 'bg-emerald-600 text-white font-bold',
    price: 'KES 100',
    unit: 'per piece',
    image: '/beam-block-finished.jpg',
    description: 'Lightweight hollow concrete blocks specifically rebated to fit securely onto the lower flanges of SI-LATECH T-Beams, delivering exceptional acoustic and thermal insulation.',
    highlight: 'Reduces overall slab dead load by over 45% compared to solid concrete',
    beamType: 'tbeam',
    specs: [
      { label: 'Dimensions', value: '400mm (L) × 200mm (W) × 150mm (H)' },
      { label: 'Design Weight', value: 'Approx. 12 - 14 kg / piece' },
      { label: 'Cavity Structure', value: 'Double hollow chamber' },
      { label: 'Acoustic Rating', value: 'Superior floor-to-floor sound dampening' },
      { label: 'Compatible Beam', value: 'T-Beam (KES 1,200/m)' },
    ],
  },
  {
    id: 'flat-block',
    name: 'Flat Beam Hollow Infill Block',
    category: 'blocks',
    badge: 'Most Economical',
    badgeColor: 'bg-amber-600 text-white font-bold',
    price: 'KES 90',
    unit: 'per piece',
    image: '/beam-block-real.jpg',
    description: 'Specially engineered infill blocks with shallow seating shoulders designed to nest alongside our 545/m Flat Beams, producing a level, flush soffit ceiling ready for direct plaster.',
    highlight: 'Lowest cost per m² for residential building slabs in Kenya',
    beamType: 'flat',
    specs: [
      { label: 'Dimensions', value: '400mm (L) × 200mm (W) × 120mm (H)' },
      { label: 'Design Weight', value: 'Approx. 10 - 12 kg / piece' },
      { label: 'Ceiling Finish', value: 'Flush soffit for direct plaster skim' },
      { label: 'Thermal Comfort', value: 'Hollow insulation traps cool air' },
      { label: 'Compatible Beam', value: 'Flat Beam (KES 545/m)' },
    ],
  },
  {
    id: 'full-slab-package',
    name: 'Complete Slab Materials Package',
    category: 'packages',
    badge: 'All-in-One Site Supply',
    badgeColor: 'bg-purple-600 text-white font-bold',
    price: 'Custom Quote',
    unit: 'turnkey delivered to site',
    image: '/beam-block-finished.jpg',
    description: 'Complete material package bundled and delivered together: Precast Beams cut to architectural spans, Hollow Infill Blocks, BRC Mesh A142, Cement bags, Sand & Ballast aggregate.',
    highlight: 'Save up to 30% overall compared to conventional cast-in-situ slabs',
    specs: [
      { label: 'Included Components', value: 'Beams + Blocks + BRC + Concrete Materials' },
      { label: 'Cut to Length', value: 'Factory cut to your exact plan dimensions' },
      { label: 'Delivery', value: 'Offloaded directly at your construction site' },
      { label: 'Technical Support', value: 'Free layout drawings & installation guide' },
    ],
  },
  {
    id: 'brc-mesh-props',
    name: 'BRC Mesh & Construction Accessories',
    category: 'accessories',
    badge: 'Site Accessories',
    badgeColor: 'bg-slate-700 text-white font-bold',
    price: 'Wholesale Rates',
    unit: 'available on order',
    image: '/beam-block-system.png',
    description: 'High-tensile welded BRC A142 wire fabric for structural slab screeds, telescopic adjustable steel props, and formwork timber battens for temporary propping during casting.',
    highlight: 'High-strength A142 mesh ensures crack-free structural topping concrete',
    specs: [
      { label: 'BRC Fabric', value: 'A142 Standard (6mm wire @ 200mm mesh)' },
      { label: 'Steel Props', value: 'Telescopic adjustable 2.0m - 3.8m' },
      { label: 'Timber Support', value: '3×2 treated structural battens' },
      { label: 'Availability', value: 'In stock at Ruiru factory yard' },
    ],
  },
];

export function ProductsSection() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'beams' | 'blocks' | 'packages' | 'accessories'>('all');
  const { updateSettings } = useCalculator();

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleSelectProductForCalc = (beamType?: 'tbeam' | 'flat') => {
    if (beamType) {
      updateSettings({ beamType });
    }
    const el = document.getElementById('calculator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getWhatsAppOrderUrl = (productName: string, price: string) => {
    const text = `Hello SI-LATECH, I am interested in purchasing: ${productName} (${price}). Please let me know current availability, delivery scheduling, and quotation details.`;
    return `https://wa.me/254741557960?text=${encodeURIComponent(text)}`;
  };

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200 scroll-mt-20" id="products">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-700">
              <Box className="h-4 w-4 text-amber-600" />
              <span>Direct Manufacturer &amp; Supplier</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Precast Concrete Beams, Blocks &amp; Materials
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              We engineer and manufacture high-grade prestressed concrete beams and hollow infill blocks at our Ruiru factory. Supplied directly to builders, contractors, and home developers across Kenya at factory prices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild variant="outline" className="rounded-xl border-slate-300 font-bold hover:bg-slate-50">
              <Link href="/products" className="flex items-center gap-2">
                Detailed Product Catalog
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md">
              <a href="#calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculate Quantities
              </a>
            </Button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'beams', label: 'Precast Beams' },
            { id: 'blocks', label: 'Hollow Infill Blocks' },
            { id: 'packages', label: 'Full Slab Packages' },
            { id: 'accessories', label: 'BRC & Accessories' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Product Visual Header */}
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                
                {/* Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`text-[11px] px-3 py-1 rounded-full shadow-sm ${product.badgeColor}`}>
                    {product.badge}
                  </span>
                </div>

                {/* Price Display */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 block">Factory Rate</span>
                    <span className="text-2xl font-black text-white">{product.price}</span>
                    <span className="text-[11px] text-slate-300 ml-1 font-medium">{product.unit}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[11px] text-amber-300 font-bold">
                    Direct Supply
                  </div>
                </div>
              </div>

              {/* Product Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Highlight pill */}
                  <div className="bg-amber-50/80 border border-amber-200/70 p-2.5 rounded-xl flex items-start gap-2 text-xs text-amber-900 font-medium">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{product.highlight}</span>
                  </div>
                </div>

                {/* Quick Specs Table */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                  {product.specs.slice(0, 3).map((spec, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-600">
                      <span className="font-medium text-slate-500">{spec.label}:</span>
                      <span className="font-bold text-slate-900 text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTAs */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 hover:text-[#25D366] border-[#25D366]/30 font-bold rounded-xl text-xs py-5"
                  >
                    <a 
                      href={getWhatsAppOrderUrl(product.name, product.price)}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Order via WA
                    </a>
                  </Button>

                  {product.beamType ? (
                    <Button
                      size="sm"
                      onClick={() => handleSelectProductForCalc(product.beamType)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs py-5 flex items-center justify-center gap-1.5"
                    >
                      <Calculator className="h-4 w-4 text-amber-400" />
                      Calculate Slab
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs py-5"
                    >
                      <Link href="/products" className="flex items-center justify-center gap-1.5">
                        Details &amp; Specs
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Value Prop Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Direct Site Delivery</h4>
                <p className="text-xs text-slate-400">Offloaded safely at your construction site in Nairobi, Kiambu &amp; Kenya-wide.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Structural Quality (C50)</h4>
                <p className="text-xs text-slate-400">Prestressed with high-tensile steel wire strands for zero sag &amp; high load rating.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Custom Lengths Fabricated</h4>
                <p className="text-xs text-slate-400">Beams cut to the precise dimensions of your architectural layout drawings.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
