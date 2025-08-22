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

// This function is no longer HMAC-based but a simple bearer token check.
// I'm renaming it for clarity, but keeping the `validateHmac` name in the API routes
// to minimize breaking changes during this refactor.
export async function validateHmac(request: Request, email: string): Promise<boolean> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const clientKey = authHeader.split(' ')[1];
    if (!clientKey) {
        return false;
    }
    
    const serverKey = getSharedSecret();

    // Use crypto.timingSafeEqual to prevent timing attacks
    try {
        return crypto.timingSafeEqual(Buffer.from(clientKey), Buffer.from(serverKey));
    } catch {
        // This will catch errors if the buffer lengths are different, which is expected
        // for non-matching keys.
        return false;
    }
};
