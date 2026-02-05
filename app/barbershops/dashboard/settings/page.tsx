'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBarbershop } from '@/data/dashboard';

const settingsSchema = z
    .object({
        name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
        address: z.string().min(5, 'Endereço inválido'),
        phone: z.string().min(10, 'Telefone inválido'),
        description: z.string().optional(),
        openingTime: z.string().min(1, 'Informe o horário de abertura'),
        closingTime: z.string().min(1, 'Informe o horário de fechamento'),
    })
    .refine((data) => data.openingTime < data.closingTime, {
        message: 'Horário de abertura deve ser menor que o de fechamento',
        path: ['closingTime'],
    });

type SettingsFormData = z.infer<typeof settingsSchema>;

interface BarbershopResponseDTO {
    id: string;
    name: string;
    address: string;
    description: string;
    imageUrl: string;
    phones: string[];
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: '',
            address: '',
            phone: '',
            description: '',
            openingTime: '',
            closingTime: '',
        },
    });

    useEffect(() => {
        const fetchBarbershop = async () => {
            const barbershopId = localStorage.getItem('barbershopId');
            if (!barbershopId) return;

            try {
                const data: BarbershopResponseDTO | null =
                    await getBarbershop(barbershopId);

                if (!data) return;

                reset({
                    name: data.name,
                    address: data.address,
                    phone: data.phones?.[0] ?? '',
                    description: data.description ?? '',
                    openingTime: '',
                    closingTime: '',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchBarbershop();
    }, [reset]);

    const onSubmit = async (data: SettingsFormData) => {
        console.log(data);
    };

    if (loading) {
        return <div className="py-8 text-center">Carregando configurações...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>

            <Tabs defaultValue="general" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="schedules">Horários</TabsTrigger>
                    <TabsTrigger value="cancellation">Cancelamento</TabsTrigger>
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Barbearia</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div>
                                <Label>Nome</Label>
                                <Input {...register('name')} />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Endereço</Label>
                                <Input {...register('address')} />
                                {errors.address && (
                                    <p className="text-sm text-red-500">
                                        {errors.address.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Telefone</Label>
                                <Input {...register('phone')} />
                                {errors.phone && (
                                    <p className="text-sm text-red-500">
                                        {errors.phone.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Descrição</Label>
                                <Input {...register('description')} />
                            </div>

                            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                                Salvar alterações
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedules">
                    <Card>
                        <CardHeader>
                            <CardTitle>Horários de Funcionamento</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Abertura</Label>
                                    <Input type="time" {...register('openingTime')} />
                                    {errors.openingTime && (
                                        <p className="text-sm text-red-500">
                                            {errors.openingTime.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Fechamento</Label>
                                    <Input type="time" {...register('closingTime')} />
                                    {errors.closingTime && (
                                        <p className="text-sm text-red-500">
                                            {errors.closingTime.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                                Salvar alterações
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cancellation">
                    <Card>
                        <CardHeader>
                            <CardTitle>Política de Cancelamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Em breve…</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usuários</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button>Adicionar usuário</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
