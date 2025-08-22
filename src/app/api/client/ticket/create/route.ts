
import { NextResponse } from 'next/server';
import { createTicketFromWebhook } from '@/lib/data';
import type { ClientWebhookPayload } from '@/types';
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

    const email = getField(fields, 'email');
    const message = getField(fields, 'message');
    const createdAt = getField(fields, 'created_at');

    if (!email || !message || !createdAt) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: email, message, and created_at' }, { status: 400 });
    }

    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid HMAC signature' }, { status: 401 });
    }
    
    const imageUrl = getPublicUrl(files.image);

    const payload: ClientWebhookPayload = {
      email,
      message,
      created_at: parseInt(createdAt, 10),
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
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: 'Failed to create ticket', error: errorMessage }, { status: 500 });
  }
}
