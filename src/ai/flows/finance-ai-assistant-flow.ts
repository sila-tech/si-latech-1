'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for parsing raw text into financial record
const ParseFinanceRecordInputSchema = z.object({
  rawText: z.string().describe('The raw text, receipt details, M-Pesa message, or note to parse into a financial record.'),
});

export type ParseFinanceRecordInput = z.infer<typeof ParseFinanceRecordInputSchema>;

const ParseFinanceRecordOutputSchema = z.object({
  type: z.enum(['income', 'expense', 'facilitation_request']).describe('Classification of the transaction.'),
  amount: z.number().describe('Extracted monetary amount in KSh.'),
  reason: z.string().describe('Cleaned, structured reason or description of the transaction.'),
  category: z.string().describe('Extracted category (e.g. Client Payment, Transport, Materials, Labor/Wages, Utilities, Site Ops).'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the AI extraction.'),
  explanation: z.string().describe('Brief summary of how the text was parsed.'),
});

export type ParseFinanceRecordOutput = z.infer<typeof ParseFinanceRecordOutputSchema>;

export async function parseFinanceRecord(input: ParseFinanceRecordInput): Promise<ParseFinanceRecordOutput> {
  return parseFinanceRecordFlow(input);
}

export const parseFinanceRecordFlow = ai.defineFlow(
  {
    name: 'parseFinanceRecordFlow',
    inputSchema: ParseFinanceRecordInputSchema,
    outputSchema: ParseFinanceRecordOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are an expert AI financial bookkeeper for SI-LATECH precast beam & block construction company in Kenya.
Analyze the following raw transaction text, M-Pesa receipt SMS, invoice note, or expenditure log:

Input Text: "${input.rawText}"

Your Job:
1. Identify if this is:
   - "income": Payments received from clients, investors, or sales deposits.
   - "expense": Money paid out for materials, transport, fuel, wages, equipment hire, utilities, or office supplies.
   - "facilitation_request": Funds requested by site technicians for operational tasks.
2. Extract the exact numerical amount in KSh (Kenya Shillings).
3. Create a clean, professional "reason" description summarizing who paid/was paid and for what purpose.
4. Assign a category (e.g. "Client Payment", "Materials & Supplies", "Transport & Fuel", "Labor & Wages", "Equipment Rental", "Site Operational Expense").
5. Indicate your confidence level and a brief explanation.

Return structured JSON according to the output schema.`,
      output: {
        schema: ParseFinanceRecordOutputSchema,
      },
    });

    if (!output) {
      return {
        type: 'expense' as const,
        amount: 0,
        reason: input.rawText,
        category: 'General Expense',
        confidence: 'low' as const,
        explanation: 'Could not auto-extract fields. Please verify manually.',
      };
    }

    return output;
  }
);

// Schema for analyzing pending facilitation requests
const AnalyzeFacilitationRequestsInputSchema = z.object({
  requests: z.array(z.object({
    id: z.string().optional(),
    amount: z.number(),
    reason: z.string(),
    requestedBy: z.string().optional(),
  })).describe('List of pending facilitation requests.'),
});

export type AnalyzeFacilitationRequestsInput = z.infer<typeof AnalyzeFacilitationRequestsInputSchema>;

const AnalyzeFacilitationRequestsOutputSchema = z.object({
  summary: z.string().describe('Overall summary of pending site facilitation funds.'),
  recommendations: z.array(z.string()).describe('Specific actionable approval recommendations for finance admins.'),
  totalRequested: z.number().describe('Sum of all pending requested amounts in KSh.'),
});

export type AnalyzeFacilitationRequestsOutput = z.infer<typeof AnalyzeFacilitationRequestsOutputSchema>;

export async function analyzeFacilitationRequests(input: AnalyzeFacilitationRequestsInput): Promise<AnalyzeFacilitationRequestsOutput> {
  return analyzeFacilitationRequestsFlow(input);
}

export const analyzeFacilitationRequestsFlow = ai.defineFlow(
  {
    name: 'analyzeFacilitationRequestsFlow',
    inputSchema: AnalyzeFacilitationRequestsInputSchema,
    outputSchema: AnalyzeFacilitationRequestsOutputSchema,
  },
  async (input) => {
    const formattedRequests = input.requests.map((r, i) => `${i + 1}. KSh ${r.amount.toLocaleString()} requested by ${r.requestedBy || 'Staff'} for: "${r.reason}"`).join('\n');
    const total = input.requests.reduce((sum, r) => sum + (r.amount || 0), 0);

    const { output } = await ai.generate({
      prompt: `You are the AI Financial Audit & Operations Assistant for SI-LATECH.
Review the following list of pending staff site facilitation requests:

Pending Requests (Total: KSh ${total.toLocaleString()}):
${formattedRequests || 'No pending requests.'}

Your Job:
1. Provide a concise executive summary of the pending facilitation requests.
2. Provide clear, actionable recommendations for the finance team (e.g. which requests are standard site expenses like transport/fundis lunch, and which require verification).
3. Calculate the total requested amount.

Return structured JSON according to the schema.`,
      output: {
        schema: AnalyzeFacilitationRequestsOutputSchema,
      },
    });

    if (!output) {
      return {
        summary: `There are ${input.requests.length} pending requests totaling KSh ${total.toLocaleString()}.`,
        recommendations: ['Review each request reason against assigned site milestones.'],
        totalRequested: total,
      };
    }

    return output;
  }
);
