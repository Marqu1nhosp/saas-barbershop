'use client';

import { useEffect, useState } from 'react';

interface DashboardUser {
    id: string;
    name: string;
    email: string;
    role: string;
    barbershopId: string | null;
}

const DASHBOARD_USER_KEY = 'dashboard_auth_user';
const DASHBOARD_TOKEN_KEY = 'dashboard_auth_token';

export function useDashboardSession() {
    const [user, setUser] = useState<DashboardUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Log quando user ou isLoading mudam
    useEffect(() => {
        console.log('[useDashboardSession] user or isLoading changed:', { user, isLoading });
    }, [user, isLoading]);

    const loadUser = () => {
        try {
            const userJson = localStorage.getItem(DASHBOARD_USER_KEY);

            if (userJson) {
                const parsedUser = JSON.parse(userJson);
                setUser(parsedUser);
            } else {

                // Log all localStorage keys para debug
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.includes('dashboard') || key?.includes('auth') || key?.includes('barber')) {
                        console.log(`  - ${key}: ${localStorage.getItem(key)?.slice(0, 50)}...`);
                    }
                }
                setUser(null);
            }
        } catch (err) {
            console.error('[useDashboardSession] Erro ao fazer parse do usuário:', err);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Carregar do localStorage na montagem

        loadUser();

        // Ouvir mudanças no localStorage (tanto de outra aba quanto de outro componente)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === DASHBOARD_USER_KEY) {
                loadUser();
            }
        };

        // Também ouvir evento customizado para mudanças nesta aba
        const handleDashboardSessionUpdate = () => {
            loadUser();
        };


        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('dashboard-session-updated', handleDashboardSessionUpdate);

        // IMPORTANTE: Também fazer um "check" curto depois para garantir que localStorage foi sincronizado
        // Isso resolve problemas de timing com o evento
        const timeoutId = setTimeout(() => {
            const currentUserJson = localStorage.getItem(DASHBOARD_USER_KEY);
            if (currentUserJson && !user) {
                loadUser();
            }
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('dashboard-session-updated', handleDashboardSessionUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { user, isLoading };
}

export function saveDashboardSession(user: DashboardUser, token: string) {
    localStorage.setItem(DASHBOARD_USER_KEY, JSON.stringify(user));
    localStorage.setItem(DASHBOARD_TOKEN_KEY, token);

    // Disparar evento customizado para notificar listeners na mesma aba
    window.dispatchEvent(new Event('dashboard-session-updated'));
}

export function clearDashboardSession() {

    localStorage.removeItem(DASHBOARD_USER_KEY);
    localStorage.removeItem(DASHBOARD_TOKEN_KEY);


    // Disparar evento customizado
    window.dispatchEvent(new Event('dashboard-session-updated'));
}
