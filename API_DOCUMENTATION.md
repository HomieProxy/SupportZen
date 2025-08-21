# SupportZen API Documentation

This document explains how the SupportZen application sends and receives data between the client (the user's browser) and the server.

## Overview

The application uses **Next.js Server Actions** with **Genkit flows** to handle communication. This modern approach allows client-side components to directly call server-side functions as if they were local functions, without needing to manually set up traditional REST or GraphQL API endpoints.

### How it Works

1.  **Server-Side Functions (The "API")**:
    -   The core logic for handling data, especially AI-powered features, resides in files located in `src/ai/flows/`. These are called "Genkit flows".
    -   Each flow file starts with the `'use server';` directive. This tells Next.js that the functions exported from this file are Server Actions and can be securely called from client-side code.
    -   These functions define expected input and output data structures using the `zod` library for validation.
    -   They perform server-side tasks, such as calling the Gemini AI model.

2.  **Client-Side Components**:
    -   The user interface is built with React components located in `src/app/` and `src/components/`.
    -   When a client-side component needs to send data to the server or request data from it, it simply `imports` the required server function from a flow file and calls it using `async/await`.

## Example: Suggesting a Chat Response

Let's look at how the "AI Assist" feature in the chat window works.

1.  **Client-Side Call (`src/app/chat/page.tsx`)**
    -   The `ChatWindow` component imports the `suggestResponse` function:
        ```typescript
        import { suggestResponse } from '@/ai/flows/suggest-response';
        ```
    -   When the AI is enabled and a new customer message arrives, the `handleCustomerMessage` function is called. It gathers the conversation history and the new message, then calls the `suggestResponse` function with that data:
        ```typescript
        const result = await suggestResponse({
            customerMessage,
            conversationHistory
        });
        setSuggestedResponse(result.suggestedResponse);
        ```

2.  **Server-Side Execution (`src/ai/flows/suggest-response.ts`)**
    -   This file is marked with `'use server';`.
    -   It defines the `suggestResponseFlow` using Genkit, which is designed to take the `customerMessage` and `conversationHistory` as input.
    -   The flow sends this data to the AI model with a specific prompt, asking it to generate a helpful reply.
    -   The AI's generated response is then returned from the function.

    ```typescript
    // This is the Genkit flow definition
    const suggestResponseFlow = ai.defineFlow(
      {
        name: 'suggestResponseFlow',
        inputSchema: SuggestResponseInputSchema, // Validates the input data
        outputSchema: SuggestResponseOutputSchema, // Validates the output data
      },
      async input => {
        // Calls the AI model
        const {output} = await suggestResponsePrompt(input);
        return output!;
      }
    );
    ```

## Summary

| Topic           | How it's handled                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| **Sending Data**  | Client components call an imported server function with data as arguments (e.g., `suggestResponse({ ... })`). |
| **Receiving Data**| The `await` keyword pauses execution until the server function returns a response, which can then be used by the client. |
| **API Endpoints** | No explicit API endpoints (`/api/...`) are needed. Next.js handles the networking behind the scenes.      |

This architecture simplifies development by allowing a seamless connection between client and server code, making the application more efficient and easier to maintain.
