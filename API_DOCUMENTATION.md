# SupportZen API Documentation

This document explains how to send data to the SupportZen application from an external client, such as a separate frontend application or a third-party service. The API is divided into two main categories: **Tickets** and **Live Chat**.

All requests must have a `Content-Type: application/json` header and contain a JSON body with a single top-level `data` object, which holds the actual payload.

---

## 1. Tickets

Handles the creation and updating of asynchronous support tickets.

### Create a New Ticket

This endpoint creates a new support ticket.

-   **Endpoint:** `POST /api/client/ticket/create`

#### Request Payload (`data` object)

| Field         | Type     | Required | Description                                                |
| ------------- | -------- | -------- | ---------------------------------------------------------- |
| `uuid`        | string   | Yes      | A unique identifier for the user.                          |
| `email`       | string   | Yes      | The user's email address.                                  |
| `message`     | string   | Yes      | The initial content of the support message.                |
| `created_at`  | number   | Yes      | The Unix timestamp when the user account was created.      |
| `image_url`   | string   | No       | An optional URL to an image to be attached to the message. |
| `plan_id`     | string   | No       | The identifier for the user's subscription plan.           |
| `expired_at`  | number   | No       | The Unix timestamp when the user's plan expires.           |

#### Example Request

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/ticket/create \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
        "uuid": "user-abc-456",
        "email": "new.user@example.com",
        "created_at": 1679123400,
        "message": "I am having trouble with my recent invoice."
    }
}'
```

#### Success Response

```json
{
  "status": "success",
  "message": "Ticket created successfully.",
  "data": {
    "ticketId": "TKT-001"
  },
  "error": null
}
```

---

### Append a Message to a Ticket

This endpoint adds a follow-up message to an existing ticket.

-   **Endpoint:** `POST /api/client/ticket/append`

#### Request Payload (`data` object)

| Field       | Type   | Required | Description                                                |
| ----------- | ------ | -------- | ---------------------------------------------------------- |
| `ticket_id` | string | Yes      | The ID of the ticket to which the message should be added. |
| `message`   | string | Yes      | The content of the follow-up message.                      |
| `image_url` | string | No       | An optional URL to an image to be attached.                |

#### Example Request

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/ticket/append \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
        "ticket_id": "TKT-001",
        "message": "Here is the invoice number: #555-1234."
    }
}'
```

#### Success Response

```json
{
  "status": "success",
  "message": "Message appended to ticket successfully.",
  "data": {
    "ticketId": "TKT-001",
    "messageId": "msg-1689345678"
  },
  "error": null
}
```

---

## 2. Live Chat

Handles the creation and messaging for real-time chat sessions.

### Create a New Live Chat Session

This endpoint initiates a new live chat.

-   **Endpoint:** `POST /api/client/live/create`

#### Request Payload (`data` object)

The payload is identical to the "Create a New Ticket" endpoint.

#### Example Request

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/live/create \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
        "uuid": "user-def-789",
        "email": "chatty.user@example.com",
        "created_at": 1679223400,
        "message": "Hi, I have a quick question!"
    }
}'
```

#### Success Response

```json
{
  "status": "success",
  "message": "Live chat session created successfully.",
  "data": {
    "chatId": "chat-1"
  },
  "error": null
}
```

---

### Send a Message in a Live Chat

This endpoint sends a message to an active chat session.

-   **Endpoint:** `POST /api/client/live/chat`

#### Request Payload (`data` object)

| Field       | Type   | Required | Description                                          |
| ----------- | ------ | -------- | ---------------------------------------------------- |
| `chat_id`   | string | Yes      | The ID of the active chat session.                   |
| `message`   | string | Yes      | The content of the chat message.                     |
| `image_url` | string | No       | An optional URL to an image to be attached.          |

#### Example Request

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/live/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
        "chat_id": "chat-1",
        "message": "Can you tell me where to find my API keys?"
    }
}'
```

#### Success Response

```json
{
  "status": "success",
  "message": "Message sent successfully.",
  "data": {
    "chatId": "chat-1",
    "messageId": "msg-1689346789"
  },
  "error": null
}
```
