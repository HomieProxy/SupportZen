
import { NextResponse } from 'next/server';
import { addMessageToChat, getChatById } from '@/lib/data';
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

    const chatId = getField(fields, 'chat_id');
    const messageContent = getField(fields, 'message');
    const email = getField(fields, 'email');

    if (!chatId || !messageContent || !email) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: chat_id, message, and email' }, { status: 400 });
    }
    
    const chat = getChatById(chatId);
    if (!chat) {
        return NextResponse.json({ status: 'error', message: 'Chat session not found' }, { status: 404 });
    }

    // Ensure the email from the form matches the chat owner for auth
    if (chat.customer.email !== email) {
         return NextResponse.json({ status: 'error', message: 'Email does not match chat owner' }, { status: 403 });
    }

    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid HMAC signature' }, { status: 401 });
    }

    const imageUrl = getPublicUrl(files.image);

    const message = {
        id: `msg-${Date.now()}`,
        sender: 'customer' as const,
        content: messageContent,
        timestamp: new Date().toISOString(),
        ...(imageUrl && { attachment: { type: 'image' as const, url: imageUrl }})
    };

    addMessageToChat(chatId, message);

    return NextResponse.json({
        status: 'success',
        message: 'Message sent successfully.',
        data: {
            chatId: chatId,
            messageId: message.id
        },
        error: null
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: 'Failed to send message', error: errorMessage }, { status: 500 });
  }
}
