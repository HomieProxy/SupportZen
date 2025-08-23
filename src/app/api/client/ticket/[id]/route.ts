
import { NextResponse } from 'next/server';
import { getTicketById } from '@/lib/data';
import { validateDomain, validateHmac } from '@/lib/auth';
import { addLog } from '@/lib/logger';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('Origin') || 'Unknown';
  const ticketId = params.id;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  try {
    const isDomainAllowed = await validateDomain(request);
    if (!isDomainAllowed) {
        await addLog('ERROR', `Domain not allowed for viewing ticket: ${origin}`);
        return NextResponse.json({ status: 'error', message: 'Forbidden: Invalid origin' }, { status: 403, headers: corsHeaders });
    }
    
    if (!email) {
        await addLog('WARN', `View ticket request missing email parameter`, { ticketId });
        return NextResponse.json({ status: 'error', message: 'Missing required query parameter: email' }, { status: 400, headers: corsHeaders });
    }

    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        await addLog('ERROR', `Invalid HMAC for view ticket request from ${email}`, { ticketId });
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid signature' }, { status: 401, headers: corsHeaders });
    }

    const ticket = getTicketById(ticketId);
    if (!ticket) {
        await addLog('WARN', `Ticket not found for id: ${ticketId}`, { email });
        return NextResponse.json({ status: 'error', message: 'Ticket not found' }, { status: 404, headers: corsHeaders });
    }

    // Crucially, verify the email from the HMAC check matches the ticket's owner
    if (ticket.customer.email !== email) {
        await addLog('ERROR', `Authorization mismatch for ticket ${ticketId}. Request email: ${email}, Ticket owner: ${ticket.customer.email}`);
        return NextResponse.json({ status: 'error', message: 'Forbidden: You are not authorized to view this ticket' }, { status: 403, headers: corsHeaders });
    }

    await addLog('INFO', `Successfully retrieved ticket ${ticketId} for ${email}`);
    return NextResponse.json({
        status: 'success',
        message: 'Ticket retrieved successfully.',
        data: ticket,
        error: null
    }, { headers: corsHeaders });


  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await addLog('ERROR', `Failed to retrieve ticket ${ticketId} from ${origin}: ${errorMessage}`, { stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ status: 'error', message: 'Failed to retrieve ticket', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
