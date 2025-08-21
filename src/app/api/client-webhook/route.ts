import { NextResponse } from 'next/server';
import { updateOrAddUser } from '@/lib/data';
import { ClientWebhookPayload } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation to check if the data key exists
    if (body.status !== 'success' || !body.data) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    const userData: ClientWebhookPayload = body.data;

    // Here you can add more robust validation of userData if needed
    if (!userData.uuid || !userData.email) {
        return NextResponse.json({ error: 'Missing required fields in data object' }, { status: 400 });
    }

    // This function will update an existing user or add a new one
    // In a real app, this would interact with your database.
    // For this demo, it updates the in-memory data array.
    updateOrAddUser(userData);
    
    return NextResponse.json({ message: 'User data received successfully.' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
