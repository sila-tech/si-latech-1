'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Loader2, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Download,
  Wand2
} from 'lucide-react';
import { operationsAiAssistant, OperationsAiAssistantAction } from '@/ai/flows/operations-ai-assistant-flow';
import { calcRoomBlocksAndBeams, calculateProjectTotals, calcBilledBlocks, DEFAULTS } from '@/lib/calculator';
import { generateQuotePdf } from '@/lib/pdf-utils';

interface AdminOperationsAiModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
  finances?: any[];
  pricingRates?: any;
  onProjectUpdated?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: OperationsAiAssistantAction;
  timestamp: Date;
  statusText?: string;
  success?: boolean;
}

export function AdminOperationsAiModal({
  isOpen,
  onOpenChange,
  projects = [],
  finances = [],
  pricingRates,
  onProjectUpdated,
}: AdminOperationsAiModalProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your SILA Backend Operations & Finance AI assistant. You can tell me to:\n\n• **Move projects**: *'Move project Villa 4 from pending to expected'*\n• **Rectify errors**: *'Rectify dimension errors in project Karen Residence'*\n• **Convert & Quote T-Beams**: *'Download a T-beam quote for project Sunset and save it as T-beams without doubling beams'*\n• **Audit facilitation**: *'Audit pending staff facilitation requests'*",
      timestamp: new Date(),
    }
  ]);

  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputMessage).trim();
    if (!promptText || isLoading) return;

    setInputMessage('');
    const userMsg: Message = {
      role: 'user',
      content: promptText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Prepare compact project context for backend AI flow
      const compactProjects = projects.map(p => ({
        id: p.id,
        name: p.name || 'Unnamed Project',
        clientName: p.clientName || '',
        clientContact: p.clientContact || '',
        projectLocation: p.projectLocation || '',
        contactPerson: p.contactPerson || '',
        status: p.status || 'pending',
        beamType: p.settings?.beamType || 'flat',
        singleBeamsOnly: Boolean(p.settings?.singleBeamsOnly || p.settings?.forceSingleBeams),
        roomsCount: p.rooms?.length || 0,
        rooms: (p.rooms || []).map((r: any) => ({
          id: r.id || '1',
          name: r.name || 'Room',
          length: Number(r.length) || 0,
          width: Number(r.width) || 0,
        })),
      }));

      const pendingFinances = finances.filter((f: any) => f.status === 'pending');
      const financesSummary = pendingFinances.length 
        ? `${pendingFinances.length} pending requests totaling KSh ${pendingFinances.reduce((acc: number, f: any) => acc + (f.amount || 0), 0).toLocaleString()}`
        : 'All facilitation requests are currently cleared.';

      const result = await operationsAiAssistant({
        userMessage: promptText,
        projects: compactProjects,
        financesSummary,
      });

      let statusFeedback = '';
      let actionSucceeded = true;

      // EXECUTE STRUCTURED ACTIONS IN FIRESTORE / CLIENT
      if (result.action && result.action.type !== 'NONE') {
        const action = result.action;
        const targetProj = projects.find(p => p.id === action.projectId);

        if (action.type === 'UPDATE_STATUS' && action.projectId && action.newStatus) {
          try {
            await updateDoc(doc(firestore, 'projects', action.projectId), {
              status: action.newStatus,
              updatedAt: serverTimestamp(),
            });
            statusFeedback = `Project "${action.projectName || targetProj?.name || action.projectId}" status updated to ${action.newStatus.toUpperCase()}`;
            toast({ title: 'Status Updated', description: statusFeedback });
            if (onProjectUpdated) onProjectUpdated();
          } catch (err: any) {
            actionSucceeded = false;
            statusFeedback = `Failed to update status in database: ${err.message}`;
          }
        } else if (action.type === 'RECTIFY_PROJECT_ERRORS' && action.projectId && action.rectifiedRooms) {
          try {
            if (targetProj) {
              const currentSettings = { ...DEFAULTS, ...(targetProj.settings || {}) };
              const beamRate = currentSettings.beamType === 'tbeam' ? (pricingRates?.beamTbeamRate || 1200) : (pricingRates?.beamFlatRate || 545);
              const reCalculatedRooms = action.rectifiedRooms.map((r: any) => {
                const calcs = calcRoomBlocksAndBeams(r.length, r.width, currentSettings, beamRate, r.name);
                return { ...r, roomCalcs: calcs };
              });
              const newTotals = calculateProjectTotals(action.rectifiedRooms, currentSettings);

              await updateDoc(doc(firestore, 'projects', action.projectId), {
                rooms: action.rectifiedRooms,
                totals: newTotals,
                updatedAt: serverTimestamp(),
              });
              statusFeedback = `Rectified ${action.rectifiedRooms.length} room dimensions in "${action.projectName || targetProj.name}". Recalculated total blocks & beam lengths.`;
              toast({ title: 'Project Rectified', description: statusFeedback });
              if (onProjectUpdated) onProjectUpdated();
            }
          } catch (err: any) {
            actionSucceeded = false;
            statusFeedback = `Failed to save rectified rooms: ${err.message}`;
          }
        } else if (action.type === 'CONVERT_TO_TBEAM_AND_QUOTE' && action.projectId) {
          try {
            if (targetProj) {
              const singleBeams = Boolean(action.singleBeamsOnly);
              const updatedSettings = {
                ...DEFAULTS,
                ...(targetProj.settings || {}),
                beamType: 'tbeam',
                singleBeamsOnly: singleBeams,
                forceSingleBeams: singleBeams,
                beamTbeamRate: pricingRates?.beamTbeamRate || 1200,
                blockTbeamRate: pricingRates?.blockTbeamRate || 100,
              };

              const beamRate = updatedSettings.beamTbeamRate;
              const reCalculatedRooms = (targetProj.rooms || []).map((r: any) => {
                const calcs = calcRoomBlocksAndBeams(r.length, r.width, updatedSettings, beamRate, r.name);
                return { ...r, roomCalcs: calcs };
              });
              const newTotals = calculateProjectTotals(targetProj.rooms || [], updatedSettings);

              // Update Firestore project so it is saved as T-beams permanently
              await updateDoc(doc(firestore, 'projects', action.projectId), {
                settings: updatedSettings,
                totals: newTotals,
                updatedAt: serverTimestamp(),
              });

              statusFeedback = `Project "${targetProj.name}" saved as T-Beams${singleBeams ? ' (Single Beams Enforced beyond 4.2m)' : ''}. Generating quotation PDF...`;

              // Trigger immediate Quote PDF download
              if (action.triggerQuoteDownload !== false) {
                const invoiceNumber = `SILA-TB-${String(Date.now()).slice(-6)}`;
                generateQuotePdf({
                  invoiceNumber,
                  clientInfo: {
                    clientName: targetProj.clientName || 'Valued Client',
                    projectName: targetProj.name || 'Project',
                    projectLocation: targetProj.projectLocation || 'N/A',
                    clientContact: targetProj.clientContact || 'N/A',
                    contactPerson: targetProj.contactPerson || 'N/A',
                  },
                  totals: {
                    ...newTotals,
                    beamType: 'tbeam',
                    beamPrice: beamRate,
                    blockPrice: updatedSettings.blockTbeamRate,
                  },
                  perRoomCalculations: reCalculatedRooms,
                  discountType: targetProj.discountType || 'none',
                  discountValue: targetProj.discountValue || 0,
                  paymentMethods: targetProj.paymentMethods || [],
                  customPaymentNotes: singleBeams ? 'Engineered specification: Single T-Beam arrangement specified for structural spans.' : '',
                });
                statusFeedback += ' Quote PDF successfully downloaded.';
              }

              toast({ title: 'T-Beam Quote Generated', description: statusFeedback });
              if (onProjectUpdated) onProjectUpdated();
            }
          } catch (err: any) {
            actionSucceeded = false;
            statusFeedback = `Failed to convert project and quote: ${err.message}`;
          }
        }
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply,
          action: result.action,
          timestamp: new Date(),
          statusText: statusFeedback,
          success: actionSucceeded,
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `An error occurred while processing your request: ${err.message || 'Unknown error'}`,
          timestamp: new Date(),
          success: false,
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleChips = [
    "Move a pending project to expected",
    "Download a T-beam quote for a project without doubling beams (single beams only)",
    "Rectify room errors in project",
    "Audit pending site facilitation funds",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-600/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                SILA Operations &amp; Finance AI
                <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px]">Backend Agent</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Move project statuses, rectify dimension bugs, and quote single T-beams on demand
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Message Stream */}
        <ScrollArea className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[55vh]">
          <div className="space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-sky-600/30 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white ml-10'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800/90'
                }`}>
                  <div className="whitespace-pre-line">{m.content}</div>

                  {/* Execution Status Badge & Feedback */}
                  {m.statusText && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2">
                      {m.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className={`text-[11px] font-semibold ${m.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {m.statusText}
                      </span>
                    </div>
                  )}

                  {/* Action Summary Card */}
                  {m.action && m.action.type !== 'NONE' && (
                    <div className="mt-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px]">
                          Action: {m.action.type.replace(/_/g, ' ')}
                        </span>
                        {m.action.projectName && (
                          <Badge variant="outline" className="text-slate-400 border-slate-700 text-[10px]">
                            {m.action.projectName}
                          </Badge>
                        )}
                      </div>
                      {m.action.newStatus && (
                        <p className="text-slate-300">Status Target: <span className="font-bold text-purple-400 uppercase">{m.action.newStatus}</span></p>
                      )}
                      {m.action.beamType && (
                        <p className="text-slate-300">Beam Specification: <span className="font-bold text-amber-400 uppercase">{m.action.beamType}</span> {m.action.singleBeamsOnly ? '(Single Beams Only)' : ''}</p>
                      )}
                      {m.action.rectificationNotes && (
                        <p className="text-slate-300 italic">{m.action.rectificationNotes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-lg bg-sky-600/30 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                </div>
                <div className="bg-slate-900/80 text-slate-400 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2 border border-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>SILA-AI analyzing instruction and database...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 border-t border-slate-800/60 bg-slate-900/30 flex gap-2 overflow-x-auto text-[11px]">
          {sampleChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white shrink-0 border border-slate-700/50 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="e.g., Download a t beam quote for project Karen and save as tbeams, don't double beams even if beyond 4.2..."
              disabled={isLoading}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-xs h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-sky-500"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-10 px-4 rounded-xl shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
