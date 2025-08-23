
'use server';

import { NextResponse } from 'next/server';
import { getChatById } from '@/lib/data';
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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('Origin') || 'Unknown';
  const chatId = params.id;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  try {
    const isDomainAllowed = await validateDomain(request);
    if (!isDomainAllowed) {
        await addLog('ERROR', `Domain not allowed for viewing chat: ${origin}`);
        return NextResponse.json({ status: 'error', message: 'Forbidden: Invalid origin' }, { status: 403, headers: corsHeaders });
    }
    
    if (!email) {
        await addLog('WARN', `View chat request missing email parameter`, { chatId });
        return NextResponse.json({ status: 'error', message: 'Missing required query parameter: email' }, { status: 400, headers: corsHeaders });
    }

    const isAuthorized = await validateHmac(request, email);
    if (!isAuthorized) {
        await addLog('ERROR', `Invalid HMAC for view chat request from ${email}`, { chatId });
        return NextResponse.json({ status: 'error', message: 'Unauthorized: Invalid signature' }, { status: 401, headers: corsHeaders });
    }

    const chat = getChatById(chatId);
    if (!chat) {
        await addLog('WARN', `Chat session not found for id: ${chatId}`, { email });
        return NextResponse.json({ status: 'error', message: 'Chat session not found' }, { status: 404, headers: corsHeaders });
    }

    // Verify the email from the HMAC check matches the chat's owner
    if (chat.customer.email !== email) {
        await addLog('ERROR', `Authorization mismatch for chat ${chatId}. Request email: ${email}, Chat owner: ${chat.customer.email}`);
        return NextResponse.json({ status: 'error', message: 'Forbidden: You are not authorized to view this chat' }, { status: 403, headers: corsHeaders });
    }

    await addLog('INFO', `Successfully retrieved chat session ${chatId} for ${email}`);
    return NextResponse.json({
        status: 'success',
        message: 'Chat session retrieved successfully.',
        data: chat,
        error: null
    }, { headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await addLog('ERROR', `Failed to retrieve chat session ${chatId} from ${origin}: ${errorMessage}`, { stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ status: 'error', message: 'Failed to retrieve chat session', error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
