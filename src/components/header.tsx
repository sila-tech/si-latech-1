'use client';
import Link from 'next/link';
import { Calculator } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-20 items-center justify-between mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-16 w-16 items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="SI-LATECH Logo" className="h-full w-full object-contain" />
          </Link>
          <div className="flex flex-col">
            <span className="text-2xl font-black leading-none tracking-tight text-slate-900">SI-LATECH</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">Beam & Block Specialists</span>
          </div>
          <div className="hidden lg:flex flex-col border-l border-slate-200 pl-4 ml-2">
            <p className="text-sm font-medium text-slate-500 italic">
              @si-latech, a better simpler and cost effective way to build.
            </p>
            <p className="text-[10px] font-bold text-primary">Office: +254 701 792088</p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-black uppercase tracking-tighter text-slate-900">Beam to Beam Calculator</span>
          <span className="text-[10px] font-medium text-slate-400 italic lg:hidden">
            @si-latech, a better simpler and cost effective way to build.
          </span>
          <span className="text-[10px] font-medium text-slate-400 hidden lg:block">Get Instant Official Quotes</span>
        </div>
      </div>
    </header>
  );
}
