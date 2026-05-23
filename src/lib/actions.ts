
'use server';

import {
  generateMonetaryQuote,
} from '@/ai/flows/generate-monetary-quote';
import { z } from 'zod';


export type QuoteState = {
  message?: string;
  data?: { quote: string };
  error?: string;
};

const QuoteSchema = z.object({
  region: z.string().min(1, { message: 'Region is required.' }),
  blocks: z.coerce.number(),
  beamLength: z.coerce.number(),
  brcRolls: z.coerce.number(),
});

export async function handleGenerateQuote(
  formData: FormData
): Promise<QuoteState> {
  const validatedFields = QuoteSchema.safeParse({
    region: formData.get('region'),
    blocks: formData.get('blocks'),
    beamLength: formData.get('beamLength'),
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
