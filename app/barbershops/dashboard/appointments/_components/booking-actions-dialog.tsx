'use client';

import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminCancelBooking } from '@/actions/admin-cancel-booking';
import { adminUpdateBooking } from '@/actions/admin-update-booking';
import { getDateAvailableTimeSlots } from '@/actions/get-date-available-time-slots';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface BookingActionsDialogProps {
    bookingId: string;
    barbershopId: string;
    clientName: string;
    serviceName: string;
    currentDate: string;
    currentTime: string;
    onSuccess?: () => void;
}

export function BookingActionsDialog({
    bookingId,
    barbershopId,
    clientName,
    serviceName,
    currentDate,
    currentTime,
    onSuccess,
}: BookingActionsDialogProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

    // Carregar horários disponíveis quando a data muda
    useEffect(() => {
        if (!newDate || !barbershopId) {
            setAvailableTimeSlots([]);
            return;
        }

        const loadTimeSlots = async () => {
            setIsLoadingTimeSlots(true);
            try {
                const [year, month, day] = newDate.split('-').map(Number);
                const date = new Date(year, month - 1, day, 0, 0, 0, 0);
                
                const result = await getDateAvailableTimeSlots({
                    barbershopId,
                    date,
                });

                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                    setAvailableTimeSlots(result.data as string[]);
                    setNewTime('');
                } else {
                    setAvailableTimeSlots([]);
                }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                setAvailableTimeSlots([]);
            } finally {
                setIsLoadingTimeSlots(false);
            }
        };

        loadTimeSlots();
    }, [newDate, barbershopId]);

    const { execute: executeUpdate, isPending: isUpdating } = useAction(
        adminUpdateBooking,
        {
            onSuccess() {
                toast.success('Agendamento atualizado com sucesso!');
                setIsEditDialogOpen(false);
                setNewDate('');
                setNewTime('');
                onSuccess?.();
            },
            onError(result) {
                const message =
                    result.error?.validationErrors?._errors?.[0] ||
                    'Erro ao atualizar agendamento';
                toast.error(message);
            },
        }
    );

    const { execute: executeCancel, isPending: isCancelling } = useAction(
        adminCancelBooking,
        {
            onSuccess() {
                toast.success('Agendamento cancelado com sucesso!');
                setIsCancelDialogOpen(false);
                onSuccess?.();
            },
            onError(result) {
                const message =
                    result.error?.validationErrors?._errors?.[0] ||
                    'Erro ao cancelar agendamento';
                toast.error(message);
            },
        }
    );

    const handleUpdate = () => {
        if (!newDate || !newTime) {
            toast.error('Preencha a data e hora');
            return;
        }

        const [year, month, day] = newDate.split('-').map(Number);
        const [hours, minutes] = newTime.split(':').map(Number);
        const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

        executeUpdate({
            bookingId,
            barbershopId,
            date: dateTime.toISOString(),
        });
    };

    const handleCancel = () => {
        executeCancel({
            bookingId,
            barbershopId,
        });
    };

    return (
        <>
            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Agendamento</DialogTitle>
                        <DialogDescription>
                            Altere a data e hora do agendamento
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold">Cliente</Label>
                            <div className="p-3 bg-slate-100 rounded-lg text-slate-900">
                                {clientName}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold">Serviço</Label>
                            <div className="p-3 bg-slate-100 rounded-lg text-slate-900">
                                {serviceName}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Data</Label>
                                <Input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="h-10 rounded-lg border-slate-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Hora</Label>
                                {isLoadingTimeSlots ? (
                                    <div className="flex items-center justify-center py-2 text-slate-500 h-10 border border-slate-300 rounded-lg">
                                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                        <span className="text-sm">Carregando...</span>
                                    </div>
                                ) : availableTimeSlots.length > 0 ? (
                                    <select
                                        value={newTime}
                                        onChange={(e) => setNewTime(e.target.value)}
                                        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Selecione um horário</option>
                                        {availableTimeSlots.map((slot) => (
                                            <option key={slot} value={slot}>
                                                {slot}
                                            </option>
                                        ))}
                                    </select>
                                ) : newDate ? (
                                    <div className="py-2 px-3 text-sm text-slate-500 border border-slate-300 rounded-lg bg-slate-50 h-10 flex items-center">
                                        Nenhum horário disponível
                                    </div>
                                ) : (
                                    <div className="py-2 px-3 text-sm text-slate-500 border border-slate-300 rounded-lg bg-slate-50 h-10 flex items-center">
                                        Selecione uma data
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Atual:</strong> {currentDate} às {currentTime}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isUpdating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isUpdating ? 'Atualizando...' : 'Atualizar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você tem certeza que deseja cancelar este agendamento?
                            <div className="mt-3 p-3 bg-slate-100 rounded-lg text-slate-900 text-sm">
                                <p><strong>Cliente:</strong> {clientName}</p>
                                <p><strong>Serviço:</strong> {serviceName}</p>
                                <p><strong>Data/Hora:</strong> {currentDate} às {currentTime}</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            Voltar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isCancelling ? 'Cancelando...' : 'Cancelar Agendamento'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="border-slate-300 hover:bg-slate-100 text-slate-700"
                >
                    Editar
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsCancelDialogOpen(true)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                >
                    Cancelar
                </Button>
            </div>
        </>
    );
}
