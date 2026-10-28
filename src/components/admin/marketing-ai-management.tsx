'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Bot,
  Megaphone,
  Crosshair,
  Share2,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  Search,
  Target,
  Send,
  Zap,
  Video,
  Clapperboard,
  MessageSquare,
  Play,
} from 'lucide-react';
import {
  DEFAULT_BRAND_PROFILE,
  BrandProfile,
  CompetitorAuditOutput,
  ContentGeneratorOutput,
  AdCreativeOutput,
  ContentPlatform,
  CampaignObjective,
} from '@/lib/marketing-ai-prompts';
import {
  requestCompetitorAudit,
  requestContentGeneration,
  requestAdCreative,
} from '@/lib/marketing-ai-service';

export function MarketingAiManagement() {
  const { toast } = useToast();

  // Active main tab: 'competitor' | 'content' | 'ads'
  const [activeTab, setActiveTab] = useState<'competitor' | 'content' | 'ads'>('content');

  // Brand Profile State
  const [showBrandConfig, setShowBrandConfig] = useState(false);
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({ ...DEFAULT_BRAND_PROFILE });

  // -------------------------------------------------------------
  // TASK 1: Competitor Intelligence State
  // -------------------------------------------------------------
  const [competitorName, setCompetitorName] = useState('Conventional Cast-in-Situ Timber Formwork Contractors');
  const [focusArea, setFocusArea] = useState('Cost inflation, timber waste, 28-day curing downtime, and site hazards');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<CompetitorAuditOutput | null>(null);

  // -------------------------------------------------------------
  // TASK 2: Multi-Channel Content State (Focused on TikTok & Facebook)
  // -------------------------------------------------------------
  const [contentPlatform, setContentPlatform] = useState<ContentPlatform>('tiktok');
  const [contentTopic, setContentTopic] = useState('Stop Wasting Timber: How This Nairobi Builder Installed a 200m² Suspended Slab in 2 Days');
  const [contentObjective, setContentObjective] = useState<CampaignObjective>('Lead Gen');
  const [customInstructions, setCustomInstructions] = useState('High-energy 3-second hook for TikTok & Facebook video feeds. Emphasize saving up to KSh 250,000 on timber shuttering and skipping the 28-day curing delay. Direct viewers to tap the WhatsApp link in bio.');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [contentResult, setContentResult] = useState<ContentGeneratorOutput | null>(null);

  // -------------------------------------------------------------
  // TASK 3: Ad Creative State
  // -------------------------------------------------------------
  const [productName, setProductName] = useState('SI-LATECH Prestressed T-Beam & Hollow Block Slab System');
  const [campaignGoal, setCampaignGoal] = useState('Instant WhatsApp Slab Quotation & Site Measurement Booking');
  const [specialOffer, setSpecialOffer] = useState('Instant WhatsApp Quote + Free Technical Layout & 10% Material Discount on First 200m²');
  const [isGeneratingAds, setIsGeneratingAds] = useState(false);
  const [adResult, setAdResult] = useState<AdCreativeOutput | null>(null);

  // Copy helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({ title: 'Copied!', description: label });
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Run Task 1
  const handleRunCompetitorAudit = async () => {
    if (!competitorName.trim()) {
      toast({ title: 'Competitor Required', description: 'Please enter a competitor name or URL to analyze.', variant: 'destructive' });
      return;
    }

    setIsAuditing(true);
    try {
      const result = await requestCompetitorAudit({
        ...brandProfile,
        competitor_name_or_url: competitorName,
        focus_area: focusArea,
      });
      setAuditResult(result);
      toast({
        title: 'Audit Complete',
        description: `Successfully analyzed ${result.competitor} and generated attack angles.`,
      });
    } catch (err: any) {
      toast({
        title: 'Generation Failed',
        description: err.message || 'Error executing Competitor Audit.',
        variant: 'destructive',
      });
    } finally {
      setIsAuditing(false);
    }
  };

  // Run Task 2
  const handleRunContentGeneration = async () => {
    if (!contentTopic.trim()) {
      toast({ title: 'Topic Required', description: 'Please enter a content topic or angle.', variant: 'destructive' });
      return;
    }

    setIsGeneratingContent(true);
    try {
      const result = await requestContentGeneration({
        ...brandProfile,
        platform: contentPlatform,
        topic: contentTopic,
        objective: contentObjective,
        custom_instructions: customInstructions,
      });
      setContentResult(result);
      toast({
        title: 'Content Generated',
        description: `High-converting ${result.platform} marketing piece created.`,
      });
    } catch (err: any) {
      toast({
        title: 'Generation Failed',
        description: err.message || 'Error generating content.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Run Task 3
  const handleRunAdCreative = async () => {
    if (!campaignGoal.trim()) {
      toast({ title: 'Campaign Goal Required', description: 'Please specify the main campaign goal.', variant: 'destructive' });
      return;
    }

    setIsGeneratingAds(true);
    try {
      const result = await requestAdCreative({
        ...brandProfile,
        product_name: productName,
        campaign_goal: campaignGoal,
        special_offer: specialOffer,
      });
      setAdResult(result);
      toast({
        title: 'Ad Creatives Generated',
        description: 'Google Search Ads, Meta Feed Ad, and 3 A/B test variants are ready.',
      });
    } catch (err: any) {
      toast({
        title: 'Generation Failed',
        description: err.message || 'Error generating ads and variants.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAds(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#07365a] via-[#095388] to-[#0e7490] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] tracking-widest uppercase px-2.5 py-0.5 border-0 shadow-xs">
                AI Growth Engine
              </Badge>
              <Badge className="bg-white/10 hover:bg-white/20 text-sky-200 border-white/20 text-[10px] font-bold">
                Gemini 2.5 Flash • Strict JSON
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 font-headline">
              <Megaphone className="h-7 w-7 text-amber-300" />
              Marketing &amp; Copywriting AI Studio
            </h1>
            <p className="text-sky-100/90 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Automate competitor audits, multi-channel direct-response copy (LinkedIn, X, Blogs), and high-converting Google &amp; Meta ad variations engineered for precast beam &amp; block construction.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <Button
              onClick={() => setShowBrandConfig(!showBrandConfig)}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              {showBrandConfig ? 'Hide Brand Context' : 'Edit Brand Context'}
            </Button>
          </div>
        </div>

        {/* Collapsible Brand Profile Config */}
        {showBrandConfig && (
          <div className="mt-5 pt-5 border-t border-white/15 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Underlying Brand Profile (Injected into all Prompts)
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBrandProfile({ ...DEFAULT_BRAND_PROFILE })}
                className="text-[11px] text-sky-200 hover:text-white hover:bg-white/10 h-7 px-2"
              >
                Reset to SI-LATECH Defaults
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Company Name</label>
                <Input
                  value={brandProfile.company_name}
                  onChange={(e) => setBrandProfile({ ...brandProfile, company_name: e.target.value })}
                  className="bg-white/10 border-white/20 text-white text-xs h-8 mt-1 focus:bg-white/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Industry</label>
                <Input
                  value={brandProfile.industry}
                  onChange={(e) => setBrandProfile({ ...brandProfile, industry: e.target.value })}
                  className="bg-white/10 border-white/20 text-white text-xs h-8 mt-1 focus:bg-white/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Brand Tone</label>
                <Input
                  value={brandProfile.brand_tone}
                  onChange={(e) => setBrandProfile({ ...brandProfile, brand_tone: e.target.value })}
                  className="bg-white/10 border-white/20 text-white text-xs h-8 mt-1 focus:bg-white/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Unique Value Proposition (UVP)</label>
                <Input
                  value={brandProfile.unique_value_prop}
                  onChange={(e) => setBrandProfile({ ...brandProfile, unique_value_prop: e.target.value })}
                  className="bg-white/10 border-white/20 text-white text-xs h-8 mt-1 focus:bg-white/20"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Target Audience</label>
                <Input
                  value={brandProfile.target_audience}
                  onChange={(e) => setBrandProfile({ ...brandProfile, target_audience: e.target.value })}
                  className="bg-white/10 border-white/20 text-white text-xs h-8 mt-1 focus:bg-white/20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 h-auto gap-1">
          <TabsTrigger
            value="competitor"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Crosshair className="h-4 w-4 text-rose-500" />
            <span>1. Competitor Audit</span>
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Share2 className="h-4 w-4 text-blue-500" />
            <span>2. Content Generator</span>
          </TabsTrigger>
          <TabsTrigger
            value="ads"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span>3. Ads &amp; A/B Variants</span>
          </TabsTrigger>
        </TabsList>

        {/* =========================================================================
            TAB 1: COMPETITOR INTELLIGENCE & COUNTER-POSITIONING AUDIT
            ========================================================================= */}
        <TabsContent value="competitor" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Control Column */}
            <Card className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <CardHeader className="p-5 border-b border-slate-100">
                <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-rose-600" />
                  Competitor Intelligence Audit
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Analyze competitors or legacy construction methods to extract SWOT gaps, pain points, and killer counter-positioning angles.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Competitor Name or Alternative Method
                  </label>
                  <Input
                    placeholder="e.g. Traditional In-Situ Timber Slabs, Competitor Precast Ltd"
                    value={competitorName}
                    onChange={(e) => setCompetitorName(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold self-center">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setCompetitorName('Conventional In-Situ Timber Formwork Contractors')}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      Timber Formwork
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompetitorName('Local Hollow Pot Concrete Blocks Suppliers')}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      Hollow Pots
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompetitorName('Standard Ready-Mix Concrete Pourers')}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      Ready-Mix Slabs
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Specific Focus Area / Vulnerability
                  </label>
                  <Textarea
                    placeholder="e.g. Pricing friction, timber timber waste, structural sagging, 28-day curing delay"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>

                <Button
                  onClick={handleRunCompetitorAudit}
                  disabled={isAuditing}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 rounded-xl shadow-sm gap-2"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing Competitor &amp; Formulating Angles...
                    </>
                  ) : (
                    <>
                      <Crosshair className="h-4 w-4" />
                      Generate Counter-Positioning Audit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Results Column */}
            <div className="lg:col-span-7 space-y-4">
              {!auditResult && !isAuditing && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
                  <Crosshair className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">No competitor audit run yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Fill in the competitor details on the left and click &quot;Generate Counter-Positioning Audit&quot; to formulate strategic attack angles, pain points, and SWOT insights.
                  </p>
                </div>
              )}

              {isAuditing && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                  <Loader2 className="h-8 w-8 text-rose-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-900">Conducting Strategic Intelligence Audit...</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Analyzing market positioning against &quot;{competitorName}&quot; through our Elite CMO AI system.
                  </p>
                </div>
              )}

              {auditResult && !isAuditing && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Executive Briefing Card */}
                  <Card className="bg-gradient-to-br from-rose-50 to-amber-50/50 border border-rose-200/80 rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="p-4 bg-white/60 border-b border-rose-100 flex flex-row items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Executive Strategic Briefing</span>
                        <CardTitle className="text-sm font-bold text-slate-900 mt-0.5">
                          Out-Positioning Strategy for: {auditResult.competitor}
                        </CardTitle>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(auditResult, null, 2), 'audit-json', 'Raw JSON copied!')}
                        className="text-xs h-7 px-2.5 bg-white border-slate-200 text-slate-700"
                      >
                        {copiedKey === 'audit-json' ? <Check className="h-3 w-3 text-emerald-600 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        Copy JSON
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed italic">
                        &quot;{auditResult.executive_summary}&quot;
                      </p>
                    </CardContent>
                  </Card>

                  {/* 4-Quadrant SWOT Analysis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Strengths (Competitor)
                      </p>
                      <ul className="space-y-1.5">
                        {auditResult.swot_analysis.strengths.map((s, idx) => (
                          <li key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-black text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                        Weaknesses (Their Vulnerabilities)
                      </p>
                      <ul className="space-y-1.5">
                        {auditResult.swot_analysis.weaknesses.map((w, idx) => (
                          <li key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-black text-sky-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-sky-600" />
                        Opportunities (Our Attack Angles)
                      </p>
                      <ul className="space-y-1.5">
                        {auditResult.swot_analysis.opportunities.map((o, idx) => (
                          <li key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
                            <span className="text-sky-500 font-bold">•</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-black text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                        Threats (Market Risks)
                      </p>
                      <ul className="space-y-1.5">
                        {auditResult.swot_analysis.threats.map((t, idx) => (
                          <li key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Customer Pain Points & Messaging Gaps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <CardHeader className="p-3.5 pb-2">
                        <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Customer Pain Points
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 pt-0">
                        <ul className="space-y-2">
                          {auditResult.customer_pain_points.map((pt, i) => (
                            <li key={i} className="text-xs text-slate-700 font-medium flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-rose-500 font-bold shrink-0">#{i + 1}</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <CardHeader className="p-3.5 pb-2">
                        <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Competitor Messaging Gaps
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3.5 pt-0">
                        <ul className="space-y-2">
                          {auditResult.messaging_gaps.map((gap, i) => (
                            <li key={i} className="text-xs text-slate-700 font-medium flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-[#095388] font-bold shrink-0">#{i + 1}</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommended Campaign Angles */}
                  <Card className="bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-rose-600" />
                        Recommended Winning Campaign Angles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-3">
                      {auditResult.recommended_campaign_angles.map((ang, i) => (
                        <div key={i} className="bg-gradient-to-r from-slate-50 to-rose-50/30 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                                {i + 1}
                              </span>
                              {ang.angle_name}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(`Title: ${ang.angle_name}\nHook: ${ang.hook_premise}\nAction: ${ang.recommended_action}`, `ang-${i}`, 'Angle copied!')}
                              className="h-6 px-2 text-[10px] text-slate-600 hover:text-slate-900"
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                          </div>
                          <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-900">Hook Premise:</strong> {ang.hook_premise}
                          </p>
                          <p className="text-xs text-emerald-800 font-medium bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/60">
                            <strong>How SI-LATECH Wins:</strong> {ang.recommended_action}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* High Intent Keywords */}
                  <Card className="bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Search className="h-3.5 w-3.5 text-blue-600" />
                          High-Intent SEO / PPC Keywords
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(auditResult.high_intent_keywords.join(', '), 'kw-all', 'All keywords copied!')}
                          className="h-6 px-2 text-[10px] text-slate-600 hover:text-slate-900"
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {auditResult.high_intent_keywords.map((kw, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold py-1 px-2.5 cursor-pointer"
                            onClick={() => copyToClipboard(kw, `kw-${i}`, `Copied "${kw}"`)}
                          >
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* =========================================================================
            TAB 2: MULTI-CHANNEL CONTENT GENERATOR
            ========================================================================= */}
        <TabsContent value="content" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Control Column */}
            <Card className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <CardHeader className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-rose-600" />
                    Multi-Channel Content Brief
                  </CardTitle>
                  <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                    TikTok &amp; Facebook Ready
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Generate high-retention video scripts, viral hooks, and direct-response posts optimized for your core audiences on TikTok and Facebook.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Target Platform</label>
                    <span className="text-[10px] text-rose-600 font-bold">TikTok &amp; FB are Primary</span>
                  </div>

                  {/* Quick Platform Select Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setContentPlatform('tiktok')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                        contentPlatform === 'tiktok'
                          ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5 text-rose-400" />
                      <span>TikTok</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentPlatform('facebook')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                        contentPlatform === 'facebook'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentPlatform('instagram')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                        contentPlatform === 'instagram'
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>Instagram</span>
                    </button>
                  </div>

                  <Select value={contentPlatform} onValueChange={(val: any) => setContentPlatform(val)}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">🎵 TikTok (3s Pattern-Interrupt Hook + Video Scene Script)</SelectItem>
                      <SelectItem value="facebook">📘 Facebook (Scroll-stopping builder story + WhatsApp CTA)</SelectItem>
                      <SelectItem value="instagram">📸 Instagram / Reels (Visual hook + PAS caption)</SelectItem>
                      <SelectItem value="linkedin">💼 LinkedIn (Developer ROI breakdown &amp; authority)</SelectItem>
                      <SelectItem value="twitter">🐦 X / Twitter (Numbered curiosity thread 1/N)</SelectItem>
                      <SelectItem value="blog">📝 SEO Blog (H2/H3 structure, meta tags under 160 chars)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Campaign Objective</label>
                  <Select value={contentObjective} onValueChange={(val: any) => setContentObjective(val)}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead Gen">Lead Gen (Drive WhatsApp inquiries &amp; instant quotes)</SelectItem>
                      <SelectItem value="Thought Leadership">Thought Leadership (Position as top slab authority)</SelectItem>
                      <SelectItem value="Product Launch">Product Launch (Promote T-Beams &amp; Hollow Blocks)</SelectItem>
                      <SelectItem value="Educational">Educational (Why timber formwork is costing you money)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Topic / Angle</label>
                  <Input
                    placeholder="e.g. Stop Wasting Timber: 200m² Slab in 2 Days"
                    value={contentTopic}
                    onChange={(e) => setContentTopic(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold self-center">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setContentPlatform('tiktok');
                        setContentTopic('Stop Wasting Timber: How This Builder Installed a 200m² Slab in 2 Days');
                        setCustomInstructions('Extreme visual hook: Show bent sagging timber props vs clean precast T-beams. Fast pacing with on-screen text overlays.');
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      TikTok: Timber vs Precast
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContentPlatform('facebook');
                        setContentTopic('How a Nairobi Homeowner Saved KSh 280,000 on Their Suspended Slab');
                        setCustomInstructions('Relatable builder story. Break down the costs of cement, timber, and labour saved. Close with a direct link to WhatsApp for a free quote.');
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      FB: Homeowner Case Study
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContentPlatform('tiktok');
                        setContentTopic('Can a Precast T-Beam Really Hold 3 Multi-Storey Floors? (Structural Test)');
                        setCustomInstructions('Address homeowner skepticism with technical proof, deflection specs, and live site placement video cues.');
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      TikTok: Strength Test
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Special Instructions</label>
                  <Textarea
                    placeholder="Any specific metrics, tone adjustments, or target personas to highlight..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>

                <Button
                  onClick={handleRunContentGeneration}
                  disabled={isGeneratingContent}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl shadow-sm gap-2"
                >
                  {isGeneratingContent ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Crafting Platform-Native Copy...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Generate {contentPlatform.toUpperCase()} Piece
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Results Column */}
            <div className="lg:col-span-7 space-y-4">
              {!contentResult && !isGeneratingContent && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
                  <Share2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">No content piece generated yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Select a platform, specify the topic and objective, and click &quot;Generate Piece&quot; to write direct-response copy adhering to strict platform algorithms.
                  </p>
                </div>
              )}

              {isGeneratingContent && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-900">Writing High-Converting Copy...</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Applying direct-response principles, zero clichés, and platform-specific structure.
                  </p>
                </div>
              )}

              {contentResult && !isGeneratingContent && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Title & Hook Card */}
                  <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                            {contentResult.platform}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-500">
                            {contentResult.metadata?.estimated_read_time || '2 min read'}
                          </span>
                        </div>
                        <CardTitle className="text-base font-black text-slate-900">
                          {contentResult.title}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(contentResult.content, 'post-content', 'Post text copied!')}
                          className="text-xs h-8 px-3 bg-white border-slate-200 text-slate-700 font-bold"
                        >
                          {copiedKey === 'post-content' ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                          Copy Post
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {/* Opening Hook Highlight */}
                      <div className="bg-amber-50/70 border-l-4 border-amber-500 p-3 rounded-r-xl">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-amber-600" /> Opening Hook (Above The Fold)
                        </p>
                        <p className="text-xs font-bold text-slate-900 leading-snug">
                          {contentResult.hook}
                        </p>
                      </div>

                      {/* Main Post Content */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                          Post Body
                        </p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-normal text-slate-800 whitespace-pre-wrap leading-relaxed font-sans max-h-96 overflow-y-auto">
                          {contentResult.content}
                        </div>
                      </div>

                      {/* CTA Highlight */}
                      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-1">
                          Call To Action (CTA)
                        </p>
                        <p className="text-xs font-bold text-emerald-950">
                          {contentResult.call_to_action}
                        </p>
                      </div>

                      {/* Video Script Scene Breakdown (For TikTok & Reels) */}
                      {contentResult.video_script && contentResult.video_script.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <Clapperboard className="w-3.5 h-3.5 text-rose-600" />
                              TikTok / Video Scene-by-Scene Script Breakdown
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const scriptText = contentResult.video_script!
                                  .map(s => `[${s.timestamp}]\nVisual: ${s.visual}\nAudio: ${s.audio_voiceover}\nOn-Screen Text: ${s.on_screen_text}\n`)
                                  .join('\n');
                                copyToClipboard(scriptText, 'video-scenes', 'Video scenes script copied!');
                              }}
                              className="h-6 px-2 text-[10px] text-slate-600 hover:text-slate-900"
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy Scene Breakdown
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {contentResult.video_script.map((scene, sIdx) => (
                              <div key={sIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <Badge className="bg-slate-950 text-white text-[10px] font-mono px-2 py-0.5">
                                    {scene.timestamp}
                                  </Badge>
                                  <span className="text-[10px] font-semibold text-slate-400">Scene {sIdx + 1}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800">Visual Cue: </span>
                                  <span className="text-slate-700 italic">{scene.visual}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                                  <span className="font-bold text-slate-900">Audio / Spoken Dialogue: </span>
                                  <span className="text-slate-800">&quot;{scene.audio_voiceover}&quot;</span>
                                </div>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">On-Screen Text:</span>
                                  <Badge variant="secondary" className="text-[10px] font-bold bg-rose-50 text-rose-800 border-rose-200">
                                    {scene.on_screen_text}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hashtags */}
                      {contentResult.hashtags && contentResult.hashtags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Tags:</span>
                          {contentResult.hashtags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="bg-white text-blue-700 border-blue-200 text-[11px] font-semibold">
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Metadata & Visual Concept Prompt */}
                  {contentResult.metadata && (
                    <Card className="bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Code2 className="h-3.5 w-3.5 text-blue-600" />
                          Metadata &amp; Creative Concept Brief
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 space-y-3">
                        {contentResult.metadata.meta_title && (
                          <div className="text-xs">
                            <span className="font-bold text-slate-700">SEO Meta Title: </span>
                            <span className="text-slate-900">{contentResult.metadata.meta_title}</span>
                          </div>
                        )}
                        {contentResult.metadata.meta_description && (
                          <div className="text-xs">
                            <span className="font-bold text-slate-700">SEO Meta Description: </span>
                            <span className="text-slate-900">{contentResult.metadata.meta_description}</span>
                            <span className="ml-2 text-[10px] font-bold text-slate-400">
                              ({contentResult.metadata.meta_description.length} chars)
                            </span>
                          </div>
                        )}
                        {contentResult.metadata.visual_concept_prompt && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Visual / Graphic Concept Prompt (For Designer or Image AI)
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(contentResult.metadata.visual_concept_prompt, 'vis-prompt', 'Visual prompt copied!')}
                                className="h-5 px-1.5 text-[10px] text-slate-500 hover:text-slate-900"
                              >
                                <Copy className="h-3 w-3 mr-1" /> Copy Prompt
                              </Button>
                            </div>
                            <p className="text-xs text-slate-700 italic">
                              &quot;{contentResult.metadata.visual_concept_prompt}&quot;
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* =========================================================================
            TAB 3: AD CREATIVE & 3-VARIANT A/B TEST GENERATOR
            ========================================================================= */}
        <TabsContent value="ads" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Control Column */}
            <Card className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <CardHeader className="p-5 border-b border-slate-100">
                <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Paid Ad &amp; A/B Testing Brief
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Generate character-validated Google Search Ads (Headlines &le; 30 chars, Descriptions &le; 90 chars), Meta feed ads, and 3 scientific A/B test angles.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Product / Service</label>
                  <Input
                    placeholder="e.g. SI-LATECH Prestressed Precast Slab System"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Campaign Goal</label>
                  <Input
                    placeholder="e.g. Free Instant Slab Quotation & Site Measurement Booking"
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold self-center">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setCampaignGoal('Instant Online Slab Quotation')}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      Instant Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignGoal('Free Technical Slab Span Inspection')}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      Site Inspection
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignGoal('Precast Factory Tour in Nairobi')}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      Factory Tour
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Special Offer / Incentive</label>
                  <Textarea
                    placeholder="e.g. 10% Material Discount on First 200m², Free Engineer Blueprint Review"
                    value={specialOffer}
                    onChange={(e) => setSpecialOffer(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>

                <Button
                  onClick={handleRunAdCreative}
                  disabled={isGeneratingAds}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-10 rounded-xl shadow-sm gap-2"
                >
                  {isGeneratingAds ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Ads &amp; Validating Character Lengths...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-slate-950" />
                      Generate Ads &amp; 3 A/B Variants
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Results Column */}
            <div className="lg:col-span-7 space-y-4">
              {!adResult && !isGeneratingAds && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
                  <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">No ad campaigns generated yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Fill in the campaign goal and offer to produce Google Search Ads, Meta Feed Ad copy, and 3 distinct direct-response A/B test variants.
                  </p>
                </div>
              )}

              {isGeneratingAds && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-900">Engineering Ad Variations &amp; A/B Split Angles...</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Validating strict character constraints (Google &le; 30 chars headlines, &le; 90 chars descriptions).
                  </p>
                </div>
              )}

              {adResult && !isGeneratingAds && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Google Search Ads Mockup */}
                  <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="p-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          Ad
                        </span>
                        <CardTitle className="text-sm font-black text-slate-900">
                          Google Search Ads (Character Validated)
                        </CardTitle>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(adResult.google_search_ads, null, 2), 'google-ads-json', 'Google Ads JSON copied!')}
                        className="text-xs h-7 px-2.5 bg-white border-slate-200 text-slate-700"
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy Google JSON
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {/* Realistic Google Search Card */}
                      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-1.5 font-sans">
                        <p className="text-[11px] text-slate-600 flex items-center gap-1">
                          <span className="font-semibold text-slate-800">si-latech.co.ke</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">{adResult.google_search_ads.display_path || 'slabs/instant-quote'}</span>
                        </p>
                        <h4 className="text-sm md:text-base font-medium text-blue-800 hover:underline cursor-pointer flex flex-wrap gap-1">
                          {adResult.google_search_ads.headlines.slice(0, 3).join(' | ')}
                        </h4>
                        <p className="text-xs text-slate-600 leading-snug">
                          {adResult.google_search_ads.descriptions.slice(0, 2).join(' ')}
                        </p>
                        {adResult.google_search_ads.callouts && (
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                            {adResult.google_search_ads.callouts.map((co, i) => (
                              <span key={i} className="hover:text-blue-700 cursor-pointer">
                                • {co}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Character Breakdown list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Headlines (Max 30 Chars)
                          </p>
                          {adResult.google_search_ads.headlines.map((hl, i) => {
                            const len = hl.length;
                            const isOk = len <= 30;
                            return (
                              <div key={i} className="text-xs flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200/60">
                                <span className="font-medium text-slate-800 truncate mr-2">{hl}</span>
                                <Badge className={isOk ? 'bg-emerald-100 text-emerald-800 text-[10px] font-bold border-0 shrink-0' : 'bg-red-100 text-red-800 text-[10px] font-bold border-0 shrink-0'}>
                                  {len}/30
                                </Badge>
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Descriptions (Max 90 Chars)
                          </p>
                          {adResult.google_search_ads.descriptions.map((desc, i) => {
                            const len = desc.length;
                            const isOk = len <= 90;
                            return (
                              <div key={i} className="text-xs flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200/60">
                                <span className="font-medium text-slate-800 truncate mr-2">{desc}</span>
                                <Badge className={isOk ? 'bg-emerald-100 text-emerald-800 text-[10px] font-bold border-0 shrink-0' : 'bg-red-100 text-red-800 text-[10px] font-bold border-0 shrink-0'}>
                                  {len}/90
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Meta Feed Ad Preview */}
                  <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="p-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          Meta Feed Ad
                        </Badge>
                        <CardTitle className="text-sm font-black text-slate-900">
                          Facebook &amp; Instagram Sponsored Copy
                        </CardTitle>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(adResult.meta_feed_ad.primary_text, 'meta-primary', 'Meta ad primary text copied!')}
                        className="text-xs h-7 px-2.5 bg-white border-slate-200 text-slate-700"
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Primary Text</p>
                          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {adResult.meta_feed_ad.primary_text}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div>
                            <p className="text-xs font-black text-slate-900">{adResult.meta_feed_ad.headline}</p>
                            <p className="text-[10px] text-slate-500">si-latech.co.ke</p>
                          </div>
                          <Badge className="bg-blue-600 text-white font-bold text-xs py-1 px-3">
                            {adResult.meta_feed_ad.cta_button || 'Learn More'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-700 block mb-0.5">Target Demographics:</span>
                          <span className="text-slate-600">{adResult.meta_feed_ad.target_demographics}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-700 block mb-0.5">Creative Visual Prompt:</span>
                          <span className="text-slate-600 italic">&quot;{adResult.meta_feed_ad.visual_concept_prompt}&quot;</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* TikTok Video Ad Blueprint */}
                  {adResult.tiktok_video_ad && (
                    <Card className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                      <CardHeader className="p-4 bg-slate-950 text-white flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
                            TikTok Video Ad
                          </Badge>
                          <CardTitle className="text-sm font-black text-white">
                            Viral In-Feed / Spark Video Blueprint
                          </CardTitle>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const tk = adResult.tiktok_video_ad!;
                            const text = `Hook (3s): ${tk.hook_3s}\nVisual: ${tk.visual_concept}\nScript: ${tk.script_voiceover}\nCTA: ${tk.cta_button}\nOn-screen text: ${tk.on_screen_text?.join(', ')}`;
                            copyToClipboard(text, 'tiktok-ad', 'TikTok ad script copied!');
                          }}
                          className="text-xs h-7 px-2.5 bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy TikTok Script
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div className="bg-rose-50/70 border-l-4 border-rose-600 p-3 rounded-r-xl">
                          <p className="text-[10px] font-black uppercase tracking-wider text-rose-800 mb-1 flex items-center gap-1">
                            <Zap className="h-3 w-3 text-rose-600" /> 3-Second Scroll-Stopping Hook
                          </p>
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {adResult.tiktok_video_ad.hook_3s}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Visual Action Cue</span>
                            <p className="text-slate-800 italic">{adResult.tiktok_video_ad.visual_concept}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Spoken Voiceover Script</span>
                            <p className="text-slate-800">{adResult.tiktok_video_ad.script_voiceover}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On-Screen Text:</span>
                            {adResult.tiktok_video_ad.on_screen_text?.map((txt, i) => (
                              <Badge key={i} variant="outline" className="bg-slate-50 text-slate-800 text-[10px] font-bold">
                                {txt}
                              </Badge>
                            ))}
                          </div>
                          <Badge className="bg-rose-600 text-white font-bold text-xs py-1 px-3">
                            {adResult.tiktok_video_ad.cta_button || 'WhatsApp Now'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 3 Distinct A/B Testing Variants */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-amber-500" />
                        3-Variant A/B Test Matrix
                      </h3>
                      <span className="text-[11px] text-slate-500">Compare 3 distinct conversion hypotheses</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {adResult.ab_test_variants.map((v, i) => {
                        const variantColors = [
                          { bg: 'from-rose-50 to-white', border: 'border-rose-200', tag: 'bg-rose-100 text-rose-800' },
                          { bg: 'from-emerald-50 to-white', border: 'border-emerald-200', tag: 'bg-emerald-100 text-emerald-800' },
                          { bg: 'from-sky-50 to-white', border: 'border-sky-200', tag: 'bg-sky-100 text-sky-800' },
                        ][i % 3];

                        return (
                          <Card key={i} className={`bg-gradient-to-b ${variantColors.bg} border ${variantColors.border} rounded-xl shadow-2xs flex flex-col justify-between`}>
                            <CardHeader className="p-3.5 pb-2">
                              <Badge className={`${variantColors.tag} text-[10px] font-bold w-fit mb-1.5 border-0`}>
                                {v.variant}
                              </Badge>
                              <CardTitle className="text-xs font-black text-slate-900 leading-snug">
                                {v.headline}
                              </CardTitle>
                              <p className="text-[11px] text-slate-600 italic mt-1 bg-white/80 p-1.5 rounded border border-slate-100">
                                <strong className="font-semibold text-slate-800">Hypothesis:</strong> {v.hypothesis}
                              </p>
                            </CardHeader>
                            <CardContent className="p-3.5 pt-1 space-y-2.5">
                              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white/90 p-2.5 rounded-lg border border-slate-100 max-h-48 overflow-y-auto">
                                {v.body_copy}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CTA:</span>
                                <Badge variant="outline" className="bg-white text-slate-900 font-bold text-[10px] border-slate-300">
                                  {v.cta}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
