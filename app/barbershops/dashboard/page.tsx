'use client';

import { Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BarChartComponent } from '@/components/dashboard/bar-chart';
import { MetricCard } from '@/components/dashboard/metric-card';
import { PieChartComponent } from '@/components/dashboard/pie-chart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    getDashboardMetrics,
    getMostPopularServices,
    getWeeklyBookings,
} from '@/data/dashboard';

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

    // 1️⃣ Primeiro: garantir que o barbershopId existe
    useEffect(() => {
        const id = localStorage.getItem('barbershopId');
        console.log('Barbershop ID:', id);

        if (!id) {
            console.error('Barbearia não encontrada no localStorage');
            return;
        }

        setBarbershopId(id);
    }, []);

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

                console.log('METRICS:', metricsData);
                console.log('WEEKLY:', weeklyBookingsData);
                console.log('SERVICES:', popularServicesData);

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
        return <div className="text-center py-8">Carregando dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Visão Geral</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Painel de controle da barbearia
                    </p>
                </div>
            </div>

            {/* Filtros (visual apenas por enquanto) */}
            <div className="flex gap-4">
                <Input type="date" className="w-40" />
                <Input type="date" className="w-40" />
                <Button>Filtrar</Button>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                    title="Agendamentos hoje"
                    value={metrics?.bookingsToday ?? 0}
                    icon={<Calendar className="w-4 h-4 text-blue-500" />}
                />

                <MetricCard
                    title="Agendamentos no mês"
                    value={metrics?.bookingsMonth ?? 0}
                    icon={<Calendar className="w-4 h-4 text-purple-500" />}
                />

                <MetricCard
                    title="Faturamento hoje"
                    value={`R$ ${metrics?.revenueToday?.toFixed(2) ?? '0.00'}`}
                    icon={<DollarSign className="w-4 h-4 text-green-500" />}
                />

                <MetricCard
                    title="Faturamento no mês"
                    value={`R$ ${metrics?.revenueMonth?.toFixed(2) ?? '0.00'}`}
                    icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                />

                <MetricCard
                    title="Clientes atendidos"
                    value={metrics?.clientsCount ?? 0}
                    icon={<Users className="w-4 h-4 text-orange-500" />}
                />

                <MetricCard
                    title="Taxa de ocupação"
                    value="78%"
                    icon={<TrendingUp className="w-4 h-4 text-red-500" />}
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarChartComponent
                    title="Agendamentos na semana"
                    data={weeklyData}
                    dataKey="count"
                    xAxisKey="day"
                />

                <PieChartComponent
                    title="Serviços mais realizados"
                    data={servicesData.map((service) => ({
                        name: service.name,
                        value: service.count,
                    }))}
                />
            </div>
        </div>
    );
}
