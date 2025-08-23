
'use server';

import { getAllowDomains, setAllowDomains, getClientApiSecretKey, setClientApiSecretKey } from '@/lib/config';
import { revalidatePath } from 'next/cache';

interface AppSettings {
    allowedDomains: string[];
    clientApiSecretKey: string;
}

export async function getSettings(): Promise<AppSettings> {
    const allowedDomains = await getAllowDomains();
    const clientApiSecretKey = await getClientApiSecretKey();
    return { allowedDomains, clientApiSecretKey };
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<{ success: boolean }> {
    if (settings.allowedDomains !== undefined) {
        await setAllowDomains(settings.allowedDomains);
    }
    if (settings.clientApiSecretKey !== undefined) {
        await setClientApiSecretKey(settings.clientApiSecretKey);
    }
    revalidatePath('/settings');
    return { success: true };
}
