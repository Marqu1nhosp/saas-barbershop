"use server";

import { headers } from "next/headers";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { actionClient } from "@/lib/action-client";
import { extractDashboardToken, parseDashboardToken } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";

const adminCancelBookingSchema = z.object({
    bookingId: z.string("ID do agendamento inválido").min(1),
    barbershopId: z.string("ID da barbearia inválido").min(1),
});

export const adminCancelBooking = actionClient
    .inputSchema(adminCancelBookingSchema)
    .action(async ({ parsedInput: { bookingId, barbershopId } }) => {
        try {
            // Get dashboard token from headers
            const requestHeaders = await headers();
            const authHeader = requestHeaders.get('authorization') ?? undefined;
            const cookieHeader = requestHeaders.get('cookie') ?? undefined;

            const token = extractDashboardToken(authHeader, cookieHeader);

            if (!token) {
                return returnValidationErrors(adminCancelBookingSchema, {
                    _errors: ["Você precisa estar logado no dashboard para cancelar agendamentos"],
                });
            }

            const userPayload = parseDashboardToken(token);

            if (!userPayload) {
                return returnValidationErrors(adminCancelBookingSchema, {
                    _errors: ["Token inválido ou expirado. Faça login novamente"],
                });
            }

            // Get admin user
            const adminUser = await prisma.user.findUnique({
                where: { id: userPayload.id },
            });

            if (!adminUser || adminUser.barbershopId !== barbershopId) {
                return returnValidationErrors(adminCancelBookingSchema, {
                    _errors: ["Você não tem permissão para cancelar agendamentos nesta barbearia"],
                });
            }

            // Verificar se o usuário é ADMIN ou EMPLOYEE
            if (adminUser.role !== "ADMIN" && adminUser.role !== "EMPLOYEE") {
                return returnValidationErrors(adminCancelBookingSchema, {
                    _errors: ["Apenas administradores e funcionários podem cancelar agendamentos"],
                });
            }

            // Get booking
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
            });

            if (!booking) {
                return returnValidationErrors(adminCancelBookingSchema, {
                    _errors: ["Agendamento não encontrado"],
                });
            }

            if (booking.barbershopId !== barbershopId) {
                return returnValidationErrors(adminCancelBookingSchema, {
                    _errors: ["Este agendamento não pertence a sua barbearia"],
                });
            }

            if (booking.cancelledAt) {
                return returnValidationErrors(adminCancelBookingSchema, {
                    _errors: ["Este agendamento já foi cancelado"],
                });
            }

            // Cancel the booking
            const cancelledBooking = await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    cancelledAt: new Date(),
                },
                include: {
                    user: true,
                    service: true,
                },
            });

            return cancelledBooking;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao cancelar agendamento';
            return returnValidationErrors(adminCancelBookingSchema, {
                _errors: [errorMessage],
            });
        }
    });
