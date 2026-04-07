'use client';

import { Check, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { adminCreateBooking } from '@/actions/admin-create-booking';
import { createClient } from '@/actions/create-client';
import { getDateAvailableTimeSlots } from '@/actions/get-date-available-time-slots';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewAppointmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onClientCreated?: () => void;
    clients: Array<{ id: string; name: string; email: string }>;
    services: Array<{ id: string; name: string; priceInCents: number }>;
    barbershopId: string;
}

export function NewAppointmentDialog({
    isOpen,
    onClose,
    onSuccess,
    onClientCreated,
    clients,
    services,
    barbershopId,
}: NewAppointmentDialogProps) {
    const isSelectedDateInPast = (dateString: string): boolean => {
        const [year, month, day] = dateString.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today;
    };

    const [isLoading, setIsLoading] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [showCreateClientForm, setShowCreateClientForm] = useState(false);
    const [newClientData, setNewClientData] = useState({ name: '', email: '' });
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const clientInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        clientId: '',
        serviceId: '',
        date: '',
        time: '',
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredClients = clients.filter((client) =>
        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );

    const selectedClient = clients.find((c) => c.id === formData.clientId);

    // Carregar horários disponíveis quando a data muda
    useEffect(() => {
        if (!formData.date || !barbershopId) {
            setAvailableTimeSlots([]);
            return;
        }

        const loadTimeSlots = async () => {
            setIsLoadingTimeSlots(true);
            try {
                // Corrigir timezone: split a data e criar no fuso horário local
                const [year, month, day] = formData.date.split('-').map(Number);
                const date = new Date(year, month - 1, day, 0, 0, 0, 0);
                
                const result = await getDateAvailableTimeSlots({
                    barbershopId,
                    date,
                });

                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                    // Os horários já vêm como strings HH:MM
                    setAvailableTimeSlots(result.data as string[]);
                    setFormData((prev) => ({ ...prev, time: '' }));
                } else {
                    setAvailableTimeSlots([]);
                }
            } catch (error) {
                console.error('[TimeSlots] Erro ao carregar horários:', error);
                setAvailableTimeSlots([]);
            } finally {
                setIsLoadingTimeSlots(false);
            }
        };

        loadTimeSlots();
    }, [formData.date, barbershopId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            // Se clicou no input, não fecha
            if (clientInputRef.current?.contains(target)) {
                return;
            }
            
            // Se clicou no dropdown, não fecha
            if (dropdownRef.current?.contains(target)) {
                return;
            }
            
            // Caso contrário, fecha
            setIsClientDropdownOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateNewClient = async () => {
        if (!newClientData.name || !newClientData.email) {
            toast.error('Preencha o nome e email do cliente');
            return;
        }

        setIsCreatingClient(true);
        try {
            const result = await createClient({
                name: newClientData.name,
                email: newClientData.email,
                barbershopId,
            });

            if (result.data) {
                toast.success('Cliente criado com sucesso');
                setFormData({ ...formData, clientId: result.data.id });
                setNewClientData({ name: '', email: '' });
                setShowCreateClientForm(false);
                setIsClientDropdownOpen(false);
                setClientSearchTerm('');
                onClientCreated?.();
            } else {
                toast.error(result.error || 'Erro ao criar cliente');
            }
        } catch (error) {
            console.error('Error creating client:', error);
            toast.error('Erro ao criar cliente');
        } finally {
            setIsCreatingClient(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientId || !formData.serviceId || !formData.date || !formData.time) {
            toast.error('Preencha todos os campos');
            return;
        }

        setIsLoading(true);
        try {
            // Combinar data e hora corrigindo o timezone
            const [year, month, day] = formData.date.split('-').map(Number);
            const [hours, minutes] = formData.time.split(':').map(Number);
            const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
            
            console.log('[NewAppointmentDialog] Tentando criar agendamento:', {
                clientId: formData.clientId,
                serviceId: formData.serviceId,
                dateTime: dateTime.toISOString(),
                barbershopId,
            });
            
            const result = await adminCreateBooking({
                clientId: formData.clientId,
                serviceId: formData.serviceId,
                date: dateTime.toISOString(),
                barbershopId,
            });

            console.log('[NewAppointmentDialog] Resposta da ação:', result);
            
            if (result.data) {
                toast.success('Agendamento criado com sucesso');
                setFormData({ clientId: '', serviceId: '', date: '', time: '' });
                onClose();
                onSuccess();
            } else {
                console.log('[NewAppointmentDialog] ❌ Validação falhou');
                console.log('[NewAppointmentDialog] Todos os erros:', JSON.stringify(result.validationErrors, null, 2));
                const errorMessage = result.validationErrors?.['_errors']?.[0] || JSON.stringify(result.validationErrors) || 'Erro ao criar agendamento';
                console.log('[NewAppointmentDialog] ❌ Mensagem de erro:', errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast.error('Erro ao criar agendamento');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                    <DialogDescription>
                        Crie um novo agendamento para um cliente
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2 relative">
                        <Label htmlFor="client">Cliente</Label>
                        <input
                            ref={clientInputRef}
                            id="client"
                            type="text"
                            placeholder="Digite o nome ou email do cliente..."
                            value={clientSearchTerm || selectedClient?.name || ''}
                            onChange={(e) => {
                                setClientSearchTerm(e.target.value);
                                setIsClientDropdownOpen(true);
                                if (formData.clientId) {
                                    setFormData({ ...formData, clientId: '' });
                                }
                            }}
                            onFocus={() => setIsClientDropdownOpen(true)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />

                        {isClientDropdownOpen && (
                            <div 
                                ref={dropdownRef}
                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                            >
                                {showCreateClientForm ? (
                                    <div className="p-3 space-y-3 border-b border-slate-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700">Novo Cliente</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCreateClientForm(false);
                                                    setNewClientData({ name: '', email: '' });
                                                }}
                                                className="text-slate-500 hover:text-slate-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Nome do cliente"
                                            value={newClientData.name}
                                            onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email do cliente"
                                            value={newClientData.email}
                                            onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateNewClient}
                                            disabled={isCreatingClient}
                                            className="w-full px-2 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:bg-blue-400"
                                        >
                                            {isCreatingClient ? 'Criando...' : 'Criar Cliente'}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filteredClients.length === 0 && !clientSearchTerm ? (
                                            <div className="px-3 py-2 text-sm text-slate-500">
                                                Nenhum cliente encontrado
                                            </div>
                                        ) : (
                                            filteredClients.map((client) => (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setFormData({ ...formData, clientId: client.id });
                                                        setClientSearchTerm('');
                                                        setIsClientDropdownOpen(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
                                                >
                                                    <div>
                                                        <div className="font-medium text-slate-900">{client.name}</div>
                                                        <div className="text-xs text-slate-500">{client.email}</div>
                                                    </div>
                                                    {formData.clientId === client.id && (
                                                        <Check className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateClientForm(true)}
                                            className="w-full px-3 py-2.5 text-left hover:bg-blue-50 flex items-center gap-2 border-t border-slate-200 text-blue-600 font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Criar novo cliente
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="service">Serviço</Label>
                        <select
                            id="service"
                            value={formData.serviceId}
                            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">Selecione um serviço</option>
                            {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Hora</Label>
                            {isLoadingTimeSlots ? (
                                <div className="flex items-center justify-center py-8 text-slate-500">
                                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                    Carregando horários...
                                </div>
                            ) : availableTimeSlots.length > 0 ? (
                                <select
                                    id="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Selecione um horário</option>
                                    {availableTimeSlots.map((slot) => (
                                        <option key={slot} value={slot}>
                                            {slot}
                                        </option>
                                    ))}
                                </select>
                            ) : formData.date ? (
                                <div className="py-2 px-3 text-sm text-slate-500 border border-slate-300 rounded-lg bg-slate-50">
                                    {isSelectedDateInPast(formData.date) ?
                                        'Data no passado - selecione uma data válida' :
                                        'Nenhum horário disponível para esta data'
                                    }
                                </div>
                            ) : (
                                <div className="py-2 px-3 text-sm text-slate-500 border border-slate-300 rounded-lg bg-slate-50">
                                    Selecione uma data primeiro
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Criando...' : 'Criar Agendamento'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
