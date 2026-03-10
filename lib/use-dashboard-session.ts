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

    useEffect(() => {
        // Carregar do localStorage com a chave específica do dashboard
        const loadUser = () => {
            const userJson = localStorage.getItem(DASHBOARD_USER_KEY);
            if (userJson) {
                try {
                    setUser(JSON.parse(userJson));
                } catch (err) {
                    console.error('Erro ao fazer parse do usuário do dashboard:', err);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        loadUser();

        // Ouvir mudanças no localStorage (se login acontecer em outra aba)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === DASHBOARD_USER_KEY) {
                if (e.newValue) {
                    try {
                        setUser(JSON.parse(e.newValue));
                    } catch (err) {
                        console.error('Erro ao fazer parse do usuário do dashboard:', err);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return { user, isLoading };
}

export function saveDashboardSession(user: DashboardUser, token: string) {
    localStorage.setItem(DASHBOARD_USER_KEY, JSON.stringify(user));
    localStorage.setItem(DASHBOARD_TOKEN_KEY, token);
}

export function clearDashboardSession() {
    localStorage.removeItem(DASHBOARD_USER_KEY);
    localStorage.removeItem(DASHBOARD_TOKEN_KEY);
}
