// This file uses server-side code, mark it so Next.js knows. See https://nextjs.org/docs/app/api-reference/file-conventions/server-actions
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting responses to customer messages based on conversation history.
 *
 * - `suggestResponse` - An async function that takes customer message and conversation history as input and returns a suggested response.
 * - `SuggestResponseInput` - The input type for the `suggestResponse` function.
 * - `SuggestResponseOutput` - The output type for the `suggestResponse` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResponseInputSchema = z.object({
  customerMessage: z.string().describe('The latest message from the customer.'),
  conversationHistory: z.string().describe('The entire conversation history between the agent and the customer.'),
});
export type SuggestResponseInput = z.infer<typeof SuggestResponseInputSchema>;

const SuggestResponseOutputSchema = z.object({
  suggestedResponse: z.string().describe('The AI-suggested response to the customer message.'),
});
export type SuggestResponseOutput = z.infer<typeof SuggestResponseOutputSchema>;

export async function suggestResponse(input: SuggestResponseInput): Promise<SuggestResponseOutput> {
  return suggestResponseFlow(input);
}

const suggestResponsePrompt = ai.definePrompt({
  name: 'suggestResponsePrompt',
  input: {schema: SuggestResponseInputSchema},
  output: {schema: SuggestResponseOutputSchema},
  prompt: `You are an AI assistant helping a customer support agent.
  Based on the conversation history and the customer's latest message, suggest a response that the agent can use.
  Be concise and helpful.

  Conversation History:
  {{conversationHistory}}

  Customer Message:
  {{customerMessage}}

  Suggested Response:`,
});

const suggestResponseFlow = ai.defineFlow(
  {
    name: 'suggestResponseFlow',
    inputSchema: SuggestResponseInputSchema,
    outputSchema: SuggestResponseOutputSchema,
  },
  async input => {
    const {output} = await suggestResponsePrompt(input);
    return output!;
  }
);
