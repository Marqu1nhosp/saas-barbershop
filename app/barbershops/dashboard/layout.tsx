'use client';

import { BarChart3, Calendar, DollarSign, Menu, Settings, Users, X } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { DashboardHeader } from '@/app/barbershops/dashboard/_components/dashboard-header';
import { DashboardSessionSync } from '@/app/barbershops/dashboard/_components/dashboard-session-sync';
import { Button } from '@/components/ui/button';
import { getBarbershopName } from '@/data/dashboard';
import { useDashboardSession } from '@/lib/use-dashboard-session';
import { cn } from '@/lib/utils';

const navItems = [
    {
        href: '/barbershops/dashboard',
        label: 'Visão Geral',
        icon: BarChart3,
    },
    {
        href: '/barbershops/dashboard/appointments',
        label: 'Agendamentos',
        icon: Calendar,
    },
    {
        href: '/barbershops/dashboard/professionals',
        label: 'Profissionais',
        icon: Users,
    },
    {
        href: '/barbershops/dashboard/financial',
        label: 'Financeiro',
        icon: DollarSign,
    },
    {
        href: '/barbershops/dashboard/settings',
        label: 'Configurações',
        icon: Settings,
    },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [barbershopName, setBarbershopName] = useState<string | null>(null);
    const { user } = useDashboardSession();

    console.log('[DashboardLayout] User loaded:', { 
        id: user?.id, 
        email: user?.email, 
        role: user?.role, 
        barbershopId: user?.barbershopId 
    });

    const filteredNavItems = navItems.filter((item) => {
        // Se for funcionário, esconde Profissionais, Financeiro e Configurações
        if (user?.role === 'EMPLOYEE') {
            return !['professionals', 'financial', 'settings'].some(keyword => item.href.includes(keyword));
        }
        return true;
    });

    // Sincronizar barbershopId da sessão com localStorage
    useEffect(() => {
        if (user?.barbershopId) {
            console.log('[DashboardLayout] Setting barbershopId to localStorage:', user.barbershopId);
            localStorage.setItem('barbershopId', user.barbershopId);
        } else {
            console.warn('[DashboardLayout] ⚠️ No barbershopId in user:', user);
        }
    }, [user?.barbershopId]);

    useEffect(() => {
        const fetchBarbershop = async () => {
            const barbershopId = localStorage.getItem('barbershopId');
            if (!barbershopId) return;

            const name = await getBarbershopName(barbershopId);
            setBarbershopName(name);
        };

        fetchBarbershop();
    }, []);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <DashboardSessionSync />
            {/* Sidebar Desktop */}
            <aside className="fixed left-0 top-0 z-40 hidden md:flex w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl">
                <div className="flex flex-col h-full w-full p-6">
                    {/* Logo */}
                    <div className="mb-8">
                        <h1 className="text-xl font-bold text-white truncate">{barbershopName || 'Barbearia'}</h1>
                        <p className="text-xs text-slate-400 mt-1">Painel de Controle</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200 rounded-lg"
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="ml-3 text-sm font-medium">{item.label}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="border-t border-slate-700 pt-4">
                        <p className="text-xs text-slate-400 font-semibold px-2">USUÁRIO</p>
                        {user && (
                            <p className="text-sm text-white font-medium truncate px-2 py-2">{user.name}</p>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 md:hidden bg-black/50"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            <aside className={cn(
                "fixed left-0 top-0 z-40 w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl md:hidden transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full w-full p-6">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-xl font-bold text-white">{barbershopName || 'Barbearia'}</h1>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200 rounded-lg"
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="ml-3 text-sm font-medium">{item.label}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-slate-700 pt-4">
                        <p className="text-xs text-slate-400 font-semibold px-2">USUÁRIO</p>
                        {user && (
                            <p className="text-sm text-white font-medium truncate px-2 py-2">{user.name}</p>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 w-full">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4">
                        <h1 className="text-lg font-semibold text-slate-900 truncate">{barbershopName || 'Barbearia'}</h1>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:block sticky top-0 z-20">
                    <DashboardHeader userName={user?.name} barbershopName={barbershopName} role={user?.role} />
                </div>

                <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}