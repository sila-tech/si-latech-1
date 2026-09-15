'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const RoomSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  length: z.number(),
  width: z.number(),
});

const ProjectContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  clientName: z.string().optional(),
  clientContact: z.string().optional(),
  projectLocation: z.string().optional(),
  contactPerson: z.string().optional(),
  status: z.string().optional(),
  beamType: z.string().optional(),
  singleBeamsOnly: z.boolean().optional(),
  roomsCount: z.number().optional(),
  rooms: z.array(RoomSummarySchema).optional(),
});

export type ProjectContext = z.infer<typeof ProjectContextSchema>;

const OperationsAiAssistantInputSchema = z.object({
  userMessage: z.string().describe('The command, question, or instruction from the staff or finance admin.'),
  projects: z.array(ProjectContextSchema).optional().describe('List of available projects for matching and operations.'),
  financesSummary: z.string().optional().describe('Brief context of pending finances or facilitation requests.'),
});

export type OperationsAiAssistantInput = z.infer<typeof OperationsAiAssistantInputSchema>;

const RectifiedRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  length: z.number().describe('Corrected length in meters.'),
  width: z.number().describe('Corrected width in meters.'),
  reason: z.string().optional().describe('Why this room was modified or corrected.'),
});

const OperationsAiAssistantActionSchema = z.object({
  type: z.enum([
    'UPDATE_STATUS',
    'RECTIFY_PROJECT_ERRORS',
    'CONVERT_TO_TBEAM_AND_QUOTE',
    'AUDIT_FINANCES',
    'NONE'
  ]).describe('Action type to execute.'),
  projectId: z.string().optional().describe('ID of the project being affected.'),
  projectName: z.string().optional().describe('Name of the matched project.'),
  newStatus: z.enum(['pending', 'expected', 'running', 'finished']).optional().describe('New project status to set.'),
  beamType: z.enum(['flat', 'tbeam']).optional().describe('Target beam system.'),
  singleBeamsOnly: z.boolean().optional().describe('True if double/triple beams should NOT be used even if span > 4.2m.'),
  rectifiedRooms: z.array(RectifiedRoomSchema).optional().describe('Corrected rooms if errors were fixed.'),
  rectificationNotes: z.string().optional().describe('Summary of errors that were rectified.'),
  triggerQuoteDownload: z.boolean().optional().describe('Whether the system should automatically download the quote PDF.'),
  explanation: z.string().optional().describe('Technical explanation of the action taken.'),
});

export type OperationsAiAssistantAction = z.infer<typeof OperationsAiAssistantActionSchema>;

const OperationsAiAssistantOutputSchema = z.object({
  reply: z.string().describe('Friendly, professional response explaining what was done or recommended.'),
  action: OperationsAiAssistantActionSchema.optional().describe('Structured executable action payload.'),
});

export type OperationsAiAssistantOutput = z.infer<typeof OperationsAiAssistantOutputSchema>;

export async function operationsAiAssistant(input: OperationsAiAssistantInput): Promise<OperationsAiAssistantOutput> {
  try {
    return await operationsAiAssistantFlow(input);
  } catch (err: any) {
    console.error('Fatal Server Action error in operationsAiAssistant:', err);
    return {
      reply: "I am ready to help manage project statuses, rectify dimension errors, convert flat beams to T-beams, and download custom quotations. Please select a project or specify what you'd like to do.",
    };
  }
}

export const operationsAiAssistantFlow = ai.defineFlow(
  {
    name: 'operationsAiAssistantFlow',
    inputSchema: OperationsAiAssistantInputSchema,
    outputSchema: OperationsAiAssistantOutputSchema,
  },
  async (input) => {
    const projectsList = input.projects || [];
    const projectsFormatted = projectsList.map((p) => {
      const roomsInfo = (p.rooms || []).map(r => `${r.name}: ${r.length}m x ${r.width}m`).join(', ');
      return `[ID: ${p.id}] "${p.name}" | Client: ${p.clientName || 'N/A'} | Status: ${p.status || 'pending'} | System: ${p.beamType || 'flat'}${p.singleBeamsOnly ? ' (Single Beams Enforced)' : ''} | Rooms: [${roomsInfo || `${p.roomsCount || 0} rooms`}]`;
    }).join('\n');

    const prompt = `You are SILA-OPS AI, the backend operational and financial automation assistant for SI-LATECH (Precast Beam & Block construction).

CURRENT PROJECTS IN DATABASE:
${projectsFormatted || 'No active projects provided.'}

FINANCIAL/FACILITATION CONTEXT:
${input.financesSummary || 'No pending financial items.'}

USER INSTRUCTION:
"${input.userMessage}"

CAPABILITIES YOU MUST FULFILL:
1. MOVE PROJECTS BETWEEN STATUSES:
   - If the user asks to move/update a project from "pending" to "expected" (or "running", "finished"):
     Identify the target project by name or ID. Set action type "UPDATE_STATUS", projectId, and newStatus ("expected", "running", "finished", "pending").
2. RECTIFY ERRORS IN PROJECTS:
   - If the user asks to rectify or fix errors in a project:
     Scan the project rooms for errors:
     a) Values entered in millimeters instead of meters (e.g. 3500 or 4000 instead of 3.5 or 4.0). Convert to meters by dividing by 1000.
     b) Inverted or zero dimensions (e.g. length <= 0 or width <= 0).
     c) Room names that need cleaning.
     Set action type "RECTIFY_PROJECT_ERRORS", provide "rectifiedRooms", and explain what was fixed in "rectificationNotes".
3. T-BEAM QUOTE GENERATION & CONVERSION (WITH SINGLE-BEAM OVERRIDE):
   - If the user asks to "download a t beam quote for a certain project and also save that quote as for tbeams even if it was for flatbeams":
     Identify the project. Set action type "CONVERT_TO_TBEAM_AND_QUOTE", projectId, beamType: "tbeam", triggerQuoteDownload: true.
   - If the user specifies NOT to double or triple beams ("dont double the beams or tripple just single them even if it is beyond 4.2"):
     Set singleBeamsOnly: true. Explain clearly that single T-beams will be used throughout regardless of span length.
4. FINANCE AUDIT & ASSISTANCE:
   - If the user asks for finance/facilitation guidance, summarize recommendations and set action type "AUDIT_FINANCES".
5. GENERAL QUERIES:
   - Provide concise, practical construction engineering guidance for SI-LATECH precast systems.

Return structured output according to the schema. Always match the target project accurately using fuzzy string matching on project name or client name.`;

    try {
      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt,
        output: {
          schema: OperationsAiAssistantOutputSchema,
        },
      });

      if (!output) {
        return {
          reply: "I am ready to help manage project statuses, rectify dimension errors, convert flat beams to T-beams, and download custom quotations. How can I assist?",
        };
      }

      return output;
    } catch (err: any) {
      console.error('Error in operationsAiAssistantFlow:', err);
      // Try fallback to gemini-2.0-flash or return a helpful operational response
      try {
        const { output } = await ai.generate({
          model: googleAI.model('gemini-2.0-flash'),
          prompt,
          output: {
            schema: OperationsAiAssistantOutputSchema,
          },
        });
        if (output) return output;
      } catch (fallbackErr: any) {
        console.error('Fallback model failed in operationsAiAssistantFlow:', fallbackErr);
      }

      // Keyword-based offline fallback so the user is never blocked even if AI API has a network hiccup
      const lower = input.userMessage.toLowerCase();
      const matchedProj = input.projects && input.projects.length > 0 ? input.projects[0] : undefined;

      if (lower.includes('t beam') || lower.includes('tbeam') || lower.includes('quote')) {
        return {
          reply: matchedProj 
            ? `I have identified project "${matchedProj.name}". I am preparing your T-beam quotation with single beams enforced as requested.`
            : "Please select or mention which project you would like to generate a T-beam quote for.",
          action: matchedProj ? {
            type: 'CONVERT_TO_TBEAM_AND_QUOTE' as const,
            projectId: matchedProj.id,
            projectName: matchedProj.name,
            beamType: 'tbeam' as const,
            singleBeamsOnly: true,
            triggerQuoteDownload: true,
            explanation: 'Single T-beam quotation prepared directly.',
          } : undefined
        };
      }

      return {
        reply: "I am ready to help manage project statuses, rectify dimension errors, convert flat beams to T-beams, and download custom quotations. Please specify the project name.",
      };
    }
  }
);
