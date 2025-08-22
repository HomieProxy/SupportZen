'use server';
import { NextResponse } from 'next/server';
import { addMessageToChat, getChatById } from '@/lib/data';
import { validateHmac } from '@/lib/auth';


interface LiveChatPayload {
    chat_id: string;
    message: string;
    image_url?: string;
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload: LiveChatPayload = body.data;

    if (!payload || !payload.chat_id || !payload.message) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: chat_id and message' }, { status: 400 });
    }
    
    const chat = getChatById(payload.chat_id);
    if (!chat) {
        return NextResponse.json({ status: 'error', message: 'Chat session not found' }, { status: 404 });
    }

    const isAuthorized = await validateHmac(request, chat.customer.email);
    if (!isAuthorized) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid HMAC signature' }, { status: 401 });
    }

    const message = {
        id: `msg-${Date.now()}`,
        sender: 'customer' as const,
        content: payload.message,
        timestamp: new Date().toISOString(),
        ...(payload.image_url && { attachment: { type: 'image' as const, url: payload.image_url }})
    };

    addMessageToChat(payload.chat_id, message);

    return NextResponse.json({
        status: 'success',
        message: 'Message sent successfully.',
        data: {
            chatId: payload.chat_id,
            messageId: message.id
        },
        error: null
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: 'Failed to send message', error: errorMessage }, { status: 500 });
  }
}
