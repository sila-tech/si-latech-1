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

const GenerateMonetaryQuoteOutputSchema = z.object({
  quote: z.string().describe('The monetary quote, including a breakdown of costs.'),
});
export type GenerateMonetaryQuoteOutput = z.infer<typeof GenerateMonetaryQuoteOutputSchema>;

export async function generateMonetaryQuote(input: GenerateMonetaryQuoteInput): Promise<GenerateMonetaryQuoteOutput> {
  return generateMonetaryQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMonetaryQuotePrompt',
  input: {schema: GenerateMonetaryQuoteInputSchema},
  output: {schema: GenerateMonetaryQuoteOutputSchema},
  prompt: `You are a construction cost estimator. Based on the material quantities and the region provided, you will generate a monetary quote.

Material Quantities:
- Blocks: {{{blocks}}}
- Beam Length: {{{beamLength}}} meters
- Concrete Volume: {{{concreteVolume}}} cubic meters
- BRC Rolls: {{{brcRolls}}}

Region: {{{region}}}

Consider regional pricing variances when generating the quote. Include a breakdown of the costs for each material.

Return the quote in a clear and concise format.
`,
});

const generateMonetaryQuoteFlow = ai.defineFlow(
  {
    name: 'generateMonetaryQuoteFlow',
    inputSchema: GenerateMonetaryQuoteInputSchema,
    outputSchema: GenerateMonetaryQuoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
