'use server';

/**
 * @fileOverview Generates a monetary quote based on material quantities and regional pricing.
 *
 * - generateMonetaryQuote - A function that generates a monetary quote.
 * - GenerateMonetaryQuoteInput - The input type for the generateMonetaryQuote function.
 * - GenerateMonetaryQuoteOutput - The return type for the generateMonetaryQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMonetaryQuoteInputSchema = z.object({
  blocks: z.number().describe('The quantity of blocks required.'),
  beamLength: z.number().describe('The total length of beams required in meters.'),
  concreteVolume: z.number().describe('The volume of concrete required in cubic meters.'),
  brcRolls: z.number().describe('The number of BRC rolls required.'),
  region: z.string().describe('The region for which the quote is being generated.'),
});
export type GenerateMonetaryQuoteInput = z.infer<typeof GenerateMonetaryQuoteInputSchema>;

// The output is now a simple string.
export type GenerateMonetaryQuoteOutput = string;

export async function generateMonetaryQuote(input: GenerateMonetaryQuoteInput): Promise<GenerateMonetaryQuoteOutput> {
  return generateMonetaryQuoteFlow(input);
}

const generateMonetaryQuoteFlow = ai.defineFlow(
  {
    name: 'generateMonetaryQuoteFlow',
    inputSchema: GenerateMonetaryQuoteInputSchema,
    outputSchema: z.string(), // Expect a raw string as output.
  },
  async (input) => {
    const { text } = await ai.generate({
      prompt: `You are a construction cost estimator. Based on the material quantities and the region provided, you will generate a monetary quote.

Material Quantities:
- Blocks: ${input.blocks}
- Beam Length: ${input.beamLength} meters
- Concrete Volume: ${input.concreteVolume} cubic meters
- BRC Rolls: ${input.brcRolls}

Region: ${input.region}

Consider regional pricing variances when generating the quote. Include a breakdown of the costs for each material.

Return the quote in a clear and concise format.`,
      output: { format: 'text' },
    });
    return text;
  }
);
