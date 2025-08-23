
'use server';
import { getUserByEmail } from './data';
import crypto from 'crypto';

// This is a stand-in for a secure way to get a shared secret.
// In a real application, this should come from a secure source like environment variables.
const getSharedSecret = () => {
    const secret = process.env.CLIENT_API_SECRET_KEY;
    if (!secret) {
        // For development, we can use a default, but this is not secure for production.
        console.warn("CLIENT_API_SECRET_KEY is not set. Using a default, insecure key.");
        return "default_insecure_secret_key_for_development_only";
    }
    return secret;
}

export async function login(email: string, password: string) {
    try {
        const response = await fetch("https://myboard.316293.xyz/api/v1/passport/auth/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.status !== 200 || result.status !== 'success') {
            throw new Error(result.message || 'Invalid email or password.');
        }

        if (result.data.is_admin !== true) {
            throw new Error('Access denied. This application is for administrators only.');
        }
        
        // This is a client-side only operation for now.
        if (typeof window !== 'undefined') {
            localStorage.setItem('gemini_api_key', result.data.gemini_api_key);
        }

        return {
            email: email,
            token: result.data.token,
            auth_data: result.data.auth_data,
        };

    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred during login.");
    }
}

export async function logout() {
    // This function can be expanded to call a logout endpoint if one exists
    // For now, it's a placeholder as the client handles state removal
    return Promise.resolve();
}

// This function validates that the incoming request is from an authorized client
// by checking a shared secret passed as a Bearer token.
export async function validateHmac(request: Request, email: string): Promise<boolean> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("Validation failed: Missing or malformed Authorization header.");
        return false;
    }
    
    const clientKey = authHeader.split(' ')[1];
    if (!clientKey) {
        console.error("Validation failed: Bearer token is empty.");
        return false;
    }
    
    const serverKey = getSharedSecret();

    // Use crypto.timingSafeEqual to prevent timing attacks.
    // Both buffers must be of the same length for this to work.
    try {
        const clientBuffer = Buffer.from(clientKey, 'utf-8');
        const serverBuffer = Buffer.from(serverKey, 'utf-8');

        if (clientBuffer.length !== serverBuffer.length) {
            console.error("Validation failed: Token length mismatch.");
            return false;
        }

        return crypto.timingSafeEqual(clientBuffer, serverBuffer);
    } catch (e) {
        console.error("An error occurred during token validation:", e);
        // This will catch errors if the buffers are invalid for some reason.
        return false;
    }
};
