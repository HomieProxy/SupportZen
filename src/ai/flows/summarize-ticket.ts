'use server';

/**
 * @fileOverview An AI agent to summarize support tickets.
 *
 * - summarizeTicket - A function that summarizes the ticket.
 * - SummarizeTicketInput - The input type for the summarizeTicket function.
 * - SummarizeTicketOutput - The return type for the summarizeTicket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTicketInputSchema = z.object({
  ticketText: z.string().describe('The text content of the support ticket.'),
});
export type SummarizeTicketInput = z.infer<typeof SummarizeTicketInputSchema>;

const SummarizeTicketOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the support ticket.'),
});
export type SummarizeTicketOutput = z.infer<typeof SummarizeTicketOutputSchema>;

export async function summarizeTicket(input: SummarizeTicketInput): Promise<SummarizeTicketOutput> {
  return summarizeTicketFlow(input);
}

const summarizeTicketPrompt = ai.definePrompt({
  name: 'summarizeTicketPrompt',
  input: {schema: SummarizeTicketInputSchema},
  output: {schema: SummarizeTicketOutputSchema},
  prompt: `You are an AI assistant helping to summarize support tickets for agents.

  Please summarize the following support ticket text, extracting the key issue and relevant context in a concise manner:

  {{ticketText}}`,
});

const summarizeTicketFlow = ai.defineFlow(
  {
    name: 'summarizeTicketFlow',
    inputSchema: SummarizeTicketInputSchema,
    outputSchema: SummarizeTicketOutputSchema,
  },
  async input => {
    const {output} = await summarizeTicketPrompt(input);
    return output!;
  }
);
