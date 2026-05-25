'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractWhatsAppMeasurementsInputSchema = z.string().describe('The raw text message from the WhatsApp user.');

const ExtractWhatsAppMeasurementsOutputSchema = z.object({
  action: z.enum(['QUOTE', 'FAQ', 'GREETING', 'UNKNOWN']).describe('The primary intent of the user.'),
  rooms: z.array(z.object({
    length: z.number().describe('The length of the room in meters.'),
    width: z.number().describe('The width of the room in meters.'),
  })).optional().describe('Extracted room dimensions if the user is asking for a quote.'),
  isAreaMode: z.boolean().optional().describe('True if the user provided total square meters instead of dimensions.'),
  totalArea: z.number().optional().describe('The total square meters if isAreaMode is true.'),
  faqTopic: z.string().optional().describe('If the user is asking a question (e.g. price of blocks, curing time), summarize the topic here.'),
});

export type ExtractWhatsAppMeasurementsOutput = z.infer<typeof ExtractWhatsAppMeasurementsOutputSchema>;

export const extractWhatsAppMeasurements = ai.defineFlow(
  {
    name: 'extractWhatsAppMeasurements',
    inputSchema: ExtractWhatsAppMeasurementsInputSchema,
    outputSchema: ExtractWhatsAppMeasurementsOutputSchema,
  },
  async (text) => {
    const { output } = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: `
        You are an assistant for SI-LATECH, a company that sells a precast beam and block floor system.
        Analyze the following incoming WhatsApp message from a customer.
        
        Rules:
        - If they are saying hi/hello, set action to "GREETING".
        - If they are asking for a quote and provide dimensions (e.g., "3 by 4", "4x5m", "100 square meters"), set action to "QUOTE" and extract the dimensions. Convert all dimensions to meters.
        - If they provide total area (e.g. 100 sq meters), set isAreaMode to true and totalArea to the number.
        - If they are asking a question like "how much is a block?" or "do I need formwork?", set action to "FAQ" and provide the topic.
        - Otherwise, set action to "UNKNOWN".

        Message: "${text}"
      `,
      output: {
        schema: ExtractWhatsAppMeasurementsOutputSchema,
      },
    });

    return output;
  }
);
