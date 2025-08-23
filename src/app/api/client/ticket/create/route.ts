
import { NextResponse } from 'next/server';
import { createTicketFromWebhook } from '@/lib/data';
import type { ClientWebhookPayload } from '@/types';
import { parseForm, getPublicUrl, getField } from '@/lib/api-helpers';
import { validateDomain } from '@/lib/auth';

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

    const email = getField(fields, 'email');
    const message = getField(fields, 'message');
    const createdAt = getField(fields, 'created_at');

    if (!email || !message || !createdAt) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: email, message, and created_at' }, { status: 400, headers: corsHeaders });
    }

    const authToken = request.headers.get('Authorization')?.split(' ')[1];
    
    const imageUrl = getPublicUrl(files.image);

    const payload: ClientWebhookPayload = {
      email,
      message,
      created_at: parseInt(createdAt, 10),
      auth_token: authToken,
      name: getField(fields, 'name'),
      plan_id: getField(fields, 'plan_id'),
      expired_at: getField(fields, 'expired_at') ? parseInt(getField(fields, 'expired_at')!, 10) : undefined,
      image_url: imageUrl
    };

    const newTicket = createTicketFromWebhook(payload);

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
    return NextResponse.json({ status: 'error', message: 'Failed to create ticket', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
