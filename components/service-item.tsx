"use client";

import Image from "next/image";
import { useState } from "react";

import { BookingSheet } from "@/components/booking-sheet";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Barbershop } from "@/generated/prisma/client";

type ServiceItemProps = {
    service: {
        id: string;
        name: string;
        description?: string | null;
        priceInCents?: number | null;
        imageUrl?: string | null;
        barbershopId: string;
    };
    barbershop: Barbershop;
};

export function ServiceItem({ service, barbershop }: ServiceItemProps) {
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    const price =
        service.priceInCents != null
            ? new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
            }).format(service.priceInCents / 100)
            : null;

    return (
        <>
            <Card className="p-3">
                <CardHeader className="flex items-start gap-4 p-0">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                        {service.imageUrl ? (
                            <Image
                                src={service.imageUrl}
                                alt={service.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                                {price}
                            </div>
                        )}
                    </div>


                    <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                            {service.name}
                        </CardTitle>

                        {service.description && (
                            <CardDescription className="mt-1">
                                {service.description}
                            </CardDescription>
                        )}

                        {price && (
                            <div className="mt-2 text-sm font-semibold text-black">
                                {price}
                            </div>
                        )}
                    </div>

                    {/* Action */}
                    <CardAction>
                        <Button size="sm" onClick={() => setIsBookingOpen(true)}>
                            Reservar
                        </Button>
                    </CardAction>
                </CardHeader>
            </Card>

            <BookingSheet
                open={isBookingOpen}
                onOpenChange={setIsBookingOpen}
                service={service}
                barbershop={barbershop}
            />
        </>
    );
}
