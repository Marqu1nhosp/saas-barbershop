'use client';

import { useLayoutEffect } from 'react';

import { authClient } from './auth-client';
import { saveDashboardSession } from './use-dashboard-session';

interface SessionUser extends Record<string, unknown> {
    id: string;
    name?: string;
    email: string;
    role?: string;
    barbershopId?: string;
}

interface SessionData extends Record<string, unknown> {
    user?: SessionUser;
    token?: string;
}

export function useSyncDashboardSession() {
    const { data: session } = authClient.useSession();

    useLayoutEffect(() => {
        if (session?.user) {
            // Sincronizar usuário com localStorage
            const sessionUser = session.user as SessionUser;
            const sessionData = session as SessionData;
            const dashboardUser = {
                id: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
                role: sessionUser.role || 'CLIENT',
                barbershopId: sessionUser.barbershopId || null,
            };

            // Usar um token dummy já que o better-auth gerencia a sessão
            const token = sessionData.token || 'better-auth-token';

            saveDashboardSession(dashboardUser, token);

            // Também sincronizar barbershopId se disponível
            if (dashboardUser.barbershopId) {
                localStorage.setItem('barbershopId', dashboardUser.barbershopId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user]);
}
