"use server"
import { endOfDay, format, startOfDay } from "date-fns";
import { z } from "zod";

import { actionClient } from "@/lib/action-client";
import prisma from "@/lib/prisma";

const inputSchema = z.object({
    barbershopId: z.string().uuid(),
    date: z.date(),
});

const TIME_SLOTS = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
] as const;

export const getDateAvailableTimeSlots = actionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { barbershopId, date } }) => {

        const bookings = await prisma.booking.findMany({
            where: {
                barbershopId,
                date: {
                    gte: startOfDay(date),
                    lte: endOfDay(date),
                },
                cancelledAt: null,
            },
        });

        const occupiedTimeSlots = bookings.map(booking => format(booking.date, 'HH:mm'));
        const availableTimeSlots = TIME_SLOTS.filter(timeSlot => !occupiedTimeSlots.includes(timeSlot));

        return availableTimeSlots;

    });