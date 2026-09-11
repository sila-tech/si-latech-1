'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, MessageCircle, Menu, X, Calculator, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const phoneNumber = '254741557960';
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello SI-LATECH, I would like to inquire about purchasing precast beams and blocks.')}`;

const navLinks = [
  { href: '/#marketplace', label: 'Marketplace' },
  { href: '/#calculator', label: 'Calculator' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="container flex h-20 items-center justify-between mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="SI-LATECH Logo" className="h-full w-full object-contain" />
          </Link>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black leading-none tracking-tight text-slate-950">SI-LATECH</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600">Precast &amp; EcoSlabs</span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-bold transition-colors text-slate-700 hover:bg-slate-100 hover:text-slate-950'
              )}
            >
              {label}
            </a>
          ))}
          <Link
            href="/partner/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Sign In
          </Link>
        </nav>

        {/* Desktop Right CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp SI-LATECH"
            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1fbb57] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <MessageCircle size={15} />
            WhatsApp Order
          </a>

          <Button
            asChild
            className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold px-4 py-2.5 text-xs rounded-xl shadow-md transition-all hover:scale-105 border border-slate-800"
          >
            <a href="/#calculator" className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-amber-400" />
              Material Estimator
            </a>
          </Button>
        </div>

        {/* Mobile Header Right: WhatsApp + Prominent Calculate CTA + Hamburger */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp SI-LATECH"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#25D366] text-white shadow-xs active:scale-95 transition-transform"
          >
            <MessageCircle size={17} />
          </a>

          <Button
            asChild
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 text-xs rounded-xl shadow-xs active:scale-95 transition-transform"
          >
            <a href="/#calculator" className="flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5" />
              <span>Calculate</span>
            </a>
          </Button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-95 transition-all"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              {label}
            </a>
          ))}
          <Link
            href="/partner/login"
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Sign In
          </Link>
          <div className="pt-3 grid grid-cols-2 gap-2 border-t border-slate-100">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 bg-[#25D366] text-white py-3 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
            <a
              href="tel:+254741557960"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              <Phone size={15} /> Call Factory
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
