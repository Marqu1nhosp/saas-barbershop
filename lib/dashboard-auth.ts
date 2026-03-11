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
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DashboardUserPayload;
        return decoded;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return null;
    }
}

export function extractDashboardToken(authHeader?: string, cookies?: string): string | undefined {
    // Tentar extrair do header Authorization (Bearer token)
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    // Tentar extrair do cookie
    if (cookies) {
        const match = cookies.match(/(?:^|;\s*)token=([^;]*)/);
        if (match) {
            return match[1];
        }
    }

    return undefined;
}
