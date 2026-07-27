'use client';

import React from 'react';
import { Star, ShieldCheck, Award, CheckCircle2, Building2, User } from 'lucide-react';

const partners = [
  'Nairobi Builders Guild',
  'Kiambu Structural Consultants',
  'Ruiru Commercial Developers',
  'Apex Civil Engineering',
  'Kenya Housing Contractors',
];

const testimonials = [
  {
    name: 'Eng. Peter Mwangi',
    title: 'Senior Structural Engineer',
    company: 'Mwangi & Associates Consultants',
    quote: 'SilaCalc saved us days of manual estimation. The beam and block quantities matched our structural drawings with pinpoint accuracy.',
    rating: 5,
    avatarBg: 'bg-amber-500 text-slate-950',
    initials: 'PM',
  },
  {
    name: 'David Karanja',
    title: 'Lead Site Contractor',
    company: 'Karanja Construction Ltd, Ruiru',
    quote: 'We completed a 240 m² floor slab in Kiambu in less than 3 days. The cost savings compared to cast-in-situ concrete were substantial.',
    rating: 5,
    avatarBg: 'bg-blue-600 text-white',
    initials: 'DK',
  },
  {
    name: 'Mary Wanjiru',
    title: 'Project Developer',
    company: 'Wanjiru Heights Apartments',
    quote: 'The instant PDF quote feature allowed us to send transparent material breakdowns to our bank for financing approval immediately.',
    rating: 5,
    avatarBg: 'bg-emerald-600 text-white',
    initials: 'MW',
  },
];

const trustBadges = [
  { icon: ShieldCheck, title: 'Engineer Certified', desc: 'Verified calculations based on BS 8110 standards' },
  { icon: Award, title: 'Quality Tested', desc: 'High-strength precast beams & hollow blocks' },
  { icon: CheckCircle2, title: 'KEBS Compliant', desc: 'Meets Kenyan building standards' },
  { icon: Building2, title: 'Insured Guarantee', desc: 'Trusted by over 500+ site projects' },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200" id="testimonials">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Trusted Partners Logo/Text Bar */}
        <div className="text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Trusted by Leading Contractors & Structural Engineers Across Kenya
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-80 grayscale hover:grayscale-0 transition-all">
            {partners.map((partner, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-sm"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-600">
            Contractor Feedback
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            What Building Professionals Say
          </h3>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Here is how SI-LATECH is helping Kenyan builders save money and speed up project timelines.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* 5-Star Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-slate-700 text-sm leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Profile */}
              <div className="pt-6 border-t border-slate-100 flex items-center gap-3 mt-6">
                <div className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ${t.avatarBg}`}>
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-500">{t.title} • <span className="text-slate-700 font-medium">{t.company}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Certification & Trust Badges */}
        <div className="pt-8 border-t border-slate-200/80">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center gap-3 shadow-xs"
                >
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">{badge.title}</h5>
                    <p className="text-[11px] text-slate-500">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
