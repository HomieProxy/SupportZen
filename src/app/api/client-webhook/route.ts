import { NextResponse } from 'next/server';
import { createOrUpdateTicketFromWebhook } from '@/lib/data';
import { ClientWebhookPayload } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation to check if the data key exists
    if (body.status !== 'success' || !body.data) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    const payload: ClientWebhookPayload = body.data;

    // Here you can add more robust validation of userData if needed
    if (!payload.uuid || !payload.email || !payload.message) {
        return NextResponse.json({ error: 'Missing required fields (uuid, email, message) in data object' }, { status: 400 });
    }

    // This function will create a new ticket or update an existing one
    const result = createOrUpdateTicketFromWebhook(payload);
    
    return NextResponse.json({ message: 'Webhook received successfully.', ticketId: result.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook', details: errorMessage }, { status: 500 });
  }
}
