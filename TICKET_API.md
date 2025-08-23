# Ticket API Documentation

This document specifies the API for the ticket management service, designed to be implemented on the **SupportZen backend**. The client application will interact with these endpoints to create and update support tickets for authenticated users.

## Authentication

All requests to the Ticket API must be authenticated. The `Authorization` header must contain a Bearer token which is an HMAC-SHA256 hash.

The hash is generated from the user's `email` and a pre-shared secret key.

**Example Header:**
`Authorization: Bearer <HMAC_SHA256(email, YOUR_SHARED_SECRET_KEY)>`

---

## Endpoints

All endpoints expect a `Content-Type` of `multipart/form-data`.

### 1. Create a New Support Ticket

This endpoint creates a new support ticket.

-   **Endpoint:** `POST /api/client/ticket/create`
-   **Authentication:** Required (Bearer Token).

#### Request Form Data
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string | Yes | The user's email address. Used for HMAC generation. |
| `name` | string | No | The user's name or current plan name (e.g., "Basic Plan"). |
| `plan_id` | number | No | The user's current subscription plan ID. |
| `created_at` | number | Yes | The user's account creation timestamp. |
| `message` | string | Yes | The initial message/subject of the ticket. |
| `image` | file | No | An optional image file to be attached. |

#### Example Request (using `curl`)

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/ticket/create \
  -H 'Authorization: Bearer <YOUR_GENERATED_HMAC_HASH>' \
  -F 'email=user@example.com' \
  -F 'name=Premium Plan' \
  -F 'plan_id=5' \
  -F 'created_at=1679223400' \
  -F 'message=My account is locked and I cannot log in.' \
  -F 'image=@/path/to/your/screenshot.png'
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

### 2. Append a Message to a Ticket

This endpoint adds a new message from the customer to an existing ticket.

-   **Endpoint:** `POST /api/client/ticket/append`
-   **Authentication:** Required (Bearer Token).

#### Request Form Data

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `ticket_id` | string | Yes | The ID of the ticket to append the message to. |
| `email` | string | Yes | The user's email, used for request validation and HMAC generation. |
| `message` | string | Yes | The content of the message. |
| `image`| file | No | An optional image file to be attached. |

#### Example Request (using `curl`)

```bash
curl -X POST \
  https://support.msdnoff365.tk/api/client/ticket/append \
  -H 'Authorization: Bearer <YOUR_GENERATED_HMAC_HASH>' \
  -F 'ticket_id=TKT-001' \
  -F 'email=user@example.com' \
  -F 'message=I\'ve tried resetting my password, but it didn\'t work.' \
  -F 'image=@/path/to/another/screenshot.png'
```

#### Success Response

```json
{
  "status": "success",
  "message": "Message appended to ticket successfully.",
  "data": {
    "ticketId": "TKT-001",
    "messageId": "msg-def-789"
  },
  "error": null
}
```
