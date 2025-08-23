
'use server';

import { getLogs as apiGetLogs, clearLogs as apiClearLogs, LogEntry } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
    try {
        const logs = await apiGetLogs();
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
     try {
        await apiClearLogs();
        revalidatePath('/logs');
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
    }
}
