'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, MessageCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const phoneNumber = '254141981315';
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello SI-LATECH, I would like to make an inquiry about your Beam and Block Slab system.')}`;

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#calculator', label: 'Calculator' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-20 items-center justify-between mx-auto max-w-7xl px-4">
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-16 w-16 items-center justify-center overflow-hidden shrink-0">
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
            <a href="tel:+254141981315" className="text-[10px] font-bold text-primary hover:underline">
              Office: +254 141 981 315
            </a>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="ml-3 flex items-center gap-2 border-l border-slate-200 pl-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp SI-LATECH"
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1fbb57] text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.889.001 2.269.654 4.505 1.88 6.385l.115.2-1.362 4.955 5.064-1.325.192.113zm9.57-5.171c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.296-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href="tel:+254141981315"
              aria-label="Call SI-LATECH"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg text-xs font-bold transition-all"
            >
              <Phone size={13} />
              Call
            </a>
          </div>
        </nav>

        {/* Mobile: Phone + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <a
            href="tel:+254141981315"
            aria-label="Call SI-LATECH"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary"
          >
            <Phone size={18} />
          </a>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl text-sm font-bold"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href="tel:+254141981315"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-bold"
            >
              <Phone size={16} /> Call Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
