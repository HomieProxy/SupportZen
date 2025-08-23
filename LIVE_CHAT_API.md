# Live Chat API Documentation

This document specifies the API for the stateful live chat service, designed to be implemented on the **SupportZen backend**. The client application will interact with these endpoints to provide real-time support to authenticated users.

## Authentication

All requests to the Live Chat API must be authenticated using an HMAC-based Bearer token. This ensures that requests are coming from a trusted client application.

The signature is an **HMAC-SHA256** hash generated from two components:
1. The user's `email` address.
2. The `CLIENT_API_SECRET_KEY` which is configured in your SupportZen dashboard settings and must be securely stored on your client application's server.

The client application must generate this hash for each request and include it in the `Authorization` header. The SupportZen server will perform the same calculation to verify the request's authenticity.

**Example Header:**
`Authorization: Bearer <HMAC_SHA256(email, YOUR_CLIENT_API_SECRET_KEY)>`

---

## Endpoints

All endpoints expect a `Content-Type` of `multipart/form-data` for `POST` requests.

### 1. Create a New Live Chat Session

This endpoint initiates a new chat session. It should be called only when the user sends their first message in a new conversation.

-   **Endpoint:** `POST /api/client/live/create`
-   **Authentication:** Required (Bearer Token).

#### Request Form Data

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string | Yes | The user's email address. **This is used to generate the HMAC signature.** |
| `name` | string | No | The user's name or current plan name (e.g., "Basic Plan"). |
| `plan_id` | number | No | The user's current subscription plan ID. |
| `created_at` | number | Yes | The user's account creation timestamp. |
| `message` | string | Yes | The initial message content from the user. |
| `image` | file | No | An optional image file to be attached. |

#### Example Request (using `curl`)

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/live/create \
  -H 'Authorization: Bearer <YOUR_GENERATED_HMAC_HASH>' \
  -F 'email=user@example.com' \
  -F 'name=Premium Plan' \
  -F 'plan_id=5' \
  -F 'created_at=1679223400' \
  -F 'message=Hi, I have a quick question!' \
  -F 'image=@/path/to/your/image.jpg'
```

#### Success Response

```json
{
  "status": "success",
  "message": "Live chat session created successfully.",
  "data": {
    "chatId": "chat-session-xyz-123"
  },
  "error": null
}
```

---

### 2. Send a Message to an Existing Chat

This endpoint is used to send all subsequent messages after a chat session has been created.

-   **Endpoint:** `POST /api/client/live/chat`
-   **Authentication:** Required (Bearer Token).

#### Request Form Data

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `chat_id` | string | Yes | The ID of the active chat session (obtained from the `/create` endpoint). |
| `email` | string | Yes | The user's email, used for HMAC signature generation and validation. |
| `message` | string | Yes | The content of the chat message. |
| `image`| file | No | An optional image file to be attached. |

#### Example Request (using `curl`)

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/live/chat \
  -H 'Authorization: Bearer <YOUR_GENERATED_HMAC_HASH>' \
  -F 'chat_id=chat-session-xyz-123' \
  -F 'email=user@example.com' \
  -F 'message=Where can I find my subscription URL?' \
  -F 'image=@/path/to/another/image.png'
```

#### Success Response

```json
{
  "status": "success",
  "message": "Message sent successfully.",
  "data": {
    "chatId": "chat-session-xyz-123",
    "messageId": "msg-abc-456"
  },
  "error": null
}
```

---

### 3. View a Live Chat Session

This endpoint retrieves the full details and message history for a single chat session. This is useful for resuming a chat if the user refreshes their page.

-   **Endpoint:** `GET /api/client/live/chat/{id}`
-   **Method:** `GET`
-   **Authentication:** Required (Bearer Token).

#### Path Parameters
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | The ID of the chat session to retrieve. |

#### Query Parameters
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string | Yes | The user's email address. Required for HMAC validation to ensure the user is authorized to view this chat. |

#### Example Request (using `curl`)
```bash
curl -X GET \
  'https://support.msdnoff365.tk/api/client/live/chat/chat-session-xyz-123?email=user@example.com' \
  -H 'Authorization: Bearer <YOUR_GENERATED_HMAC_HASH>'
```

#### Success Response

A full chat session object, including all messages.

```json
{
  "status": "success",
  "message": "Chat session retrieved successfully.",
  "data": {
    "id": "chat-session-xyz-123",
    "customer": {
        "name": "John Doe",
        "email": "user@example.com",
        "auth_token": "...",
        "avatarUrl": "...",
        "planId": "Premium Plan",
        "expiredAt": "2025-01-01",
        "createdAt": "..."
    },
    "status": "active",
    "messages": [
      {
        "id": "msg-abc-123",
        "sender": "customer",
        "content": "Hi, I have a quick question!",
        "timestamp": "2023-10-27T10:00:00.000Z"
      },
      {
        "id": "msg-xyz-789",
        "sender": "agent",
        "content": "Of course, how can I help?",
        "timestamp": "2023-10-27T10:01:00.000Z"
      }
    ]
  },
  "error": null
}
```
