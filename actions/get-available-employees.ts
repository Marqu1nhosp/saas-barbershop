"use server";

import { z } from "zod";

import { protectedActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";

const getAvailableEmployeesSchema = z.object({
    barbershopId: z.string().uuid(),
    dateTime: z.string().or(z.date()).transform((val) => {
        if (typeof val === "string") {
            return new Date(val);
        }
        return val;
    }),
});

/**
 * Obtém lista de barbeiros disponíveis para uma data/hora específica
 */
export const getAvailableEmployees = protectedActionClient
    .inputSchema(getAvailableEmployeesSchema)
    .action(async ({ parsedInput: { barbershopId, dateTime } }) => {
        try {
            // Buscar todos os employees da barbearia
            const employees = await prisma.user.findMany({
                where: {
                    barbershopId,
                    role: "EMPLOYEE",
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true,
                },
                orderBy: {
                    name: "asc",
                },
            });

            if (employees.length === 0) {
                return {
                    available: [],
                    unavailable: [],
                };
            }

            // Para cada employee, verificar se tem agendamento naquele horário
            const employeeAvailability = await Promise.all(
                employees.map(async (emp) => {
                    const existingBooking = await prisma.booking.count({
                        where: {
                            employeeId: emp.id,
                            date: dateTime,
                            cancelledAt: null,
                        },
                    });

                    return {
                        ...emp,
                        isAvailable: existingBooking === 0,
                    };
                })
            );


            return {
                available: employeeAvailability.filter((e) => e.isAvailable),
                unavailable: employeeAvailability.filter((e) => !e.isAvailable),
            };
        } catch (error) {
            throw new Error(`Erro ao buscar barbeiros disponíveis: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
