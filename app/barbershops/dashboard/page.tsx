'use client';

import { Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BarChartComponent } from '@/components/dashboard/bar-chart';
import { MetricCard } from '@/components/dashboard/metric-card';
import { PieChartComponent } from '@/components/dashboard/pie-chart';
import {
    getDashboardMetrics,
    getMostPopularServices,
    getWeeklyBookings,
} from '@/data/dashboard';
import { useDashboardSession } from '@/lib/use-dashboard-session';

interface DashboardMetrics {
    bookingsToday: number
    bookingsMonth: number
    revenueToday: number
    revenueMonth: number
    clientsCount: number
}

interface WeeklyBookings {
    day: string
    count: number
}

interface ServicesMetrics {
    name: string
    count: number
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyBookings[]>([]);
    const [servicesData, setServicesData] = useState<ServicesMetrics[]>([]);

    const [loading, setLoading] = useState(true);
    const [barbershopId, setBarbershopId] = useState<string | null>(null);
    const { user: dashboardUser, isLoading: isDashboardLoading } = useDashboardSession();

    // Usar barbershopId da sessão do dashboard (JWT)
    useEffect(() => {
        if (isDashboardLoading) {
            return;
        }

        if (dashboardUser?.barbershopId) {
            setBarbershopId(dashboardUser.barbershopId);
            localStorage.setItem('barbershopId', dashboardUser.barbershopId);
        } else {
            // Verificar se estamos em uma rota de logout (normal e esperado)
            const isDashboardRoute = typeof window !== 'undefined' && window.location.pathname.includes('/barbershops/dashboard');
            if (isDashboardRoute && dashboardUser === null) {
                console.log('[Dashboard] User logged out or session cleared (expected)');
            } else {
                console.warn('[Dashboard] No barbershopId found in session, and user is not null. This may indicate an issue with the session or authentication flow.');
            }
            setBarbershopId(null);
        }
    }, [dashboardUser?.barbershopId, isDashboardLoading, dashboardUser]);

    useEffect(() => {
        if (!barbershopId) return;

        const loadData = async () => {
            try {
                setLoading(true);

                const [metricsData, weeklyBookingsData, popularServicesData] =
                    await Promise.all([
                        getDashboardMetrics(barbershopId),
                        getWeeklyBookings(barbershopId),
                        getMostPopularServices(barbershopId),
                    ]);

                setMetrics(metricsData);
                setWeeklyData(weeklyBookingsData);
                setServicesData(popularServicesData);
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [barbershopId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            {/* Header */}
            <div className="border-b border-slate-200 pb-6 sm:pb-8">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
                    Visão Geral
                </h1>
                <p className="text-base sm:text-lg text-slate-500 mt-2 font-medium">
                    Acompanhe métricas e desempenho da sua barbearia
                </p>
            </div>

            {/* Métricas - Grid Responsivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                <MetricCard
                    title="Agendamentos Hoje"
                    value={metrics?.bookingsToday ?? 0}
                    icon={<Calendar className="w-5 h-5 text-blue-500" />}
                />

                <MetricCard
                    title="Agendamentos no Mês"
                    value={metrics?.bookingsMonth ?? 0}
                    icon={<Calendar className="w-5 h-5 text-indigo-500" />}
                />

                <MetricCard
                    title="Faturamento Hoje"
                    value={`R$ ${metrics?.revenueToday?.toFixed(2) ?? '0.00'}`}
                    icon={<DollarSign className="w-5 h-5 text-green-500" />}
                />

                <MetricCard
                    title="Faturamento no Mês"
                    value={`R$ ${metrics?.revenueMonth?.toFixed(2) ?? '0.00'}`}
                    icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                />

                <MetricCard
                    title="Clientes Atendidos"
                    value={metrics?.clientsCount ?? 0}
                    icon={<Users className="w-5 h-5 text-orange-500" />}
                />

                <MetricCard
                    title="Taxa de Ocupação"
                    value="78%"
                    icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                    <BarChartComponent
                        title="Agendamentos na Semana"
                        data={weeklyData}
                        dataKey="count"
                        xAxisKey="day"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                    <PieChartComponent
                        title="Serviços Mais Realizados"
                        data={servicesData.map((service) => ({
                            name: service.name,
                            value: service.count,
                        }))}
                    />
                </div>
            </div>
        </div>
    );
}
