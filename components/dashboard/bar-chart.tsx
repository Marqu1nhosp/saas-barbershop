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
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxisKey} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey={dataKey} fill="#0f172a" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}