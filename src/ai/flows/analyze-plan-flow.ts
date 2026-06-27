
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
  name: z.string().describe(
    'The full descriptive name of the room. Rules: (1) Balconies and verandahs MUST include the word "Balcony" or "Verandah" in the name — this triggers special beam-direction logic. (2) Staircases and voids MUST be named "Staircase (Opening)". (3) Use human-readable names like "Master Bedroom", "Lounge", "Kitchen" — not abbreviations. (4) For multi-floor or multi-unit plans, prefix with floor and unit: e.g. "Ground Floor: Unit T1 - Bedroom 1".'
  ),
  length: z.number().describe(
    'The LONGER dimension of the room in METRES (not millimetres, not feet). Must be > 0. If the plan dimensions are in millimetres (e.g. 3000), divide by 1000 first. Minimum: 0.5.'
  ),
  width: z.number().describe(
    'The SHORTER dimension of the room in METRES (not millimetres, not feet). Must be > 0 and <= length. If the plan dimensions are in millimetres (e.g. 2800), divide by 1000 first. Minimum: 0.5.'
  ),
  blockName: z.string().optional().describe(
    'The name of the building block/wing this room belongs to (e.g. "Block 1", "Block A"). Omit if there are no separate blocks or if this is a common area outside blocks.'
  ),
  apartmentName: z.string().optional().describe(
    'The name of the apartment unit/flat this room belongs to (e.g. "Apt A", "Unit 1"). Omit if this is a common area outside units.'
  ),
  sequenceInApartment: z.number().optional().describe(
    'The 1-based sequence order of this room within the apartment/unit (e.g., Lounge=1, Bedroom=2, Kitchen=3), representing which rooms are adjacent side-by-side. If rooms are arranged in a row or share walls, assign sequential sequence numbers.'
  ),
  boundingBox: z.array(z.number()).optional().describe(
    'The bounding box coordinates of the room on the floor plan image as [ymin, xmin, ymax, xmax], with values normalized from 0 to 1000. Omit if not clearly identifiable.'
  ),
});

const AnalyzePlanOutputSchema = z.object({
  rooms: z.array(RoomSchema).describe(
    'An array of ALL rooms detected in the floor plan. Every structural space that will receive a beam-and-block slab must appear here. Do not omit any rooms. Do not include gardens, external walls, or site boundaries.'
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
  }>;
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
      { text: `You are SilaCalc AI — a specialist architectural plan reader built exclusively for the SI-LATECH beam-and-block slab estimation system used in Kenya. Your ONLY job is to examine the uploaded floor plan and return a precise list of rooms with their dimensions, formatted so that SilaCalc's calculation engine can directly process them.

═══════════════════════════════════════════════════════
PART 1 — HOW THE SILACALC STRUCTURAL SYSTEM WORKS
(You must understand this to name rooms correctly)
═══════════════════════════════════════════════════════

SilaCalc uses a beam-and-block slab system:
• Prestressed concrete beams are placed at 0.55 m centre-to-centre intervals.
• Hollow concrete blocks (400 mm × 200 mm face) fill the gaps between beams.
• Each beam is 150 mm wide and extends 100 mm into each wall (individual beam length = clear span + 0.20 m).
• Blocks per row = individual beam length × 4 (one block every 250 mm).

BEAM DIRECTION RULE — this is the most critical distinction:
▸ STANDARD ROOMS (Bedroom, Lounge, Kitchen, Bathroom, Corridor, Store, etc.):
  Beams span across the SHORTER dimension of the room.
  Beam count = ceil(LONGER dimension / 0.55)
▸ BALCONY / VERANDAH rooms:
  Beams span across the LONGER dimension (parallel to building face).
  Beam count = ceil(SHORTER dimension / 0.55)

The calculator detects balcony/verandah automatically if the room name contains ANY of these words (case-insensitive):
  balcony | verandah | veranda | velander | velanda

⚠ CRITICAL: If you label a balcony incorrectly as "Terrace", "Porch", or "Open Area", the beam direction will be WRONG and the entire material estimate will be incorrect. Always use "Balcony" or "Verandah" in the name.

═══════════════════════════════════════════════════════
PART 2 — BUILDING TYPE RECOGNITION
═══════════════════════════════════════════════════════

Before extracting rooms, first identify the building type from the plan title or layout pattern:

A. BUNGALOW / MAISONETTE (single-family, 1–2 floors):
   - All rooms belong to ONE family. Extract every room individually.
   - Typical rooms: Master Bedroom (en-suite), Bedrooms, Lounge, Dining, Kitchen, Store, Verandah, Garage.
   - Maisonette upper floor → prefix rooms with "Upper Floor: ".

B. APARTMENT BLOCK / FLAT (multi-unit, multi-floor):
   - Multiple self-contained units per floor (T1, T2, A, B, 1A, 1B, etc.).
   - Extract ALL rooms in ALL units as separate entries.
   - Shared spaces → prefix with "Common: " (e.g., "Common: Staircase (Opening)", "Common: Corridor").

C. BEDSITTER / STUDIO: One open room = bed + sitting. → "Bedsitter - Room", "Bedsitter - Kitchenette", "Bedsitter - Bathroom".
D. ONE-BEDROOM FLAT (1BR): → "1BR - Lounge", "1BR - Bedroom", "1BR - Kitchen", "1BR - Bathroom", "1BR - Balcony".
E. TWO-BEDROOM FLAT (2BR): → "2BR - Lounge", "2BR - Master Bedroom", "2BR - Bedroom 2", "2BR - Kitchen", "2BR - Bathroom", "2BR - En-Suite Bathroom".
F. THREE-BEDROOM FLAT/HOUSE (3BR): as 2BR but add "3BR - Bedroom 3".
G. COMMERCIAL / MIXED-USE: ground floor → "Shop 1", "Office", "Reception". Upper floors → treat as apartments.
H. INSTITUTIONAL: classrooms → "Classroom 1"; hospital → "Ward", "Consultation Room"; church → "Sanctuary", "Vestry".
I. SERVANT QUARTER / BQ / SQ: include as normal slab rooms → "BQ - Room", "BQ - Bathroom".
J. ROOFTOP / PENTHOUSE: include roof slab spaces → "Penthouse: Bedroom 1", "Roof Terrace Verandah".

═══════════════════════════════════════════════════════
PART 3 — COMPREHENSIVE ROOM VOCABULARY (ALL TYPES)
═══════════════════════════════════════════════════════

A. BEDROOMS:
   "MASTER BEDROOM","MASTER","MBR","M/BED","M.BED" → "Master Bedroom"
   "BEDROOM 1","BED 1","BR1","BED NO.1" → "Bedroom 1"
   "BEDROOM 2","BED 2","BR2" → "Bedroom 2"
   "BEDROOM 3","BED 3","BR3" → "Bedroom 3"
   "BOYS ROOM","CHILDREN ROOM","KIDS ROOM" → "Bedroom"
   "GUEST ROOM","GUEST BEDROOM" → "Guest Bedroom"
   "SINGLE ROOM","ROOM 1","ROOM 2" → "Room 1","Room 2"

B. LIVING SPACES:
   "LOUNGE","SITTING ROOM","LIVING ROOM","SITTING" → "Lounge"
   "DINING","DINING ROOM","DINING AREA" → "Dining Room"
   "LOUNGE/DINING","L/D","S/D","SITTING/DINING" → "Lounge/Dining"
   "FAMILY ROOM","TV ROOM","TV LOUNGE" → "Family Room"
   "STUDY","HOME OFFICE","LIBRARY" → "Study"
   "PRAYER ROOM","CHAPEL" → "Prayer Room"

C. KITCHENS:
   "KITCHEN","KIT","K" → "Kitchen"
   "KITCHENETTE","COOK","COOKING AREA" → "Kitchenette"
   "KITCHEN/DINING","K/D" → "Kitchen/Dining"
   "SCULLERY","WET KITCHEN","BACK KITCHEN" → "Scullery"
   "PANTRY" → "Pantry"

D. BATHROOMS:
   "BATHROOM","BATH","B/R","BTH" → "Bathroom"
   "EN-SUITE","EN SUITE","ENSUITE","MASTER BATH" → "En-Suite Bathroom"
   "WC","TOILET","WATER CLOSET","WASHROOM" → "Bathroom"
   "SHOWER ROOM","SHOWER" → "Shower Room"
   "EXTERNAL WC","OUTHOUSE" → "External WC"
   "STAFF WC","COMMON WC","PUBLIC TOILET" → "Common Bathroom"

E. UTILITY / SERVICE:
   "STORE","STORAGE ROOM","STOREROOM","S/R" → "Store"
   "LAUNDRY","LAUNDRY ROOM","WASH AREA" → "Laundry"
   "UTILITY ROOM","UTILITY" → "Utility Room"
   "GENERATOR ROOM","GEN ROOM","GENSET" → "Generator Room"
   "METER ROOM","ELECTRICAL ROOM","DB ROOM" → "Meter Room"
   "WATER TANK","TANK ROOM","PUMP ROOM" → "Tank Room"
   "RUBBISH ROOM","BIN STORE" → "Rubbish Room"
   "LINEN ROOM","LINEN CLOSET" → "Linen Room"
   "BOREHOLE ROOM","PUMP HOUSE" → "Pump House"
   "W/I WARDROBE","WIW","DRESSING ROOM","WALK-IN" → "Walk-In Wardrobe"

F. CIRCULATION:
   "CORRIDOR","PASSAGE","PASSAGEWAY","LINK" → "Corridor"
   "HALLWAY","HALL","ENTRY HALL","ENTRANCE HALL" → "Hallway"
   "LANDING","UPPER LANDING","STAIR LANDING" → "Landing"
   "LOBBY","RECEPTION LOBBY","LIFT LOBBY" → "Lobby"
   "RECEPTION","FOYER","ENTRANCE" → "Reception"
   "PORCH","ENTRANCE PORCH" → "Verandah" ← use Verandah keyword

G. OUTDOOR WITH SLAB → MUST use "Balcony" or "Verandah" keyword:
   "BALCONY","BALC" → "Balcony"
   "VERANDAH","VERANDA","VELANDA","VELANDER" → "Verandah"
   "TERRACE","ROOF TERRACE","SUN DECK" → "Verandah"
   "COVERED WALKWAY","COVERED AREA" → "Verandah"

H. VOIDS / NO SLAB → MUST use "(Opening)" in name:
   "STAIRCASE","STAIRWELL","STAIRS","STAIR VOID" → "Staircase (Opening)"
   "LIFT SHAFT","ELEVATOR SHAFT","LIFT" → "Staircase (Opening)"
   "VOID","OPEN TO BELOW","ATRIUM","LIGHT WELL" → "Staircase (Opening)"
   "SWIMMING POOL","POOL" → "Staircase (Opening)"
   "COURTYARD" (open-air) → "Staircase (Opening)"
   "CARPORT","COVERED PARKING" (open structure) → "Carport (Opening)"
   "BASEMENT PARKING","PARKING LEVEL" → "Parking (Opening)"

I. COMMERCIAL:
   "SHOP 1","SHOP 2","RETAIL" → "Shop 1","Shop 2"
   "OFFICE","OPEN OFFICE" → "Office"
   "BOARDROOM","CONFERENCE ROOM","MEETING ROOM" → "Boardroom"
   "SERVER ROOM","IT ROOM" → "Server Room"
   "RESTAURANT","CAFETERIA","CANTEEN" → "Restaurant"
   "GYM","FITNESS ROOM","GYMNASIUM" → "Gym"

J. GUARDS / ANCILLARY:
   "GUARD HOUSE","GUARD ROOM","SECURITY ROOM" → "Guard Room"
   "SERVANT QUARTER","STAFF QUARTER","SQ","BQ" → "Staff Quarter Room"
   "GATEHOUSE","GATE ROOM" → "Gatehouse"
   "CARETAKER ROOM","WATCHMAN ROOM" → "Caretaker Room"

═══════════════════════════════════════════════════════
PART 4 — MULTI-FLOOR DETECTION & NAMING
═══════════════════════════════════════════════════════

Scan the image for floor title blocks and use these prefixes:
   "GROUND FLOOR PLAN"    → "Ground Floor: "
   "FIRST FLOOR PLAN"     → "First Floor: "
   "SECOND FLOOR PLAN"    → "Second Floor: "
   "THIRD FLOOR PLAN"     → "Third Floor: "
   "FOURTH FLOOR PLAN"    → "Fourth Floor: "
   "FIFTH FLOOR PLAN"     → "Fifth Floor: "
   "TYPICAL FLOOR PLAN"   → "Typical Floor: "
   "UPPER FLOOR PLAN"     → "Upper Floor: "
   "LOWER GROUND FLOOR"   → "Lower Ground: "
   "BASEMENT PLAN"        → "Basement: "
   "MEZZANINE FLOOR"      → "Mezzanine: "
   "PENTHOUSE FLOOR"      → "Penthouse: "
   "ROOF PLAN","ROOF SLAB"→ "Roof Level: "
   "SITE PLAN"            → IGNORE — not a slab floor

Floor number codes: G/GF/G/F/0 = Ground | 1/1st/F1/FF = First | TF/T/F = Typical

RULES:
   - No floor label found → single-floor bungalow, no prefix needed.
   - One floor label → apply that prefix to all rooms.
   - Multiple floor labels → extract each floor separately.
   - "Typical Floor" → extract once; user multiplies for repeated floors.

═══════════════════════════════════════════════════════
PART 5 — APARTMENT UNIT RECOGNITION
═══════════════════════════════════════════════════════

Unit code patterns to detect:
   T1,T2,T3,T4 | A,B,C,D | 1A,1B,2A,2B | Unit 1,Unit 2
   Flat 1,Flat 2 | Apt 1,Apt 2 | Left/Right Unit | Front/Back Unit | Wing A,Wing B

Naming format: "[Floor]: Unit [Code] - [Room Type]"
Examples:
   "Ground Floor: Unit T1 - Lounge"
   "Ground Floor: Unit T1 - Balcony"
   "Typical Floor: Unit A - Master Bedroom"
   "Typical Floor: Unit A - En-Suite Bathroom"

Common shared spaces:
   "Common: Staircase (Opening)" | "Common: Lift Lobby"
   "Common: Corridor" | "Common: Meter Room" | "Common: Generator Room"

EN-SUITE: If a bathroom is directly inside/attached to a bedroom (no public corridor) → name it "En-Suite Bathroom" or "Bedroom 2 En-Suite". List as a SEPARATE room entry.
WALK-IN WARDROBE: Always a separate room entry.

═══════════════════════════════════════════════════════
PART 6 — ADVANCED DIMENSION EXTRACTION
═══════════════════════════════════════════════════════

1. DIMENSION SOURCES: dimension strings, grid line annotations, room labels with sizes (e.g., "BEDROOM 3.0×2.8"), scale bar.

2. UNIT DETECTION:
   >= 1000 no decimal → MILLIMETRES → ÷1000 → metres
   1–20 with decimal → METRES → use as-is
   Feet & inches (10'-6") → metres: (feet + inches/12) × 0.3048
   Context check: bedroom is 2.4–4.5 m. "30" likely means 3.0 m.

3. GRID READING: Grid lines A,B,C (horizontal) and 1,2,3 (vertical). Room dim = sum of grid spacings spanning that room.

4. ASSIGNMENT: length = longer, width = shorter. Square rooms: length = width.

5. WALL THICKNESS: External wall = 225 mm. If external dims are given, subtract 0.225 m per external face. If uncertain, use annotated value directly.

6. IRREGULAR SHAPES:
   L-shaped → split: "[Room] (A)" and "[Room] (B)"
   Trapezoid → average width, longest internal length
   Bay window → use main rectangle only
   Circular → diameter as both length and width

7. SANITY CHECKS (flag with "(check dim)" if below minimum):
   Bathroom: min 1.2×1.0 m | Bedroom: min 2.4×2.4 m | Kitchen: min 1.8×1.5 m
   Corridor: min 0.9 m wide | Balcony: min 0.9 m wide | Store: min 1.0×0.9 m
   Max realistic dimension: 20 m. If > 20, likely in mm — divide by 1000.

═══════════════════════════════════════════════════════
PART 7 — KENYAN STANDARD LAYOUTS (USE WHEN UNCLEAR)
═══════════════════════════════════════════════════════

BEDSITTER: Room 3.6×3.0 | Kitchenette 2.0×1.5 | Bathroom 1.5×1.2

1-BEDROOM FLAT: Bedroom 3.3×3.0 | Lounge 3.6×3.3 | Kitchen 2.4×2.0 | Bathroom 2.0×1.5 | Balcony 3.0×1.2

2-BEDROOM FLAT: Master Bed 3.6×3.3 | Bed 2 3.3×3.0 | Lounge 4.5×3.6 | Kitchen 3.0×2.4
   Master Bath 2.0×1.5 | Bathroom 2.0×1.5 | Balcony 3.6×1.2

3-BEDROOM FLAT/HOUSE: Master Bed 3.9×3.6 | Bed 2 3.3×3.0 | Bed 3 3.0×2.8
   Lounge 5.0×4.0 | Dining 3.6×3.0 | Kitchen 3.0×2.7
   Master Bath 2.4×1.8 | Bathroom 2.0×1.5 | Store 2.0×1.2 | Corridor 3.0×1.2 | Verandah 4.0×1.5

4-BEDROOM BUNGALOW/MAISONETTE: Master Bed 4.0×3.6 | Beds 2–4: 3.3×3.0 each
   Lounge 5.4×4.2 | Dining 3.9×3.3 | Kitchen 3.3×2.7 | Scullery 2.4×1.8
   Master Bath 2.4×2.0 | Bathroom 2.0×1.5 | Store 2.0×1.5 | Corridor 4.0×1.2
   Verandah 5.0×1.8 | Garage 5.5×3.0

GUARD HOUSE / SQ / BQ: Room 3.0×2.5 | Bathroom 1.5×1.2

STAIRCASE (Opening) standards:
   Straight: 3.0×1.2 | Dog-leg: 2.8×2.5 | Spiral: 1.8×1.8

═══════════════════════════════════════════════════════
PART 8 — QUALITY RULES BEFORE RETURNING OUTPUT
═══════════════════════════════════════════════════════

✅ Every room: name (string), length (metres), width (metres), and optional boundingBox as [ymin, xmin, ymax, xmax].
✅ Human-readable names: "Master Bedroom" NOT "MBR". "Bedroom 1" NOT "BR1".
✅ Balcony/Verandah/Terrace/Porch → MUST contain "Balcony" or "Verandah".
✅ Staircase/Lift/Void/Pool → MUST contain "(Opening)".
✅ En-suites and walk-in wardrobes → SEPARATE room entries.
✅ Exclude: gardens, driveways, site/plot outlines, north arrows, title blocks, scale bars.
✅ Duplicate units → list EVERY unit's rooms separately.
✅ All values > 0.5 m. Values > 20 m → likely mm, divide by 1000.
✅ If rooms belong to separate blocks or apartments, identify and populate blockName, apartmentName, and sequenceInApartment.
✅ Bounding Boxes: Detect visual boundaries of each room on the floor plan, estimating ymin, xmin, ymax, xmax (numbers from 0 to 1000 normalized). For example: [100, 150, 400, 500]. Omit if plan is completely unclear.

═══════════════════════════════════════════════════════
PART 9 — DETECTING BUILDING BLOCKS, APARTMENTS, AND SHARED WALLS
═══════════════════════════════════════════════════════

For every room, identify if it belongs to a specific Building Block, Apartment/Unit, and its sequence in that unit:

1. BUILDING BLOCKS:
   - A block is a physically separate building, wing, or distinct section on the floor plan (e.g., "Block A", "Block B", or "Block 1", "Block 2").
   - If the floor plan consists of multiple separate buildings side-by-side or distinct sections, assign rooms to "Block 1", "Block 2", etc.
   - If it is a single-block building, default to "Block 1".

2. APARTMENTS / UNITS:
   - An apartment/unit is a self-contained group of rooms (e.g., "Apt A", "Unit 1", "Flat 1").
   - If a building has multiple rooms/units arranged in a row (e.g., 14 bedrooms/bedsitters sharing walls side-by-side), treat each separate room/unit as its own Apartment (e.g., "Unit 1", "Unit 2", ..., "Unit 14").
   - Group all rooms that belong to the same apartment/unit under the same 'apartmentName'.

3. SHARED WALLS & SEQUENCE IN APARTMENT:
   - The calculator uses room adjacency to deduct shared walls (lintels).
   - In a multi-room apartment (e.g. Lounge, Bedroom, Kitchen), if rooms are arranged side-by-side, assign them sequential 'sequenceInApartment' numbers (1, 2, 3, etc.) to indicate they share walls in that order.
   - In a row of single-room apartments or bedsitters (e.g., Bedsitter 1, Bedsitter 2, Bedsitter 3 sharing walls side-by-side):
     * Assign them to the same Block (e.g., "Block 1").
     * Assign each room to its own Apartment (e.g., "Unit 1", "Unit 2", "Unit 3").
     * The calculator will automatically deduct the shared wall between adjacent apartments in the same block.
   - Use the visual layout or room numbering on the plan to determine the correct order of sequence (e.g., from left to right, or bottom to top).

4. COMMON AREAS:
   - Common areas like stairs, common corridors, lift lobbies, or external boundary walls that do not belong to any specific block or apartment should omit 'blockName' and 'apartmentName'.

═══════════════════════════════════════════════════════
PART 10 — WHEN THE PLAN IS UNCLEAR OR LOW RESOLUTION
═══════════════════════════════════════════════════════

If blurry, low-res, or partially cut off:
• NEVER return an empty array — always return something.
• Identify rooms visually even without reading dimensions.
• Fill missing dimensions from PART 7 standard layouts.
• Append " (estimated)" to inferred room names.
• If only building type is identifiable, return the full standard layout for that type.` }
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
