# SupportZen Client API Documentation

This project contains two separate API documentation files:

-   [`LIVE_CHAT_API.md`](./LIVE_CHAT_API.md) - For real-time chat sessions.
-   [`TICKET_API.md`](./TICKET_API.md) - For creating and updating support tickets.

## Global Security Policies

All client API endpoints described in the documents below are protected by the following security policies, which are checked in order:

1.  **Domain Validation:** Every request must originate from a domain specified in the "Allowed Domains" list in your SupportZen dashboard settings. Requests from any other origin will be rejected.
2.  **HMAC Authentication:** Every request must include a valid HMAC-based Bearer token to verify the request's integrity and authenticity.

Please refer to the appropriate file for the specific endpoints you wish to use.
