'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, VolumeX, Sparkles, X, MessageSquare, Trash2, Headphones, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCalculator } from '@/context/calculator-context';
import { processSilaMessage } from '@/ai/flows/sila-voice-flow';
import { useToast } from '@/hooks/use-toast';

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
  const [ttsEnabled, setTtsEnabled] = useState(true);
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
    const BEAM_PRICE = settings.beamType === 'tbeam' ? 1250 : 520;
    const BLOCK_PRICE = settings.beamType === 'tbeam' ? 110 : 85;
    
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
  if (!mounted) return null;

  return (
    <div className="fixed bottom-[108px] right-6 z-[10001] flex flex-col items-end pointer-events-none">
      
      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="mb-4 w-[92vw] sm:w-[420px] h-[550px] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-white/10 relative pointer-events-auto">
          
          {/* Decorative glowing blobs */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-850 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-white font-headline font-black shadow-lg">
                  Si
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-headline font-black text-slate-100 text-sm">Si-la Assistant</h3>
                  <span className="bg-primary/20 text-primary text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest border border-primary/20">AI Voice</span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                  Online • Swahili, Sheng, English
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Language Switcher */}
              <button
                onClick={handleLanguageToggle}
                className="h-8 px-2 rounded-xl text-[10px] font-black border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all uppercase tracking-wider flex items-center gap-1"
                title="Switch voice recognition language"
              >
                🌐 {language === 'sw' ? 'Sheng/Swahili' : 'English'}
              </button>

              {/* TTS Toggle */}
              <button
                onClick={handleTtsToggle}
                className={`h-8 w-8 rounded-xl border border-slate-800 flex items-center justify-center transition-all ${
                  ttsEnabled ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-slate-900/60 text-slate-500'
                }`}
                title={ttsEnabled ? "Mute voice response" : "Unmute voice response"}
              >
                {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              {/* Clear Chat */}
              <button
                onClick={clearChatHistory}
                className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all"
                title="Clear conversation"
              >
                <Trash2 size={14} />
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all ml-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white font-semibold rounded-tr-none shadow-md shadow-primary/10'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className={`block text-[9px] mt-1.5 text-right ${
                    msg.role === 'user' ? 'text-white/60' : 'text-slate-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900/80 p-3.5 text-xs text-slate-400 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-slate-500">Si-la anafikiria...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/60 overflow-x-auto flex gap-2 scrollbar-none relative z-10">
            <button
              onClick={() => handleSendMessage("Niko na slab ya 6m by 5m")}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              📐 6m x 5m Slab
            </button>
            <button
              onClick={() => handleSendMessage("How much is a block and flat beam?")}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              💰 Price ni ngapi?
            </button>
            <button
              onClick={() => handleSendMessage("How does shared walls deduction work?")}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              🏢 Shared Walls?
            </button>
            <button
              onClick={() => handleSendMessage("clear the calculator")}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:border-rose-950 transition-colors"
            >
              🗑️ Clear Slab
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-900 flex items-center gap-2 relative z-10">
            {/* Voice Input Button */}
            <button
              onClick={toggleListening}
              className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/20'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-850'
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
                    : (language === 'sw' ? 'Type or talk to Si-la...' : 'Type or talk to Si-la...')
                }
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isListening}
                className="h-11 bg-slate-900 border-slate-850 text-slate-200 placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl text-xs pr-10"
              />
              
              {/* Send Button inside Input */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim() || isListening}
                className="absolute right-3 text-slate-500 hover:text-primary transition-colors disabled:opacity-30"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
          
        </div>
      )}

      {/* Floating Activation Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-sky-400 text-white shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group border border-white/20 relative pointer-events-auto"
      >
        {isOpen ? (
          <X size={22} className="rotate-90 transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center">
            <Headphones size={22} className="group-hover:animate-bounce" />
            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider border border-slate-950">
              Sila AI
            </span>
          </div>
        )}
      </button>

    </div>
  );
}
