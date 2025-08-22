
import { NextResponse } from 'next/server';
import { createOrUpdateTicketFromWebhook, createChatFromWebhook } from '@/lib/data';
import { ClientWebhookPayload } from '@/types';

/**
 * @swagger
 * /api/client-webhook:
 *   post:
 *     summary: Create/update a ticket or initiate a live chat session.
 *     description: This endpoint receives data from an external client. If a `ticket_id` is provided, it appends the message to the existing ticket. If no `ticket_id` is provided, it creates a new live chat session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
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
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Webhook received successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                      ticketId:
 *                          type: string
 *                          example: TKT-005
 *                      chatId:
 *                          type: string
 *                          example: chat-1
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
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

    if (!body.data) {
      return NextResponse.json({ status: 'error', message: 'Invalid payload structure, missing "data" object.', data: null, error: 'Invalid payload structure' }, { status: 400 });
    }

    const payload: ClientWebhookPayload = body.data;

    if (!payload.uuid || !payload.email || !payload.message) {
        return NextResponse.json({ status: 'error', message: 'Missing required fields (uuid, email, message) in data object', data: null, error: 'Missing required fields' }, { status: 400 });
    }

    let result;
    let message;

    // If a ticket_id is provided, update the ticket.
    // Otherwise, create a new chat session.
    if (payload.ticket_id) {
        result = createOrUpdateTicketFromWebhook(payload);
        message = 'Ticket updated successfully.';
        return NextResponse.json({
            status: 'success',
            message: message,
            data: {
                ticketId: result.id
            },
            error: null
        });
    } else {
        result = createChatFromWebhook(payload);
        message = 'Chat session created successfully.';
        return NextResponse.json({
            status: 'success',
            message: message,
            data: {
                chatId: result.id
            },
            error: null
        });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook processing error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to process webhook', data: null, error: errorMessage }, { status: 500 });
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
 *           description: Optional. If provided, the message will be appended to this existing ticket. If omitted, a new chat session will be created.
 *           example: 'TKT-001'
 */
