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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2rem font-bold">
                    {value}
                    {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
                </div>
                {trend && (
                    <div className={cn(
                        'flex items-center text-xs font-medium mt-2',
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