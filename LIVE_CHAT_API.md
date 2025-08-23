# Live Chat API Documentation

This document specifies the API for the stateful live chat service, designed to be implemented on the **SupportZen backend**. The client application will interact with these endpoints to provide real-time support to authenticated users.

## Authentication

All requests to the Live Chat API must be authenticated using a Bearer token sent in the `Authorization` header. This token is a pre-shared secret key that validates the client's request.

**Example Header:**
`Authorization: Bearer <YOUR_SHARED_SECRET_KEY>`

---

## Endpoints

All endpoints expect a `Content-Type` of `multipart/form-data`.

### 1. Create a New Live Chat Session

This endpoint initiates a new chat session. It should be called only when the user sends their first message in a new conversation.

-   **Endpoint:** `POST /api/client/live/create`
-   **Authentication:** Required (Bearer Token).

#### Request Form Data

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string | Yes | The user's email address. |
| `uuid` | string | Yes | The user's unique identifier (e.g., a database ID). Required for security. |
| `name` | string | No | The user's name or current plan name (e.g., "Basic Plan"). |
| `plan_id` | number | No | The user's current subscription plan ID. |
| `created_at` | number | Yes | The user's account creation timestamp. |
| `message` | string | Yes | The initial message content from the user. |
| `image` | file | No | An optional image file to be attached. |

#### Example Request (using `curl`)

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/live/create \
  -H 'Authorization: Bearer <YOUR_SHARED_SECRET_KEY>' \
  -F 'email=user@example.com' \
  -F 'uuid=user-db-id-12345' \
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
| `email` | string | Yes | The user's email, used for request validation. |
| `message` | string | Yes | The content of the chat message. |
| `image`| file | No | An optional image file to be attached. |

#### Example Request (using `curl`)

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/live/chat \
  -H 'Authorization: Bearer <YOUR_SHARED_SECRET_KEY>' \
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
