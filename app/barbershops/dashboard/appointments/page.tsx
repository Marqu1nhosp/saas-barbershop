'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getBookings } from '@/data/dashboard';

interface BookingData {
    id: string;
    client: string;
    service: string;
    professional: string;
    date: string;
    time: string;
    status: string;
}

export default function AppointmentsPage() {
    const [bookings, setBookings] = useState<BookingData[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const barbershopId = localStorage.getItem('barbershopId');
                if (!barbershopId) {
                    throw new Error('Barbearia não encontrada na sessão do usuário.');
                }
                const data = await getBookings(barbershopId, selectedDate);
                setBookings(data);
                setFilteredBookings(data);
            } catch (error) {
                console.error('Erro ao carregar agendamentos:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, [selectedDate]);

    useEffect(() => {
        const filtered = bookings.filter((booking) =>
            booking.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.service.toLowerCase().includes(searchTerm.toLowerCase())
        );
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
        return <div className="text-center py-8">Carregando agendamentos...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3rem font-bold text-slate-900">Agendamentos</h1>
                <Button>Novo agendamento</Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Input
                    placeholder="Pesquisar cliente ou serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
                <Input
                    type="date"
                    className="w-40"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setSelectedDate('');
                }}>
                    Limpar
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Agendamentos ({filteredBookings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredBookings.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Nenhum agendamento encontrado
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead>Profissional</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>{booking.client}</TableCell>
                                        <TableCell>{booking.service}</TableCell>
                                        <TableCell>{booking.professional}</TableCell>
                                        <TableCell>{booking.date}</TableCell>
                                        <TableCell>{booking.time}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(booking.status)}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm">
                                                    Editar
                                                </Button>
                                                <Button variant="destructive" size="sm">
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}