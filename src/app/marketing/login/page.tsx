'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, Lock, ArrowRight, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function MarketingLoginPage() {
  const [passkey, setPasskey] = useState('');
  const [username, setUsername] = useState('marketing');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Accept standard marketing credentials or master admin passkey
    if (passkey.trim() === 'SilaMarket2026' || passkey.trim() === 'Sila4927' || passkey.trim().toLowerCase() === 'marketing') {
      const sessionData = {
        role: 'marketing',
        username: username.trim() || 'marketing',
        timestamp: Date.now(),
      };
      sessionStorage.setItem('sila-marketing-auth', JSON.stringify(sessionData));
      toast({
        title: 'Welcome Marketing Team',
        description: 'Successfully authenticated to the Marketing & Portfolio Dashboard.',
      });
      router.push('/marketing');
    } else {
      toast({
        title: 'Access Denied',
        description: 'Invalid access passkey. Please check with the administrator.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-amber-500 shadow-xl shadow-pink-600/20 mb-2">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-headline">
            SI-LATECH <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-400">Marketing</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Dedicated Media, Photography &amp; Project Showcase Portal
          </p>
        </div>

        <Card className="bg-slate-900/90 border-slate-800 text-white shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Marketing Team Sign In
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Access the ongoing &amp; completed project photo manager
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Username / Department</Label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="marketing"
                  className="bg-slate-950 border-slate-800 text-white text-xs h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-slate-300">Passkey</Label>
                  <span className="text-[10px] text-slate-500">Contact admin if forgotten</span>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter marketing passkey"
                    className="bg-slate-950 border-slate-800 text-white text-xs h-10 rounded-xl pl-9"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white font-bold text-xs h-10 rounded-xl shadow-lg transition-all gap-2"
              >
                Sign In to Marketing Hub <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex justify-center items-center gap-4 text-[11px] text-slate-500 pt-2">
                <Link href="/" className="hover:text-slate-300 transition-colors">
                  &larr; Back to Home
                </Link>
                <span>•</span>
                <Link href="/portfolio" className="hover:text-slate-300 transition-colors">
                  View Public Portfolio
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
