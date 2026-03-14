'use server';

import { prisma } from '@/lib/prisma';

export interface EmployeeAvailability {
    id: string;
    name: string;
    image?: string;
    totalBookings: number;
    available: boolean;
}

/**
 * Listar barbeiros (employees) disponíveis para uma barbearia
 */
export async function getEmployeesForBarbershop(barbershopId: string) {
    try {
        const employees = await prisma.user.findMany({
            where: {
                barbershopId,
                role: 'EMPLOYEE',
            },
            select: {
                id: true,
                name: true,
                image: true,
                email: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return employees;
    } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        throw new Error('Erro ao buscar barbeiros');
    }
}

/**
 * Listar barbeiros disponíveis para uma data específica
 */
export async function getAvailableEmployeesForDateTime(
    barbershopId: string,
    dateTime: Date,
): Promise<EmployeeAvailability[]> {
    try {
        const employees = await prisma.user.findMany({
            where: {
                barbershopId,
                role: 'EMPLOYEE',
            },
            include: {
                employeeBookings: {
                    where: {
                        date: {
                            equals: dateTime,
                        },
                        cancelledAt: null,
                    },
                },
            },
        });

        return employees.map((emp) => ({
            id: emp.id,
            name: emp.name,
            image: emp.image || undefined,
            totalBookings: emp.employeeBookings.length,
            available: emp.employeeBookings.length === 0, // Disponível se sem agendamentos nesse horário
        }));
    } catch (error) {
        console.error('Erro ao buscar barbeiros disponíveis:', error);
        throw new Error('Erro ao buscar barbeiros disponíveis');
    }
}

/**
 * Obter detalhes de um barbeiro específico
 */
export async function getEmployeeDetails(employeeId: string, barbershopId: string) {
    try {
        const employee = await prisma.user.findFirst({
            where: {
                id: employeeId,
                barbershopId,
                role: 'EMPLOYEE',
            },
            include: {
                employeeBookings: {
                    include: {
                        service: true,
                        barbershop: true,
                    },
                    orderBy: {
                        date: 'desc',
                    },
                    take: 10,
                },
            },
        });

        return employee;
    } catch (error) {
        console.error('Erro ao buscar detalhes do barbeiro:', error);
        throw new Error('Erro ao buscar detalhes do barbeiro');
    }
}

/**
 * Contar agendamentos de um barbeiro em um período
 */
export async function getEmployeeBookingCount(
    employeeId: string,
    barbershopId: string,
    startDate: Date,
    endDate: Date,
): Promise<number> {
    try {
        const count = await prisma.booking.count({
            where: {
                employeeId,
                barbershopId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                cancelledAt: null,
            },
        });

        return count;
    } catch (error) {
        console.error('Erro ao contar agendamentos do barbeiro:', error);
        throw new Error('Erro ao contar agendamentos do barbeiro');
    }
}
