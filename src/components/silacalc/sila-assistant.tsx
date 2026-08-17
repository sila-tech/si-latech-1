'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, VolumeX, Sparkles, X, MessageSquare, Trash2, Headphones, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCalculator } from '@/context/calculator-context';
import { processSilaMessage } from '@/ai/flows/sila-voice-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export function SilaAssistant() {
  const { rooms, setRooms, clearCalculator, settings, totals } = useCalculator();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello, and welcome! I'm Si-la, your personal assistant at SI-LATECH. I'm here to help you effortlessly calculate your beam and block requirements, generate accurate quotes, and answer any questions you may have. You're welcome to speak or type in English, Swahili, or Sheng — I understand it all. Shall we get started?",
      timestamp: new Date(0)
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'sw' | 'en'>('sw'); // 'sw' for Swahili/Sheng, 'en' for English
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Load settings from localStorage if available
  useEffect(() => {
    setMounted(true);
    try {
      const storedTts = localStorage.getItem('sila-tts-enabled');
      if (storedTts !== null) {
        setTtsEnabled(storedTts === 'true');
      }
      const storedLang = localStorage.getItem('sila-lang');
      if (storedLang === 'sw' || storedLang === 'en') {
        setLanguage(storedLang);
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        
        rec.onstart = () => {
          setIsListening(true);
        };
        
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputVal(transcript);
            handleSendMessage(transcript);
          }
        };
        
        rec.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone Access Denied",
              description: "Please check your browser permissions to allow microphone access.",
              variant: "destructive",
            });
          }
        };
        
        rec.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = rec;
      }
    }
  }, [language]);

  // Speak out text (Text-to-Speech)
  const speak = (text: string, langCode: 'sw' | 'en') => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      if (langCode === 'sw') {
        utterance.lang = 'sw-KE';
      } else {
        utterance.lang = 'en-US';
      }

      // Try to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      if (langCode === 'sw') {
        // Try Swahili or any East African voice
        selectedVoice = voices.find(v => v.lang.startsWith('sw') || v.name.toLowerCase().includes('swahili'));
      }
      
      if (!selectedVoice) {
        // Fallback to a natural sounding English female voice
        selectedVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.toLowerCase().includes('female') || 
           v.name.toLowerCase().includes('google') || 
           v.name.toLowerCase().includes('zira') || 
           v.name.toLowerCase().includes('siri'))
        );
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn("Speech Synthesis failed:", error);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser does not support voice speech-to-text. Please try using Google Chrome or Microsoft Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Cancel speech before listening to prevent echo
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Update speech recognition language
      recognitionRef.current.lang = language === 'sw' ? 'sw-KE' : 'en-KE';
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech Recognition failed to start:", err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    setInputVal('');
    
    // User Message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Calculate details to pass as current state
    const BEAM_PRICE = settings.beamType === 'tbeam' ? 1100 : 520;
    const BLOCK_PRICE = settings.beamType === 'tbeam' ? 100 : 85;
    
    const calculatorState = {
      beamType: settings.beamType || 'flat',
      rooms: rooms.map(r => ({ name: r.name, length: r.length, width: r.width })),
      totalArea: totals.totalArea,
      totalBeamsCost: totals.totalInvoiceBeamLength * BEAM_PRICE,
      totalBlocksCost: totals.totalBlocks * BLOCK_PRICE,
      grandTotalCost: (totals.totalInvoiceBeamLength * BEAM_PRICE) + (totals.totalBlocks * BLOCK_PRICE)
    };

    // Chat History
    const history = messages
      .filter(m => m.id !== 'welcome')
      .slice(-10) // Only send the last 10 messages to save context tokens
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    try {
      const response = await processSilaMessage({
        userMessage: text,
        history,
        calculatorState
      });

      // Handle structured commands from the assistant
      if (response.command) {
        const { action, rooms: responseRooms } = response.command;
        
        if (action === 'CLEAR_CALCULATOR') {
          clearCalculator();
          toast({
            title: "Calculator Cleared",
            description: "All rooms have been cleared by Si-la.",
          });
        } else if (action === 'ADD_ROOMS' && responseRooms && responseRooms.length > 0) {
          const newRooms = responseRooms.map((r, i) => ({
            id: crypto.randomUUID(),
            name: r.name || `Room ${rooms.length + i + 1}`,
            length: r.length,
            width: r.width
          }));
          setRooms([...rooms, ...newRooms]);
          toast({
            title: `${newRooms.length} Room(s) Added`,
            description: `Added by Si-la: ${newRooms.map(r => `${r.name} (${r.length}x${r.width}m)`).join(', ')}`,
          });
        } else if (action === 'DOWNLOAD_QUOTE') {
          const downloadBtn = document.getElementById('real-invoice-btn');
          if (downloadBtn) {
            downloadBtn.click();
            toast({
              title: "Downloading Your Quote",
              description: "Si-la is generating your PDF quote now.",
            });
          } else {
            toast({
              title: "No Quote Available",
              description: "Please add at least one room before downloading a quote.",
              variant: "destructive",
            });
          }
        }
      }

      // Add Model Response
      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: response.reply,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, modelMsg]);
      
      // Voice feedback
      speak(response.reply, language);

    } catch (err) {
      console.error("Si-la communication error:", err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        content: "Oops! Sikuweza kukupata vizuri. Mfumo wangu umepata shida ya mtandao. Tafadhali jaribu tena.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageToggle = () => {
    const nextLang = language === 'sw' ? 'en' : 'sw';
    setLanguage(nextLang);
    try {
      localStorage.setItem('sila-lang', nextLang);
    } catch (e) {}
    toast({
      title: `Language Switched`,
      description: nextLang === 'sw' ? 'Listening in Kiswahili/Sheng' : 'Listening in English',
    });
  };

  const handleTtsToggle = () => {
    const nextTts = !ttsEnabled;
    setTtsEnabled(nextTts);
    try {
      localStorage.setItem('sila-tts-enabled', String(nextTts));
    } catch (e) {}
    if (!nextTts && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    toast({
      title: nextTts ? "Voice Output On" : "Voice Output Muted",
      description: nextTts ? "Si-la will read her answers." : "Si-la will remain silent.",
    });
  };

  const clearChatHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content: "Hello again! I'm Si-la, ready to assist you. Feel free to share your room dimensions whenever you're ready — in English, Swahili, or Sheng. I'm all ears!",
        timestamp: new Date()
      }
    ]);
  };

  // Don't render on the server — prevents hydration mismatch from Date/localStorage
  const hasMobileBar = (totals?.totalArea || 0) > 0;

  return (
    <div className={cn(
      "fixed left-4 md:left-6 z-[999990] flex flex-col items-start gap-2 select-none transition-all duration-300 print:hidden no-print",
      hasMobileBar ? "bottom-20 md:bottom-6" : "bottom-5 md:bottom-6"
    )}>
      
      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[370px] h-[500px] max-h-[80vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 ring-1 ring-white/10 relative">
          
          {/* Decorative glowing blobs */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

          {/* Chat Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img 
                  src="/sila-avatar.jpg" 
                  alt="Si-la AI" 
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-headline font-black text-slate-100 text-sm">Si-la</h3>
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-400" /> AI Assistant
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                  Online • Speaks Swahili, Sheng, English
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={handleLanguageToggle}
                className="h-8 px-2 rounded-xl text-[10px] font-black border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all uppercase tracking-wider flex items-center gap-1"
                title="Switch voice recognition language"
              >
                🌐 {language === 'sw' ? 'Sheng/Swahili' : 'English'}
              </button>

              {/* TTS Toggle */}
              <button
                type="button"
                onClick={handleTtsToggle}
                className={`h-8 w-8 rounded-xl border border-slate-800 flex items-center justify-center transition-all ${
                  ttsEnabled ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-slate-900/80 text-slate-500'
                }`}
                title={ttsEnabled ? "Mute voice response" : "Unmute voice response"}
              >
                {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              {/* Clear Chat */}
              <button
                type="button"
                onClick={clearChatHistory}
                className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all"
                title="Clear conversation"
              >
                <Trash2 size={14} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all ml-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 relative z-10 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}
              >
                {msg.role === 'model' && (
                  <img
                    src="/sila-avatar.jpg"
                    alt="Si-la"
                    className="w-7 h-7 rounded-full object-cover border border-amber-400 shrink-0 mt-0.5 shadow-xs"
                  />
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className={`block text-[9px] mt-1 text-right ${
                    msg.role === 'user' ? 'text-slate-900/70 font-bold' : 'text-slate-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start items-center gap-2">
                <img
                  src="/sila-avatar.jpg"
                  alt="Si-la"
                  className="w-7 h-7 rounded-full object-cover border border-amber-400 shrink-0 shadow-xs animate-pulse"
                />
                <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-400 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-slate-400">Si-la is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3.5 py-2 border-t border-slate-900 bg-slate-950/80 overflow-x-auto flex gap-2 scrollbar-none relative z-10">
            <button
              type="button"
              onClick={() => handleSendMessage("Niko na slab ya 6m by 5m")}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              📐 6m x 5m Slab
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("How much is a block and flat beam?")}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              💰 Price ni ngapi?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("How does shared walls deduction work?")}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              🏢 Shared Walls?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("clear the calculator")}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:border-rose-950 transition-colors"
            >
              🗑️ Clear Slab
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-900 flex items-center gap-2 relative z-10">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/20'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
              }`}
              title={isListening ? "Stop listening" : "Talk to Si-la"}
            >
              {isListening ? (
                <div className="relative flex items-center justify-center">
                  <Activity size={18} className="animate-spin text-white opacity-80" />
                </div>
              ) : (
                <Mic size={18} />
              )}
            </button>

            {/* Input field */}
            <div className="flex-1 relative flex items-center">
              <Input
                type="text"
                placeholder={
                  isListening
                    ? (language === 'sw' ? 'Listening (Sheng/Swahili)...' : 'Listening (English)...')
                    : (language === 'sw' ? 'Ask Si-la in Swahili, Sheng or English...' : 'Ask Si-la in Swahili, Sheng or English...')
                }
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isListening}
                className="h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-amber-500 rounded-xl text-xs pr-10"
              />
              
              {/* Send Button inside Input */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim() || isListening}
                className="absolute right-3 text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-30"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
          
        </div>
      )}

      {/* Touch-Friendly Floating Activation Button & AI Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-900 text-white p-1.5 pr-4 rounded-full shadow-2xl border-2 border-amber-400/80 active:scale-95 transition-all duration-200 touch-manipulation cursor-pointer"
        aria-label="Open Si-la AI Assistant"
      >
        <div className="relative shrink-0">
          <img
            src="/sila-avatar.jpg"
            alt="Si-la AI Avatar"
            className="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover border-2 border-amber-400 group-hover:scale-105 transition-transform"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
        </div>
        
        <div className="flex flex-col items-start text-left">
          <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
            <span>Ask Si-la</span>
            <Sparkles size={12} className="animate-spin text-amber-300" style={{ animationDuration: '4s' }} />
          </div>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            AI Assistant
          </span>
        </div>
      </button>

    </div>
  );
}
