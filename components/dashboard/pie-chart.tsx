'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface PieChartComponentProps {
    title: string;
    data: Array<{
        name: string;
        value: number;
    }>;
}

export function PieChartComponent({ title, data }: PieChartComponentProps) {
    return (
        <>
            <CardTitle className="text-lg font-semibold text-slate-900 mb-4">{title}</CardTitle>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#3b82f6"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '1rem' }}
                        iconType="circle"
                    />
                </PieChart>
            </ResponsiveContainer>
        </>
    );
}