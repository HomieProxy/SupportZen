'use server';
import { NextResponse } from 'next/server';
import { createChatFromWebhook } from '@/lib/data';
import type { ClientWebhookPayload } from '@/types';

// This is a simplified secret key check. 
// In a real-world scenario, use a more secure method like rotating tokens and store the secret in an environment variable.
const validateApiKey = (request: Request): boolean => {
    const authHeader = request.headers.get('Authorization');
    const expectedApiKey = `Bearer ${process.env.CLIENT_API_SECRET || 'your-default-secret-key'}`;
    return authHeader === expectedApiKey;
}

export async function POST(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid API Key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload: ClientWebhookPayload = body.data;

    if (!payload || !payload.uuid || !payload.email || !payload.message) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields in data object' }, { status: 400 });
    }

    const newChat = createChatFromWebhook(payload);

    return NextResponse.json({
        status: 'success',
        message: 'Live chat session created successfully.',
        data: {
            chatId: newChat.id
        },
        error: null
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: 'Failed to create chat session', error: errorMessage }, { status: 500 });
  }
}
