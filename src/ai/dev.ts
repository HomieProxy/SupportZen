import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-response.ts';
import '@/ai/flows/summarize-ticket.ts';
import '@/ai/flows/create-ticket-from-chat.ts';