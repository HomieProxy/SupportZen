# SupportZen API Documentation

This document explains how to send data to the SupportZen application from an external client, such as a separate frontend application or a third-party service.

## External API: Client Webhook

The primary way to integrate with SupportZen from an external source is via the client webhook endpoint. This endpoint is designed to receive user information and support messages to either create a new support ticket, append information to an existing ticket, or initiate a new live chat session.

### Endpoint

`POST /api/client-webhook`

### How it Works

-   **If a `ticket_id` is provided** in the payload, the `message` will be appended to that existing support ticket.
-   **If no `ticket_id` is provided**, a new **live chat session** will be created and will appear in the "Active Conversations" list in the SupportZen dashboard. This is the primary way to initiate a chat.

### Request Body

The endpoint expects a `POST` request with a JSON body. The body must contain a single top-level `data` object, which holds the actual payload.

### Payload Schema (`data` object)

The `data` object corresponds to the `ClientWebhookPayload` type in the application.

| Field           | Type                     | Required | Description                                                                                                   |
| --------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| `uuid`          | string                   | Yes      | A unique identifier for the user.                                                                             |
| `email`         | string                   | Yes      | The user's email address.                                                                                     |
| `message`       | string                   | Yes      | The content of the support message or chat.                                                                   |
| `created_at`    | number (Unix timestamp)  | Yes      | The timestamp when the user account was created.                                                              |
| `ticket_id`     | string                   | No       | If provided, the `message` will be appended to this existing ticket. If omitted, a new chat session is created. |
| `image_url`     | string (URL)             | No       | An optional URL to an image to be attached to the message.                                                    |
| `last_login_at` | number (Unix timestamp)  | No       | The timestamp of the user's last login.                                                                       |
| `expired_at`    | number (Unix timestamp)  | No       | The timestamp when the user's plan expires.                                                                   |
| `plan_id`       | string or number         | No       | The identifier for the user's subscription plan.                                                              |
| `telegram_id`   | number                   | No       | The user's Telegram ID, if applicable.                                                                        |

---

### Example: Initiating a Live Chat

To start a new live chat session, send the initial message without a `ticket_id`.

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client-webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
        "uuid": "user-abc-456",
        "email": "new.user@example.com",
        "created_at": 1679123400,
        "message": "Hi, I have a quick question about my subscription."
    }
}'
```

**Success Response (Live Chat):**

```json
{
  "status": "success",
  "message": "Chat session created successfully.",
  "data": {
    "chatId": "chat-1"
  },
  "error": null
}
```

### Example: Appending to an Existing Ticket

To add a follow-up message to ticket `TKT-001`, your client would include the `ticket_id`.

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client-webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
        "uuid": "user-1",
        "email": "alice.j@example.com",
        "created_at": 1678886400,
        "message": "I tried resetting my password but did not receive an email.",
        "ticket_id": "TKT-001"
    }
}'
```

**Success Response (Ticket):**

```json
{
  "status": "success",
  "message": "Ticket updated successfully.",
  "data": {
    "ticketId": "TKT-001"
  },
  "error": null
}
```

### Note on Real-Time Communication

This webhook endpoint is for *initiating* chats and sending messages. For the client to receive replies from the agent in real-time, it would need to periodically poll for updates on a given `chatId` or `ticketId` (by calling a GET endpoint that would need to be created) or establish a WebSocket connection. The current application architecture does not include a WebSocket server.

### Error Responses

-   **`400 Bad Request`**: This indicates an issue with the request payload, such as a missing required field or invalid JSON. The response body will contain details about the error.
-   **`500 Internal Server Error`**: This indicates an unexpected error on the server while processing the request.
