'use client';

import { BarChart3, Bell, Building2, Calendar, DollarSign, LogOut, Menu, Scissors, Settings, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { DashboardHeader } from '@/app/barbershops/dashboard/_components/dashboard-header';
import { DashboardSessionSync } from '@/app/barbershops/dashboard/_components/dashboard-session-sync';
import { Button } from '@/components/ui/button';
import { getBarbershopName } from '@/data/dashboard';
import { clearDashboardSession, useDashboardSession } from '@/lib/use-dashboard-session';
import { cn } from '@/lib/utils';

const navItems = [
    {
        href: '/barbershops/dashboard/barbershops',
        label: 'Barbearias',
        icon: Building2,
        globalAdminOnly: true,
    },
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
        href: '/barbershops/dashboard/services',
        label: 'Serviços',
        icon: Scissors,
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
    const [newBookingCount, setNewBookingCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [recentBookings, setRecentBookings] = useState<Array<{ id: string; clientName: string; serviceName: string; date: string }>>([]);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const { user } = useDashboardSession();
    const router = useRouter();


    const filteredNavItems = navItems.filter((item) => {
        if (user?.role === 'SUPERADMIN') {
            return item.globalAdminOnly === true;
        }

        if (item.globalAdminOnly && user?.role !== 'SUPERADMIN') {
            return false;
        }
        // Se for funcionário, esconde Profissionais, Financeiro, Serviços e Configurações
        if (user?.role === 'EMPLOYEE') {
            return !['professionals', 'financial', 'services', 'settings'].some(keyword => item.href.includes(keyword));
        }
        return true;
    });

    // Sincronizar barbershopId da sessão com localStorage
    useEffect(() => {
        if (user?.barbershopId) {
            localStorage.setItem('barbershopId', user.barbershopId);
        } else {
            console.warn('[DashboardLayout] ⚠️ No barbershopId in user:', user);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.barbershopId]);

    useEffect(() => {
        if (!isNotificationsOpen || !user?.barbershopId) return;

        const loadRecentBookings = async () => {
            try {
                const authToken = localStorage.getItem('dashboard_auth_token');
                const headers: Record<string, string> = {};
                if (authToken) headers.Authorization = `Bearer ${authToken}`;

                const response = await fetch('/api/dashboard/recent-bookings?limit=5', {
                    cache: 'no-store',
                    credentials: 'include',
                    headers,
                });

                if (response.ok) {
                    const data = await response.json();
                    setRecentBookings(data.bookings ?? []);
                    localStorage.setItem('lastViewedBookingsTime', Date.now().toString());
                }
            } catch {
                setRecentBookings([]);
            }
        };

        loadRecentBookings();
    }, [isNotificationsOpen, user?.barbershopId]);

    const handleNotificationsToggle = () => {
        const willOpen = !isNotificationsOpen;

        if (willOpen) {
            localStorage.setItem('lastViewedBookingsTime', Date.now().toString());
            setNewBookingCount(0);
        }

        setIsNotificationsOpen(willOpen);
    };

    useEffect(() => {
        if (!isNotificationsOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!notificationsRef.current?.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotificationsOpen]);

    const handleLogout = () => {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        localStorage.removeItem('token');
        localStorage.removeItem('barbershopId');
        clearDashboardSession();
        router.push('/dashboard-login');
    };

    useEffect(() => {
        const fetchBarbershop = async () => {
            const barbershopId = localStorage.getItem('barbershopId');
            if (!barbershopId) return;

            const name = await getBarbershopName(barbershopId);
            setBarbershopName(name);
        };

        fetchBarbershop();
    }, []);

    useEffect(() => {
        const loadBookingCount = async () => {
            if (!user?.barbershopId) {
                setNewBookingCount(0);
                return;
            }

            try {
                const authToken = localStorage.getItem('dashboard_auth_token');
                const headers: Record<string, string> = {};
                if (authToken) {
                    headers.Authorization = `Bearer ${authToken}`;
                }

                const lastViewedTime = localStorage.getItem('lastViewedBookingsTime');
                const params = new URLSearchParams();
                if (lastViewedTime) {
                    params.append('lastViewed', lastViewedTime);
                }

                const response = await fetch(`/api/dashboard/new-bookings?${params}`, {
                    cache: 'no-store',
                    credentials: 'include',
                    headers,
                });

                if (response.ok) {
                    const data = await response.json();
                    setNewBookingCount(data.newBookingCount ?? 0);
                }
            } catch {
                setNewBookingCount(0);
            }
        };

        loadBookingCount();
        const intervalId = window.setInterval(loadBookingCount, 15000);
        const handleNewBooking = () => {
            loadBookingCount();
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'lastBookingTime') {
                loadBookingCount();
            }
        };

        window.addEventListener('dashboard-booking-created', handleNewBooking);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('dashboard-booking-created', handleNewBooking);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [user?.barbershopId]);

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
                        <button
                            onClick={handleLogout}
                            className="mt-2 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-red-300 transition-colors hover:bg-slate-800 hover:text-red-200"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 w-full">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4">
                        <h1 className="text-lg font-semibold text-slate-900 truncate flex-1">{barbershopName || 'Barbearia'}</h1>
                        <div className="flex items-center gap-3">
                            <div ref={notificationsRef} className="relative">
                                <button
                                    onClick={handleNotificationsToggle}
                                    title={newBookingCount > 0 ? `${newBookingCount} novo(s) agendamento(s)` : 'Agendamentos'}
                                    className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <Bell className="w-5 h-5 text-slate-600" />
                                    {newBookingCount > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                                            {newBookingCount > 9 ? '9+' : newBookingCount}
                                        </span>
                                    )}
                                </button>
                                {isNotificationsOpen && (
                                    <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                                        <div className="border-b border-slate-200 p-4">
                                            <h3 className="font-semibold text-slate-900">Novos Agendamentos</h3>
                                            {newBookingCount > 0 && (
                                                <p className="mt-1 text-xs text-slate-500">{newBookingCount} novo(s)</p>
                                            )}
                                        </div>
                                        {recentBookings.length > 0 ? (
                                            <>
                                                <div className="max-h-72 overflow-y-auto">
                                                    {recentBookings.map((booking) => (
                                                        <div key={booking.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                                                            <p className="text-sm font-medium text-slate-900">{booking.clientName}</p>
                                                            <p className="mt-1 text-xs text-slate-600">{booking.serviceName}</p>
                                                            <p className="mt-1 text-xs text-slate-500">{booking.date}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setIsNotificationsOpen(false);
                                                        router.push('/barbershops/dashboard/appointments');
                                                    }}
                                                    className="w-full border-t border-slate-200 bg-slate-50 p-3 text-center text-sm font-medium text-blue-600"
                                                >
                                                    Ver todos os agendamentos
                                                </button>
                                            </>
                                        ) : (
                                            <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhum agendamento novo</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(true)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Menu className="w-6 h-6 text-slate-600" />
                            </button>
                        </div>
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