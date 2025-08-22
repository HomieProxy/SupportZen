'use server';
import { NextResponse } from 'next/server';
import { createTicketFromWebhook } from '@/lib/data';
import type { ClientWebhookPayload } from '@/types';

// This is a simplified secret key check. 
// In a real-world scenario, use a more secure method like rotating tokens and store the secret in an environment variable.
const validateApiKey = (request: Request): boolean => {
    const authHeader = request.headers.get('Authorization');
    const expectedApiKey = `Bearer ${process.env.CLIENT_API_SECRET || 'your-default-secret-key'}`;
    return authHeader === expectedApiKey;
}

export async function POST(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid API Key' }, { status: 401 });
  }
    
  try {
    const body = await request.json();
    const payload: ClientWebhookPayload = body.data;

    if (!payload || !payload.uuid || !payload.email || !payload.message) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields in data object' }, { status: 400 });
    }

    const newTicket = createTicketFromWebhook(payload);

    return NextResponse.json({
        status: 'success',
        message: 'Ticket created successfully.',
        data: {
            ticketId: newTicket.id
        },
        error: null
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: 'Failed to create ticket', error: errorMessage }, { status: 500 });
  }
}
