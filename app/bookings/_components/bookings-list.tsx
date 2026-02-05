"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { getBookingDetails } from "@/actions/get-booking-details";
import { BookingDetailsSheet } from "@/components/booking-details-sheet";
import { BookingItem } from "@/components/booking-tem";

type BookingWithDetails =
    Omit<Booking, "barbershop"> & {
        barbershop: {
            id: string;
            name: string;
            address: string;
            imageUrl: string;
            phones: string[];
        };
    };

interface Booking {
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
        imageUrl: string;
    };
}

interface BookingsListProps {
    bookings: Booking[];
}

export function BookingsList({ bookings }: BookingsListProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<BookingWithDetails | null>(null);

    const { execute: executeGetBookingDetails } = useAction(getBookingDetails, {
        onSuccess({ data }) {
            if (data) {
                setBookingDetails(data);
                setIsSheetOpen(true);
            }
        },
        onError(result) {
            const message =
                result.error?.validationErrors?._errors?.[0] ??
                result.error?.serverError ??
                (result.error as Error)?.message ??
                "Erro ao carregar detalhes do agendamento.";

            toast.error(message);
        },
    });

    const handleBookingClick = (bookingId: string) => {
        executeGetBookingDetails({ bookingId });
    };

    return (
        <>
            {bookings.map((booking) => (
                <div key={booking.id} className="w-full">
                    <BookingItem
                        bookingId={booking.id}
                        serviceName={booking.service.name}
                        barbershopName={booking.barbershop.name}
                        barbershopImageUrl={booking.barbershop.imageUrl}
                        date={booking.date}
                        cancelledAt={booking.cancelledAt}
                        onClick={() => handleBookingClick(booking.id)}
                    />
                </div>
            ))}

            {bookingDetails && (
                <BookingDetailsSheet
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    booking={bookingDetails}
                />
            )}
        </>
    );
}

