
import { NextResponse } from 'next/server';
import { createTicketFromWebhook } from '@/lib/data';
import type { ClientWebhookPayload } from '@/types';
import { parseMultipartFormData } from '@/lib/api-helpers';
import { validateDomain, validateHmac } from '@/lib/auth';
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
        await addLog('ERROR', `Domain not allowed for ticket creation: ${origin}`);
        return NextResponse.json({ status: 'error', message: 'Forbidden: Invalid origin' }, { status: 403, headers: corsHeaders });
    }

    const { fields, files } = await parseMultipartFormData(request);

    const email = fields.email;
    const message = fields.message;
    const createdAt = fields.created_at;

    await addLog('INFO', `Received ticket create request from ${email}`, { fields, files: Object.keys(files) });

    if (!email || !message || !createdAt) {
      await addLog('WARN', `Ticket create request missing required fields`, { hasEmail: !!email, hasMessage: !!message, hasCreatedAt: !!createdAt });
      return NextResponse.json({ status: 'error', message: 'Missing required fields: email, message, and created_at' }, { status: 400, headers: corsHeaders });
    }
    
    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        await addLog('ERROR', `Invalid HMAC for ticket creation from ${email}`);
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid signature' }, { status: 401, headers: corsHeaders });
    }

    const authToken = request.headers.get('Authorization')?.split(' ')[1];
    const imageUrl = files.image ? `/uploads/${files.image.filename}` : undefined;

    const payload: ClientWebhookPayload = {
      email,
      message,
      created_at: parseInt(createdAt, 10),
      auth_token: authToken,
      name: fields.name,
      plan_id: fields.plan_id,
      expired_at: fields.expired_at ? parseInt(fields.expired_at, 10) : undefined,
      image_url: imageUrl
    };

    const newTicket = createTicketFromWebhook(payload);
    await addLog('INFO', `Successfully created ticket ${newTicket.id} for ${email}`);


    return NextResponse.json({
        status: 'success',
        message: 'Ticket created successfully.',
        data: {
            ticketId: newTicket.id
        },
        error: null
    }, { headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await addLog('ERROR', `Failed to create ticket from ${origin}: ${errorMessage}`, { stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ status: 'error', message: 'Failed to create ticket', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
