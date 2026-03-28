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
        console.log('[useSyncDashboardSession] Hook triggered, checking session:', { 
            hasSession: !!session?.user,
            userEmail: session?.user?.email
        });

        // Verificar se existe um token do dashboard (indica que o usuário está logado no dashboard)
        const dashboardToken = localStorage.getItem('dashboard_auth_token');
        const dashboardUserJson = localStorage.getItem('dashboard_auth_user');

        console.log('[useSyncDashboardSession] Stored dashboard session:', { 
            hasDashboardToken: !!dashboardToken,
            hasDashboardUser: !!dashboardUserJson
        });

        if (session?.user) {
            const sessionUser = session.user as SessionUser;
            
            // ❌ NÃO sincronizar se dashboard está logado
            // Se há um dashboard token, significa que há um usuário de dashboard logado
            // Neste caso, NUNCA sincronizar com better-auth
            if (dashboardToken && dashboardUserJson) {
                try {
                    const parsedUser = JSON.parse(dashboardUserJson);
                    const dashboardRole = parsedUser.role;
                    console.log('[useSyncDashboardSession] ✅ Dashboard user already logged in (role:', dashboardRole + '), skipping better-auth sync');
                    return;
                } catch (err) {
                    console.error('[useSyncDashboardSession] Erro ao fazer parse do dashboard user:', err);
                }
            }

            // Caso contrário, sincronizar a sessão do SaaS (cliente)
            const sessionData = session as SessionData;
            const saasUser = {
                id: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
                role: sessionUser.role || 'CLIENT',
                barbershopId: sessionUser.barbershopId || null,
            };

            console.log('[useSyncDashboardSession] Syncing SaaS user to dashboard session:', saasUser);

            // Usar um token dummy já que o better-auth gerencia a sessão
            const token = sessionData.token || 'better-auth-token';

            saveDashboardSession(saasUser, token);

            // Também sincronizar barbershopId se disponível
            if (saasUser.barbershopId) {
                localStorage.setItem('barbershopId', saasUser.barbershopId);
            }
        } else {
            console.log('[useSyncDashboardSession] No better-auth session found, skipping sync');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user]);
}
