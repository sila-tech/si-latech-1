'use client';

import React from 'react';
import { Phone, MessageCircle, Mail, MapPin, Clock, ArrowRight, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

const phoneNumber = '254141981315';
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello SI-LATECH, I would like to make an inquiry about your Beam and Block Slab system.')}`;

export function ContactSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-900 text-white relative overflow-hidden" id="contact">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400">
            Get In Touch
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Need Expert Slab Guidance or Custom Quotation?
          </h3>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Our structural technical team is ready to assist you with beam sizing, site layout support, and delivery logistics across Kenya.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: WhatsApp */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-[#25D366]/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center border border-[#25D366]/30">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-white">WhatsApp Direct</h4>
              <p className="text-xs text-slate-400">Chat with a technical consultant instantly on WhatsApp.</p>
            </div>
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#1fbb57] text-white font-bold rounded-xl">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                Chat on WhatsApp
              </a>
            </Button>
          </div>

          {/* Card 2: Phone Call */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Phone className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Call Us Directly</h4>
              <p className="text-xs text-slate-400">Speak directly with our technical team during business hours.</p>
            </div>
            <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl">
              <a href="tel:+254141981315" className="flex items-center justify-center gap-2">
                +254 141 981 315
              </a>
            </Button>
          </div>

          {/* Card 3: Email */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Mail className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Email Inquiry</h4>
              <p className="text-xs text-slate-400">Send your architectural drawings for a detailed quote.</p>
            </div>
            <Button asChild variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-700 rounded-xl">
              <a href="mailto:info@si-latech.com" className="flex items-center justify-center gap-2">
                info@si-latech.com
              </a>
            </Button>
          </div>

          {/* Card 4: Location & Hours */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">Yard & Office Address</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Behind Rubis Petrol Station, Ruiru, Kiambu County, Kenya.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2 text-xs text-slate-300">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Mon–Sat: 8:00 AM – 5:00 PM EAT</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
