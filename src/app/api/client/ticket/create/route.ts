'use server';
import { NextResponse } from 'next/server';
import { createTicketFromWebhook } from '@/lib/data';
import type { ClientWebhookPayload } from '@/types';
import { validateApiKey } from '@/lib/auth';

export async function POST(request: Request) {
  if (!(await validateApiKey(request))) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid API Key' }, { status: 401 });
  }
    
  try {
    const body = await request.json();
    const payload: ClientWebhookPayload = body.data;

    if (!payload || !payload.email || !payload.message) {
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
