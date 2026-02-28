import { prisma } from '@/lib/prisma';

export interface TimeAvailability {
    available: boolean;
    reason?: string;
}

function compareTime(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const mins1 = h1 * 60 + m1;
    const mins2 = h2 * 60 + m2;
    return mins1 - mins2;
}

export async function checkTimeAvailability(
    barbershopId: string,
    dateTime: Date
): Promise<TimeAvailability> {
    try {
        const dayOfWeek = dateTime.getUTCDay();
        const hours = String(dateTime.getUTCHours()).padStart(2, '0');
        const minutes = String(dateTime.getUTCMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        // Get business hours for this day
        const businessHours = await prisma.businessHours.findUnique({
            where: {
                barbershopId_dayOfWeek: {
                    barbershopId,
                    dayOfWeek,
                },
            },
        });

        if (!businessHours) {
            return {
                available: false,
                reason: 'Horários não configurados para este dia.',
            };
        }

        if (businessHours.isClosed) {
            return {
                available: false,
                reason: 'Barbearia fechada neste dia.',
            };
        }

        if (!businessHours.openingTime || !businessHours.closingTime) {
            return {
                available: false,
                reason: 'Horários não configurados para este dia.',
            };
        }

        // Check if time is within business hours
        if (
            compareTime(timeStr, businessHours.openingTime) < 0 ||
            compareTime(timeStr, businessHours.closingTime) >= 0
        ) {
            return {
                available: false,
                reason: `Barbearia funciona de ${businessHours.openingTime} até ${businessHours.closingTime}.`,
            };
        }

        // Check if time falls within lunch break
        if (businessHours.lunchStart && businessHours.lunchEnd) {
            if (
                compareTime(timeStr, businessHours.lunchStart) >= 0 &&
                compareTime(timeStr, businessHours.lunchEnd) < 0
            ) {
                return {
                    available: false,
                    reason: `Barbearia está em horário de almoço (${businessHours.lunchStart} - ${businessHours.lunchEnd}).`,
                };
            }
        }

        return { available: true };
    } catch (error) {
        console.error('Error checking time availability:', error);
        return {
            available: false,
            reason: 'Erro ao verificar disponibilidade.',
        };
    }
}
