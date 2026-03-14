"use client";

import { ArrowLeft, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { cancelBooking } from "@/actions/cancel-booking";
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
    const { status, isCancelled } = getBookingStatus(
        booking.date,
        booking.cancelledAt,
    );

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

    const bookingDate = new Date(booking.date);
    const hours = bookingDate.getHours().toString().padStart(2, "0");
    const minutes = bookingDate.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;

    const handleCancelBooking = () => {
        executeCancelBooking({ bookingId: booking.id });
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

                        {booking.employee && (
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
                    </div>

                    {status === "confirmado" && !isCancelled && (
                        <div className="mt-auto">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => setShowCancelDialog(true)}
                            >
                                Cancelar Reserva
                            </Button>
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


