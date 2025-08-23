
'use server';

import { getAllowDomains, setAllowDomains } from '@/lib/config';
import { revalidatePath } from 'next/cache';

interface AppSettings {
    allowedDomains: string[];
}

export async function getSettings(): Promise<AppSettings> {
    const allowedDomains = await getAllowDomains();
    return { allowedDomains };
}

export async function updateSettings(settings: AppSettings): Promise<{ success: boolean }> {
    await setAllowDomains(settings.allowedDomains);
    revalidatePath('/settings');
    return { success: true };
}
