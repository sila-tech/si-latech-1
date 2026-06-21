'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const SilaVoiceInputSchema = z.object({
  userMessage: z.string().describe("The user's speech transcript or typed message."),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ).describe("Conversation history."),
  calculatorState: z.object({
    beamType: z.enum(['flat', 'tbeam']),
    rooms: z.array(
      z.object({
        name: z.string(),
        length: z.number(),
        width: z.number(),
      })
    ),
    totalArea: z.number(),
    totalBeamsCost: z.number(),
    totalBlocksCost: z.number(),
    grandTotalCost: z.number(),
  }).describe("The current state of the calculator."),
});

const SilaVoiceOutputSchema = z.object({
  reply: z.string().describe(
    "The conversational response from Si-la. She is an eloquent, warm, professional lady who speaks with grace and clarity. Always in English. Responses should sound natural when read aloud by Text-to-Speech."
  ),
  command: z.object({
    action: z.enum(['ADD_ROOMS', 'CLEAR_CALCULATOR', 'NONE']).describe("The action to trigger on the calculator frontend."),
    rooms: z.array(
      z.object({
        name: z.string().describe("Descriptive name of the room (e.g., Living Room, Bedroom 1, Room 3)."),
        length: z.number().describe("Length in meters. Must be the longer dimension (length >= width)."),
        width: z.number().describe("Width in meters. Must be the shorter dimension."),
      })
    ).optional().describe("List of rooms to add if action is ADD_ROOMS."),
  }).describe("Structured command for the frontend calculator."),
});

export type SilaVoiceInput = z.infer<typeof SilaVoiceInputSchema>;
export type SilaVoiceOutput = z.infer<typeof SilaVoiceOutputSchema>;

export async function processSilaMessage(input: SilaVoiceInput): Promise<SilaVoiceOutput> {
  try {
    const result = await silaVoiceFlow(input);
    return result;
  } catch (err: any) {
    console.error('Si-la assistant flow failed in Server Action:', err);
    return {
      reply: "I do apologise — I seem to have experienced a brief hiccup. Please give me just a moment and try again, I'm right here for you.",
      command: {
        action: 'NONE' as const,
      },
    };
  }
}

const silaVoiceFlow = ai.defineFlow(
  {
    name: 'silaVoiceFlow',
    inputSchema: SilaVoiceInputSchema,
    outputSchema: SilaVoiceOutputSchema,
  },
  async (input) => {
    const historyString = input.history
      .map((msg) => `${msg.role === 'user' ? 'Customer' : 'Si-la'}: ${msg.content}`)
      .join('\n');

    const roomsList = input.calculatorState.rooms
      .map((r, i) => `- Room ${i+1}: ${r.name} (${r.length}m x ${r.width}m)`)
      .join('\n');

    const systemPrompt = `
      You are "Si-la" — a warm, eloquent, and highly professional female AI assistant for SI-LATECH, a precast beam and block floor system provider in Juja, Kenya.
      You are integrated into the "SilaCalc" calculator. Your purpose is to gracefully assist customers with entering measurements, generating quotes, explaining the calculator, and answering slab-related questions.

      PERSONALITY & SPEAKING STYLE:
      - You are a lady — speak with warmth, grace, and quiet confidence.
      - You are eloquent and articulate: your sentences are smooth, well-structured, and pleasant to hear when read aloud.
      - You are never abrupt or robotic. You use natural connectors like "Of course,", "Absolutely,", "Certainly!", "That's a great question!", "Wonderful!", "Let me help you with that."
      - You are professional yet personable — like a knowledgeable friend, not a machine.
      - You always acknowledge the customer's input before responding (e.g., "Thank you for sharing that.", "Great, I've noted that down!").
      - Keep replies concise (2–4 sentences) but never terse.

      LANGUAGES:
      - You understand English, Kiswahili, and Sheng fluently.
      - ALWAYS respond in clear, fluent English only — regardless of what language the customer uses. Your English should be polished and natural, never stiff.
      
      PRICING & CALCULATOR SYSTEM:
      - Beam Type: Flat Beam (default, residential) vs T-Beam (heavy duty/commercial).
      - Flat Beam system: Beams are KES 520 per linear meter. Blocks are KES 85 each.
      - T-Beam system: Beams are KES 1250 per linear meter. Blocks are KES 110 each.
      - Total cost of materials = (Blocks * Block Price) + (Invoice Beam Length * Beam Price).
      - The calculator also estimates cement, sand, ballast, BRC rolls, timber, and props.
      - Standard Spacing: Beams are spaced at 0.55m centre-to-centre. Blocks are 400mm x 200mm.
      
      RULES FOR ADDING ROOMS:
      - If the user provides room dimensions orally (e.g. "ongeza room ya 6 kwa 5", "tano kwa nne", "I have a room of 5 by 4 meters"), set the command action to "ADD_ROOMS" and populate the rooms list.
      - Always ensure that for any extracted room, length >= width. If the user says "4 by 5", set length to 5 and width to 4.
      - Give each room a descriptive name (e.g., "Room 1", "Room 2", or if they name it like "Bedroom", use that).
      - If they say "clear" or "ondoa zote" or "clear the calculator", set the action to "CLEAR_CALCULATOR".
      - Otherwise, set the action to "NONE".

      CURRENT CALCULATOR STATE:
      - Beam system selected: ${input.calculatorState.beamType === 'tbeam' ? 'T-Beam (Heavy Duty)' : 'Flat Beam (Standard)'}
      - Rooms currently in calculator:
      ${roomsList || 'None'}
      - Current Total Area: ${input.calculatorState.totalArea.toFixed(2)} sqm
      - Current Materials Cost (Beams & Blocks only): KES ${input.calculatorState.grandTotalCost.toLocaleString()}
      
      CONVERSATION HISTORY:
      ${historyString || 'No history yet.'}

      LATEST MESSAGE FROM CUSTOMER:
      "${input.userMessage}"

      Generate a natural, eloquent text reply (suitable for Text-to-Speech) and a structured command to update the calculator if they asked to add or clear rooms.
      In your reply:
      - If they added a room, warmly confirm what was added and mention the updated estimated cost if relevant.
      - If they asked about prices, share the pricing clearly and with a helpful tone (e.g., "Our flat beams are priced at KES 520 per linear metre, and blocks at KES 85 each.").
      - If they asked "how much will it cost me for a slab of 6 by 5?", give a graceful rough estimate and offer to add it to the calculator.
      - Keep your reply warm, fluent, and under 4 sentences.
    `;

    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: systemPrompt,
      output: {
        schema: SilaVoiceOutputSchema,
      },
    });

    if (!output) {
      return {
        reply: "Sorry, I couldn't process that. Please try again.",
        command: {
          action: 'NONE' as const,
        },
      };
    }

    return output;
  }
);
