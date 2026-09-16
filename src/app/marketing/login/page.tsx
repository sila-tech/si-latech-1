'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, ArrowRight, ShieldCheck, User, Loader2 } from 'lucide-react';
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
    if (
      passkey.trim() === 'SilaMarket2026' ||
      passkey.trim() === 'Sila4927' ||
      passkey.trim().toLowerCase() === 'marketing'
    ) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-100/60 via-slate-50 to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200/80 p-2 flex items-center justify-center">
              <img src="/logo.png" alt="SI-LATECH Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black text-slate-950 tracking-tight block leading-none">
                SI-LATECH
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block mt-1">
                Precast &amp; EcoSlabs
              </span>
            </div>
          </Link>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Marketing Media &amp; Project Showcase Portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border-slate-200/80 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#095388] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Marketing Team Sign In
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Manage live site photos and completed project portfolios
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Username / Department</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="marketing"
                    className="h-10 pl-9 rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#095388]"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-slate-700">Passkey</Label>
                  <span className="text-[10px] text-slate-400">Default: SilaMarket2026</span>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter marketing passkey"
                    className="h-10 pl-9 rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#095388]"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#095388] hover:bg-[#073f67] text-white font-bold text-xs h-10 rounded-xl shadow-md transition-all gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Marketing Hub <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="flex justify-center items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
                <Link href="/" className="hover:text-[#095388] transition-colors">
                  &larr; Back to Home
                </Link>
                <span>•</span>
                <Link href="/portfolio" className="hover:text-[#095388] transition-colors">
                  View Public Portfolio
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footnote */}
        <p className="text-center text-[11px] text-slate-400 font-medium">
          Protected portal &bull; Authorized SI-LATECH Marketing Team only
        </p>
      </div>
    </div>
  );
}
