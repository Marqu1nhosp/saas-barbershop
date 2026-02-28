"use server"
import { endOfDay, format, startOfDay } from "date-fns";
import { z } from "zod";

import { actionClient } from "@/lib/action-client";
import { getBusinessHours } from "@/data/dashboard";
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

function compareTime(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const mins1 = h1 * 60 + m1;
    const mins2 = h2 * 60 + m2;
    return mins1 - mins2;
}

export const getDateAvailableTimeSlots = actionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { barbershopId, date } }) => {
        // Get business hours for the day
        const businessHours = await getBusinessHours(barbershopId);
        const dayOfWeek = date.getDay();
        const dayHours = businessHours.find(h => h.dayOfWeek === dayOfWeek);

        // Check if shop is closed
        if (!dayHours || dayHours.isClosed) {
            return [];
        }

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

        // Filter time slots based on business hours
        let availableTimeSlots = TIME_SLOTS.filter(timeSlot => {
            // Check if slot is within business hours
            if (compareTime(timeSlot, dayHours.openingTime!) < 0) return false;
            if (compareTime(timeSlot, dayHours.closingTime!) >= 0) return false;

            // Check if slot is during lunch break
            if (dayHours.lunchStart && dayHours.lunchEnd) {
                if (compareTime(timeSlot, dayHours.lunchStart) >= 0 && compareTime(timeSlot, dayHours.lunchEnd) < 0) {
                    return false;
                }
            }

            // Check if already booked
            return !occupiedTimeSlots.includes(timeSlot);
        });

        return availableTimeSlots;

    });