# Ticket API Documentation

This document specifies the API for the ticket management service, designed to be implemented on the **SupportZen backend**. The client application will interact with these endpoints to create and update support tickets for authenticated users.

## Authentication

All requests to the Ticket API must be authenticated. The `Authorization` header must contain a Bearer token which is an HMAC-SHA256 hash.

The hash is generated from the user's `email` and a pre-shared secret key.

**Example Header:**
`Authorization: Bearer <HMAC_SHA256(email, YOUR_SHARED_SECRET_KEY)>`

---

## Endpoints


### 1. Create a New Support Ticket

This endpoint creates a new support ticket.

-   **Endpoint:** `POST /api/client/ticket/create`
-   **Method:** `POST`
-   **Content-Type:** `multipart/form-data`
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
-   **Method:** `POST`
-   **Content-Type:** `multipart/form-data`
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
---

### 3. List User's Tickets

This endpoint retrieves a list of all tickets for a specific user.

-   **Endpoint:** `GET /api/client/ticket/list`
-   **Method:** `GET`
-   **Authentication:** Required (Bearer Token).

#### Query Parameters
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string | Yes | The user's email address, used for HMAC generation and to look up tickets. |

#### Example Request (using `curl`)

```bash
curl -X GET \
  'https://support.msdnoff365.tk/api/client/ticket/list?email=user@example.com' \
  -H 'Authorization: Bearer <YOUR_GENERATED_HMAC_HASH>'
```

#### Success Response

A JSON array of ticket objects.

```json
{
  "status": "success",
  "message": "Tickets retrieved successfully.",
  "data": [
    {
      "id": "TKT-001",
      "subject": "My account is locked...",
      "status": "closed",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "lastUpdate": "2023-10-28T12:00:00.000Z"
    },
    {
      "id": "TKT-002",
      "subject": "Question about billing...",
      "status": "open",
      "createdAt": "2023-10-29T11:00:00.000Z",
      "lastUpdate": "2023-10-29T11:00:00.000Z"
    }
  ],
  "error": null
}
```

---

### 4. View a Single Ticket

This endpoint retrieves the full details and message history for a single ticket.

-   **Endpoint:** `GET /api/client/ticket/{id}`
-   **Method:** `GET`
-   **Authentication:** Required (Bearer Token).

#### Path Parameters
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | The ID of the ticket to retrieve. |

#### Query Parameters
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string | Yes | The user's email address. Required for HMAC validation to ensure the user is authorized to view this ticket. |

#### Example Request (using `curl`)
```bash
curl -X GET \
  'https://support.msdnoff365.tk/api/client/ticket/TKT-001?email=user@example.com' \
  -H 'Authorization: Bearer <YOUR_GENERATED_HMAC_HASH>'
```

#### Success Response

A full ticket object, including all messages.

```json
{
  "status": "success",
  "message": "Ticket retrieved successfully.",
  "data": {
    "id": "TKT-001",
    "subject": "My account is locked and I cannot log in.",
    "customer": {
      "name": "John Doe",
      "email": "user@example.com"
    },
    "status": "closed",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "lastUpdate": "2023-10-28T12:00:00.000Z",
    "messages": [
      {
        "id": "msg-abc-123",
        "sender": "customer",
        "content": "My account is locked and I cannot log in.",
        "timestamp": "2023-10-27T10:00:00.000Z"
      },
      {
        "id": "msg-xyz-789",
        "sender": "agent",
        "content": "I have reset your password. Please check your email.",
        "timestamp": "2023-10-28T12:00:00.000Z"
      }
    ]
  },
  "error": null
}
```
