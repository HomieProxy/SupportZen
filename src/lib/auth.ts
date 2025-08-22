'use server';
import { getUserByEmail } from './data';
import crypto from 'crypto';

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

export async function validateHmac(request: Request, email: string): Promise<boolean> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const clientHash = authHeader.split(' ')[1];
    if (!clientHash) {
        return false;
    }
    
    const user = getUserByEmail(email);
    // If the user doesn't exist, we can't verify the hash.
    // The request to /api/client/live/create will proceed to create a new user.
    if (!user) {
        // For new users, we can't validate, so we assume it's their first contact.
        // A more secure system might have a separate pre-registration step.
        return true; 
    }

    try {
        const secret = user.auth_token;
        const generatedHash = crypto.createHmac('sha256', secret).update(email).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(clientHash), Buffer.from(generatedHash));
    } catch (error) {
        console.error("HMAC validation error:", error);
        return false;
    }
};
