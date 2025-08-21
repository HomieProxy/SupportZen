# SupportZen API Documentation

This document explains how to send data to the SupportZen application from an external client, such as a separate frontend application or a third-party service.

## External API: Client Webhook

The primary way to integrate with SupportZen from an external source is via the client webhook endpoint. This endpoint is designed to receive user information and support messages to either create a new support ticket or append information to an existing one.

### Endpoint

`POST /api/client-webhook`

### Request Body

The endpoint expects a `POST` request with a JSON body. The body must have a specific structure containing a `status` field and a `data` object.

-   **`status`** (string, required): Must always be the string `"success"`.
-   **`data`** (object, required): This object contains the actual payload. See the schema below for details.

### Payload Schema (`data` object)

The `data` object corresponds to the `ClientWebhookPayload` type in the application.

| Field           | Type                     | Required | Description                                                                                                   |
| --------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| `uuid`          | string                   | Yes      | A unique identifier for the user.                                                                             |
| `email`         | string                   | Yes      | The user's email address.                                                                                     |
| `message`       | string                   | Yes      | The content of the support message or chat.                                                                   |
| `created_at`    | number (Unix timestamp)  | Yes      | The timestamp when the user account was created.                                                              |
| `ticket_id`     | string                   | No       | If provided, the `message` will be appended to this existing ticket. If omitted, a new ticket will be created. |
| `image_url`     | string (URL)             | No       | An optional URL to an image to be attached to the message.                                                    |
| `last_login_at` | number (Unix timestamp)  | No       | The timestamp of the user's last login.                                                                       |
| `expired_at`    | number (Unix timestamp)  | No       | The timestamp when the user's plan expires.                                                                   |
| `plan_id`       | string or number         | No       | The identifier for the user's subscription plan.                                                              |
| `telegram_id`   | number                   | No       | The user's Telegram ID, if applicable.                                                                        |

### Example Request

Here is an example of a valid cURL request to create a new ticket:

```bash
curl -X POST \
  https://<YOUR_APP_URL>/api/client-webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "success",
    "data": {
        "uuid": "user-xyz-123",
        "email": "customer@example.com",
        "created_at": 1678886400,
        "message": "My account is locked and I cannot log in.",
        "plan_id": "premium-monthly",
        "image_url": "https://example.com/screenshot.png"
    }
}'
```

### Example: Appending to an Existing Ticket

To add a follow-up message to ticket `TKT-001`:

```bash
curl -X POST \
  https://<YOUR_APP_URL>/api/client-webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "success",
    "data": {
        "uuid": "user-1",
        "email": "alice.j@example.com",
        "created_at": 1678886400,
        "message": "I tried resetting my password but did not receive an email.",
        "ticket_id": "TKT-001"
    }
}'
```

### Success Response

If the request is successful, the API will respond with a `200 OK` status and a JSON object containing the ID of the created or updated ticket.

```json
{
  "message": "Webhook received successfully.",
  "ticketId": "TKT-005"
}
```

### Error Responses

-   **`400 Bad Request`**: This indicates an issue with the request payload, such as a missing required field or invalid JSON.
-   **`500 Internal Server Error`**: This indicates an unexpected error on the server while processing the request.

---

## Internal API: Server Actions

For communication *within* the SupportZen application (i.e., between its own frontend components and its backend logic), it uses **Next.js Server Actions** with **Genkit flows**. This approach allows client-side components to directly call server-side functions securely without needing traditional REST or GraphQL API endpoints. If you are extending the SupportZen application itself, you should use this method.
```