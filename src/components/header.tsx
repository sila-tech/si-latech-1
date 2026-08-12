'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, MessageCircle, Menu, X, Calculator } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const phoneNumber = '254141981315';
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello SI-LATECH, I would like to make an inquiry about your Beam and Block Slab system.')}`;

const navLinks = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#calculator', label: 'Calculator' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#testimonials', label: 'Testimonials' },
  { href: '/#contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="container flex h-20 items-center justify-between mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="SI-LATECH Logo" className="h-full w-full object-contain" />
          </Link>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black leading-none tracking-tight text-slate-900">SI-LATECH</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600">Beam & Block Specialists</span>
          </div>
          <div className="hidden xl:flex flex-col border-l border-slate-200 pl-4 ml-2">
            <p className="text-xs font-medium text-slate-500 italic">
              A better, simpler & cost-effective way to build.
            </p>
            <a href="tel:+254141981315" className="text-[10px] font-bold text-amber-600 hover:underline">
              Call: +254 141 981 315
            </a>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop Right CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp SI-LATECH"
            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1fbb57] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>

          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-105"
          >
            <a href="/#calculator" className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4" />
              Calculate Now
            </a>
          </Button>
        </div>

        {/* Mobile Header Right: WhatsApp + Prominent Calculate CTA + Hamburger */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
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
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 sm:px-3.5 py-1.5 text-xs rounded-xl shadow-xs active:scale-95 transition-transform"
          >
            <a href="/#calculator" className="flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Calculate</span>
            </a>
          </Button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="pt-3 grid grid-cols-2 gap-2.5 border-t border-slate-100">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href="tel:+254141981315"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              <Phone size={16} /> Call Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
