"use client";


import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createBookingCheckoutSession } from "@/actions/create-booking-checkout-session";
import { BookingSummary } from "@/components/booking-summary";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Barbershop } from "@/generated/prisma/client";
import { useGetAvailableEmployees } from "@/hooks/data/useGetAvailableEmployees";
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
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>(
    undefined
  );
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const employeesScrollRef = useRef<HTMLDivElement>(null);
  const employeesUnavailableScrollRef = useRef<HTMLDivElement>(null);
  
  // Use refs instead of state for drag tracking to avoid stale closure issues
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    dragRefId: null as string | null,
    dragDistance: 0,
  });

  const handleDragStart = (ref: React.RefObject<HTMLDivElement | null>, refId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!ref.current) return;
    e.stopPropagation();
    const pageX = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
    dragStateRef.current = {
      isDragging: true,
      startX: pageX,
      scrollLeft: ref.current?.scrollLeft || 0,
      dragRefId: refId,
      dragDistance: 0,
    };
  };

  const handleDragMove = (ref: React.RefObject<HTMLDivElement | null>, refId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStateRef.current.isDragging || dragStateRef.current.dragRefId !== refId || !ref.current) return;
    e.stopPropagation();
    const pageX = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
    const walk = (pageX - dragStateRef.current.startX) * 2;
    dragStateRef.current.dragDistance = Math.abs(walk);
    
    const newScrollLeft = dragStateRef.current.scrollLeft - walk;
    ref.current.scrollLeft = newScrollLeft;
  };

  const handleDragEnd = () => {
    dragStateRef.current.isDragging = false;
    dragStateRef.current.dragRefId = null;
  };

  const canClickButton = () => {
    return dragStateRef.current.dragDistance < 25; // Threshold of 25px for click
  };

  // Global drag end listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        handleDragEnd();
      }
    };

    const handleGlobalTouchEnd = () => {
      if (dragStateRef.current.isDragging) {
        handleDragEnd();
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, []);

  const { data: availableTimeSlots } = useGetDateAvailableTimeSlots({
    barbershopId: service.barbershopId,
    date: selectedDate,
  })

  // Build the dateTime for employee availability check
  const employeeDateTimeCheck = selectedDate && selectedTime
    ? (() => {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      return new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes,
        0,
        0
      );
    })()
    : undefined;

  const { data: availableEmployees, isPending: isLoadingEmployees } = useGetAvailableEmployees({
    barbershopId: service.barbershopId,
    dateTime: employeeDateTimeCheck,
  });
  
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
      employeeId: selectedEmployee,
    });

    setSheetIsOpen(false);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setSelectedEmployee(undefined);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-6 p-5 overflow-y-auto overscroll-contain">
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
              <div 
                ref={timeScrollRef}
                className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={(e) => handleDragStart(timeScrollRef, "time", e)}
                onTouchStart={(e) => handleDragStart(timeScrollRef, "time", e)}
                onMouseMove={(e) => handleDragMove(timeScrollRef, "time", e)}
                onTouchMove={(e) => handleDragMove(timeScrollRef, "time", e)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchEnd={handleDragEnd}
              >
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
                    onClick={() => {
                      if (!canClickButton()) return;
                      handleTimeSelect(time);
                      setSelectedEmployee(undefined); // Reset employee when time changes
                    }}
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

        {/* Employee Selection */}
        {selectedDate && selectedTime && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase">Barbeiro (Opcional)</h3>
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
                    <div 
                      ref={employeesScrollRef}
                      className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2 cursor-grab active:cursor-grabbing select-none"
                      onMouseDown={(e) => handleDragStart(employeesScrollRef, "available", e)}
                      onTouchStart={(e) => handleDragStart(employeesScrollRef, "available", e)}
                      onMouseMove={(e) => handleDragMove(employeesScrollRef, "available", e)}
                      onTouchMove={(e) => handleDragMove(employeesScrollRef, "available", e)}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      onTouchEnd={handleDragEnd}
                    >
                      {availableEmployees.available.map((employee) => (
                        <Button
                          key={employee.id}
                          variant={selectedEmployee === employee.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (!canClickButton()) return;
                            setSelectedEmployee(employee.id);
                          }}
                          className="flex items-center gap-2"
                        >
                          {employee.image && (
                            <Avatar className="w-5 h-5">
                              <Image
                                src={employee.image}
                                alt={employee.name}
                                width={20}
                                height={20}
                                className="w-full h-full object-cover rounded-full"
                              />
                            </Avatar>
                          )}
                          <span className="text-xs">{employee.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unavailable Employees */}
                {availableEmployees.unavailable.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Indisponíveis</p>
                    <div 
                      ref={employeesUnavailableScrollRef}
                      className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2 opacity-50 cursor-grab active:cursor-grabbing select-none"
                      onMouseDown={(e) => handleDragStart(employeesUnavailableScrollRef, "unavailable", e)}
                      onTouchStart={(e) => handleDragStart(employeesUnavailableScrollRef, "unavailable", e)}
                      onMouseMove={(e) => handleDragMove(employeesUnavailableScrollRef, "unavailable", e)}
                      onTouchMove={(e) => handleDragMove(employeesUnavailableScrollRef, "unavailable", e)}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      onTouchEnd={handleDragEnd}
                    >
                      {availableEmployees.unavailable.map((employee) => (
                        <Button
                          key={employee.id}
                          variant="outline"
                          size="sm"
                          disabled
                          className="flex items-center gap-2"
                        >
                          {employee.image && (
                            <Avatar className="w-5 h-5">
                              <Image
                                src={employee.image}
                                alt={employee.name}
                                width={20}
                                height={20}
                                className="w-full h-full object-cover rounded-full"
                              />
                            </Avatar>
                          )}
                          <span className="text-xs">{employee.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">Se nenhum barbeiro for selecionado, será atribuído automaticamente</p>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Nenhum barbeiro cadastrado</p>
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
