'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartComponentProps {
    title: string;
    data: Array<{
        [key: string]: string | number;
    }>;
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