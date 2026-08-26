'use server';

/**
 * @fileOverview High-Accuracy AI Floor Plan & Blueprint Reader for SilaCalc.
 *
 * Implements multi-stage reasoning, architectural few-shot prompting,
 * mathematical geometric reconciliation, and scale calibration.
 *
 * - analyzePlan - Analyzes a floor plan image/blueprint and returns verified rooms.
 * - AnalyzePlanInput - Input schema including optional calibration data.
 * - AnalyzePlanOutput - Return schema with rooms, detected scale, and confidence.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const AnalyzePlanInputSchema = z.object({
  photoDataUri: z.string().describe(
    "A photo or render of a floor plan, as a data URI with Base64 encoding ('data:<mimetype>;base64,<data>')."
  ),
  calibrationScale: z.number().optional().describe(
    "Optional user-calibrated scale factor representing normalized pixels (out of 1000) per real-world metre."
  ),
  customNote: z.string().optional().describe(
    "Optional user context or instructions (e.g. '3-bedroom bungalow ground floor')."
  ),
});
export type AnalyzePlanInput = z.infer<typeof AnalyzePlanInputSchema>;

const RoomSchema = z.object({
  name: z.string().describe(
    'The full descriptive name of the room. Rules: (1) Balconies/verandahs MUST include "Balcony" or "Verandah". (2) Staircases/voids MUST include "(Opening)". (3) Use human-readable names like "Master Bedroom", "Lounge", "Kitchen". (4) For multi-unit plans: "Ground Floor: Unit A - Lounge".'
  ),
  length: z.number().describe(
    'The LONGER clear span dimension in METRES (e.g. 4.2). Must be > 0. If in mm (e.g. 4200), divide by 1000.'
  ),
  width: z.number().describe(
    'The SHORTER clear span dimension in METRES (e.g. 3.6). Must be > 0 and <= length. If in mm, divide by 1000.'
  ),
  blockName: z.string().optional().describe(
    'The building block/wing (e.g. "Block 1", "Block A").'
  ),
  apartmentName: z.string().optional().describe(
    'The apartment unit/flat (e.g. "Unit 1", "Apt A").'
  ),
  sequenceInApartment: z.number().optional().describe(
    '1-based sequence order for shared wall deductions (1, 2, 3...).'
  ),
  boundingBox: z.array(z.number()).optional().describe(
    'Bounding box coordinates on the image as [ymin, xmin, ymax, xmax] normalized from 0 to 1000.'
  ),
  confidence: z.number().optional().describe(
    'Confidence score from 0.0 to 1.0 based on text clarity and dimension witness lines.'
  ),
  aspectRatioWarning: z.boolean().optional().describe(
    'True if bounding box geometry differs from extracted dimensions.'
  ),
});

const AnalyzePlanOutputSchema = z.object({
  rooms: z.array(RoomSchema).describe(
    'An array of all detected rooms with verified dimensions in metres.'
  ),
  detectedScale: z.string().optional().describe(
    'The detected drawing scale (e.g., "1:100", "1:50", "1:200", or "Unspecified").'
  ),
  detectedUnits: z.string().optional().describe(
    'The dimension units detected on the drawing (e.g., "mm", "m", "ft/in").'
  ),
  drawingType: z.string().optional().describe(
    'Type of drawing identified (e.g., "Architectural Floor Plan", "Structural Slab Layout").'
  ),
  summary: z.string().optional().describe(
    'Brief structural summary of the detected layout and total rooms.'
  ),
});
export type AnalyzePlanOutput = z.infer<typeof AnalyzePlanOutputSchema>;

export interface AnalyzePlanResult {
  success: boolean;
  rooms?: Array<{ 
    name: string; 
    length: number; 
    width: number; 
    blockName?: string; 
    apartmentName?: string; 
    sequenceInApartment?: number; 
    boundingBox?: number[];
    confidence?: number;
    aspectRatioWarning?: boolean;
  }>;
  detectedScale?: string;
  detectedUnits?: string;
  drawingType?: string;
  summary?: string;
  error?: string;
}

/**
 * Mathematical Geometric Reconciliation & Validation Layer.
 * Cross-references visual bounding boxes with extracted numerical dimensions,
 * rectifies unscaled millimetres, and applies physical sanity checks.
 */
function reconcileAndValidateRooms(output: AnalyzePlanOutput, calibrationScale?: number): AnalyzePlanOutput {
  const reconciledRooms = (output.rooms || []).map((room, idx) => {
    let length = Number(room.length) || 3.0;
    let width = Number(room.width) || 2.5;

    // 1. Automatic Millimetre / Centimetre Rectification
    if (length > 25) length = length / 1000;
    if (width > 25) width = width / 1000;

    // Minimum sensible structural dimension in construction (0.5m)
    length = Math.max(0.5, Math.round(length * 100) / 100);
    width = Math.max(0.5, Math.round(width * 100) / 100);

    // Ensure length >= width
    if (width > length) {
      const temp = length;
      length = width;
      width = temp;
    }

    let aspectRatioWarning = false;
    let confidence = room.confidence ?? 0.90;

    // 2. Bounding Box Geometric Validation
    if (room.boundingBox && Array.isArray(room.boundingBox) && room.boundingBox.length === 4) {
      const [ymin, xmin, ymax, xmax] = room.boundingBox;
      const boxHeight = Math.abs(ymax - ymin);
      const boxWidth = Math.abs(xmax - xmin);

      if (boxHeight > 5 && boxWidth > 5) {
        const boxRatio = Math.max(boxWidth, boxHeight) / Math.min(boxWidth, boxHeight);
        const dimRatio = length / width;
        const ratioDiff = Math.abs(boxRatio - dimRatio) / Math.max(boxRatio, dimRatio);

        // If bounding box aspect ratio deviates > 35% from numerical dimensions, flag for user inspection
        if (ratioDiff > 0.35) {
          aspectRatioWarning = true;
          confidence = Math.max(0.60, confidence - 0.20);
        }

        // 3. User Calibration Scale Cross-Verification (if supplied)
        if (calibrationScale && calibrationScale > 0) {
          const visualLengthM = Math.max(boxWidth, boxHeight) / calibrationScale;
          const visualWidthM = Math.min(boxWidth, boxHeight) / calibrationScale;

          // If extracted dimension is wildly deviant (>60%) or unreadable, calibrate from physical pixels
          const lengthDev = Math.abs(visualLengthM - length) / Math.max(visualLengthM, length);
          if (lengthDev > 0.60 && visualLengthM >= 0.8) {
            length = Math.round(visualLengthM * 10) / 10;
            width = Math.round(visualWidthM * 10) / 10;
            aspectRatioWarning = false;
            confidence = 0.85;
          }
        }
      }
    }

    return {
      ...room,
      length,
      width,
      confidence: Math.round(confidence * 100) / 100,
      aspectRatioWarning,
    };
  });

  return {
    ...output,
    rooms: reconciledRooms,
  };
}

export async function analyzePlan(input: AnalyzePlanInput): Promise<AnalyzePlanResult> {
  try {
    const rawOutput = await analyzePlanFlow(input);
    const validatedOutput = reconcileAndValidateRooms(rawOutput, input.calibrationScale);

    return {
      success: true,
      rooms: validatedOutput.rooms,
      detectedScale: validatedOutput.detectedScale,
      detectedUnits: validatedOutput.detectedUnits,
      drawingType: validatedOutput.drawingType,
      summary: validatedOutput.summary,
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
    console.log("Starting high-accuracy analyzePlanFlow. Input photoDataUri length:", input.photoDataUri?.length);
    
    const promptParts = [
      { media: { url: input.photoDataUri } },
      { text: `You are SilaCalc AI — a specialist architectural plan reader built exclusively for the SI-LATECH beam-and-block slab estimation system in Kenya. Your task is to perform high-accuracy computer vision extraction of all room spaces, clear span dimensions, and bounding boxes from the blueprint.

${input.customNote ? `USER CONTEXT NOTE: "${input.customNote}"` : ''}

═══════════════════════════════════════════════════════
STAGE 1: DRAWING METADATA & SCALE CALIBRATION
═══════════════════════════════════════════════════════
1. Detect the drawing type: "Architectural Floor Plan", "Structural Slab Layout", etc.
2. Read the drawing scale from the title block if present (e.g., 1:50, 1:100, 1:200).
3. Detect the dimension units:
   - "mm" if numbers are in thousands (e.g., 3600, 4200) → MUST DIVIDE BY 1000 to return metres.
   - "m" if numbers have decimals (e.g., 3.60, 4.20) → use directly.
   - "feet/inches" (e.g., 12'-0") → convert: (feet + inches/12) * 0.3048.
4. Distinguish between Centerline (c/c) and Clear Internal Spans:
   - If dimension strings run along grid lines or are marked c/c, deduct wall thickness (Kenya standard: 200 mm for external walls, 150 mm or 100 mm for internal partitions).
   - Example: 4000 mm c/c between 200 mm walls → Clear span = 4000 - 200 = 3800 mm = 3.80 m.

═══════════════════════════════════════════════════════
STAGE 2: BEAM-AND-BLOCK SLAB STRUCTURAL RULES
═══════════════════════════════════════════════════════
• STANDARD ROOMS (Bedroom, Lounge, Kitchen, Dining, Store, Corridor, etc.):
  Beams span across the SHORTER dimension.
• BALCONIES & VERANDAHS (including cantilevers/porches):
  Beams span across the LONGER dimension (parallel to building face).
  ⚠ CRITICAL: The room name MUST contain "Balcony" or "Verandah" (or "Baraza") to trigger proper beam direction logic.
• VOIDS / OPENINGS (Stairwells, Lift Shafts, Light Wells, Courtyards, Ducts):
  Must include "(Opening)" in the name (e.g., "Staircase (Opening)", "Lift (Opening)").
• SUNKEN SLABS:
  Bathrooms, En-suites, Kitchens marked as "Sunken Slab" ARE CONCRETE SLABS. Extract them as regular rooms.

═══════════════════════════════════════════════════════
STAGE 3: FEW-SHOT BLUEPRINT EXAMPLES (GROUND TRUTH)
═══════════════════════════════════════════════════════

EXAMPLE A — 3-Bedroom Kenyan Maisonette Ground Floor:
Output JSON:
{
  "detectedScale": "1:100",
  "detectedUnits": "mm",
  "drawingType": "Architectural Floor Plan",
  "summary": "3-Bedroom Ground Floor with Lounge, Dining, Kitchen, Master En-suite, Verandah, and Stair Void.",
  "rooms": [
    { "name": "Lounge", "length": 5.4, "width": 4.2, "blockName": "Block 1", "apartmentName": "Ground Floor", "sequenceInApartment": 1, "boundingBox": [320, 150, 680, 480], "confidence": 0.95 },
    { "name": "Dining Room", "length": 3.9, "width": 3.3, "blockName": "Block 1", "apartmentName": "Ground Floor", "sequenceInApartment": 2, "boundingBox": [320, 480, 580, 720], "confidence": 0.92 },
    { "name": "Kitchen", "length": 3.3, "width": 2.7, "blockName": "Block 1", "apartmentName": "Ground Floor", "sequenceInApartment": 3, "boundingBox": [580, 480, 850, 720], "confidence": 0.94 },
    { "name": "Master Bedroom", "length": 4.0, "width": 3.6, "blockName": "Block 1", "apartmentName": "Ground Floor", "sequenceInApartment": 4, "boundingBox": [100, 150, 320, 480], "confidence": 0.96 },
    { "name": "En-Suite Bathroom", "length": 2.4, "width": 1.8, "blockName": "Block 1", "apartmentName": "Ground Floor", "sequenceInApartment": 5, "boundingBox": [100, 480, 240, 620], "confidence": 0.90 },
    { "name": "Verandah", "length": 4.5, "width": 1.8, "blockName": "Block 1", "apartmentName": "Ground Floor", "sequenceInApartment": 6, "boundingBox": [680, 150, 850, 450], "confidence": 0.95 },
    { "name": "Staircase (Opening)", "length": 3.0, "width": 2.2, "blockName": "Block 1", "apartmentName": "Ground Floor", "sequenceInApartment": 7, "boundingBox": [240, 480, 320, 620], "confidence": 0.92 }
  ]
}

EXAMPLE B — Multi-Unit Bedsitter Row (Shared Walls):
Output JSON:
{
  "detectedScale": "1:100",
  "detectedUnits": "mm",
  "drawingType": "Architectural Floor Plan",
  "summary": "Block of 3 Bedsitters side-by-side with shared walls.",
  "rooms": [
    { "name": "Bedsitter 1 - Room", "length": 3.6, "width": 3.0, "blockName": "Block 1", "apartmentName": "Unit 1", "sequenceInApartment": 1, "boundingBox": [100, 50, 400, 300], "confidence": 0.95 },
    { "name": "Bedsitter 1 - Bathroom", "length": 1.8, "width": 1.5, "blockName": "Block 1", "apartmentName": "Unit 1", "sequenceInApartment": 2, "boundingBox": [400, 50, 550, 200], "confidence": 0.91 },
    { "name": "Bedsitter 2 - Room", "length": 3.6, "width": 3.0, "blockName": "Block 1", "apartmentName": "Unit 2", "sequenceInApartment": 1, "boundingBox": [100, 300, 400, 550], "confidence": 0.95 },
    { "name": "Bedsitter 2 - Bathroom", "length": 1.8, "width": 1.5, "blockName": "Block 1", "apartmentName": "Unit 2", "sequenceInApartment": 2, "boundingBox": [400, 300, 550, 450], "confidence": 0.91 },
    { "name": "Bedsitter 3 - Room", "length": 3.6, "width": 3.0, "blockName": "Block 1", "apartmentName": "Unit 3", "sequenceInApartment": 1, "boundingBox": [100, 550, 400, 800], "confidence": 0.95 },
    { "name": "Bedsitter 3 - Bathroom", "length": 1.8, "width": 1.5, "blockName": "Block 1", "apartmentName": "Unit 3", "sequenceInApartment": 2, "boundingBox": [400, 550, 550, 700], "confidence": 0.91 },
    { "name": "Common Verandah", "length": 9.0, "width": 1.5, "blockName": "Block 1", "boundingBox": [550, 50, 700, 800], "confidence": 0.94 }
  ]
}

═══════════════════════════════════════════════════════
STAGE 4: SWAHILI & LOCAL VOCABULARY REFERENCE
═══════════════════════════════════════════════════════
- Sebule / S/D / L/D → "Lounge" or "Lounge/Dining"
- Jikoni / Kit → "Kitchen"
- Chumba Kikuu / MBR → "Master Bedroom"
- Chumba / BR / Bed 1/2/3 → "Bedroom 1", "Bedroom 2", "Bedroom 3"
- Choo / B/R / Bth / Washroom → "Bathroom" or "En-Suite Bathroom"
- Stoo / S/R → "Store"
- Baraza / Velanda / Velander → "Verandah"
- SQ / DSQ / BQ → "Staff Quarter Room"

═══════════════════════════════════════════════════════
STAGE 5: FINAL OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════
1. Return EVERY structural room space requiring a slab.
2. Length and Width MUST be positive floating-point numbers in METRES.
3. Accurate boundingBox [ymin, xmin, ymax, xmax] coordinates between 0 and 1000.
4. Exclude site boundary fences, exterior landscaping, roof timber framing, foundation trench footings, and elevations.` }
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
    console.log("Raw AI output summary:", output.summary || `Found ${output.rooms?.length} rooms`);

    return output;
  }
);
