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
        console.log('[useDashboardSession] State changed:', { user, isLoading });
    }, [user, isLoading]);

    const loadUser = () => {
        try {
            const userJson = localStorage.getItem(DASHBOARD_USER_KEY);
            console.log('[useDashboardSession] Loading user from localStorage:', { 
                key: DASHBOARD_USER_KEY,
                rawJson: userJson?.slice(0, 100) + (userJson && userJson.length > 100 ? '...' : '')
            });
            
            if (userJson) {
                const parsedUser = JSON.parse(userJson);
                console.log('[useDashboardSession] ✅ Parsed user:', { 
                    id: parsedUser.id,
                    email: parsedUser.email,
                    role: parsedUser.role,
                    barbershopId: parsedUser.barbershopId
                });
                setUser(parsedUser);
            } else {
                console.log('[useDashboardSession] ⚠️  No user found in localStorage, checking all keys:');
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
        console.log('[useDashboardSession] ➕ Hook mounted, initial load...');
        loadUser();

        // Ouvir mudanças no localStorage (tanto de outra aba quanto de outro componente)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === DASHBOARD_USER_KEY) {
                console.log('[useDashboardSession] Storage changed (other tab):', e.newValue?.slice(0, 50));
                loadUser();
            }
        };

        // Também ouvir evento customizado para mudanças nesta aba
        const handleDashboardSessionUpdate = () => {
            console.log('[useDashboardSession] 🔔 Custom event fired (same tab) - reloading user');
            loadUser();
        };

        console.log('[useDashboardSession] ➕ Registering event listeners');
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('dashboard-session-updated', handleDashboardSessionUpdate);

        // IMPORTANTE: Também fazer um "check" curto depois para garantir que localStorage foi sincronizado
        // Isso resolve problemas de timing com o evento
        const timeoutId = setTimeout(() => {
            console.log('[useDashboardSession] ⏱️ Delayed check (100ms) - verifying user is loaded');
            const currentUserJson = localStorage.getItem(DASHBOARD_USER_KEY);
            if (currentUserJson && !user) {
                console.log('[useDashboardSession] ✅ Found user in localStorage after delay, reloading');
                loadUser();
            }
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            console.log('[useDashboardSession] ➖ Removing event listeners');
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('dashboard-session-updated', handleDashboardSessionUpdate);
        };
    }, []);

    return { user, isLoading };
}

export function saveDashboardSession(user: DashboardUser, token: string) {
    console.log('[saveDashboardSession] Saving user:', user);
    localStorage.setItem(DASHBOARD_USER_KEY, JSON.stringify(user));
    localStorage.setItem(DASHBOARD_TOKEN_KEY, token);
    
    // Disparar evento customizado para notificar listeners na mesma aba
    console.log('[saveDashboardSession] Firing dashboard-session-updated event');
    window.dispatchEvent(new Event('dashboard-session-updated'));
}

export function clearDashboardSession() {
    console.log('[clearDashboardSession] 🧹 Clearing dashboard session from localStorage');
    console.log('[clearDashboardSession] Before clear - existing keys:', {
        hasDashboardUser: !!localStorage.getItem(DASHBOARD_USER_KEY),
        hasDashboardToken: !!localStorage.getItem(DASHBOARD_TOKEN_KEY),
    });
    
    localStorage.removeItem(DASHBOARD_USER_KEY);
    localStorage.removeItem(DASHBOARD_TOKEN_KEY);
    
    console.log('[clearDashboardSession] After clear - existing keys:', {
        hasDashboardUser: !!localStorage.getItem(DASHBOARD_USER_KEY),
        hasDashboardToken: !!localStorage.getItem(DASHBOARD_TOKEN_KEY),
    });
    
    // Disparar evento customizado
    console.log('[clearDashboardSession] Firing dashboard-session-updated event');
    window.dispatchEvent(new Event('dashboard-session-updated'));
}
