'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle2, Building, Printer, Phone } from 'lucide-react';

interface SampleQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SampleQuoteModal({ open, onOpenChange }: SampleQuoteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Sample Material Estimate PDF</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">Official SI-LATECH Client Quote Preview</DialogDescription>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="hidden sm:flex gap-1.5">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </DialogHeader>

        {/* PDF Preview Paper Document UI */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner my-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 font-sans text-slate-800 space-y-6 text-xs sm:text-sm">
            
            {/* Header / Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-amber-500 font-black text-xs">
                    SIL
                  </div>
                  <span className="text-lg font-black text-slate-900 tracking-tight">SI-LATECH</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Beam & Block Floor System Specialists</p>
                <p className="text-[11px] text-slate-500">Ruiru, Kiambu | Tel: +254 141 981 315</p>
              </div>
              <div className="sm:text-right bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-bold text-amber-600 block">ESTIMATE #SL-2026-0842</span>
                <span className="text-slate-500 block text-xs">Date: 27 July 2026</span>
                <span className="text-slate-500 block text-xs">Valid for: 14 Days</span>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">PROJECT CLIENT</span>
                <strong className="text-slate-900">Kiambu Residential Villa</strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">TOTAL SLAB AREA</span>
                <strong className="text-slate-900">120.00 m² (2 Rooms)</strong>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Material Breakdown</h5>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit Rate (KES)</th>
                      <th className="p-2 text-right">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-medium">Precast Concrete Beams (T-Section/Flat)</td>
                      <td className="p-2 text-right">240 m</td>
                      <td className="p-2 text-right">850.00</td>
                      <td className="p-2 text-right font-semibold">204,000.00</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Hollow Concrete Infill Blocks</td>
                      <td className="p-2 text-right">1,200 pcs</td>
                      <td className="p-2 text-right">100.00</td>
                      <td className="p-2 text-right font-semibold">120,000.00</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">BRC Mesh (A142 6x2.4m)</td>
                      <td className="p-2 text-right">9 sheets</td>
                      <td className="p-2 text-right">4,800.00</td>
                      <td className="p-2 text-right font-semibold">43,200.00</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Cement (50kg bags - Topping)</td>
                      <td className="p-2 text-right">48 bags</td>
                      <td className="p-2 text-right">820.00</td>
                      <td className="p-2 text-right font-semibold">39,360.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 bg-slate-900 text-white p-3.5 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>KES 400,560.00</span>
                </div>
                <div className="flex justify-between font-bold text-amber-400 text-sm border-t border-slate-700 pt-1">
                  <span>ESTIMATED TOTAL:</span>
                  <span>KES 400,560.00</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="text-[11px] text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900">
              <p className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                Includes beam placement guidance & custom material schedule.
              </p>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Preview
          </Button>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
            <a href="#calculator" onClick={() => onOpenChange(false)}>
              Generate My Own Quote Now
            </a>
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
