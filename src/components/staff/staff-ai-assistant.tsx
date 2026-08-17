'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, Sparkles, Send, ArrowRight, ShieldAlert, CheckCircle2, HelpCircle, HardHat } from 'lucide-react';
import { staffAiAssistant } from '@/ai/flows/staff-ai-assistant-flow';

interface StaffAiAssistantProps {
  staffName?: string;
  assignedProjects?: Array<{ name: string; projectLocation?: string; roomsCount?: number }>;
  onApplyFacilitation?: (amount: number, reason: string) => void;
}

export function StaffAiAssistant({ staffName, assignedProjects, onApplyFacilitation }: StaffAiAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; facilitation?: { amount: number; reason: string } }>>([
    {
      role: 'assistant',
      text: `Hello ${staffName || 'Technician'}! I am SILA-AI, your site operations and facilitation assistant. Ask me for technical installation guidelines or help estimating site facilitation funds.`
    }
  ]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || prompt;
    if (!textToSend.trim() || loading) return;

    setPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await staffAiAssistant({
        userMessage: textToSend,
        staffName,
        assignedProjects,
      });

      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply || 'Here is the response to your request.',
          facilitation: res.suggestedFacilitation
        }
      ]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an issue reaching the AI service. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-b from-amber-50/40 via-white to-slate-50 shadow-sm overflow-hidden print:hidden no-print">
      <CardHeader className="bg-slate-900 text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/sila-avatar.jpg" 
              alt="Si-la AI" 
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0 shadow-md" 
            />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Si-la Field AI Assistant <Sparkles size={16} className="text-amber-400 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs">
                Site task guidelines & facilitation request estimator
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-400/40 text-amber-300 text-[10px] uppercase tracking-wide">
            Staff Protected Mode
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Quick action chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleSend('Help me draft a facilitation request for 4 fundis lunch and local transport to site.')}
            className="bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-full border border-amber-200 transition-colors flex items-center gap-1 font-medium"
          >
            <Sparkles size={12} className="text-amber-700" /> Fundis & Transport Request
          </button>
          <button
            type="button"
            onClick={() => handleSend('How do I correctly space telescopic props for T-beams during installation?')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors flex items-center gap-1"
          >
            <HardHat size={12} className="text-primary" /> Prop Spacing Guide
          </button>
          <button
            type="button"
            onClick={() => handleSend('What is the recommended topping concrete screed mix ratio and curing time?')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors flex items-center gap-1"
          >
            <HelpCircle size={12} className="text-slate-600" /> Screed Mix Ratio
          </button>
        </div>

        {/* Chat History Box */}
        <div className="h-64 overflow-y-auto space-y-3 p-3 bg-white rounded-lg border border-slate-200 text-xs">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* If AI suggested a facilitation estimate */}
              {msg.facilitation && onApplyFacilitation && (
                <div className="mt-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg max-w-[85%] flex flex-col gap-2 shadow-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <CheckCircle2 size={14} className="text-amber-600" />
                    AI Facilitation Estimate Generated:
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-amber-800">KSh {msg.facilitation.amount.toLocaleString()}</span> — {msg.facilitation.reason}
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-7 text-xs flex items-center gap-1"
                    onClick={() => onApplyFacilitation(msg.facilitation!.amount, msg.facilitation!.reason)}
                  >
                    Apply to Request Form <ArrowRight size={12} />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic py-2">
              <Loader2 size={14} className="animate-spin text-amber-600" /> SILA-AI is thinking...
            </div>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI about site tasks or request facilitation..."
            className="flex-1 text-xs"
            disabled={loading}
          />
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0" disabled={loading || !prompt.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
