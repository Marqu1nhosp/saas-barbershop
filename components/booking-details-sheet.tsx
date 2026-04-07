"use client";

import { ArrowLeft, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cancelBooking } from "@/actions/cancel-booking";
import { updateBookingEmployee } from "@/actions/update-booking-employee";
import CopyButton from "@/app/barbershops/[id]/_components/copy-button";
import { BookingSummary } from "@/components/booking-summary";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useGetAvailableEmployees } from "@/hooks/data/useGetAvailableEmployees";
import { canCancelByPolicy, getCancellationPolicyMessage } from "@/lib/cancellation-policy";
import { getBookingStatus } from "@/lib/booking-utils";

interface BookingDetailsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking: {
        id: string;
        date: Date | string;
        cancelledAt: Date | string | null;
        service: {
            id: string;
            name: string;
            imageUrl: string | null;
            priceInCents: number | null;
        };
        barbershop: {
            id: string;
            name: string;
            address: string;
            imageUrl: string;
            phones: string[];
            cancellationNoticeHours?: number;
        };
        employee?: {
            id: string;
            name: string;
            image?: string | null;
        } | null;
    };
}

export function BookingDetailsSheet({
    open,
    onOpenChange,
    booking,
}: BookingDetailsSheetProps) {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>(booking.employee?.id);
    const { status, isCancelled } = getBookingStatus(
        booking.date,
        booking.cancelledAt,
    );

    const bookingDate = new Date(booking.date);
    const cancellationNoticeHours = booking.barbershop.cancellationNoticeHours ?? 2;
    const canCancelNow = canCancelByPolicy(booking.date, cancellationNoticeHours);
    const cancellationPolicyMessage = getCancellationPolicyMessage(cancellationNoticeHours);

    const { data: availableEmployees, isPending: isLoadingEmployees } = useGetAvailableEmployees({
        barbershopId: booking.barbershop.id,
        dateTime: bookingDate,
    });

    const { execute: executeCancelBooking, isPending: isCancelling } = useAction(
        cancelBooking,
        {
            onSuccess() {
                toast.success("Agendamento cancelado com sucesso!");
                setShowCancelDialog(false);
                onOpenChange(false);
            },
            onError(result) {
                const message =
                    result.error?.validationErrors?._errors?.[0] ??
                    result.error?.serverError ??
                    (result.error as Error)?.message ??
                    "Erro ao cancelar agendamento.";

                toast.error(message);
            },
        },
    );

    const { execute: executeUpdateEmployee, isPending: isUpdatingEmployee } = useAction(
        updateBookingEmployee,
        {
            onSuccess() {
                toast.success("Profissional atualizado com sucesso!");
                setIsEditing(false);
            },
            onError(result) {
                const message =
                    result.error?.validationErrors?._errors?.[0] ??
                    result.error?.serverError ??
                    (result.error as Error)?.message ??
                    "Erro ao atualizar profissional.";

                toast.error(message);
            },
        },
    );

    useEffect(() => {
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsEditing(false);
            setSelectedEmployee(booking.employee?.id);
        }
    }, [open, booking.employee?.id]);

    const bookingTime = new Date(booking.date);
    const hours = bookingTime.getHours().toString().padStart(2, "0");
    const minutes = bookingTime.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;

    const handleCancelBooking = () => {
        executeCancelBooking({ bookingId: booking.id });
    };

    const handleUpdateEmployee = () => {
        executeUpdateEmployee({
            bookingId: booking.id,
            employeeId: selectedEmployee || null,
        });
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="flex flex-col gap-6 p-5 overflow-y-auto">
                    <SheetHeader className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <SheetTitle className="flex-1">
                                Detalhes do Agendamento
                            </SheetTitle>
                        </div>
                    </SheetHeader>

                    <BookingSummary
                        serviceName={booking.service.name}
                        barbershopName={booking.barbershop.name}
                        serviceImageUrl={booking.service.imageUrl}
                        date={booking.date}
                        time={time}
                        priceInCents={booking.service.priceInCents}
                    />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase">
                                Informações da Barbearia
                            </h3>
                            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="relative shrink-0 w-12 h-12 rounded-md bg-muted overflow-hidden">
                                        <Image
                                            src={booking.barbershop.imageUrl}
                                            alt={booking.barbershop.name}
                                            fill
                                            className="object-cover"
                                            sizes="3rem"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">
                                            {booking.barbershop.name}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">
                                                {booking.barbershop.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {booking.barbershop.phones.length > 0 && (
                                    <div className="space-y-2 border-t border-border pt-3">
                                        {booking.barbershop.phones.map(
                                            (phone, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {phone}
                                                        </span>
                                                    </div>
                                                    <CopyButton text={phone} />
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isEditing && booking.employee && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase">
                                    Barbeiro
                                </h3>
                                <div className="rounded-lg border border-border bg-card p-4">
                                    <div className="flex items-center gap-3">
                                        {booking.employee.image && (
                                            <div className="relative shrink-0 w-12 h-12 rounded-md bg-muted overflow-hidden">
                                                <Image
                                                    src={booking.employee.image}
                                                    alt={booking.employee.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="3rem"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">
                                                {booking.employee.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEditing && status === "confirmado" && !isCancelled && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase">
                                    Escolher Barbeiro
                                </h3>
                                {isLoadingEmployees ? (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <p className="text-sm">Carregando barbeiros disponíveis...</p>
                                    </div>
                                ) : availableEmployees && (availableEmployees.available?.length > 0 || availableEmployees.unavailable?.length > 0) ? (
                                    <div className="space-y-3">
                                        {/* Available Employees */}
                                        {availableEmployees.available.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground">Disponíveis</p>
                                                <div className="flex flex-col gap-2">
                                                    {availableEmployees.available.map((employee) => (
                                                        <Button
                                                            key={employee.id}
                                                            variant={selectedEmployee === employee.id ? "default" : "outline"}
                                                            onClick={() => setSelectedEmployee(employee.id)}
                                                            className="flex items-center gap-3 h-auto py-2 px-3"
                                                        >
                                                            {employee.image && (
                                                                <div className="relative shrink-0 w-8 h-8 rounded-md bg-muted overflow-hidden">
                                                                    <Image
                                                                        src={employee.image}
                                                                        alt={employee.name}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="2rem"
                                                                    />
                                                                </div>
                                                            )}
                                                            <p className="text-sm font-medium">{employee.name}</p>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Unavailable Employees */}
                                        {availableEmployees.unavailable.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground">Indisponíveis</p>
                                                <div className="flex flex-col gap-2">
                                                    {availableEmployees.unavailable.map((employee) => (
                                                        <div
                                                            key={employee.id}
                                                            className="flex items-center gap-3 h-auto py-2 px-3 rounded-md border border-muted bg-muted/50 opacity-50"
                                                        >
                                                            {employee.image && (
                                                                <div className="relative shrink-0 w-8 h-8 rounded-md bg-muted overflow-hidden">
                                                                    <Image
                                                                        src={employee.image}
                                                                        alt={employee.name}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="2rem"
                                                                    />
                                                                </div>
                                                            )}
                                                            <p className="text-sm font-medium text-muted-foreground">{employee.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <p className="text-sm">Nenhum barbeiro disponível para este horário</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {status === "confirmado" && !isCancelled && (
                        <div className="mt-auto space-y-3">
                            {!canCancelNow && (
                                <p className="text-xs text-muted-foreground">
                                    {cancellationPolicyMessage}
                                </p>
                            )}
                            {isEditing ? (
                                <>
                                    <Button
                                        className="w-full"
                                        onClick={handleUpdateEmployee}
                                        disabled={isUpdatingEmployee}
                                    >
                                        {isUpdatingEmployee ? "Atualizando..." : "Confirmar Profissional"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setSelectedEmployee(booking.employee?.id);
                                        }}
                                        disabled={isUpdatingEmployee}
                                    >
                                        Cancelar
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Editar Profissional
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => setShowCancelDialog(true)}
                                        disabled={!canCancelNow}
                                    >
                                        Cancelar Reserva
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Cancelar Agendamento
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja cancelar este agendamento?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelBooking}
                            disabled={isCancelling}
                        >
                            {isCancelling ? "Cancelando..." : "Cancelar Reserva"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


