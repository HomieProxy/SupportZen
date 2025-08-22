'use server';
import { NextResponse } from 'next/server';
import { createChatFromWebhook } from '@/lib/data';
import type { ClientWebhookPayload } from '@/types';

export async function POST(request: Request) {
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
