'use client';

import { PlusCircle, Download } from 'lucide-react';
import { useCalculator } from '@/context/calculator-context';

export function MobileQuoteBar() {
  const { addRoom } = useCalculator();

  const handleDownload = () => {
    const realBtn = document.getElementById('real-invoice-btn');
    if (realBtn) realBtn.click();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <button
        onClick={addRoom}
        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
      >
        <PlusCircle size={18} />
        Add Room
      </button>
      <button
        onClick={handleDownload}
        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-black text-sm shadow-md transition-all"
      >
        <Download size={18} />
        Download Quote
      </button>
    </div>
  );
}
