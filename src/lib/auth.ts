
'use server';
import crypto from 'crypto';
import { getAllowDomains as getConfiguredDomains } from './config';
import { getUserByEmail } from './data';

// This is a stand-in for a secure way to get a shared secret.
// In a real application, this should come from a secure source like environment variables.
const getSharedSecret = () => {
    const secret = process.env.CLIENT_API_SECRET_KEY;
    if (!secret) {
        // For development, we can use a default, but this is not secure for production.
        console.warn("CLIENT_API_SECRET_KEY is not set. Using a default, insecure key for legacy functions if needed.");
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

/**
 * Validates that an incoming request is from a legitimate client by checking
 * the provided Bearer token against the token stored for that user.
 * @param request The incoming Request object.
 * @param email The email of the user making the request.
 * @returns A boolean indicating if the request is authorized.
 */
export async function validateClientRequest(request: Request, email: string): Promise<boolean> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("Validation failed: Missing or malformed Authorization header.");
        return false;
    }
    
    const clientToken = authHeader.split(' ')[1];
    if (!clientToken) {
        console.error("Validation failed: Bearer token is empty.");
        return false;
    }
    
    const user = getUserByEmail(email);
    if (!user || !user.auth_token) {
        console.error(`Validation failed: No user or stored token found for email: ${email}`);
        return false;
    }

    const serverToken = user.auth_token;

    try {
        const clientBuffer = Buffer.from(clientToken, 'utf-8');
        const serverBuffer = Buffer.from(serverToken, 'utf-8');

        if (clientBuffer.length !== serverBuffer.length) {
            console.error("Validation failed: Token length mismatch.");
            return false;
        }

        return crypto.timingSafeEqual(clientBuffer, serverBuffer);
    } catch (e) {
        console.error("An error occurred during token validation:", e);
        return false;
    }
};

/**
 * Retrieves the list of allowed domains from the config file.
 * @returns A promise that resolves to an array of allowed domain strings.
 */
export async function getAllowDomains(): Promise<string[]> {
    return await getConfiguredDomains();
}

/**
 * Validates that the request's origin domain is in the allowed list.
 * @param request The incoming Request object.
 * @returns A boolean indicating if the origin is allowed.
 */
export async function validateDomain(request: Request): Promise<boolean> {
    const origin = request.headers.get('Origin');
    const allowedDomains = await getAllowDomains();

    if (allowedDomains.length === 0) {
        console.warn("No allowed domains configured. Allowing all domains for development, but this is insecure for production.");
        return true;
    }

    if (!origin) {
        console.warn("Validation failed: Request is missing 'Origin' header. Blocking request.");
        return false;
    }

    const requestHost = new URL(origin).hostname;

    for (const pattern of allowedDomains) {
        if (pattern.startsWith('*.')) {
            const baseDomain = pattern.substring(2);
            if (requestHost.endsWith(`.${baseDomain}`) || requestHost === baseDomain) {
                return true;
            }
        } else if (pattern === requestHost) {
            return true;
        }
    }

    console.error(`Validation failed: Origin '${origin}' is not in the allowed list.`);
    return false;
}
