import { NextResponse } from 'next/server';
import { createOrUpdateTicketFromWebhook } from '@/lib/data';
import { ClientWebhookPayload } from '@/types';

/**
 * @swagger
 * /api/client-webhook:
 *   post:
 *     summary: Create or update a support ticket from a client webhook.
 *     description: This endpoint receives data from an external client to create a new support ticket or add a message to an existing one. It's the primary method for third-party integrations to feed data into SupportZen.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - data
 *             properties:
 *               status:
 *                 type: string
 *                 description: The status of the request, must be 'success'.
 *                 example: 'success'
 *               data:
 *                 $ref: '#/components/schemas/ClientWebhookPayload'
 *     responses:
 *       '200':
 *         description: Webhook received and processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Webhook received successfully.
 *                 ticketId:
 *                   type: string
 *                   example: TKT-005
 *       '400':
 *         description: Bad Request. The payload is invalid or missing required fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid payload structure
 *       '500':
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to process webhook
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation to check if the data key exists
    if (body.status !== 'success' || !body.data) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    const payload: ClientWebhookPayload = body.data;

    // Here you can add more robust validation of userData if needed
    if (!payload.uuid || !payload.email || !payload.message) {
        return NextResponse.json({ error: 'Missing required fields (uuid, email, message) in data object' }, { status: 400 });
    }

    // This function will create a new ticket or update an existing one
    const result = createOrUpdateTicketFromWebhook(payload);
    
    return NextResponse.json({ message: 'Webhook received successfully.', ticketId: result.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook', details: errorMessage }, { status: 500 });
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ClientWebhookPayload:
 *       type: object
 *       required:
 *         - uuid
 *         - email
 *         - created_at
 *         - message
 *       properties:
 *         uuid:
 *           type: string
 *           description: The unique identifier for the user.
 *           example: 'user-xyz-123'
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address.
 *           example: 'customer@example.com'
 *         last_login_at:
 *           type: integer
 *           format: int64
 *           description: Unix timestamp of the user's last login.
 *           nullable: true
 *         created_at:
 *           type: integer
 *           format: int64
 *           description: Unix timestamp when the user was created.
 *         expired_at:
 *           type: integer
 *           format: int64
 *           description: Unix timestamp of the user's plan expiration.
 *           nullable: true
 *         plan_id:
 *           type: string
 *           description: The user's current subscription plan ID.
 *           nullable: true
 *           example: 'premium-monthly'
 *         telegram_id:
 *           type: integer
 *           description: The user's Telegram ID.
 *           nullable: true
 *         message:
 *           type: string
 *           description: The content of the support message.
 *           example: 'My account is locked and I cannot log in.'
 *         image_url:
 *           type: string
 *           format: uri
 *           description: An optional URL to an image attached to the message.
 *           example: 'https://example.com/screenshot.png'
 *         ticket_id:
 *           type: string
 *           description: Optional. If provided, the message will be appended to this existing ticket. If omitted, a new ticket will be created.
 *           example: 'TKT-001'
 */
