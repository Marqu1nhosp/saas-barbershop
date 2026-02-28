"use client";


import { loadStripe } from "@stripe/stripe-js";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { createBookingCheckoutSession } from "@/actions/create-booking-checkout-session";
import { BookingSummary } from "@/components/booking-summary";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Barbershop } from "@/generated/prisma/client";
import { useGetDateAvailableTimeSlots } from "@/hooks/data/useGetDataAvailableTimeSlots";
interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    name: string;
    barbershopId: string;
    priceInCents?: number | null;
    imageUrl?: string | null;
  };
  barbershop: Barbershop;
}
const today = new Date();
today.setHours(0, 0, 0, 0);

export function BookingSheet({
  open,
  onOpenChange,
  service,
  barbershop,
}: BookingSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined
  );
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const { data: availableTimeSlots } = useGetDateAvailableTimeSlots({
    barbershopId: service.barbershopId,
    date: selectedDate,
  })
  const now = new Date();


  const { execute: executeCreateBooking, isPending: isCreateBooking } = useAction(
    createBookingCheckoutSession,
    {
      async onSuccess(result) {
        const checkoutSession = result.data;
        if (!checkoutSession.url) {
          return toast.error("Não foi possível iniciar o processo de pagamento. Tente novamente.");
        }

        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          return toast.error("Chave de publicação do Stripe não está definida.");
        }

        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          return toast.error("Não foi possível iniciar o processo de agendamento. Tente novamente.");
        }

        await stripe.redirectToCheckout({
          sessionId: checkoutSession.id,
        });


        onOpenChange(false);
        setSelectedDate(undefined);
        setSelectedTime(undefined);
      },

      onError(result) {
        const message =
          result.error?.validationErrors?._errors?.[0] ??
          result.error?.serverError ??
          (result.error as Error)?.message ??
          "Por favor, faça um login para fazer um agendamento!";

        toast.error(message);
      },
    }
  );


  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);

    const date = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    await executeCreateBooking({
      serviceId: service.id,
      date: date.toISOString(),
    });

    setSheetIsOpen(false);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-6 p-5">
        <SheetHeader className="space-y-4">
          <SheetTitle>Reservar {service.name}</SheetTitle>
          <div className="text-xs text-muted-foreground">
            {barbershop.name}
          </div>
        </SheetHeader>

        {/* Calendar */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase">Data</h3>
          <Calendar
            selected={selectedDate}
            onSelect={handleDaySelect}
            disabled={(date) => date < today}
          />
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase">Horário</h3>
            {availableTimeSlots?.data && availableTimeSlots.data.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2">
                {availableTimeSlots.data.filter((time) => {
                  if (!selectedDate) return false;

                  const [hours, minutes] = time.split(":").map(Number);
                  const slotDate = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    hours,
                    minutes,
                    0,
                    0
                  );

                  if (selectedDate.toDateString() === now.toDateString()) {
                    return slotDate > now;
                  }

                  return true;
                }).map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSelect(time)}
                    className="shrink-0"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm font-medium">Barbearia fechada</p>
                <p className="text-xs">Nenhum horário disponível para este dia</p>
              </div>
            )}
          </div>
        )}

        {selectedDate && selectedTime && (
          <BookingSummary
            serviceName={service.name}
            barbershopName={barbershop.name}
            serviceImageUrl={service.imageUrl}
            date={selectedDate}
            time={selectedTime}
            priceInCents={service.priceInCents}
          />
        )}

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmBooking}
          disabled={!selectedDate || !selectedTime || isCreateBooking || sheetIsOpen}
          className="w-full mt-auto"
        >
          {isCreateBooking ? "Confirmando..." : "Confirmar agendamento"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
