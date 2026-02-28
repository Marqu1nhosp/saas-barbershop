'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBarbershop, updateBarbershop } from '@/data/dashboard';
import { BusinessHoursForm } from './_components/business-hours-form';

const settingsSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    address: z.string().min(5, 'Endereço inválido'),
    phone: z.string(),
    description: z.string().optional(),
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
        },
    });


    useEffect(() => {
        const fetchBarbershop = async () => {
            const barbershopId = localStorage.getItem('barbershopId');

            if (!barbershopId) {
                setLoading(false);
                return;
            }

            try {
                const data: BarbershopResponseDTO | null =
                    await getBarbershop(barbershopId);

                if (!data) return;

                reset({
                    name: data.name,
                    address: data.address,
                    phone: data.phones?.[0] ?? '',
                    description: data.description ?? '',
                });
            } catch {
                toast.error('Erro ao carregar dados da barbearia');
            } finally {
                setLoading(false);
            }
        };

        fetchBarbershop();
    }, [reset]);

    const onSubmit = async (data: SettingsFormData) => {
        console.log('DADOS DA BARBEARIA:', data);

        const barbershopId = localStorage.getItem('barbershopId');
        if (!barbershopId) return;

        try {
            await updateBarbershop(
                barbershopId,
                data.name,
                data.address,
                data.description ?? '',
                data.phone,
            );

            toast.success('Informações da barbearia atualizadas!');
        } catch {
            toast.error('Erro ao atualizar barbearia');
        }
    };

    if (loading) {
        return <div className="py-8 text-center">Carregando configurações...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="schedules">
                        {(() => {
                            const barbershopId = localStorage.getItem('barbershopId');
                            return barbershopId ? (
                                <BusinessHoursForm barbershopId={barbershopId} />
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Horários de Funcionamento</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Carregando...
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })()}
                    </TabsContent>


                    <TabsContent value="cancellation">
                        <Card>
                            <CardHeader>
                                <CardTitle>Política de Cancelamento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Em breve…
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="users">
                        <Card>
                            <CardHeader>
                                <CardTitle>Usuários</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button type="button">Adicionar usuário</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-start">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
