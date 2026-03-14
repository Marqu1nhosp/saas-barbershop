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
            console.log("DEBUG: getAvailableEmployees called with:", { barbershopId, dateTime });
            
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

            console.log("DEBUG: Found employees:", employees.length, employees);

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

            console.log("DEBUG: employeeAvailability:", employeeAvailability);

            return {
                available: employeeAvailability.filter((e) => e.isAvailable),
                unavailable: employeeAvailability.filter((e) => !e.isAvailable),
            };
        } catch (error) {
            console.error("Erro ao buscar barbeiros disponíveis:", error);
            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
            throw new Error(`Erro ao buscar barbeiros disponíveis: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
