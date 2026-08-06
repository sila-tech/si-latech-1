'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StaffAiAssistantInputSchema = z.object({
  userMessage: z.string().describe('The question or request from the field staff member.'),
  staffName: z.string().optional().describe('Name of the staff member.'),
  assignedProjects: z.array(z.object({
    name: z.string(),
    projectLocation: z.string().optional(),
    roomsCount: z.number().optional(),
  })).optional().describe('Brief non-sensitive context on projects assigned to this staff.'),
});

export type StaffAiAssistantInput = z.infer<typeof StaffAiAssistantInputSchema>;

const StaffAiAssistantOutputSchema = z.object({
  reply: z.string().describe('The AI response to the staff member.'),
  suggestedFacilitation: z.object({
    amount: z.number().describe('Suggested facilitation amount in KSh if applicable.'),
    reason: z.string().describe('Clean concise reason for the facilitation request.'),
  }).optional().describe('Populated if the user asked to request facilitation or estimate site expenses.'),
});

export type StaffAiAssistantOutput = z.infer<typeof StaffAiAssistantOutputSchema>;

export async function staffAiAssistant(input: StaffAiAssistantInput): Promise<StaffAiAssistantOutput> {
  return staffAiAssistantFlow(input);
}

export const staffAiAssistantFlow = ai.defineFlow(
  {
    name: 'staffAiAssistantFlow',
    inputSchema: StaffAiAssistantInputSchema,
    outputSchema: StaffAiAssistantOutputSchema,
  },
  async (input) => {
    const projectsContext = input.assignedProjects?.length
      ? input.assignedProjects.map(p => `- ${p.name} (${p.projectLocation || 'Location N/A'}, ${p.roomsCount || 0} areas)`).join('\n')
      : 'No active projects currently assigned.';

    const { output } = await ai.generate({
      prompt: `You are SILA-AI, an expert field operations and technical assistant for SI-LATECH precast beam & block construction staff and site technicians.
Staff Member Name: ${input.staffName || 'Staff Member'}

Assigned Projects Context:
${projectsContext}

User Message: "${input.userMessage}"

YOUR DUAL ROLE:
1. SITE TASK GUIDANCE:
   - Provide technical guidelines on SI-LATECH T-Beam (150x120mm) and Maxspan Beam (220x120mm) installation, hollow block arrangement (550mm c/c spacing), prop positioning (max 1.5m spacing under beams), BRC A142/A98 mesh layout, and 50mm topping concrete screed mixing ratio (1:2:4 / Class 25) and curing times (7-14 days).
2. FACILITATION REQUEST ESTIMATION & DRAFTING:
   - When staff ask for help requesting money, site facilitation, transport expenses, fundis lunch, prop hire, or emergency supplies, help them estimate reasonable amounts in Kenyan Shillings (KSh) and provide a concise justification.
   - If the user asks to request facilitation or estimate expenses, ALWAYS populate the "suggestedFacilitation" object with a realistic estimated "amount" (number in KSh) and a clear "reason" string.

STRICT PRIVACY & DATA ISOLATION SECURITY RULES:
- Under NO CIRCUMSTANCES should you reveal, estimate, or discuss company profit margins, total revenues, bank balances, internal material manufacturing costs, investor payouts, or overall finance ledgers.
- If the user asks about overall company finance or profit, politely state: "As a field assistant, I do not have access to company financial ledgers or profit statistics. Please contact the Finance Admin for internal financial inquiries."

Format your reply clearly in friendly professional markdown.`,
      output: {
        schema: StaffAiAssistantOutputSchema,
      },
    });

    if (!output) {
      return {
        reply: "I am ready to help with your site technical tasks or drafting facilitation requests. How can I assist you today?",
      };
    }

    return output;
  }
);
