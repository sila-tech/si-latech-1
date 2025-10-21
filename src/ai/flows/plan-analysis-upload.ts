'use server';

/**
 * @fileOverview A plan analysis AI agent.
 *
 * - planAnalysisUpload - A function that handles the plan analysis process.
 * - PlanAnalysisUploadInput - The input type for the planAnalysisUpload function.
 * - PlanAnalysisUploadOutput - The return type for the planAnalysisUpload function.
 */

import {ai} from '@/ai/genkit';
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
  roomDimensions: z
    .array(z.object({
      name: z.string().describe('The name of the room.'),
      length: z.number().describe('The length of the room in meters.'),
      width: z.number().describe('The width of the room in meters.'),
    }))
    .describe('An array of room dimensions extracted from the plan.'),
});
export type PlanAnalysisUploadOutput = z.infer<typeof PlanAnalysisUploadOutputSchema>;

export async function planAnalysisUpload(input: PlanAnalysisUploadInput): Promise<PlanAnalysisUploadOutput> {
  return planAnalysisUploadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'planAnalysisUploadPrompt',
  input: {schema: PlanAnalysisUploadInputSchema},
  output: {schema: PlanAnalysisUploadOutputSchema},
  prompt: `You are an expert architect specializing in reading building plans and extracting room dimensions.

You will use this information to identify the rooms in the plan, determine their dimensions (length and width in meters), and extract their labels.

Analyze the following building plan and provide room dimensions.

Plan: {{media url=planDataUri}}

Ensure that the room dimensions are as accurate as possible.

Output should be a JSON array of objects, where each object represents a room and contains the room's name, length, and width in meters.

Example output:
{
  "roomDimensions": [
    {
      "name": "Living Room",
      "length": 5.5,
      "width": 4.2
    },
    {
      "name": "Bedroom 1",
      "length": 3.8,
      "width": 3.0
    }
  ]
}
`,
});

const planAnalysisUploadFlow = ai.defineFlow(
  {
    name: 'planAnalysisUploadFlow',
    inputSchema: PlanAnalysisUploadInputSchema,
    outputSchema: PlanAnalysisUploadOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
