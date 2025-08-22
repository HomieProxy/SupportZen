'use server';
/**
 * @fileOverview This file defines a Genkit flow to automatically create a support ticket from a live chat conversation.
 *
 * @exports createTicketFromChat - A function that initiates the ticket creation process.
 * @exports CreateTicketFromChatInput - The input type for the createTicketFromChat function.
 * @exports CreateTicketFromChatOutput - The return type for the createTicketFromChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateTicketFromChatInputSchema = z.object({
  conversationText: z
    .string()
    .describe('The complete text of the conversation with the user.'),
  customerEmail: z.string().email().describe('The email address of the customer.'),
  customerPlanId: z.string().describe('The plan ID of the customer.'),
  customerExpiredAt: z.string().describe('The expiration date of the customer plan.'),
  customerUuid: z.string().describe('The auth token of the customer.'),
});

export type CreateTicketFromChatInput = z.infer<typeof CreateTicketFromChatInputSchema>;

const CreateTicketFromChatOutputSchema = z.object({
  ticketId: z.string().describe('The ID of the newly created support ticket.'),
  summary: z.string().describe('A brief summary of the support ticket.'),
});

export type CreateTicketFromChatOutput = z.infer<typeof CreateTicketFromChatOutputSchema>;

export async function createTicketFromChat(input: CreateTicketFromChatInput): Promise<CreateTicketFromChatOutput> {
  return createTicketFromChatFlow(input);
}

const createTicketPrompt = ai.definePrompt({
  name: 'createTicketPrompt',
  input: {schema: CreateTicketFromChatInputSchema},
  output: {schema: CreateTicketFromChatOutputSchema},
  prompt: `You are an AI assistant tasked with creating support tickets from chat conversations.

  Analyze the following conversation and create a support ticket with a summary of the issue.

  Conversation:
  {{conversationText}}

  Customer Email: {{customerEmail}}
  Customer Plan ID: {{customerPlanId}}
  Customer Expiration Date: {{customerExpiredAt}}
  Customer Auth Token: {{customerUuid}}

  Please generate a ticket ID and a summary of the issue based on the conversation.
  The summary should be concise and informative.
`,
});

const createTicketFromChatFlow = ai.defineFlow(
  {
    name: 'createTicketFromChatFlow',
    inputSchema: CreateTicketFromChatInputSchema,
    outputSchema: CreateTicketFromChatOutputSchema,
  },
  async input => {
    const {output} = await createTicketPrompt(input);
    return output!;
  }
);
