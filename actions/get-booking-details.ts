"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { protectedActionClient } from "@/lib/action-client";
import prisma from "@/lib/prisma";

const inputSchema = z.object({
    bookingId: z.string().uuid(),
});

export const getBookingDetails = protectedActionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { bookingId }, ctx: { user } }) => {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        priceInCents: true,
                    },
                },
                barbershop: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        imageUrl: true,
                        phones: true,
                        cancellationNoticeHours: true,
                    },
                },
                employee: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        if (!booking) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Agendamento não encontrado"],
            });
        }

        if (booking.userId !== user.id) {
            return returnValidationErrors(inputSchema, {
                _errors: [
                    "Você não tem permissão para visualizar este agendamento",
                ],
            });
        }

        return booking;
    });


