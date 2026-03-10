import jwt from 'jsonwebtoken';

export interface DashboardUserPayload {
    id: string;
    email: string;
    role: string;
    barbershopId: string | null;
    iat: number;
    exp: number;
}

export function parseDashboardToken(token?: string): DashboardUserPayload | null {
    if (!token) {
        console.log('[parseDashboardToken] No token provided');
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DashboardUserPayload;
        console.log('[parseDashboardToken] Token decoded successfully:', {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            barbershopId: decoded.barbershopId
        });
        return decoded;
    } catch (error) {
        console.error('[parseDashboardToken] Error decoding token:', error instanceof Error ? error.message : String(error));
        return null;
    }
}

export function extractDashboardToken(authHeader?: string, cookies?: string): string | undefined {
    // Tentar extrair do header Authorization (Bearer token)
    if (authHeader?.startsWith('Bearer ')) {
        console.log('[extractDashboardToken] Found token in Authorization header');
        return authHeader.slice(7);
    }

    // Tentar extrair do cookie
    if (cookies) {
        console.log('[extractDashboardToken] Cookies:', cookies);
        const match = cookies.match(/(?:^|;\s*)token=([^;]*)/);
        if (match) {
            console.log('[extractDashboardToken] Found token in cookies');
            return match[1];
        }
    }

    console.log('[extractDashboardToken] No token found in headers or cookies');
    return undefined;
}
