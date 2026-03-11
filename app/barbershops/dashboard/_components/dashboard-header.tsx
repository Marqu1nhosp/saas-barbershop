'use client';

import { LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { clearDashboardSession } from '@/lib/use-dashboard-session';

interface DashboardHeaderProps {
    userName: string | undefined;
    barbershopName: string | null;
    role: string | undefined;
}

export function DashboardHeader({ userName, barbershopName, role }: DashboardHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        localStorage.removeItem('token');
        localStorage.removeItem('barbershopId');
        clearDashboardSession();
        router.push('/dashboard-login');
    };

    function getRole(role: string | undefined) {
        if (role === 'EMPLOYEE') return 'Funcionário';
        return 'Administrador';
    }

    const initials = userName
        ?.split(' ')
        .map((word) => word[0].toUpperCase())
        .join('')
        .slice(0, 2) || 'AD';

    return (
        <div className="bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between h-16 px-6">
                {/* Left - Barbershop Name */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{barbershopName || 'Barbearia'}</h2>
                    <p className="text-xs text-slate-500">Painel de Controle</p>
                </div>

                {/* Right - User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm">
                            {initials}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium text-slate-900">{userName || 'Usuário'}</p>
                            <p className="text-xs text-slate-500">{getRole(role) || 'Admin'}</p>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                            {role !== 'EMPLOYEE' && (
                                <>
                                    <button
                                        onClick={() => {
                                            router.push('/barbershops/dashboard/settings');
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Configurações</span>
                                    </button>

                                    <hr className="my-1" />
                                </>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sair</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
