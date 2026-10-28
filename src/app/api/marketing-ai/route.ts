import { NextRequest, NextResponse } from 'next/server';
import {
  MASTER_SYSTEM_PROMPT,
  buildCompetitorAuditPrompt,
  buildContentGeneratorPrompt,
  buildAdCreativePrompt,
  CompetitorAuditInput,
  ContentGeneratorInput,
  AdCreativeInput,
} from '@/lib/marketing-ai-prompts';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';

/**
 * Execute Gemini REST generateContent call with strict JSON response guarantee
 */
async function callGeminiMarketingAi(systemPrompt: string, userPrompt: string) {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment variables.');
  }

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API (${model}) failed with HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error(`Empty response received from Gemini (${model})`);
      }

      // Clean markdown code blocks if present
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(cleanJson);
    } catch (err: any) {
      console.warn(`Attempt with ${model} encountered error:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to run Marketing AI flow with available Gemini models.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload, customSystemPrompt, customUserPrompt } = body;

    let systemPrompt = customSystemPrompt || MASTER_SYSTEM_PROMPT;
    let userPrompt = '';

    switch (action) {
      case 'competitor_audit': {
        const input: CompetitorAuditInput = payload || {};
        userPrompt = buildCompetitorAuditPrompt(input);
        break;
      }

      case 'content_generator': {
        const input: ContentGeneratorInput = payload || {
          platform: 'linkedin',
          topic: 'Precast Beam & Block Slab Advantages',
          objective: 'Thought Leadership',
        };
        userPrompt = buildContentGeneratorPrompt(input);
        break;
      }

      case 'ad_creative': {
        const input: AdCreativeInput = payload || {
          campaign_goal: 'Free Slab Quotation & Site Visit',
        };
        userPrompt = buildAdCreativePrompt(input);
        break;
      }

      case 'custom': {
        if (!customUserPrompt) {
          return NextResponse.json(
            { success: false, error: 'customUserPrompt is required when action is "custom".' },
            { status: 400 }
          );
        }
        userPrompt = customUserPrompt;
        break;
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action "${action}". Must be "competitor_audit", "content_generator", "ad_creative", or "custom".`,
          },
          { status: 400 }
        );
    }

    const aiResult = await callGeminiMarketingAi(systemPrompt, userPrompt);

    return NextResponse.json({
      success: true,
      action,
      data: aiResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/marketing-ai route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred while generating marketing assets.',
      },
      { status: 500 }
    );
  }
}
