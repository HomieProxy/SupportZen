
'use server';
import crypto from 'crypto';
import { getAllowDomains as getConfiguredDomains, getClientApiSecretKey } from './config';

const getSharedSecret = async (): Promise<string> => {
    const secret = await getClientApiSecretKey();
    if (!secret || secret === 'default_insecure_secret_key_for_development_only') {
        console.error("SECURITY WARNING: Using default or missing CLIENT_API_SECRET_KEY. Please set a secure key in the dashboard settings.");
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
    return Promise.resolve();
}

/**
 * Validates an incoming request by comparing its HMAC signature with a newly generated one.
 * @param request The incoming Request object.
 * @param email The email of the user making the request.
 * @returns A boolean indicating if the request is authorized.
 */
export async function validateHmac(request: Request, email: string): Promise<boolean> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("Validation failed: Missing or malformed Authorization header.");
        return false;
    }
    
    const clientHmac = authHeader.split(' ')[1];
    if (!clientHmac) {
        console.error("Validation failed: Bearer token is empty.");
        return false;
    }

    // Re-create the HMAC on the server
    const secret = await getSharedSecret();
    const serverHmac = crypto.createHmac('sha256', secret).update(email).digest('hex');

    try {
        // Use timingSafeEqual to prevent timing attacks
        const clientBuffer = Buffer.from(clientHmac, 'hex');
        const serverBuffer = Buffer.from(serverHmac, 'hex');

        if (clientBuffer.length !== serverBuffer.length) {
            console.error("Validation failed: HMAC length mismatch.");
            return false;
        }

        return crypto.timingSafeEqual(clientBuffer, serverBuffer);
    } catch (e) {
        console.error("An error occurred during HMAC validation:", e);
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
        // This is a fallback for development. In production, this should be a hard failure.
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
