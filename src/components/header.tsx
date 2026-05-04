
'use client';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-20 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#095388] p-2 rounded-lg text-white">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 7V3L2 12h3v9h14v-9h3L12 7zm0 12H7v-5h10v5h-5z"/>
            </svg>
          </div>
          <Link href="/" className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-[#095388] leading-none">
              SI-LATECH
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#f59e0b] leading-tight uppercase">
              Beam & Block Specialists
            </span>
          </Link>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-black text-[#095388] uppercase tracking-wider">
            Beam to Beam Calculator
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Get Instant Quotes & Invoices
          </span>
        </div>
      </div>
    </header>
  );
}
