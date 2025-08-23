
import { NextResponse } from 'next/server';
import { addMessageToTicketByCustomer, getTicketById } from '@/lib/data';
import { validateDomain, validateHmac } from '@/lib/auth';
import { parseMultipartFormData } from '@/lib/api-helpers';
import { addLog } from '@/lib/logger';

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
  const origin = request.headers.get('Origin') || 'Unknown';
  try {
    const isDomainAllowed = await validateDomain(request);
    if (!isDomainAllowed) {
        await addLog('ERROR', `Domain not allowed for ticket append: ${origin}`);
        return NextResponse.json({ status: 'error', message: 'Forbidden: Invalid origin' }, { status: 403, headers: corsHeaders });
    }

    const { fields, files } = await parseMultipartFormData(request);

    const ticketId = fields.ticket_id;
    const messageContent = fields.message;
    const email = fields.email;

    await addLog('INFO', `Received ticket append request for ticket ${ticketId} from ${email}`, { fields });

    if (!ticketId || !messageContent || !email) {
      await addLog('WARN', `Ticket append request missing required fields`, { ticketId, email, hasMessage: !!messageContent });
      return NextResponse.json({ status: 'error', message: 'Missing required fields: ticket_id, email, and message' }, { status: 400, headers: corsHeaders });
    }
    
    const ticket = getTicketById(ticketId);
    if (!ticket) {
        await addLog('WARN', `Ticket not found for id: ${ticketId}`);
        return NextResponse.json({ status: 'error', message: 'Ticket not found' }, { status: 404, headers: corsHeaders });
    }

    if (ticket.customer.email !== email) {
        await addLog('ERROR', `Email mismatch for ticket ${ticketId}. Request email: ${email}, Ticket owner: ${ticket.customer.email}`);
        return NextResponse.json({ status: 'error', message: 'Email does not match ticket owner' }, { status: 403, headers: corsHeaders });
    }

    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        await addLog('ERROR', `Invalid HMAC for ticket append from ${email}`);
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid signature' }, { status: 401, headers: corsHeaders });
    }

    const imageUrl = files.image ? `/uploads/${files.image.filename}` : undefined;

    const updatedTicket = addMessageToTicketByCustomer(ticketId, messageContent, imageUrl);
    await addLog('INFO', `Successfully appended message to ticket ${ticketId}`);

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
    await addLog('ERROR', `Failed to append to ticket from ${origin}: ${errorMessage}`, { stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ status: 'error', message: 'Failed to append to ticket', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
