"use server";

import { headers } from "next/headers";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { actionClient } from "@/lib/action-client";
import { extractDashboardToken, parseDashboardToken } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";

const adminCreateBookingSchema = z.object({
    clientId: z.string("ID do cliente inválido").min(1),
    serviceId: z.string("ID do serviço inválido").min(1),
    date: z.string("Data inválida").min(1),
    barbershopId: z.string("ID da barbearia inválido").min(1),
    employeeId: z.string("ID do barbeiro inválido").optional(),
});

export const adminCreateBooking = actionClient
    .inputSchema(adminCreateBookingSchema)
    .action(async ({ parsedInput: { clientId, serviceId, date, barbershopId, employeeId } }) => {
        try {
            // Get dashboard token from headers
            const requestHeaders = await headers();
            const authHeader = requestHeaders.get('authorization') ?? undefined;
            const cookieHeader = requestHeaders.get('cookie') ?? undefined;

            const token = extractDashboardToken(authHeader, cookieHeader);

            if (!token) {
                return returnValidationErrors(adminCreateBookingSchema, {
                    _errors: ["Você precisa estar logado no dashboard para criar agendamentos"],
                });
            }

            const userPayload = parseDashboardToken(token);

            if (!userPayload) {
                return returnValidationErrors(adminCreateBookingSchema, {
                    _errors: ["Token inválido ou expirado. Faça login novamente"],
                });
            }

            // Get admin user
            const adminUser = await prisma.user.findUnique({
                where: { id: userPayload.id },
            });

            if (!adminUser || adminUser.role !== "ADMIN" || adminUser.barbershopId !== barbershopId) {
                return returnValidationErrors(adminCreateBookingSchema, {
                    _errors: ["Você não tem permissão para criar agendamentos nesta barbearia"],
                });
            }

            const bookingDate = new Date(date);
            const now = new Date();

            // Verificar se a data/hora já passou
            if (bookingDate < now) {
                return returnValidationErrors(adminCreateBookingSchema, {
                    _errors: ["Não é possível agendar para um horário que já passou"],
                });
            }

            // Verificar se o cliente existe
            const client = await prisma.user.findUnique({
                where: { id: clientId },
            });

            if (!client) {
                return returnValidationErrors(adminCreateBookingSchema, {
                    _errors: ["Cliente não encontrado"],
                });
            }

            // Verificar se o serviço existe na barbearia
            const service = await prisma.barbershopService.findUnique({
                where: { id: serviceId },
            });

            if (!service || service.barbershopId !== barbershopId) {
                return returnValidationErrors(adminCreateBookingSchema, {
                    _errors: ["Serviço não encontrado ou não pertence a esta barbearia"],
                });
            }

            // Se um barbeiro foi especificado, validar
            if (employeeId) {
                const employee = await prisma.user.findFirst({
                    where: {
                        id: employeeId,
                        barbershopId,
                        role: "EMPLOYEE",
                    },
                });

                if (!employee) {
                    return returnValidationErrors(adminCreateBookingSchema, {
                        _errors: ["Barbeiro não encontrado ou não pertence a esta barbearia"],
                    });
                }

                // Verificar disponibilidade do barbeiro no horário
                const employeeBookingAtTime = await prisma.booking.findFirst({
                    where: {
                        employeeId,
                        date: new Date(date),
                        cancelledAt: null,
                    },
                });

                if (employeeBookingAtTime) {
                    return returnValidationErrors(adminCreateBookingSchema, {
                        _errors: ["Este barbeiro já possui um agendamento neste horário"],
                    });
                }
            }

            // Verificar se já existe agendamento para este serviço no mesmo horário (se sem barbeiro específico)
            if (!employeeId) {
                const existingBooking = await prisma.booking.findFirst({
                    where: {
                        serviceId,
                        date: new Date(date),
                        cancelledAt: null,
                    },
                });

                if (existingBooking) {
                    return returnValidationErrors(adminCreateBookingSchema, {
                        _errors: ["Já existe um agendamento para este serviço nesta data e hora"],
                    });
                }
            }

            // Criar o agendamento
            const booking = await prisma.booking.create({
                data: {
                    userId: clientId,
                    serviceId,
                    barbershopId,
                    date: new Date(date),
                    employeeId: employeeId || undefined,
                },
                include: {
                    user: true,
                    service: true,
                    employee: true,
                },
            });

            return booking;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar agendamento';
            return returnValidationErrors(adminCreateBookingSchema, {
                _errors: [errorMessage],
            });
        }
    });
