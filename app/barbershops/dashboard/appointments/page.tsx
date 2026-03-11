'use client';

import { format, parseISO } from 'date-fns';
import { Calendar, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getBookings, getClientsForBarbershop, getServicesForBarbershop } from '@/data/dashboard';
import { authClient } from '@/lib/auth-client';
import { NewAppointmentDialog } from './_components/new-appointment-dialog';
import { BookingActionsDialog } from './_components/booking-actions-dialog';

interface BookingData {
    id: string;
    client: string;
    service: string;
    professional: string;
    date: string;
    time: string;
    status: string;
}

interface Client {
    id: string;
    name: string;
    email: string;
}

interface Service {
    id: string;
    name: string;
    priceInCents: number;
}

export default function AppointmentsPage() {
    const [bookings, setBookings] = useState<BookingData[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [barbershopId, setBarbershopId] = useState<string>('');
    const [isSessionInitialized, setIsSessionInitialized] = useState(false);
    const { data: session, isPending: isSessionLoading } = authClient.useSession();

    // Sincronizar barbershopId da sessão com localStorage
    useEffect(() => {
        if (isSessionLoading) {
            console.log('[Appointments] Session still loading...');
            return;
        }

        let barbId = localStorage.getItem('barbershopId');
        console.log('[Appointments] Storage barbId:', barbId);
        
        // Se não encontrar no localStorage, tenta pegar da sessão do better-auth
        if (!barbId && session?.user) {
            barbId = (session.user as any).barbershopId;
            console.log('[Appointments] Session barbId:', barbId);
            if (barbId) {
                localStorage.setItem('barbershopId', barbId);
            }
        }

        console.log('[Appointments] Final barbId:', barbId);
        setBarbershopId(barbId || '');
        setIsSessionInitialized(true);
    }, [session?.user, isSessionLoading]);

    // Carregamento de dados quando barbershopId está pronto
    useEffect(() => {
        // Não executar enquanto a sessão está sendo inicializada
        if (!isSessionInitialized || !barbershopId) {
            console.log('[Appointments] Skipping load:', { isSessionInitialized, barbershopId });
            if (isSessionInitialized && !barbershopId) {
                console.error('[Appointments] Barbearia não encontrada na sessão do usuário.');
                setLoading(false);
            }
            return;
        }

        const initLoad = async () => {
            try {
                console.log('[Appointments] Initial load with barbId:', barbershopId);
                const data = await getBookings(barbershopId, undefined);
                console.log('[Appointments] Initial bookings loaded:', { count: data.length, data });
                setBookings(data);
                setFilteredBookings(data);

                // Carregar clientes e serviços para o diálogo
                await loadClientsAndServices(barbershopId);
            } catch (error) {
                console.error('[Appointments] Erro ao carregar agendamentos inicialmente:', error);
            } finally {
                setLoading(false);
            }
        };

        initLoad();
    }, [barbershopId, isSessionInitialized]);

    // Recarregamento quando data é selecionada
    useEffect(() => {
        if (selectedDate && barbershopId) {
            const reloadByDate = async () => {
                try {
                    console.log('[Appointments] Reloading with date filter:', selectedDate);
                    const data = await getBookings(barbershopId, selectedDate);
                    console.log('[Appointments] Bookings by date loaded:', { count: data.length, data });
                    setBookings(data);
                    setFilteredBookings(data);
                } catch (error) {
                    console.error('[Appointments] Erro ao filtrar por data:', error);
                }
            };

            reloadByDate();
        } else if (!selectedDate && barbershopId) {
            // Se limpou a data, recarrega todos
            const reloadAll = async () => {
                try {
                    console.log('[Appointments] Clearing date filter');
                    const data = await getBookings(barbershopId, undefined);
                    console.log('[Appointments] All bookings reloaded:', { count: data.length, data });
                    setBookings(data);
                    setFilteredBookings(data);
                } catch (error) {
                    console.error('[Appointments] Erro ao recarregar agendamentos:', error);
                }
            };

            reloadAll();
        }
    }, [selectedDate, barbershopId]);

    // Polling automático a cada 5 segundos para atualizar em tempo real
    useEffect(() => {
        if (!barbershopId || isNewAppointmentOpen) return;

        const pollInterval = setInterval(async () => {
            try {
                const data = await getBookings(barbershopId, selectedDate || undefined);
                setBookings(data);
                setFilteredBookings(data);
            } catch (error) {
                console.error('[Appointments] Erro no polling automático:', error);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [barbershopId, selectedDate, isNewAppointmentOpen]);

    const loadClientsAndServices = async (barbId: string) => {
        try {
            const [clientsData, servicesData] = await Promise.all([
                getClientsForBarbershop(barbId),
                getServicesForBarbershop(barbId),
            ]);

            setClients(clientsData);
            setServices(servicesData);
        } catch (error) {
            console.error('[Appointments] Erro ao carregar clientes e serviços:', error);
        }
    };

    useEffect(() => {
        console.log('[Appointments] Filtering with searchTerm:', searchTerm);
        const filtered = bookings.filter((booking) =>
            booking.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.service.toLowerCase().includes(searchTerm.toLowerCase())
        );
        console.log('[Appointments] Filtered results:', filtered);
        setFilteredBookings(filtered);
    }, [searchTerm, bookings]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmado':
                return 'bg-green-100 text-green-800';
            case 'pendente':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelado':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando agendamentos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Agendamentos</h1>
                    <p className="text-sm sm:text-base text-slate-500 mt-2">Total: {filteredBookings.length} agendamentos</p>
                </div>
                <Button onClick={() => setIsNewAppointmentOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Novo agendamento
                </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Pesquisar cliente ou serviço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <Input
                        type="date"
                        className="pl-10 h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        value={selectedDate}
                        onChange={(e) => {
                            console.log('[Appointments] Date changed from:', selectedDate, 'to:', e.target.value);
                            setSelectedDate(e.target.value);
                        }}
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        setSearchTerm('');
                        setSelectedDate('');
                    }}
                    className="border-slate-300 hover:bg-slate-100 text-slate-700 h-11 rounded-lg"
                >
                    <X className="w-4 h-4 mr-2" />
                    Limpar
                </Button>
            </div>

            {/* Desktop Table */}
            {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhum agendamento encontrado</p>
                    <p className="text-slider-400 text-sm mt-1">Tente ajustar seus filtros</p>
                </div>
            ) : (
                <>
                    <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 hover:bg-slate-100">
                                    <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Serviço</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Profissional</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Data</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Hora</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBookings.map((booking) => (
                                    <TableRow key={booking.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
                                        <TableCell className="font-semibold text-slate-900">{booking.client}</TableCell>
                                        <TableCell className="text-slate-600">{booking.service}</TableCell>
                                        <TableCell className="text-slate-600">{booking.professional}</TableCell>
                                        <TableCell className="text-slate-600">{format(parseISO(booking.date), "dd/MM/yyyy")}</TableCell>
                                        <TableCell className="text-slate-600">{booking.time}</TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusColor(booking.status)} font-medium rounded-full`}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <BookingActionsDialog
                                                bookingId={booking.id}
                                                barbershopId={barbershopId}
                                                clientName={booking.client}
                                                serviceName={booking.service}
                                                currentDate={format(parseISO(booking.date), "dd/MM/yyyy")}
                                                currentTime={booking.time}
                                                onSuccess={() => {
                                                    setSelectedDate('');
                                                    setSearchTerm('');
                                                    const barbId = localStorage.getItem('barbershopId');
                                                    if (barbId) {
                                                        getBookings(barbId, undefined).then(data => {
                                                            setBookings(data);
                                                            setFilteredBookings(data);
                                                        });
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-4">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 text-lg">{booking.client}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{booking.service}</p>
                                    </div>
                                    <Badge className={`${getStatusColor(booking.status)} font-medium rounded-full ml-2`}>
                                        {booking.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 text-xs font-medium mb-1">Profissional</p>
                                        <p className="text-slate-900 font-medium">{booking.professional}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs font-medium mb-1">Data</p>
                                        <p className="text-slate-900 font-medium">{format(parseISO(booking.date), "dd/MM/yyyy")}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs font-medium mb-1">Hora</p>
                                        <p className="text-slate-900 font-medium">{booking.time}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <BookingActionsDialog
                                        bookingId={booking.id}
                                        barbershopId={barbershopId}
                                        clientName={booking.client}
                                        serviceName={booking.service}
                                        currentDate={format(parseISO(booking.date), "dd/MM/yyyy")}
                                        currentTime={booking.time}
                                        onSuccess={() => {
                                            setSelectedDate('');
                                            setSearchTerm('');
                                            const barbId = localStorage.getItem('barbershopId');
                                            if (barbId) {
                                                getBookings(barbId, undefined).then(data => {
                                                    setBookings(data);
                                                    setFilteredBookings(data);
                                                });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* New Appointment Dialog */}
            <NewAppointmentDialog
                isOpen={isNewAppointmentOpen}
                onClose={() => setIsNewAppointmentOpen(false)}
                onSuccess={async () => {
                    setSelectedDate('');
                    setSearchTerm('');
                    // Recarregar agendamentos
                    const barbId = localStorage.getItem('barbershopId');
                    if (barbId) {
                        try {
                            const data = await getBookings(barbId, undefined);
                            setBookings(data);
                            setFilteredBookings(data);
                        } catch (error) {
                            console.error('Erro ao recarregar agendamentos:', error);
                        }
                    }
                }}
                onClientCreated={async () => {
                    // Recarregar lista de clientes quando um novo é criado
                    if (barbershopId) {
                        await loadClientsAndServices(barbershopId);
                    }
                }}
                clients={clients}
                services={services}
                barbershopId={barbershopId}
            />
        </div>
    );
}