
'use server';

import { getTickets } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const tickets = getTickets();
        return NextResponse.json(tickets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}
