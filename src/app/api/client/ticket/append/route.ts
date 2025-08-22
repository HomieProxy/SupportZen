'use server';
import { NextResponse } from 'next/server';
import { addMessageToTicketByCustomer } from '@/lib/data';

interface AppendTicketPayload {
    ticket_id: string;
    message: string;
    image_url?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload: AppendTicketPayload = body.data;

    if (!payload || !payload.ticket_id || !payload.message) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: ticket_id and message' }, { status: 400 });
    }

    const updatedTicket = addMessageToTicketByCustomer(payload.ticket_id, payload.message, payload.image_url);

    return NextResponse.json({
        status: 'success',
        message: 'Message appended to ticket successfully.',
        data: {
            ticketId: updatedTicket.id,
            messageId: updatedTicket.messages[updatedTicket.messages.length - 1].id
        },
        error: null
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: 'Failed to append to ticket', error: errorMessage }, { status: 500 });
  }
}
