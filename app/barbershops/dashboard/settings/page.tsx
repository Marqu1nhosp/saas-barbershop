'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
    const [formData, setFormData] = useState({
        barbershopName: 'Minha Barbearia',
        address: 'Rua das Flores, 123',
        phone: '(11) 99999-9999',
        email: 'contato@mihabarbearia.com.br',
        openingTime: '09:00',
        closingTime: '18:00',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3rem font-bold text-slate-900">Configurações</h1>

            <Tabs defaultValue="general" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="schedules">Horários</TabsTrigger>
                    <TabsTrigger value="cancellation">Cancelamento</TabsTrigger>
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                </TabsList>

                {/* Geral */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Barbearia</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label>Nome</Label>
                                    <Input
                                        name="barbershopName"
                                        value={formData.barbershopName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <Label>Endereço</Label>
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <Label>Telefone</Label>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <Button>Salvar alterações</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Horários */}
                <TabsContent value="schedules">
                    <Card>
                        <CardHeader>
                            <CardTitle>Horários de Funcionamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Horário de abertura</Label>
                                        <Input
                                            type="time"
                                            name="openingTime"
                                            value={formData.openingTime}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <Label>Horário de fechamento</Label>
                                        <Input
                                            type="time"
                                            name="closingTime"
                                            value={formData.closingTime}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Intervalo de almoço</Label>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <Input type="time" placeholder="Início" />
                                        <Input type="time" placeholder="Fim" />
                                    </div>
                                </div>
                                <Button>Salvar alterações</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cancelamento */}
                <TabsContent value="cancellation">
                    <Card>
                        <CardHeader>
                            <CardTitle>Política de Cancelamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label>Prazo máximo para cancelamento (horas)</Label>
                                    <Input type="number" defaultValue="24" />
                                </div>
                                <div>
                                    <Label>Percentual de reembolso (%)</Label>
                                    <Input type="number" defaultValue="100" />
                                </div>
                                <Button>Salvar alterações</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Usuários */}
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gerenciar Usuários</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button>Adicionar novo usuário</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}