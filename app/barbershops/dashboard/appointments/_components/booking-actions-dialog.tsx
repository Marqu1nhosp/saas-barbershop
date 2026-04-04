'use client';

import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminCancelBooking } from '@/actions/admin-cancel-booking';
import { adminUpdateBooking } from '@/actions/admin-update-booking';
import { getAvailableEmployees } from '@/actions/get-available-employees';
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
    cancelledAt?: string | null;
    onSuccess?: () => void;
}

export function BookingActionsDialog({
    bookingId,
    barbershopId,
    clientName,
    serviceName,
    currentDate,
    currentTime,
    cancelledAt,
    onSuccess,
}: BookingActionsDialogProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const [timeSlotError, setTimeSlotError] = useState<string>('');
    const [availableEmployees, setAvailableEmployees] = useState<{ available: any[], unavailable: any[] }>({ available: [], unavailable: [] });
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

    // Carregar horários disponíveis quando a data muda
    useEffect(() => {
        if (!newDate || !barbershopId) {
            setAvailableTimeSlots([]);
            setTimeSlotError('');
            return;
        }

        const loadTimeSlots = async () => {
            setIsLoadingTimeSlots(true);
            setTimeSlotError('');
            try {
                const [year, month, day] = newDate.split('-').map(Number);
                const date = new Date(year, month - 1, day, 0, 0, 0, 0);

                const result = await getDateAvailableTimeSlots({
                    barbershopId,
                    date,
                });

                // Handle both array result and object with data property
                let slots: string[] = [];
                if (Array.isArray(result)) {
                    slots = result;
                } else if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
                    slots = result.data;
                }

                if (slots && slots.length > 0) {
                    setAvailableTimeSlots(slots);
                    setNewTime('');
                } else if (slots && slots.length === 0) {
                    setAvailableTimeSlots([]);
                    setTimeSlotError('Nenhum horário disponível para esta data');
                } else {
                    setAvailableTimeSlots([]);
                    setTimeSlotError('Erro ao carregar horários');
                }
            } catch (error) {
                setAvailableTimeSlots([]);
                setTimeSlotError('Erro ao carregar horários');
            } finally {
                setIsLoadingTimeSlots(false);
            }
        };

        loadTimeSlots();
    }, [newDate, barbershopId]);

    // Carregar profissionais disponíveis quando data e hora mudam
    useEffect(() => {
        if (!newDate || !newTime || !barbershopId) {
            setAvailableEmployees({ available: [], unavailable: [] });
            return;
        }

        const loadEmployees = async () => {
            setIsLoadingEmployees(true);
            try {
                const [year, month, day] = newDate.split('-').map(Number);
                const [hours, minutes] = newTime.split(':').map(Number);
                const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

                const result = await getAvailableEmployees({
                    barbershopId,
                    dateTime,
                });

                // Handle both direct result and object with data property
                let employees: { available: any[], unavailable: any[] } = { available: [], unavailable: [] };
                if (result && typeof result === 'object' && 'available' in result) {
                    employees = result as { available: any[], unavailable: any[] };
                } else if (result && typeof result === 'object' && 'data' in result && result.data) {
                    employees = result.data as { available: any[], unavailable: any[] };
                }

                setAvailableEmployees(employees);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                setAvailableEmployees({ available: [], unavailable: [] });
            } finally {
                setIsLoadingEmployees(false);
            }
        };

        loadEmployees();
    }, [newDate, newTime, barbershopId]);

    // Reset states when edit dialog closes
    useEffect(() => {
        if (!isEditDialogOpen) {
            setNewDate('');
            setNewTime('');
            setSelectedEmployee(null);
            setAvailableTimeSlots([]);
            setTimeSlotError('');
            setAvailableEmployees({ available: [], unavailable: [] });
        }
    }, [isEditDialogOpen]);

    const { execute: executeUpdate, isPending: isUpdating } = useAction(
        adminUpdateBooking,
        {
            onSuccess() {
                toast.success('Agendamento atualizado com sucesso!');
                setIsEditDialogOpen(false);
                setNewDate('');
                setNewTime('');
                setSelectedEmployee(null);
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
            employeeId: selectedEmployee || undefined,
        });
    };

    const handleCancel = () => {
        executeCancel({
            bookingId,
            barbershopId,
        });
    };

    // Verificar se a data do agendamento é passada
    const isDatePassed = (() => {
        try {
            const [day, month, year] = currentDate.split('/').map(Number);
            const bookingDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate < today;
        } catch {
            return false;
        }
    })();

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
                                        <span className="text-sm">Carregando horários...</span>
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
                                ) : timeSlotError ? (
                                    <div className="py-2 px-3 text-sm text-red-600 border border-red-300 rounded-lg bg-red-50 h-10 flex items-center">
                                        {timeSlotError}
                                    </div>
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

                        {newDate && newTime && (
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Profissional (Opcional)</Label>
                                {isLoadingEmployees ? (
                                    <div className="flex items-center justify-center py-4 text-slate-500">
                                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                        <span className="text-sm">Carregando profissionais...</span>
                                    </div>
                                ) : availableEmployees.available.length > 0 || availableEmployees.unavailable.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-2">
                                        {/* Available Employees */}
                                        {availableEmployees.available.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-slate-600">Disponíveis</p>
                                                {availableEmployees.available.map((employee) => (
                                                    <button
                                                        key={employee.id}
                                                        onClick={() => setSelectedEmployee(employee.id)}
                                                        className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left ${
                                                            selectedEmployee === employee.id
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-slate-300 bg-white hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {employee.image && (
                                                            <div className="relative shrink-0 w-8 h-8 rounded-md bg-slate-200 overflow-hidden">
                                                                <Image
                                                                    src={employee.image}
                                                                    alt={employee.name}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="2rem"
                                                                />
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-medium text-slate-900">{employee.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Unavailable Employees */}
                                        {availableEmployees.unavailable.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-slate-600">Indisponíveis</p>
                                                {availableEmployees.unavailable.map((employee) => (
                                                    <div
                                                        key={employee.id}
                                                        className="w-full flex items-center gap-3 p-2 rounded-lg border border-slate-300 bg-slate-50 opacity-50"
                                                    >
                                                        {employee.image && (
                                                            <div className="relative shrink-0 w-8 h-8 rounded-md bg-slate-200 overflow-hidden">
                                                                <Image
                                                                    src={employee.image}
                                                                    alt={employee.name}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="2rem"
                                                                />
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-medium text-slate-500">{employee.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-4 px-3 text-sm text-slate-500 border border-slate-300 rounded-lg bg-slate-50 text-center">
                                        Nenhum profissional disponível para este horário
                                    </div>
                                )}
                                {selectedEmployee && (
                                    <button
                                        onClick={() => setSelectedEmployee(null)}
                                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        Limpar seleção
                                    </button>
                                )}
                            </div>
                        )}
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
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-900 text-sm space-y-2">
                        <div><strong>Cliente:</strong> {clientName}</div>
                        <div><strong>Serviço:</strong> {serviceName}</div>
                        <div><strong>Data/Hora:</strong> {currentDate} às {currentTime}</div>
                    </div>
                    
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
                    onClick={() => setIsEd || !!cancelledAt}
                    title={cancelledAt ? 'Não é possível editar agendamentos cancelados' : isDatePassed ? 'Não é possível editar agendamentos passados' : ''}
                    className={`border-slate-300 text-slate-700 ${
                        (isDatePassed || cancelledAt) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-slate-100'
                    }`}
                >
                    Editar
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsCancelDialogOpen(true)}
                    disabled={isDatePassed || !!cancelledAt}
                    title={cancelledAt ? 'Este agendamento já foi cancelado' : isDatePassed ? 'Não é possível cancelar agendamentos passados' : ''}
                    className={`bg-red-50 text-red-600 border border-red-200 ${
                        (isDatePassed || cancelledAt)ed-50 text-red-600 border border-red-200 ${
                        isDatePassed 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-red-100'
                    }`}
                >
                    Cancelar
                </Button>
            </div>
        </>
    );
}
