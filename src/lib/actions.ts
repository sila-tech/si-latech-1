'use server';

import {
  planAnalysisUpload,
  PlanAnalysisUploadOutput,
} from '@/ai/flows/plan-analysis-upload';
import {
  generateMonetaryQuote,
  GenerateMonetaryQuoteInput,
} from '@/ai/flows/generate-monetary-quote';
import { z } from 'zod';

const fileToDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const readFileAsBuffer = (file: File): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(Buffer.from(reader.result));
      } else {
        reject(new Error('Failed to read file as ArrayBuffer.'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};


export type PlanUploadState = {
  message?: string;
  data?: PlanAnalysisUploadOutput;
  error?: string;
};

export async function handlePlanUpload(
  prevState: PlanUploadState,
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
    const buffer = await readFileAsBuffer(file);
    const planDataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await planAnalysisUpload({ planDataUri });
    return { message: 'Plan analyzed successfully.', data: result };
  } catch (error) {
    console.error('Plan analysis failed:', error);
    return {
      error: 'Failed to analyze the plan. Please try again with a different file.',
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
  blocks: z.number(),
  beamLength: z.number(),
  concreteVolume: z.number(),
  brcRolls: z.number(),
});

export async function handleGenerateQuote(
  prevState: QuoteState,
  formData: FormData
): Promise<QuoteState> {
  const validatedFields = QuoteSchema.safeParse({
    region: formData.get('region'),
    blocks: Number(formData.get('blocks')),
    beamLength: Number(formData.get('beamLength')),
    concreteVolume: Number(formData.get('concreteVolume')),
    brcRolls: Number(formData.get('brcRolls')),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.region?.[0] || 'Invalid input.',
    };
  }

  try {
    const result = await generateMonetaryQuote(validatedFields.data);
    return { message: 'Quote generated successfully.', data: result };
  } catch (error) {
    console.error('Quote generation failed:', error);
    return {
      error: 'Failed to generate a quote. Please try again later.',
    };
  }
}
