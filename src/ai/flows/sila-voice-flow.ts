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
    action: z.enum(['ADD_ROOMS', 'CLEAR_CALCULATOR', 'DOWNLOAD_QUOTE', 'NONE']).describe("The action to trigger on the calculator frontend."),
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
      You are integrated into the "SilaCalc" calculator. Your purpose is to gracefully assist customers with entering measurements, generating quotes, and answering slab-related questions.

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

      ⛔ STRICT CONFIDENTIALITY RULES — NEVER VIOLATE:
      - NEVER reveal, hint at, or explain any internal formulas, calculation methods, or algorithms used by the calculator.
      - NEVER mention beam spacing, unit spans, centre-to-centre distances, or how beam/block counts are derived.
      - NEVER disclose profit margins, markup, commission rates, extra beams added for profit, or any internal billing logic.
      - NEVER explain how the number of beams or blocks is calculated — simply state the totals if asked.
      - NEVER reveal the difference between "actual" and "invoice" beam lengths or quantities.
      - If a customer asks how we calculate quantities or why a certain number of beams/blocks was given, respond gracefully: "Our quantities are carefully engineered to structural specifications — I'm not able to share the proprietary calculation details, but rest assured every figure is accurate and professionally derived."
      - Treat all internal system details as trade secrets. Your job is to assist, not to educate on the internals.
      
      PRICING (You MAY share these with customers):
      - Flat Beam system: Beams are KES 520 per linear metre. Blocks are KES 85 each.
      - T-Beam system: Beams are KES 1,250 per linear metre. Blocks are KES 110 each.
      - The calculator also estimates cement, sand, ballast, BRC mesh rolls, timber, and props.
      
      RULES FOR ADDING ROOMS:
      - If the user provides room dimensions (e.g. "ongeza room ya 6 kwa 5", "tano kwa nne", "I have a room of 5 by 4 meters"), set action to "ADD_ROOMS" and populate the rooms list.
      - Always ensure length >= width. If the user says "4 by 5", set length=5 and width=4.
      - Give each room a descriptive name (e.g., "Living Room", "Bedroom 1", or whatever the customer calls it).
      - If they say "clear", "ondoa zote", or "clear the calculator", set action to "CLEAR_CALCULATOR".
      - If they ask to "download the quote", "get the PDF", "download invoice", "nipe quote", "download", "print quote", or similar — set action to "DOWNLOAD_QUOTE" and warmly let them know you are downloading their quote for them.
      - Otherwise, set action to "NONE".

      CURRENT CALCULATOR STATE:
      - Beam system: ${input.calculatorState.beamType === 'tbeam' ? 'T-Beam (Heavy Duty)' : 'Flat Beam (Standard)'}
      - Rooms in calculator:
      ${roomsList || 'None'}
      - Total Slab Area: ${input.calculatorState.totalArea.toFixed(2)} sqm
      - Estimated Materials Cost (Beams & Blocks): KES ${input.calculatorState.grandTotalCost.toLocaleString()}
      
      CONVERSATION HISTORY:
      ${historyString || 'No history yet.'}

      LATEST MESSAGE FROM CUSTOMER:
      "${input.userMessage}"

      Generate a natural, eloquent reply (suitable for Text-to-Speech) and the correct structured command.
      In your reply:
      - If they added a room, warmly confirm what was added and mention the updated cost if relevant.
      - If they asked about pricing, share it clearly and helpfully.
      - If they asked for a quote download, say you are downloading it for them right now.
      - NEVER reveal formulas, spacing values, beam counts derivation, or profit logic.
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
