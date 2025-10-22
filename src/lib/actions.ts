'use server';

import {
  planAnalysisUpload,
  PlanAnalysisUploadOutput,
} from '@/ai/flows/plan-analysis-upload';
import {
  generateMonetaryQuote,
} from '@/ai/flows/generate-monetary-quote';
import { z } from 'zod';

export type PlanUploadState = {
  message?: string;
  data?: PlanAnalysisUploadOutput;
  error?: string;
};

export async function handlePlanUpload(
  formData: FormData
): Promise<PlanUploadState> {
  const file = formData.get('planFile') as File;

  if (!file || file.size === 0) {
    return { error: 'Please select a file to upload.' };
  }
  
  // File size limit (e.g., 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File size must be less than 10MB.' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const planDataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await planAnalysisUpload({ planDataUri });
    return { message: 'Plan analyzed successfully.', data: result };
  } catch (error) {
    console.error('Plan analysis failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      error: `Failed to analyze the plan. ${errorMessage}`,
    };
  }
}

export type QuoteState = {
  message?: string;
  data?: { quote: string };
  error?: string;
};

const QuoteSchema = z.object({
  region: z.string().min(1, { message: 'Region is required.' }),
  blocks: z.coerce.number(),
  beamLength: z.coerce.number(),
  concreteVolume: z.coerce.number(),
  brcRolls: z.coerce.number(),
});

export async function handleGenerateQuote(
  formData: FormData
): Promise<QuoteState> {
  const validatedFields = QuoteSchema.safeParse({
    region: formData.get('region'),
    blocks: formData.get('blocks'),
    beamLength: formData.get('beamLength'),
    concreteVolume: formData.get('concreteVolume'),
    brcRolls: formData.get('brcRolls'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.region?.[0] || 'Invalid input.',
    };
  }

  try {
    const result = await generateMonetaryQuote(validatedFields.data);
    return { message: 'Quote generated successfully.', data: { quote: result } };
  } catch (error) {
    console.error('Quote generation failed:', error);
    return {
      error: 'Failed to generate a quote. Please try again later.',
    };
  }
}
