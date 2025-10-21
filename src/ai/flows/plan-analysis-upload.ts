'use server';

/**
 * @fileOverview A plan analysis AI agent.
 *
 * - planAnalysisUpload - A function that handles the plan analysis process.
 * - PlanAnalysisUploadInput - The input type for the planAnalysisUpload function.
 * - PlanAnalysisUploadOutput - The return type for the planAnalysisUpload function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const PlanAnalysisUploadInputSchema = z.object({
  planDataUri: z
    .string()
    .describe(
      "A building plan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type PlanAnalysisUploadInput = z.infer<typeof PlanAnalysisUploadInputSchema>;

const PlanAnalysisUploadOutputSchema = z.object({
  floors: z.array(z.object({
    floorName: z.string().describe('The name of the floor, e.g., "Ground Floor", "First Floor".'),
    rooms: z.array(z.object({
      name: z.string().describe('The name of the room.'),
      length: z.number().describe('The length of the room in meters.'),
      width: z.number().describe('The width of the room in meters.'),
    })).describe('An array of rooms with their dimensions found on this floor.'),
    otherFeatures: z.array(z.object({
        name: z.string().describe('The name of the feature, e.g., "Balcony", "Veranda".'),
        count: z.number().describe('The number of instances of this feature.'),
    })).describe('A list of other identified features on the floor.'),
  })).describe('An array of floors identified in the plan.'),
});

export type PlanAnalysisUploadOutput = z.infer<typeof PlanAnalysisUploadOutputSchema>;

export async function planAnalysisUpload(input: PlanAnalysisUploadInput): Promise<PlanAnalysisUploadOutput> {
  return planAnalysisUploadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'planAnalysisUploadPrompt',
  input: {schema: PlanAnalysisUploadInputSchema},
  output: {schema: PlanAnalysisUploadOutputSchema},
  prompt: `You are an expert architect specializing in reading building plans.

Your task is to analyze the provided building plan image and extract its structure in a detailed, organized manner.

Follow these steps:
1.  Identify each floor level shown in the plan (e.g., "Ground Floor", "First Floor", "Second Floor").
2.  For each floor, identify every labeled room and carefully measure its internal dimensions (length and width) in meters. Assume standard architectural scales if not explicitly stated.
3.  For each floor, also identify and count other significant features like balconies, verandas, or patios.
4.  Structure the output with a list of floors. Each floor object should contain the floor's name, a list of its rooms with their dimensions, and a list of any other features found.

Analyze the following building plan:

Plan: {{media url=planDataUri}}

Ensure the dimensions are as accurate as possible. If a room has an irregular shape, provide the main rectangular dimensions.
`,
});

const planAnalysisUploadFlow = ai.defineFlow(
  {
    name: 'planAnalysisUploadFlow',
    inputSchema: PlanAnalysisUploadInputSchema,
    outputSchema: PlanAnalysisUploadOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: googleAI.model('gemini-pro-vision'),
      prompt: await prompt.render({input}),
      output: {
        format: 'json',
        schema: PlanAnalysisUploadOutputSchema,
      },
    });

    return output!;
  }
);
