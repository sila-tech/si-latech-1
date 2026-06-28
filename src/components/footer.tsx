'use client';

import Link from 'next/link';
import { Phone, MessageCircle, MapPin, Clock } from 'lucide-react';

export function Footer() {
  const phoneNumber = '254141981315';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello SI-LATECH, I would like to make an inquiry about your Beam and Block Slab system.')}`;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white mt-auto">
      {/* Main footer grid */}
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="SI-LATECH Logo" className="h-12 w-12 object-contain" />
              <div>
                <span className="text-xl font-black text-white block">SI-LATECH</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">Beam & Block Specialists</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-sm">
              Kenya's trusted beam and block specialists. We supply precision precast concrete beams and hollow blocks for residential and commercial construction projects nationwide.
            </p>
            {/* Social / Contact Icons */}
            <div className="flex items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1fbb57] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.889.001 2.269.654 4.505 1.88 6.385l.115.2-1.362 4.955 5.064-1.325.192.113zm9.57-5.171c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.296-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                WhatsApp Us
              </a>
              <a
                href="tel:+254141981315"
                aria-label="Call SI-LATECH"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-slate-700"
              >
                <Phone size={16} />
                Call Us
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Home' },
                { href: '/#calculator', label: 'Beam & Block Calculator' },
                { href: '/', label: 'Concrete Slab Calculator' },
                { href: '/contact', label: 'Contact Us' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#f59e0b] group-hover:w-2 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">Contact</h3>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5 text-sm text-slate-400">
                <Phone size={15} className="text-primary shrink-0 mt-0.5" />
                <a href="tel:+254141981315" className="hover:text-white transition-colors">
                  +254 141 981 315
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-400">
                <MessageCircle size={15} className="text-[#25D366] shrink-0 mt-0.5" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp: +254 141 981 315
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-400">
                <MapPin size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <span>Nairobi, Kenya<br/>Serving Kenya-wide</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-400">
                <Clock size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Mon–Fri: 8am–5pm<br/>Sat: 8am–1pm</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-500 text-xs">
            © {year} SI-LATECH. All rights reserved. Powered by SilaCalc™
          </p>
          <p className="text-slate-600 text-xs italic">
            @si-latech, a better simpler and cost effective way to build.
          </p>
        </div>
      </div>
    </footer>
  );
}
