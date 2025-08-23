
import { NextResponse } from 'next/server';
import { addMessageToChat, getChatById } from '@/lib/data';
import { validateDomain, validateHmac } from '@/lib/auth';
import { parseForm, getPublicUrl, getField } from '@/lib/api-helpers';

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

    const chatId = getField(fields, 'chat_id');
    const messageContent = getField(fields, 'message');
    const email = getField(fields, 'email');

    if (!chatId || !messageContent || !email) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields: chat_id, message, and email' }, { status: 400, headers: corsHeaders });
    }
    
    const chat = getChatById(chatId);
    if (!chat) {
        return NextResponse.json({ status: 'error', message: 'Chat session not found' }, { status: 404, headers: corsHeaders });
    }

    // Ensure the email from the form matches the chat owner for auth
    if (chat.customer.email !== email) {
         return NextResponse.json({ status: 'error', message: 'Email does not match chat owner' }, { status: 403, headers: corsHeaders });
    }
    
    // Now validate the HMAC signature
    const isAuthorized = await validateHmac(request, chat.customer.email, chat.customer.uuid);
    if (!isAuthorized) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid signature' }, { status: 401, headers: corsHeaders });
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
    }, { headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', message: 'Failed to send message', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
