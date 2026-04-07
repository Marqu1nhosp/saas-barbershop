"use server"
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
const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

function getDatePartsInSaoPaulo(date: Date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: SAO_PAULO_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value ?? "0000";
    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const day = parts.find((part) => part.type === "day")?.value ?? "01";

    return { year, month, day, ymd: `${year}-${month}-${day}` };
}

function getTimeInSaoPaulo(date: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: SAO_PAULO_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

function getDayOfWeekInSaoPaulo(date: Date): number {
    const shortWeekDay = new Intl.DateTimeFormat("en-US", {
        timeZone: SAO_PAULO_TIME_ZONE,
        weekday: "short",
    }).format(date);

    const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };

    return dayMap[shortWeekDay] ?? 0;
}

function createSaoPauloDateTime(ymd: string, time: string): Date {
    return new Date(`${ymd}T${time}:00-03:00`);
}

function compareTime(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const mins1 = h1 * 60 + m1;
    const mins2 = h2 * 60 + m2;
    return mins1 - mins2;
}

function isTimeInPast(timeSlot: string, selectedDateYmd: string): boolean {
    const now = new Date();
    const nowYmd = getDatePartsInSaoPaulo(now).ymd;
    const nowTime = getTimeInSaoPaulo(now);

    const slotTime = createSaoPauloDateTime(selectedDateYmd, timeSlot);
    const nowInSaoPaulo = createSaoPauloDateTime(nowYmd, nowTime);

    return slotTime <= nowInSaoPaulo;
}

export const getDateAvailableTimeSlots = actionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { barbershopId, date } }) => {
        const now = new Date();

        const selectedDateYmd = getDatePartsInSaoPaulo(date).ymd;
        const todayYmd = getDatePartsInSaoPaulo(now).ymd;
        const selectedDateNormalized = new Date(`${selectedDateYmd}T00:00:00-03:00`);
        const todayNormalized = new Date(`${todayYmd}T00:00:00-03:00`);

        if (selectedDateNormalized < todayNormalized) {
            return [];
        }

        // Get business hours for the day
        const businessHours = await getBusinessHours(barbershopId);
        const dayOfWeek = getDayOfWeekInSaoPaulo(date);
        const dayHours = businessHours.find(h => h.dayOfWeek === dayOfWeek);

        // Check if shop is closed
        if (!dayHours || dayHours.isClosed) {
            return [];
        }

        const bookings = await prisma.booking.findMany({
            where: {
                barbershopId,
                date: {
                    gte: new Date(`${selectedDateYmd}T00:00:00-03:00`),
                    lte: new Date(`${selectedDateYmd}T23:59:59.999-03:00`),
                },
                cancelledAt: null,
            },
        });

        const occupiedTimeSlots = bookings.map(booking => getTimeInSaoPaulo(booking.date));

        // Check if the selected date is today
        const isToday = selectedDateYmd === todayYmd;

        // Filter time slots based on business hours
        let availableTimeSlots = TIME_SLOTS.filter(timeSlot => {
            // Check if slot is within business hours
            if (compareTime(timeSlot, dayHours.openingTime!) < 0) {
                return false;
            }
            if (compareTime(timeSlot, dayHours.closingTime!) >= 0) {
                return false;
            }

            // Check if slot is during lunch break
            if (dayHours.lunchStart && dayHours.lunchEnd) {
                if (compareTime(timeSlot, dayHours.lunchStart) >= 0 && compareTime(timeSlot, dayHours.lunchEnd) < 0) {
                    return false;
                }
            }

            // Check if already booked
            if (occupiedTimeSlots.includes(timeSlot)) {
                return false;
            }

            // Only exclude past times if it's today
            if (isToday) {
                if (isTimeInPast(timeSlot, selectedDateYmd)) {
                    return false;
                }
            }

            return true;
        });

        // Retornar horários disponíveis
        return availableTimeSlots;

    });