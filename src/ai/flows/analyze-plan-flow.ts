
'use server';

/**
 * @fileOverview Analyzes a floor plan image to extract room dimensions.
 *
 * - analyzePlan - A function that analyzes a floor plan image.
 * - AnalyzePlanInput - The input type for the analyzePlan function.
 * - AnalyzePlanOutput - The return type for the analyzePlan function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const AnalyzePlanInputSchema = z.object({
  photoDataUri: z.string().describe(
    "A photo of a floor plan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type AnalyzePlanInput = z.infer<typeof AnalyzePlanInputSchema>;

const RoomSchema = z.object({
  name: z.string().describe('The name of the room (e.g., "Bedroom 1", "Kitchen").'),
  length: z.number().describe('The length of the room in meters.'),
  width: z.number().describe('The width of the room in meters.'),
});

const AnalyzePlanOutputSchema = z.object({
  rooms: z.array(RoomSchema).describe('An array of all rooms detected in the floor plan.'),
});
export type AnalyzePlanOutput = z.infer<typeof AnalyzePlanOutputSchema>;

export async function analyzePlan(input: AnalyzePlanInput): Promise<AnalyzePlanOutput> {
  return analyzePlanFlow(input);
}

const analyzePlanFlow = ai.defineFlow(
  {
    name: 'analyzePlanFlow',
    inputSchema: AnalyzePlanInputSchema,
    outputSchema: AnalyzePlanOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      output: { schema: AnalyzePlanOutputSchema },
      prompt: `You are an expert architectural plan reader. Your task is to analyze the provided floor plan image and extract all rooms with their dimensions.

- Identify every enclosed space and its label (e.g., "Bedroom," "Living Room," "Kitchen").
- If a room is unlabeled, assign a generic name like "Room 1".
- For each room, determine its length and width in meters. Extract dimensions from the plan. If dimensions are in millimeters, convert them to meters. If they are not explicitly written, infer them from the scale or surrounding context.
- For irregular rooms, approximate the main rectangular dimensions.
- Return the data as a structured list of room objects.

Floor Plan Image:
{{media url=photoDataUri}}`,
      context: [
        { role: 'user', content: [{ media: { url: input.photoDataUri } }] },
      ],
    });
    
    if (!output) {
      throw new Error('The AI model did not return a valid output.');
    }
    return output;
  }
);
