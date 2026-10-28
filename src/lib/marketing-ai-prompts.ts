/**
 * Production-ready Marketing AI Prompt Architecture
 * Supporting Google Gemini, OpenAI, Anthropic, or any LLM API.
 */

export const MASTER_SYSTEM_PROMPT = `You are an Elite AI Chief Marketing Officer (CMO), Direct-Response Copywriter, and Growth Strategist.
Your objective is to generate high-converting, platform-native marketing assets that drive traffic, brand authority, and customer acquisition on behalf of the company.
CORE PRINCIPLES:
1. NO CORPORATE CLICHÉS: Never use generic filler words such as "delve", "game-changer", "in today's fast-paced world", "unlock potential", "testament", or "revolutionize". Write with authentic, punchy, human language.
2. OUTCOME-FOCUSED: Every piece of copy must focus on the customer's desired outcome and pain points, not just product features.
3. PLATFORM-NATIVE FORMATTING (ESPECIALLY TIKTOK & FACEBOOK):
   - TikTok: Extreme pattern interrupt in the first 3 seconds (verbal hook + visual action), fast-paced problem-solution video script, on-screen text overlays, relatable tone for builders/homeowners, and high-converting bio/WhatsApp CTA.
   - Facebook: Scroll-stopping opening line (addressing money loss, timber headaches, or construction delays), relatable storytelling/case study format, skimmable bullet points, social proof, and high-intent WhatsApp/Calculator CTA.
   - Instagram / Reels: Visual-first hook, punchy Problem-Agitation-Solution structure, aesthetic site proof, and direct message/link in bio CTA.
   - LinkedIn: Professional yet direct hook within first 2 lines, technical ROI comparisons for engineers/developers, generous line breaks, and discussion question.
   - X / Twitter: High-curiosity opening hook, numbered thread structure (1/N to N/N), crisp value delivery per tweet, and clear CTA.
   - SEO Blog: Comprehensive H2/H3 hierarchy, actionable takeaways, meta title, and meta description under 160 characters.
   - Google Search Ads: Headlines must NEVER exceed 30 characters. Descriptions must NEVER exceed 90 characters.
4. STRICT JSON OUTPUT: Return only valid, parseable JSON matching the requested schema. No markdown formatting outside the JSON block.`;

export interface BrandProfile {
  company_name: string;
  industry: string;
  product_description: string;
  unique_value_prop: string;
  target_audience: string;
  brand_tone: string;
}

export const DEFAULT_BRAND_PROFILE: BrandProfile = {
  company_name: 'SI-LATECH PRECAST LTD',
  industry: 'Precast Concrete, Hollow-Pot Slabs, Ribbed Beams & Modern Construction',
  product_description: 'Engineered prestressed precast concrete T-beams and lightweight hollow-core concrete blocks for fast, cost-effective suspended floor slabs and roofs without full timber shuttering.',
  unique_value_prop: 'Cuts suspended slab construction costs by up to 30%, slashes installation time by 50%, eliminates costly timber shuttering waste, with superior thermal and acoustic performance.',
  target_audience: 'Property owners, private homebuilders, residential developers, local contractors, and diaspora Kenyans actively scrolling on TikTok and Facebook seeking faster, cheaper, high-strength precast slab construction.',
  brand_tone: 'Energetic, direct-response, authentic, ROI-focused, visually engaging, punchy.',
};

/* =========================================================================
   TASK 1: COMPETITOR INTELLIGENCE & COUNTER-POSITIONING AUDIT
   ========================================================================= */

export interface CompetitorAuditInput {
  company_name?: string;
  industry?: string;
  product_description?: string;
  unique_value_prop?: string;
  target_audience?: string;
  brand_tone?: string;
  competitor_name_or_url: string;
  focus_area?: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface RecommendedCampaignAngle {
  angle_name: string;
  hook_premise: string;
  recommended_action: string;
}

export interface CompetitorAuditOutput {
  competitor: string;
  swot_analysis: SwotAnalysis;
  customer_pain_points: string[];
  messaging_gaps: string[];
  recommended_campaign_angles: RecommendedCampaignAngle[];
  high_intent_keywords: string[];
  executive_summary: string;
}

export function buildCompetitorAuditPrompt(input: CompetitorAuditInput): string {
  const profile = {
    company_name: input.company_name || DEFAULT_BRAND_PROFILE.company_name,
    industry: input.industry || DEFAULT_BRAND_PROFILE.industry,
    product_description: input.product_description || DEFAULT_BRAND_PROFILE.product_description,
    unique_value_prop: input.unique_value_prop || DEFAULT_BRAND_PROFILE.unique_value_prop,
    target_audience: input.target_audience || DEFAULT_BRAND_PROFILE.target_audience,
    brand_tone: input.brand_tone || DEFAULT_BRAND_PROFILE.brand_tone,
  };

  const competitor = input.competitor_name_or_url || 'Conventional In-Situ Timber Formwork Slab Contractors';
  const focus = input.focus_area || 'Cost inflation, timber waste, curing delay, and lack of automated structural quotes';

  return `Analyze the following competitor on behalf of our brand and generate a strategic competitive intelligence breakdown.
=== OUR BRAND PROFILE ===
- Company Name: ${profile.company_name}
- Industry: ${profile.industry}
- Core Offering: ${profile.product_description}
- Unique Value Proposition (UVP): ${profile.unique_value_prop}
- Target Audience: ${profile.target_audience}
- Brand Tone: ${profile.brand_tone}
=== COMPETITOR TO AUDIT ===
- Competitor Name / URL: ${competitor}
- Additional Focus Area: ${focus}
=== OUTPUT INSTRUCTIONS ===
Return ONLY a valid JSON object matching this schema:
{
  "competitor": "${competitor}",
  "swot_analysis": {
    "strengths": ["string", "string", "string"],
    "weaknesses": ["string", "string", "string"],
    "opportunities": ["string", "string", "string"],
    "threats": ["string", "string", "string"]
  },
  "customer_pain_points": [
    "Specific frustration or complaint customers have with the competitor...",
    "..."
  ],
  "messaging_gaps": [
    "What the competitor fails to address in their marketing...",
    "..."
  ],
  "recommended_campaign_angles": [
    {
      "angle_name": "Punchy Campaign Title",
      "hook_premise": "Core argument against the competitor",
      "recommended_action": "How our brand wins leads using this angle"
    }
  ],
  "high_intent_keywords": [
    "keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"
  ],
  "executive_summary": "1-2 sentence briefing on how to out-position this competitor."
}`;
}

/* =========================================================================
   TASK 2: MULTI-CHANNEL CONTENT GENERATOR
   ========================================================================= */

export type ContentPlatform = 'tiktok' | 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'blog';
export type CampaignObjective = 'Thought Leadership' | 'Lead Gen' | 'Product Launch' | 'Educational';

export interface VideoScriptScene {
  timestamp: string;
  visual: string;
  audio_voiceover: string;
  on_screen_text: string;
}

export interface ContentGeneratorInput {
  company_name?: string;
  industry?: string;
  unique_value_prop?: string;
  target_audience?: string;
  brand_tone?: string;
  platform: ContentPlatform;
  topic: string;
  objective: CampaignObjective | string;
  custom_instructions?: string;
}

export interface ContentGeneratorMetadata {
  meta_title: string | null;
  meta_description: string | null;
  visual_concept_prompt: string;
  estimated_read_time: string;
}

export interface ContentGeneratorOutput {
  platform: ContentPlatform | string;
  title: string;
  hook: string;
  content: string;
  call_to_action: string;
  hashtags: string[];
  video_script?: VideoScriptScene[];
  metadata: ContentGeneratorMetadata;
}

export function buildContentGeneratorPrompt(input: ContentGeneratorInput): string {
  const profile = {
    company_name: input.company_name || DEFAULT_BRAND_PROFILE.company_name,
    industry: input.industry || DEFAULT_BRAND_PROFILE.industry,
    unique_value_prop: input.unique_value_prop || DEFAULT_BRAND_PROFILE.unique_value_prop,
    target_audience: input.target_audience || DEFAULT_BRAND_PROFILE.target_audience,
    brand_tone: input.brand_tone || DEFAULT_BRAND_PROFILE.brand_tone,
  };

  const platform = input.platform || 'tiktok';
  const topic = input.topic || 'Why Builders Are Switching From Timber Formwork to SI-LATECH Precast T-Beams';
  const objective = input.objective || 'Lead Gen';
  const customInstructions = input.custom_instructions || 'Focus on real construction cost savings, timeline acceleration, and structural strength for Kenyan builders.';

  return `Generate a high-performing marketing content piece for the specified platform.
=== BRAND CONTEXT ===
- Brand: ${profile.company_name}
- Industry: ${profile.industry}
- Unique Value Proposition: ${profile.unique_value_prop}
- Target Audience: ${profile.target_audience}
- Voice & Tone: ${profile.brand_tone}
=== CONTENT BRIEF ===
- Target Platform: ${platform} (Options: tiktok, facebook, instagram, linkedin, twitter, blog)
- Topic / Angle: ${topic}
- Campaign Objective: ${objective} (Options: Thought Leadership, Lead Gen, Product Launch, Educational)
- Special Instructions: ${customInstructions}
=== OUTPUT FORMAT ===
If platform is "tiktok", format "content" as a comprehensive video script breakdown (Hook 0-3s, Problem 3-15s, Demonstration 15-45s, CTA 45-60s) AND include the optional "video_script" scene array.
If platform is "facebook", craft an irresistible scroll-stopping first sentence, followed by relatable pain-point storytelling, bulleted advantages, and a WhatsApp / instant calculator CTA.
Return ONLY a valid JSON object matching this schema:
{
  "platform": "${platform}",
  "title": "Working title or internal headline",
  "hook": "Opening sentence or first 3-second hook",
  "content": "Full formatted text of the post/article or full video script using clean markdown with proper spacing",
  "call_to_action": "Direct call-to-action sentence (e.g. WhatsApp consultation or free slab quote link)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "video_script": [
    {
      "timestamp": "0:00 - 0:03",
      "visual": "Director notes for the camera",
      "audio_voiceover": "Words spoken by presenter/voiceover",
      "on_screen_text": "Text graphic overlay"
    }
  ],
  "metadata": {
    "meta_title": "SEO title if blog post, otherwise null",
    "meta_description": "Meta description under 160 characters if blog post, otherwise null",
    "visual_concept_prompt": "Prompt for designer, video editor, or image generator describing what graphic/photo/video should accompany the copy",
    "estimated_read_time": "e.g. '45s video' or '2 min read'"
  }
}`;
}

/* =========================================================================
   TASK 3: AD CREATIVE & 3-VARIANT A/B TEST GENERATOR
   ========================================================================= */

export interface AdCreativeInput {
  company_name?: string;
  product_name?: string;
  unique_value_prop?: string;
  target_audience?: string;
  campaign_goal: string;
  special_offer?: string;
}

export interface GoogleSearchAds {
  headlines: string[];
  descriptions: string[];
  callouts: string[];
  display_path: string;
}

export interface MetaFeedAd {
  primary_text: string;
  headline: string;
  cta_button: string;
  visual_concept_prompt: string;
  target_demographics: string;
}

export interface TikTokVideoAd {
  hook_3s: string;
  visual_concept: string;
  script_voiceover: string;
  on_screen_text: string[];
  cta_button: string;
}

export interface AbTestVariant {
  variant: string;
  hypothesis: string;
  headline: string;
  body_copy: string;
  cta: string;
}

export interface AdCreativeOutput {
  google_search_ads: GoogleSearchAds;
  meta_feed_ad: MetaFeedAd;
  tiktok_video_ad?: TikTokVideoAd;
  ab_test_variants: AbTestVariant[];
}

export function buildAdCreativePrompt(input: AdCreativeInput): string {
  const company = input.company_name || DEFAULT_BRAND_PROFILE.company_name;
  const product = input.product_name || 'SI-LATECH Precast Beam & Block Slab System';
  const uvp = input.unique_value_prop || DEFAULT_BRAND_PROFILE.unique_value_prop;
  const audience = input.target_audience || DEFAULT_BRAND_PROFILE.target_audience;
  const goal = input.campaign_goal || 'Instant Slab Quotation & WhatsApp Consultation';
  const offer = input.special_offer || 'Instant Online Slab Calculation + 10% Material Discount on First 200m²';

  return `Create high-converting ad copy and 3 distinct A/B testing variants for our advertising campaigns, optimized heavily for our primary audiences on Facebook and TikTok.
=== BRAND & OFFER ===
- Company: ${company}
- Product / Service: ${product}
- Unique Value Prop: ${uvp}
- Target Audience: ${audience}
- Campaign Goal: ${goal}
- Special Offer: ${offer}
=== OUTPUT REQUIREMENTS ===
Headlines for Google MUST be 30 characters or fewer.
Descriptions for Google MUST be 90 characters or fewer.
Facebook / Meta Ads must have high-engagement social proof and a WhatsApp / Calculator CTA button.
TikTok Ads must feature a viral 3-second pattern-interrupt hook and fast-paced visual demonstration.
Return ONLY a valid JSON object matching this schema:
{
  "google_search_ads": {
    "headlines": [
      "Headline 1 (max 30 chars)",
      "Headline 2 (max 30 chars)",
      "Headline 3 (max 30 chars)",
      "Headline 4 (max 30 chars)",
      "Headline 5 (max 30 chars)"
    ],
    "descriptions": [
      "Description 1 (max 90 chars)",
      "Description 2 (max 90 chars)",
      "Description 3 (max 90 chars)"
    ],
    "callouts": ["Callout 1", "Callout 2", "Callout 3", "Callout 4"],
    "display_path": "suggested/url-slug"
  },
  "meta_feed_ad": {
    "primary_text": "Engaging scroll-stopping copy with bullet points and clear value proposition tailored for Facebook users...",
    "headline": "Punchy Facebook Headline under 40 characters",
    "cta_button": "Send WhatsApp Message / Get Quote",
    "visual_concept_prompt": "Detailed description of the image/video creative to produce",
    "target_demographics": "Target interest tags for Facebook (Real estate Kenya, Home improvement, Construction, Diaspora Kenya)"
  },
  "tiktok_video_ad": {
    "hook_3s": "Extreme scroll-stopping 3-second hook for TikTok",
    "visual_concept": "Fast-paced visual action / site demonstration",
    "script_voiceover": "Conversational, high-energy voiceover script",
    "on_screen_text": ["Text overlay 1", "Text overlay 2", "Text overlay 3"],
    "cta_button": "Tap Bio Link / WhatsApp Us"
  },
  "ab_test_variants": [
    {
      "variant": "Variant A - Pain-Point & Agitation",
      "hypothesis": "Why this angle will convert frustrated prospects",
      "headline": "...",
      "body_copy": "...",
      "cta": "..."
    },
    {
      "variant": "Variant B - Measurable ROI & Value",
      "hypothesis": "Why highlighting hard numbers will convert economic buyers",
      "headline": "...",
      "body_copy": "...",
      "cta": "..."
    },
    {
      "variant": "Variant C - Social Proof / Category Shift",
      "hypothesis": "Why framing old tools as obsolete creates urgency",
      "headline": "...",
      "body_copy": "...",
      "cta": "..."
    }
  ]
}`;
}
