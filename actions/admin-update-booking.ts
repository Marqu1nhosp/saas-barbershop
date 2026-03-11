"use server";

import { headers } from "next/headers";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { actionClient } from "@/lib/action-client";
import { extractDashboardToken, parseDashboardToken } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";

const adminUpdateBookingSchema = z.object({
    bookingId: z.string("ID do agendamento inválido").min(1),
    barbershopId: z.string("ID da barbearia inválido").min(1),
    date: z.string("Data inválida").min(1),
});

export const adminUpdateBooking = actionClient
    .inputSchema(adminUpdateBookingSchema)
    .action(async ({ parsedInput: { bookingId, barbershopId, date } }) => {
        try {
            // Get dashboard token from headers
            const requestHeaders = await headers();
            const authHeader = requestHeaders.get('authorization') ?? undefined;
            const cookieHeader = requestHeaders.get('cookie') ?? undefined;

            const token = extractDashboardToken(authHeader, cookieHeader);

            if (!token) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Você precisa estar logado no dashboard para editar agendamentos"],
                });
            }

            const userPayload = parseDashboardToken(token);

            if (!userPayload) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Token inválido ou expirado. Faça login novamente"],
                });
            }

            // Get admin user
            const adminUser = await prisma.user.findUnique({
                where: { id: userPayload.id },
            });

            if (!adminUser || adminUser.role !== "ADMIN" || adminUser.barbershopId !== barbershopId) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Você não tem permissão para editar agendamentos nesta barbearia"],
                });
            }

            // Get booking
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
            });

            if (!booking) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Agendamento não encontrado"],
                });
            }

            if (booking.barbershopId !== barbershopId) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Este agendamento não pertence a sua barbearia"],
                });
            }

            if (booking.cancelledAt) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Não é possível editar um agendamento cancelado"],
                });
            }

            const bookingDate = new Date(date);
            const now = new Date();

            // Check if date is in the future
            if (bookingDate < now) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Não é possível agendar para um horário que já passou"],
                });
            }

            // Check if there's already a booking for this service at this date/time
            const existingBooking = await prisma.booking.findFirst({
                where: {
                    serviceId: booking.serviceId,
                    date: new Date(date),
                    cancelledAt: null,
                    id: { not: bookingId },
                },
            });

            if (existingBooking) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Já existe um agendamento para este serviço nesta data e hora"],
                });
            }

            // Update the booking
            const updatedBooking = await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    date: new Date(date),
                },
                include: {
                    user: true,
                    service: true,
                },
            });

            return updatedBooking;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao editar agendamento';
            return returnValidationErrors(adminUpdateBookingSchema, {
                _errors: [errorMessage],
            });
        }
    });
