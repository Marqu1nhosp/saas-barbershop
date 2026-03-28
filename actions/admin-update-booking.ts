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
    employeeId: z.string().uuid().nullable().optional(),
});

export const adminUpdateBooking = actionClient
    .inputSchema(adminUpdateBookingSchema)
    .action(async ({ parsedInput: { bookingId, barbershopId, date, employeeId } }) => {
        try {
            // Obter token do dashboard dos headers
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

            // Obter usuário admin
            const adminUser = await prisma.user.findUnique({
                where: { id: userPayload.id },
            });

            if (!adminUser || adminUser.barbershopId !== barbershopId) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Você não tem permissão para editar agendamentos nesta barbearia"],
                });
            }

            // Verificar se o usuário é ADMIN ou EMPLOYEE
            if (adminUser.role !== "ADMIN" && adminUser.role !== "EMPLOYEE") {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Apenas administradores e funcionários podem editar agendamentos"],
                });
            }

            // Obter agendamento
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

            // Verifique se a data está no futuro.
            if (bookingDate < now) {
                return returnValidationErrors(adminUpdateBookingSchema, {
                    _errors: ["Não é possível agendar para um horário que já passou"],
                });
            }

            // Verifique se já existe uma reserva para este serviço nesta data/hora.
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

            // Se um profissional foi escolhido, validar se existe e pertence à barbearia
            if (employeeId) {
                const employee = await prisma.user.findFirst({
                    where: {
                        id: employeeId,
                        barbershopId: barbershopId,
                        role: "EMPLOYEE",
                    },
                });

                if (!employee) {
                    return returnValidationErrors(adminUpdateBookingSchema, {
                        _errors: ["Profissional não encontrado ou não pertence a esta barbearia"],
                    });
                }
            }

            // Atualizar o agendamento
            const updatedBooking = await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    date: new Date(date),
                    ...(employeeId !== undefined && { employeeId: employeeId }),
                },
                include: {
                    user: true,
                    service: true,
                    employee: true,
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
