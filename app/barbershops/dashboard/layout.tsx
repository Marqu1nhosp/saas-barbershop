'use client';

import { BarChart3, Calendar, DollarSign, LogOut, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getBarbershopName } from '@/data/dashboard';
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [collapsed, setCollapsed] = useState(false);
    const [barbershopName, setBarbershopName] = useState<string | null>(null);
    const router = useRouter();


    useEffect(() => {
        const fetchBarbershop = async () => {
            const barbershopId = localStorage.getItem('barbershopId');
            if (!barbershopId) return;

            const name = await getBarbershopName(barbershopId);
            setBarbershopName(name);
        };

        fetchBarbershop();
    }, []);



    const handleLogout = async () => {
        // Clear tokens
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        localStorage.removeItem('token');

        // Redirect to login
        router.push('/dashboard-login');
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300',
                collapsed ? 'w-20' : 'w-64'
            )}>
                <div className="flex flex-col h-full p-4">
                    {/* Logo */}
                    <div className="mb-8">
                        <h1 className={cn(
                            'text-xl font-bold',
                            collapsed && 'text-center'
                        )}>
                            {collapsed ? 'B' : barbershopName}
                        </h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            'w-full justify-start text-white hover:bg-slate-800',
                                            collapsed && 'justify-center p-2'
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {!collapsed && <span className="ml-3">{item.label}</span>}
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="border-t border-slate-700 pt-4">
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className={cn(
                                'w-full justify-start text-white hover:bg-slate-800',
                                collapsed && 'justify-center p-2'
                            )}
                        >
                            <LogOut className="w-5 h-5" />
                            {!collapsed && <span className="ml-3">Sair</span>}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                'flex-1 transition-all duration-300',
                collapsed ? 'ml-20' : 'ml-64'
            )}>
                <div className="min-h-screen bg-slate-50 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}