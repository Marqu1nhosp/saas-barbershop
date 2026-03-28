"use server";

import { revalidatePath } from "next/cache";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { protectedActionClient } from "@/lib/action-client";
import prisma from "@/lib/prisma";

const inputSchema = z.object({
    bookingId: z.uuid(),
    employeeId: z.string().uuid().nullable(),
});

export const updateBookingEmployee = protectedActionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { bookingId, employeeId }, ctx: { user } }) => {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                barbershop: true,
            },
        });

        if (!booking) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Agendamento não encontrado"],
            });
        }

        if (booking.userId !== user.id) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Você não tem permissão para atualizar este agendamento"],
            });
        }

        if (booking.cancelledAt) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Não é possível editar um agendamento cancelado"],
            });
        }

        // Se um profissional foi escolhido, validar se existe e pertence à barbearia
        if (employeeId) {
            const employee = await prisma.user.findFirst({
                where: {
                    id: employeeId,
                    barbershopId: booking.barbershopId,
                    role: "EMPLOYEE",
                },
            });

            if (!employee) {
                return returnValidationErrors(inputSchema, {
                    _errors: ["Profissional não encontrado ou não pertence a esta barbearia"],
                });
            }
        }

        // Atualizar o agendamento com o novo profissional
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                employeeId: employeeId,
            },
            include: {
                service: true,
                barbershop: true,
                employee: true,
            },
        });

        revalidatePath("/bookings");

        return updatedBooking;
    });
