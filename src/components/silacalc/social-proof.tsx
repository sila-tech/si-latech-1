'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Eng. Dennis Kamau',
    role: 'Managing Director',
    company: 'Apex Structures Ltd (Kiambu)',
    text: 'SI-LATECH changed the game for our residential projects. We saved over 25% on formwork timber and completed our first floor slab installation in just 2 days. The precast beams are of excellent structural quality.',
    stars: 5,
  },
  {
    name: 'Grace Mutua',
    role: 'Lead Architect',
    company: 'Savannah Heights Developers (Nairobi)',
    text: 'Estimating beam and block quantities used to take hours of manual CAD cross-checking. SilaCalc is instantaneous and incredibly precise. The materials are delivered exactly as quoted, reducing onsite wastage to nearly zero.',
    stars: 5,
  },
  {
    name: 'Site Mgr. Caleb Omondi',
    role: 'Project Supervisor',
    company: 'Juja Modern Builders',
    text: 'Building near Juja can be difficult due to heavy soil profiles. Choosing SI-LATECH\'s light-weight precast hollow block system significantly reduced the dead load on our foundations while providing superior thermal insulation.',
    stars: 5,
  },
];

const partnerLogos = [
  'Apex Structures',
  'Savannah Heights',
  'Juja Builders',
  'Nairobi Construction Group',
  'Kiambu Developers',
  'Promax Kenya Ltd',
];

export function SocialProof() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // Native autoplay effect (cycles slide every 4 seconds)
  React.useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="space-y-12 py-8 border-t border-slate-100">
      
      {/* Logos Strip */}
      <div className="space-y-4">
        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          Trusted by Top Construction Partners
        </p>
        <div className="w-full overflow-hidden py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:justify-between px-6 opacity-40 grayscale contrast-125">
            {partnerLogos.map((logo) => (
              <div 
                key={logo} 
                className="font-headline font-black text-sm md:text-base tracking-tight text-slate-600 select-none"
              >
                {logo.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Slider */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Success Stories</p>
          <h2 className="text-2xl font-black text-slate-900 font-headline">What Site Managers Say</h2>
        </div>

        <div className="relative max-w-3xl mx-auto px-12">
          {/* Slider Viewport */}
          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex">
              {testimonials.map((t, idx) => (
                <div key={idx} className="flex-[0_0_100%] min-w-0 px-4">
                  <Card className="border border-slate-100 bg-slate-50/50 shadow-xs rounded-2xl relative overflow-hidden">
                    <Quote className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-200/40 pointer-events-none transform -rotate-12" />
                    <CardContent className="p-8 space-y-4 relative z-10">
                      
                      {/* Stars */}
                      <div className="flex gap-1 text-[#f59e0b]">
                        {Array.from({ length: t.stars }).map((_, i) => (
                          <Star key={i} size={16} fill="currentColor" />
                        ))}
                      </div>

                      {/* Content */}
                      <p className="text-slate-600 text-sm leading-relaxed font-medium italic">
                        "{t.text}"
                      </p>

                      {/* Author */}
                      <div className="pt-2">
                        <p className="font-extrabold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t.role} &bull; <span className="text-primary">{t.company}</span>
                        </p>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all active:scale-90"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all active:scale-90"
            aria-label="Next testimonial"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
    </div>
  );
}
