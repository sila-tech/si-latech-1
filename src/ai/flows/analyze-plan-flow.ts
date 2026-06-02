
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

export interface AnalyzePlanResult {
  success: boolean;
  rooms?: Array<{ name: string; length: number; width: number }>;
  error?: string;
}

export async function analyzePlan(input: AnalyzePlanInput): Promise<AnalyzePlanResult> {
  try {
    const result = await analyzePlanFlow(input);
    return {
      success: true,
      rooms: result.rooms,
    };
  } catch (err: any) {
    console.error('Plan analysis failed in Server Action:', err);
    let errMsg = 'AI Blueprint analysis service is temporarily unavailable.';
    const errorStr = String(err.message || err);
    if (errorStr.includes('API key was reported as leaked') || errorStr.includes('leaked')) {
      errMsg = 'The Gemini API Key configured in your environment has been revoked by Google because it was reported as leaked. Please update the GEMINI_API_KEY environment variable in your production secrets (Firebase App Hosting) and local .env.local file with a newly generated key from Google AI Studio.';
    } else if (errorStr.includes('API key') || errorStr.includes('API_KEY')) {
      errMsg = 'Invalid or missing Gemini API Key. Please verify your configuration.';
    } else if (errorStr.includes('Quota exceeded') || errorStr.includes('429')) {
      errMsg = 'The Gemini API quota has been exceeded. Please check your billing plan or retry in a few moments.';
    } else if (err.message) {
      errMsg = err.message;
    }
    return {
      success: false,
      error: errMsg,
    };
  }
}

const analyzePlanFlow = ai.defineFlow(
  {
    name: 'analyzePlanFlow',
    inputSchema: AnalyzePlanInputSchema,
    outputSchema: AnalyzePlanOutputSchema,
  },
  async (input) => {
    console.log("Starting analyzePlanFlow. Input photoDataUri length:", input.photoDataUri?.length);
    
    const promptParts = [
      { media: { url: input.photoDataUri } },
      { text: `You are an expert architectural plan reader specializing in residential and high-density apartment plans. Your task is to analyze the provided floor plan document or image and extract all rooms with their exact dimensions.

CRITICAL PARSING RULES:
1. MULTI-FLOOR DETECTION: 
   - Check if the uploaded blueprint contains multiple floor plans (e.g., "GROUND FLOOR PLAN", "TYPICAL FLOOR PLAN", "FLOOR PLAN"). 
   - If multiple floors are detected, extract rooms from ALL floors. 
   - To keep data flat and compatible, prefix each room name with its floor designation (e.g., "Ground Floor: Unit T1 - Bedroom", "Typical Floor: Room 1").

2. HIGH-DENSITY FLAT / APARTMENT PATTERNS:
   - Identify self-contained units (Bedsitters / 1-Bedrooms) containing a Lounge, Bedroom, Kitchenette (cook), and Washroom (wash).
   - Extract the individual structural rooms (e.g., Lounge: 3.33m x 2.7m; Bedroom: 3.33m x 2.8m).
   - Identify single wing rooms (labeled "Room" or similar, e.g., 3.0m x 2.8m) and separate them from shared facility washrooms.

3. STAIRCASE OPENINGS:
   - Identify stairwells / staircase areas. Include them in the list but label them clearly as "Staircase (Opening)" so the calculator can note that no horizontal slab is required here.

4. DIMENSION EXTRACTION & CONVERSION:
   - Extract dimensions directly from the blueprint geometry.
   - If dimensions are in millimeters (e.g., 3000, 2800), divide by 1000 to convert them to METERS (e.g., 3.0m, 2.8m).
   - For irregular or slanted rooms (such as those along property boundaries), approximate using average rectangular dimensions (e.g., width of 3.0m).

5. BALCONY & VERANDAH IDENTIFICATION:
   - Always clearly label any balcony, veranda, or verandah with "Balcony" or "Verandah" in the name (e.g., "Ground Floor: Unit 1 - Balcony" or "Typical Floor: Verandah"). This is critical because balconies and verandahs have different structural beam span rules (beams run parallel to the longer span rather than the shorter side).
   - If a room is square, extract both dimensions accurately.

If the floor plan image is blurry, low resolution, or hard to read, do not return an empty array. Make intelligent architectural inferences based on standard residential layout dimensions (e.g., standard rooms are 3.0m x 2.8m, lounges are 3.3m x 2.7m) and complete the extraction using your best logical layout assumptions.` }
    ];

    let result = null;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting blueprint analysis with model: ${modelName}`);
        const response = await ai.generate({
          model: googleAI.model(modelName),
          output: { schema: AnalyzePlanOutputSchema },
          prompt: promptParts,
        });
        
        if (response && response.output) {
          console.log(`Successfully completed analysis with model: ${modelName}`);
          result = response;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or experienced high demand. Error:`, err.message || err);
        lastError = err;
      }
    }

    if (!result || !result.output) {
      throw new Error(`The AI blueprint analysis failed on all attempted models. Last error: ${lastError?.message || lastError}`);
    }

    const { output } = result;
    console.log("Raw AI output:", JSON.stringify(output, null, 2));

    if (!output) {
      throw new Error('The AI model did not return a valid output.');
    }
    return output;
  }
);
