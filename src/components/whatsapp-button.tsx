'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function WhatsAppButton() {
  const pathname = usePathname();
  const isAdminSection = pathname?.startsWith('/admin');

  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const phoneNumber = '254141981315';
  const message = 'Hello SI-LATECH, I would like to make an inquiry about your Beam and Block Slab system.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    // Show button after a short delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    
    // Show tooltip periodically to draw attention
    const tooltipTimer = setInterval(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearInterval(tooltipTimer);
    };
  }, []);

  if (isAdminSection) return null;
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[108px] md:bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-10">
      {/* Tooltip */}
      <div 
        className={cn(
          "relative mb-2 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-2xl ring-1 ring-black/5 transition-all duration-500",
          showTooltip ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#25D366]">Online Support</span>
          <span className="text-sm font-medium text-slate-700">How can we help you today?</span>
        </div>
        <button 
          onClick={() => setShowTooltip(false)}
          className="ml-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={14} />
        </button>
        {/* Tooltip Arrow */}
        <div className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 bg-white ring-b-1 ring-r-1 ring-black/5"></div>
      </div>

      {/* Main Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-[0_10px_30px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_15px_40px_rgba(37,211,102,0.5)] active:scale-95 animate-float animate-whatsapp-pulse"
        aria-label="Contact us on WhatsApp"
      >
        {/* Glassmorphism Shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
        
        {/* Icon */}
        <div className="relative z-10 transition-transform duration-500 group-hover:rotate-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.889.001 2.269.654 4.505 1.88 6.385l.115.2-1.362 4.955 5.064-1.325.192.113zm9.57-5.171c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.296-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
        </div>

        {/* Pulsing Outer Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 group-hover:animate-ping opacity-20"></span>
      </a>
    </div>
  );
}
