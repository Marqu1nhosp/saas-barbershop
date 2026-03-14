"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { protectedActionClient } from "@/lib/action-client";
import { checkTimeAvailability } from "@/lib/business-hours-utils";
import prisma from "@/lib/prisma";

const inputSchema = z.object({
    serviceId: z.string().uuid(),
    date: z.string().or(z.date()).transform((val) => {
        if (typeof val === "string") {
            // Parse ISO string with or without timezone offset
            return new Date(val);
        }
        return val;
    }),
    employeeId: z.string().uuid().optional(),
});

export const createBooking = protectedActionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { serviceId, date, employeeId }, ctx: { user } }) => {
        const service = await prisma.barbershopService.findUnique({
            where: { id: serviceId },
        });

        if (!service) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Serviço não encontrado"],
            });
        }

        // Se um barbeiro foi escolhido, validar se existe e pertence à barbearia
        if (employeeId) {
            const employee = await prisma.user.findFirst({
                where: {
                    id: employeeId,
                    barbershopId: service.barbershopId,
                    role: "EMPLOYEE",
                },
            });

            if (!employee) {
                return returnValidationErrors(inputSchema, {
                    _errors: ["Barbeiro não encontrado ou não pertence a esta barbearia"],
                });
            }

            // Verificar disponibilidade específica do barbeiro
            const employeeBookingAtTime = await prisma.booking.findFirst({
                where: {
                    employeeId,
                    date,
                    cancelledAt: null,
                },
            });

            if (employeeBookingAtTime) {
                return returnValidationErrors(inputSchema, {
                    _errors: ["Este barbeiro não está disponível para este horário"],
                });
            }
        }

        // Check if time is available according to business hours
        const timeAvailability = await checkTimeAvailability(service.barbershopId, date);
        if (!timeAvailability.available) {
            return returnValidationErrors(inputSchema, {
                _errors: [timeAvailability.reason || "Horário indisponível"],
            });
        }

        // Se não especificou barbeiro, verificar se algum está disponível
        if (!employeeId) {
            const availableEmployee = await prisma.user.findFirst({
                where: {
                    barbershopId: service.barbershopId,
                    role: "EMPLOYEE",
                },
                orderBy: {
                    createdAt: "asc", // Pega o primeiro (pode ser aleatório depois)
                },
            });

            if (!availableEmployee) {
                return returnValidationErrors(inputSchema, {
                    _errors: ["Nenhum barbeiro disponível nesta barbearia"],
                });
            }
        }

        const booking = await prisma.booking.create({
            data: {
                userId: user.id,
                barbershopId: service.barbershopId,
                serviceId,
                date,
                employeeId: employeeId || undefined,
            },
        });

        return booking;
    });
