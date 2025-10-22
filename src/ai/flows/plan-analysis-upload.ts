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
      "A building plan (PDF or image), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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

const planAnalysisUploadFlow = ai.defineFlow(
  {
    name: 'planAnalysisUploadFlow',
    inputSchema: PlanAnalysisUploadInputSchema,
    outputSchema: PlanAnalysisUploadOutputSchema,
  },
  async ({ planDataUri }) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: [
          {
            text: `You are an expert architect specializing in reading building plans. Your task is to analyze the provided building plan and extract its structure in a detailed, organized manner.

CRITICAL INSTRUCTIONS:
1.  **Detect Units**: First, determine if the dimensions are in meters or in feet and inches (e.g., 10' 4"). This is the most important step.
2.  **Convert to Meters**: If dimensions are in feet and inches, you MUST convert them to meters. Use the conversion: 1 foot = 0.3048 meters, 1 inch = 0.0254 meters. The final output for length and width MUST be in meters.
3.  **Extract Structure**:
    *   Identify each floor level (e.g., "Ground Floor", "First Floor").
    *   For each floor, identify every labeled room and find its internal dimensions (length and width).
    *   For each floor, also identify and count other features like balconies, verandas, or patios.
4.  **Output Format**: Structure the output as a JSON object that strictly follows the provided schema. Ensure all dimensions are accurate and represented in METERS. If a room has an irregular shape, provide the main rectangular dimensions.
`,
          },
          {
            media: {
              url: planDataUri,
            },
          },
        ],
      output: {
        format: 'json',
        schema: PlanAnalysisUploadOutputSchema,
      },
    });

    return output!;
  }
);
