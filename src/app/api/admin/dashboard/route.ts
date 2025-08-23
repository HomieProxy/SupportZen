
'use server';

import { NextResponse } from 'next/server';
import { 
    getTickets, 
    getOpenTickets, 
    getChatSessions, 
    getActiveChats,
    getLogsCount 
} from '@/lib/data';

export async function GET(request: Request) {
    try {
        const allTickets = getTickets();
        const openTickets = getOpenTickets();
        const allChats = getChatSessions();
        const activeChats = getActiveChats();
        const logCount = await getLogsCount();

        const recentOpenTickets = openTickets.slice(0, 5);

        const data = {
            totalTickets: allTickets.length,
            openTicketsCount: openTickets.length,
            totalChats: allChats.length,
            activeChatsCount: activeChats.length,
            logCount,
            recentOpenTickets,
            activeChats,
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
    }
}
