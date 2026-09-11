'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  ArrowRight, 
  MessageCircle, 
  Calculator, 
  Sparkles,
  ExternalLink,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalculator } from '@/context/calculator-context';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { ProductItem, DEFAULT_PRODUCTS } from '@/lib/products-data';

export { type ProductItem };

export function ProductsSection() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'beams' | 'blocks' | 'packages' | 'accessories'>('all');
  const { updateSettings } = useCalculator();
  const firestore = useFirestore();

  // Subscribe to live products from Firestore
  const productsQuery = useMemoFirebase(
    () => query(collection(firestore, 'products'), orderBy('order', 'asc')),
    [firestore]
  );
  const { data: dbProducts } = useCollection<ProductItem>(productsQuery);

  // Fallback to DEFAULT_PRODUCTS if Firestore is empty or loading
  const productsList: ProductItem[] = (dbProducts && dbProducts.length > 0) 
    ? dbProducts 
    : DEFAULT_PRODUCTS;

  const filteredProducts = activeCategory === 'all' 
    ? productsList 
    : productsList.filter(p => p.category === activeCategory);

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
    const text = `Hello SI-LATECH, I want to purchase: ${productName} (${price}). Please provide delivery schedule and quotation details.`;
    return `https://wa.me/254741557960?text=${encodeURIComponent(text)}`;
  };

  return (
    <section className="py-16 md:py-20 bg-slate-50 border-b border-slate-200/80 scroll-mt-20" id="marketplace">
      <div id="products" className="-mt-20 pt-20" />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Modern Clean Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-800">
              <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
              <span>Material Marketplace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
              Precast &amp; EcoSlabs Materials
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Factory-manufactured precast beams, EcoSlab systems, and hollow infill blocks prepared and cut to your project's exact structural spans on order, with nationwide site delivery across Kenya.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button asChild variant="outline" className="rounded-xl border-slate-300 font-bold hover:bg-white text-xs h-10 shadow-xs">
              <Link href="/products" className="flex items-center gap-1.5">
                Catalog Specs
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs h-10 shadow-sm">
              <a href="#calculator" className="flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-amber-400" />
                Open Estimator
              </a>
            </Button>
          </div>
        </div>

        {/* Minimal Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Materials' },
            { id: 'beams', label: 'Precast Beams' },
            { id: 'blocks', label: 'Infill Blocks' },
            { id: 'packages', label: 'Full Packages' },
            { id: 'accessories', label: 'Accessories' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Ultra-Premium Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Product Visual Header */}
              <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                    onError={(e) => {
                      (e.target as any).src = '/beam-block-system.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                    <Package className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />
                
                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full shadow-xs ${product.badgeColor || 'bg-amber-500 text-slate-950 font-bold'}`}>
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Price Display */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-300 block">Factory Rate</span>
                    <span className="text-2xl font-black text-white">{product.price}</span>
                    <span className="text-[10px] text-slate-300 ml-1 font-medium">{product.unit}</span>
                  </div>
                  <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 text-[10px] text-amber-300 font-bold">
                    In Stock
                  </span>
                </div>
              </div>

              {/* Product Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-black text-slate-950 group-hover:text-amber-600 transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Highlight callout */}
                  {product.highlight && (
                    <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-xl flex items-start gap-1.5 text-[11px] text-amber-950 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{product.highlight}</span>
                    </div>
                  )}
                </div>

                {/* Quick Specs Table */}
                {product.specs && product.specs.length > 0 && (
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1 text-xs">
                    {product.specs.slice(0, 3).map((spec, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span className="text-slate-500">{spec.label}:</span>
                        <span className="font-bold text-slate-900 text-right">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action CTAs */}
                <div className="pt-1 grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-[#25D366] hover:bg-[#1fbb57] text-white font-bold rounded-xl text-xs py-4 shadow-xs"
                  >
                    <a 
                      href={getWhatsAppOrderUrl(product.name, product.price)}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Order Now
                    </a>
                  </Button>

                  {product.beamType ? (
                    <Button
                      size="sm"
                      onClick={() => handleSelectProductForCalc(product.beamType)}
                      className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs py-4 flex items-center justify-center gap-1.5"
                    >
                      <Calculator className="h-3.5 w-3.5 text-amber-400" />
                      Count Slabs
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-300 font-bold rounded-xl text-xs py-4"
                    >
                      <Link href="/products" className="flex items-center justify-center gap-1">
                        View Specs
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
