'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Clock, Settings } from 'lucide-react';
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
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando configurações...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-8 h-8 text-blue-600" />
                    Configurações
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-2">Gerencie as configurações da sua barbearia</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="general" className="rounded font-medium data-[state=active]:bg-white">
                        <span className="hidden sm:inline">Geral</span>
                        <span className="sm:hidden text-xs">Geral</span>
                    </TabsTrigger>
                    <TabsTrigger value="schedules" className="rounded font-medium data-[state=active]:bg-white">
                        <Clock className="w-4 h-4 sm:mr-2 sm:inline-block" />
                        <span className="hidden sm:inline text-sm">Horários</span>
                    </TabsTrigger>
                    <TabsTrigger value="cancellation" className="rounded font-medium data-[state=active]:bg-white hidden sm:flex">
                        <AlertCircle className="w-4 h-4 sm:mr-2" />
                        <span className="hidden text-sm">Cancelamento</span>
                    </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <TabsContent value="general" className="mt-6">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <CardTitle className="text-xl">Informações da Barbearia</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div>
                                    <Label className="text-slate-700 font-semibold mb-2 block">Nome</Label>
                                    <Input
                                        {...register('name')}
                                        className="h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Nome da sua barbearia"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500 mt-2 font-medium">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-slate-700 font-semibold mb-2 block">Endereço</Label>
                                    <Input
                                        {...register('address')}
                                        className="h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Rua, número, complemento"
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-red-500 mt-2 font-medium">
                                            {errors.address.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-slate-700 font-semibold mb-2 block">Telefone</Label>
                                    <Input
                                        {...register('phone')}
                                        className="h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="(XX) XXXXX-XXXX"
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-500 mt-2 font-medium">
                                            {errors.phone.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-slate-700 font-semibold mb-2 block">Descrição</Label>
                                    <Input
                                        {...register('description')}
                                        className="h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Descrição da sua barbearia"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-start pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all h-11 px-8"
                            >
                                {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
                            </Button>
                        </div>
                    </TabsContent>
                </form>

                <TabsContent value="schedules" className="mt-6">
                    {(() => {
                        const barbershopId = localStorage.getItem('barbershopId');
                        return barbershopId ? (
                            <BusinessHoursForm barbershopId={barbershopId} />
                        ) : (
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                    <CardTitle>Horários de Funcionamento</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-500">
                                        Carregando...
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })()}
                </TabsContent>

                <TabsContent value="cancellation" className="mt-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                            <CardTitle>Política de Cancelamento</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500 font-medium">
                                Em breve…
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
