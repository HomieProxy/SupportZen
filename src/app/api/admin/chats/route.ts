
'use server';

import { getActiveChats } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const chats = getActiveChats();
        return NextResponse.json(chats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch active chats' }, { status: 500 });
    }
}
