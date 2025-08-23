
import { NextResponse } from 'next/server';
import { addMessageToTicketByCustomer, getTicketById } from '@/lib/data';
import { validateDomain, validateHmac } from '@/lib/auth';
import { parseForm, getPublicUrl, getField } from '@/lib/api-helpers';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const isDomainAllowed = await validateDomain(request);
    if (!isDomainAllowed) {
        return NextResponse.json({ status: 'error', message: 'Forbidden: Invalid origin' }, { status: 403, headers: corsHeaders });
    }

    const { fields, files } = await parseForm(request);

    const ticketId = getField(fields, 'ticket_id');
    const messageContent = getField(fields, 'message');
    const email = getField(fields, 'email');

    if (!ticketId || !messageContent || !email) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: ticket_id, email, and message' }, { status: 400, headers: corsHeaders });
    }
    
    const ticket = getTicketById(ticketId);
    if (!ticket) {
        return NextResponse.json({ status: 'error', message: 'Ticket not found' }, { status: 404, headers: corsHeaders });
    }

    // The email in the payload MUST match the email associated with the ticket
    if (ticket.customer.email !== email) {
        return NextResponse.json({ status: 'error', message: 'Email does not match ticket owner' }, { status: 403, headers: corsHeaders });
    }

    // Now validate the HMAC signature
    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid signature' }, { status: 401, headers: corsHeaders });
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
    }, { headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: 'Failed to append to ticket', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
