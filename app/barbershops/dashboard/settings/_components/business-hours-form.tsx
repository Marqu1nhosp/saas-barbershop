'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type BusinessHour, getBusinessHours, updateBusinessHours } from '@/data/dashboard';

const DAYS = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
];

interface BusinessHoursFormProps {
    barbershopId: string;
}

export function BusinessHoursForm({ barbershopId }: BusinessHoursFormProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [hours, setHours] = useState<BusinessHour[]>([]);

    useEffect(() => {
        const fetchHours = async () => {
            try {
                const data = await getBusinessHours(barbershopId);
                setHours(data);
            } catch (error) {
                toast.error('Erro ao carregar horários');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchHours();
    }, [barbershopId]);

    const handleSaveDay = async (dayOfWeek: number) => {
        const day = hours.find((h) => h.dayOfWeek === dayOfWeek);
        if (!day) return;

        setSubmitting(true);
        try {
            await updateBusinessHours(
                barbershopId,
                dayOfWeek,
                day.isClosed ? null : day.openingTime,
                day.isClosed ? null : day.closingTime,
                day.isClosed,
                day.lunchStart,
                day.lunchEnd
            );
            toast.success('Horários atualizados com sucesso!');
        } catch (error) {
            toast.error('Erro ao atualizar horários');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const updateDayHours = (dayOfWeek: number, field: keyof BusinessHour, value: string | boolean | null) => {
        setHours((prev) =>
            prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
        );
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Horários de Funcionamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">Carregando horários...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Horários de Funcionamento</CardTitle>
                <CardDescription>
                    Configure os horários de funcionamento para cada dia da semana
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="1" className="w-full">
                    <TabsList className="grid w-full grid-cols-7">
                        {DAYS.map((day) => (
                            <TabsTrigger key={day.value} value={String(day.value)} className="text-xs">
                                {day.label.charAt(0)}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {hours.map((day) => {
                        const dayInfo = DAYS.find((d) => d.value === day.dayOfWeek);
                        return (
                            <TabsContent key={day.dayOfWeek} value={String(day.dayOfWeek)}>
                                <div className="space-y-4 py-4">
                                    <h3 className="text-lg font-semibold">{dayInfo?.label}</h3>

                                    {/* Checkbox para fechado */}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`closed-${day.dayOfWeek}`}
                                            checked={day.isClosed}
                                            onChange={(e) =>
                                                updateDayHours(day.dayOfWeek, 'isClosed', e.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label htmlFor={`closed-${day.dayOfWeek}`} className="cursor-pointer">
                                            Fechado
                                        </Label>
                                    </div>

                                    {/* Horários de funcionamento */}
                                    {!day.isClosed && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`opening-${day.dayOfWeek}`}>
                                                    Abertura
                                                </Label>
                                                <Input
                                                    id={`opening-${day.dayOfWeek}`}
                                                    type="time"
                                                    value={day.openingTime || ''}
                                                    onChange={(e) =>
                                                        updateDayHours(
                                                            day.dayOfWeek,
                                                            'openingTime',
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`closing-${day.dayOfWeek}`}>
                                                    Fechamento
                                                </Label>
                                                <Input
                                                    id={`closing-${day.dayOfWeek}`}
                                                    type="time"
                                                    value={day.closingTime || ''}
                                                    onChange={(e) =>
                                                        updateDayHours(
                                                            day.dayOfWeek,
                                                            'closingTime',
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Intervalo de almoço */}
                                    {!day.isClosed && (
                                        <div className="space-y-3 border-t pt-4">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`lunch-${day.dayOfWeek}`}
                                                    checked={!!day.lunchStart}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            updateDayHours(day.dayOfWeek, 'lunchStart', '12:00');
                                                            updateDayHours(day.dayOfWeek, 'lunchEnd', '13:00');
                                                        } else {
                                                            updateDayHours(day.dayOfWeek, 'lunchStart', null);
                                                            updateDayHours(day.dayOfWeek, 'lunchEnd', null);
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <Label
                                                    htmlFor={`lunch-${day.dayOfWeek}`}
                                                    className="cursor-pointer"
                                                >
                                                    Intervalo de almoço
                                                </Label>
                                            </div>

                                            {day.lunchStart && day.lunchEnd && (
                                                <div className="grid grid-cols-2 gap-4 pl-6">
                                                    <div>
                                                        <Label htmlFor={`lunch-start-${day.dayOfWeek}`}>
                                                            Início
                                                        </Label>
                                                        <Input
                                                            id={`lunch-start-${day.dayOfWeek}`}
                                                            type="time"
                                                            value={day.lunchStart}
                                                            onChange={(e) =>
                                                                updateDayHours(
                                                                    day.dayOfWeek,
                                                                    'lunchStart',
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`lunch-end-${day.dayOfWeek}`}>
                                                            Fim
                                                        </Label>
                                                        <Input
                                                            id={`lunch-end-${day.dayOfWeek}`}
                                                            type="time"
                                                            value={day.lunchEnd}
                                                            onChange={(e) =>
                                                                updateDayHours(
                                                                    day.dayOfWeek,
                                                                    'lunchEnd',
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => handleSaveDay(day.dayOfWeek)}
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Salvando...' : 'Salvar'}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </CardContent>
        </Card>
    );
}
