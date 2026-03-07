'use client';

import { DollarSign, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BarChartComponent } from '@/components/dashboard/bar-chart';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Button } from '@/components/ui/button';
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
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando dados financeiros...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Financeiro</h1>
                    <p className="text-sm sm:text-base text-slate-500 mt-2">Acompanhe sua receita e desempenho financeiro</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all">
                    Gerar relatório
                </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                <MetricCard
                    title="Faturamento Total"
                    value={`R$ ${metrics?.totalRevenue?.toFixed(2).replace('.', ',') || '0,00'}`}
                    icon={<DollarSign className="w-5 h-5 text-green-500" />}
                />
                <MetricCard
                    title="Ticket Médio"
                    value={`R$ ${metrics?.averageTicket?.toFixed(2).replace('.', ',') || '0,00'}`}
                    icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                />
                <MetricCard
                    title="Serviço Mais Lucrativo"
                    value={metrics?.mostProfitableService || 'N/A'}
                    unit={`R$ ${metrics?.maxRevenueService?.toFixed(2).replace('.', ',') || '0,00'}`}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                    <BarChartComponent
                        title="Faturamento Mensal"
                        data={monthlyData.map((item) => ({
                            day: item.month,
                            count: item.revenue,
                        }))}
                        dataKey="count"
                        xAxisKey="day"
                    />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">Métodos de Pagamento</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg">
                            <span className="text-slate-700 font-medium">Cartão de crédito</span>
                            <span className="text-sm text-slate-500 font-semibold">Em breve</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-transparent rounded-lg">
                            <span className="text-slate-700 font-medium">Dinheiro</span>
                            <span className="text-sm text-slate-500 font-semibold">Em breve</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg">
                            <span className="text-slate-700 font-medium">PIX</span>
                            <span className="text-sm text-slate-500 font-semibold">Em breve</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}