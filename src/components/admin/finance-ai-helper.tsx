'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, FileText } from 'lucide-react';
import { parseFinanceRecord, analyzeFacilitationRequests, AnalyzeFacilitationRequestsOutput } from '@/ai/flows/finance-ai-assistant-flow';
import { useToast } from '@/hooks/use-toast';

interface FinanceAiSmartFillerProps {
  onApplyParsedRecord: (data: { type: string; amount: number; reason: string }) => void;
}

export function FinanceAiSmartFiller({ onApplyParsedRecord }: FinanceAiSmartFillerProps) {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const res = await parseFinanceRecord({ rawText });
      if (res.amount > 0 || res.reason) {
        onApplyParsedRecord({
          type: res.type === 'income' ? 'income' : 'other_expense',
          amount: res.amount,
          reason: res.reason,
        });
        toast({
          title: 'Record Auto-Filled by AI',
          description: `Extracted KSh ${res.amount.toLocaleString()} (${res.category}).`,
        });
        setRawText('');
      } else {
        toast({
          title: 'Could not extract values',
          description: 'Please check the raw text format.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'AI Parsing Error',
        description: 'Failed to process transaction text.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="bg-amber-50/70 text-slate-900 p-3.5 rounded-xl border border-amber-200/80 space-y-2.5 mb-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <Sparkles size={14} className="text-amber-600" /> AI Smart Record Filler
        </div>
        <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-100 text-amber-900 font-bold">
          Paste Note / M-Pesa SMS
        </Badge>
      </div>

      <Textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="e.g. Paid KSh 14,000 for sand delivery at site, or Received 450,000 from Client B for T-beams"
        className="text-xs bg-slate-950 border-slate-800 text-slate-200 min-h-[50px] placeholder:text-slate-500"
      />

      <Button
        type="button"
        size="sm"
        onClick={handleParse}
        disabled={isParsing || !rawText.trim()}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-8 flex items-center justify-center gap-1.5"
      >
        {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Auto-Fill Transaction Form
      </Button>
    </div>
  );
}

interface FinanceAiAuditModalProps {
  pendingRequests: Array<{ id: string; amount: number; reason: string; requestedBy?: string }>;
}

export function FinanceAiAuditModal({ pendingRequests }: FinanceAiAuditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeFacilitationRequestsOutput | null>(null);

  const handleAnalyze = async () => {
    if (!pendingRequests?.length) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeFacilitationRequests({ requests: pendingRequests });
      setAnalysisResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(true);
            handleAnalyze();
          }}
          className="border-amber-500/40 text-amber-700 hover:bg-amber-50 text-xs flex items-center gap-1 font-bold"
        >
          <Sparkles size={14} className="text-amber-600" /> AI Audit Requests ({pendingRequests.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="text-amber-600" /> AI Facilitation Audit & Review
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4 text-xs">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2 text-slate-500">
              <Loader2 size={24} className="animate-spin text-amber-600" />
              <p>Analyzing pending site facilitation requests...</p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="font-bold text-amber-900 mb-1">Executive Summary</p>
                <p className="text-slate-700">{analysisResult.summary}</p>
                <div className="mt-2 text-xs font-bold text-slate-900">
                  Total Pending: KSh {analysisResult.totalRequested.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Approval Recommendations</p>
                <div className="space-y-1.5">
                  {analysisResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 flex items-start gap-2 text-slate-700">
                      <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 italic">No pending requests to analyze.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
