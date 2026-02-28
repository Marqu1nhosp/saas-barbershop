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
});

export const createBooking = protectedActionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { serviceId, date }, ctx: { user } }) => {
        const service = await prisma.barbershopService.findUnique({
            where: { id: serviceId },
        });

        if (!service) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Serviço não encontrado"],
            });
        }

        // Check if time is available according to business hours
        const timeAvailability = await checkTimeAvailability(service.barbershopId, date);
        if (!timeAvailability.available) {
            return returnValidationErrors(inputSchema, {
                _errors: [timeAvailability.reason || "Horário indisponível"],
            });
        }

        const existingBooking = await prisma.booking.findFirst({
            where: { serviceId, date, cancelledAt: null },
        });

        if (existingBooking) {
            return returnValidationErrors(inputSchema, {
                _errors: [
                    "Já existe um agendamento para este serviço nesta data e hora",
                ],
            });
        }

        const booking = await prisma.booking.create({
            data: {
                userId: user.id,
                barbershopId: service.barbershopId,
                serviceId,
                date,
            },
        });

        return booking;
    });
