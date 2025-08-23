
import { NextResponse } from 'next/server';
import { getTicketsByEmail } from '@/lib/data';
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

export async function GET(request: Request) {
  const origin = request.headers.get('Origin') || 'Unknown';
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  try {
    const isDomainAllowed = await validateDomain(request);
    if (!isDomainAllowed) {
        await addLog('ERROR', `Domain not allowed for ticket list: ${origin}`);
        return NextResponse.json({ status: 'error', message: 'Forbidden: Invalid origin' }, { status: 403, headers: corsHeaders });
    }
    
    if (!email) {
        await addLog('WARN', `Ticket list request missing email parameter`);
        return NextResponse.json({ status: 'error', message: 'Missing required query parameter: email' }, { status: 400, headers: corsHeaders });
    }

    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        await addLog('ERROR', `Invalid HMAC for ticket list request from ${email}`);
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid signature' }, { status: 401, headers: corsHeaders });
    }

    const tickets = getTicketsByEmail(email);
    
    // It's better to not expose the full message history in the list view.
    const summarizedTickets = tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        createdAt: t.createdAt,
        lastUpdate: t.lastUpdate
    }));

    await addLog('INFO', `Successfully retrieved ${summarizedTickets.length} tickets for ${email}`);

    return NextResponse.json({
        status: 'success',
        message: 'Tickets retrieved successfully.',
        data: summarizedTickets,
        error: null
    }, { headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await addLog('ERROR', `Failed to list tickets from ${origin}: ${errorMessage}`, { stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ status: 'error', message: 'Failed to list tickets', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
