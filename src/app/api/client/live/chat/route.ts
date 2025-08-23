
import { NextResponse } from 'next/server';
import { addMessageToChat, getChatById, getUserByEmail } from '@/lib/data';
import { validateDomain, validateHmac } from '@/lib/auth';
import { parseMultipartFormData } from '@/lib/api-helpers';
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
      await addLog('ERROR', `Domain not allowed: ${origin}`);
      return NextResponse.json({ status: 'error', message: 'Forbidden: Invalid origin' }, { status: 403, headers: corsHeaders });
    }

    const { fields, files } = await parseMultipartFormData(request);

    const chatId = fields.chat_id;
    const messageContent = fields.message;
    const email = fields.email;

    await addLog('INFO', `Received chat message request for chat ${chatId} from ${email}`, { fields });

    if (!chatId || !messageContent || !email) {
      await addLog('WARN', 'Chat message request missing required fields', { chatId, email, hasMessage: !!messageContent });
      return NextResponse.json({ status: 'error', message: 'Missing required fields: chat_id, message, and email' }, { status: 400, headers: corsHeaders });
    }
    
    const chat = getChatById(chatId);
    if (!chat) {
        await addLog('WARN', `Chat session not found for id: ${chatId}`);
        return NextResponse.json({ status: 'error', message: 'Chat session not found' }, { status: 404, headers: corsHeaders });
    }

    if (chat.customer.email !== email) {
        await addLog('ERROR', `Email mismatch for chat ${chatId}. Request email: ${email}, Chat owner: ${chat.customer.email}`);
        return NextResponse.json({ status: 'error', message: 'Email does not match chat owner' }, { status: 403, headers: corsHeaders });
    }
    
    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        await addLog('ERROR', `Invalid HMAC for chat message from ${email}`);
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid signature' }, { status: 401, headers: corsHeaders });
    }

    const imageUrl = files.image ? `/uploads/${files.image.filename}` : undefined;

    const message = {
        id: `msg-${Date.now()}`,
        sender: 'customer' as const,
        content: messageContent,
        timestamp: new Date().toISOString(),
        ...(imageUrl && { attachment: { type: 'image' as const, url: imageUrl }})
    };

    addMessageToChat(chatId, message);
    await addLog('INFO', `Successfully added message to chat ${chatId}`);

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
    await addLog('ERROR', `Failed to process chat message from ${origin}: ${errorMessage}`, { stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ status: 'error', message: 'Failed to send message', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
