'use server';
import { NextResponse } from 'next/server';
import { addMessageToTicketByCustomer, getTicketById } from '@/lib/data';
import { validateHmac } from '@/lib/auth';

interface AppendTicketPayload {
    ticket_id: string;
    email: string; // Email is needed for HMAC validation
    message: string;
    image_url?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload: AppendTicketPayload = body.data;

    if (!payload || !payload.ticket_id || !payload.message || !payload.email) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: ticket_id, email, and message' }, { status: 400 });
    }
    
    const ticket = getTicketById(payload.ticket_id);
    if (!ticket) {
        return NextResponse.json({ status: 'error', message: 'Ticket not found' }, { status: 404 });
    }

    // The email in the payload MUST match the email associated with the ticket
    if (ticket.customer.email !== payload.email) {
        return NextResponse.json({ status: 'error', message: 'Email does not match ticket owner' }, { status: 403 });
    }

    const isAuthorized = await validateHmac(request, payload.email);
    if (!isAuthorized) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid HMAC signature' }, { status: 401 });
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
