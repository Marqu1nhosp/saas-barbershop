'use client';

import { DollarSign, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BarChartComponent } from '@/components/dashboard/bar-chart';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type FinancialMetrics, getFinancialMetrics, getMonthlyRevenue, type MonthlyRevenueData } from '@/data/dashboard';

export default function FinancialPage() {
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyRevenueData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const barbershopId = localStorage.getItem('barbershopId');
                if (!barbershopId) {
                    throw new Error('Barbearia não encontrada na sessão do usuário.');
                }

                const [metricsData, monthlyRevenueData] = await Promise.all([
                    getFinancialMetrics(barbershopId),
                    getMonthlyRevenue(barbershopId),
                ]);

                setMetrics(metricsData);
                setMonthlyData(monthlyRevenueData);
            } catch (error) {
                console.error('Erro ao carregar dados financeiros:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return <div className="text-center py-8">Carregando dados financeiros...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3rem font-bold text-slate-900">Financeiro</h1>
                <Button>Gerar relatório</Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Faturamento total"
                    value={`R$ ${metrics?.totalRevenue?.toFixed(2).replace('.', ',') || '0,00'}`}
                    icon={<DollarSign className="w-4 h-4 text-green-500" />}
                />
                <MetricCard
                    title="Ticket médio"
                    value={`R$ ${metrics?.averageTicket?.toFixed(2).replace('.', ',') || '0,00'}`}
                    icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
                />
                <MetricCard
                    title="Serviço mais lucrativo"
                    value={metrics?.mostProfitableService || 'N/A'}
                    unit={`R$ ${metrics?.maxRevenueService?.toFixed(2).replace('.', ',') || '0,00'}`}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarChartComponent
                    title="Faturamento mensal"
                    data={monthlyData}
                    dataKey="revenue"
                    xAxisKey="month"
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Métodos de pagamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span>Cartão de crédito</span>
                                <span className="font-bold">Em breve</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Dinheiro</span>
                                <span className="font-bold">Em breve</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Pix</span>
                                <span className="font-bold">Em breve</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}