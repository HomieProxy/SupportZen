
'use server';

import { getLogs as apiGetLogs, clearLogs as apiClearLogs, LogEntry, getLogsCount } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

export async function getLogs(): Promise<LogEntry[]> {
    return await apiGetLogs();
}

export async function clearLogs(): Promise<{ success: boolean }> {
    await apiClearLogs();
    revalidatePath('/logs');
    return { success: true };
}
