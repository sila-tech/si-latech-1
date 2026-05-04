'use client';
import Link from 'next/link';
import { Calculator } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-20 items-center justify-between mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
            <Calculator size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black leading-none tracking-tight text-primary">SI-LATECH</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Beam & Block Specialists</span>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-black uppercase tracking-tighter text-[#0f172a]">Beam to Beam Calculator</span>
          <span className="text-[10px] font-medium text-slate-400">Get Instant Quotes & Invoices</span>
        </div>
      </div>
    </header>
  );
}
