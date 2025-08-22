
import { NextResponse } from 'next/server';
import { addMessageToTicketByCustomer, getTicketById } from '@/lib/data';
import { validateHmac } from '@/lib/auth';
import { parseForm, getPublicUrl, getField } from '@/lib/api-helpers';


export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const { fields, files } = await parseForm(request as any);

    const ticketId = getField(fields, 'ticket_id');
    const messageContent = getField(fields, 'message');
    const email = getField(fields, 'email');

    if (!ticketId || !messageContent || !email) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: ticket_id, email, and message' }, { status: 400 });
    }
    
    const ticket = getTicketById(ticketId);
    if (!ticket) {
        return NextResponse.json({ status: 'error', message: 'Ticket not found' }, { status: 404 });
    }

    // The email in the payload MUST match the email associated with the ticket
    if (ticket.customer.email !== email) {
        return NextResponse.json({ status: 'error', message: 'Email does not match ticket owner' }, { status: 403 });
    }

    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid HMAC signature' }, { status: 401 });
    }

    const imageUrl = getPublicUrl(files.image);

    const updatedTicket = addMessageToTicketByCustomer(ticketId, messageContent, imageUrl);

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
