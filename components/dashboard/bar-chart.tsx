'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeeklyBookings {
    day: string;
    count: number;
}
interface BarChartComponentProps {
    title: string;
    data: WeeklyBookings[];
    dataKey: string;
    xAxisKey: string;
}

export function BarChartComponent({ title, data, dataKey, xAxisKey }: BarChartComponentProps) {
    return (
        <>
            <CardTitle className="text-lg font-semibold text-slate-900 mb-4">{title}</CardTitle>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey={xAxisKey} stroke="#94a3b8" style={{ fontSize: '0.875rem' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '0.875rem' }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Bar dataKey={dataKey} fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </>
    );
}