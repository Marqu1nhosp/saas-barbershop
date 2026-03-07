'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string | number;
    unit?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon?: React.ReactNode;
}

export function MetricCard({ title, value, unit, trend, icon }: MetricCardProps) {
    return (
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60"></div>
            <CardHeader className="flex items-center justify-between pb-3 pt-5">
                <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
                {icon && <div className="flex justify-center">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {value}
                    {unit && <span className="text-sm font-normal text-slate-500 ml-2">{unit}</span>}
                </div>
                {trend && (
                    <div className={cn(
                        'flex items-center text-xs font-semibold mt-3',
                        trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}>
                        {trend.isPositive ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </CardContent>
        </Card>
    );
}