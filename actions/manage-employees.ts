"use server";

import { hash } from "bcrypt";
import { headers } from "next/headers";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { actionClient } from "@/lib/action-client";
import { extractDashboardToken, parseDashboardToken } from "@/lib/dashboard-auth";
import { prisma } from "@/lib/prisma";

const createEmployeeSchema = z.object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    barbershopId: z.string().uuid("ID da barbearia inválido"),
});

const updateEmployeeSchema = z.object({
    id: z.string().uuid("ID do funcionário inválido"),
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    barbershopId: z.string().uuid("ID da barbearia inválido"),
});

const deleteEmployeeSchema = z.object({
    id: z.string().uuid("ID do funcionário inválido"),
    barbershopId: z.string().uuid("ID da barbearia inválido"),
});

export async function getEmployeesByBarbershop(barbershopId: string) {
    try {
        const employees = await prisma.user.findMany({
            where: {
                barbershopId,
                role: "EMPLOYEE",
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return employees;
    } catch (error) {
        console.error("Error fetching employees:", error);
        throw new Error("Erro ao carregar funcionários");
    }
}

export const createEmployee = actionClient
    .inputSchema(createEmployeeSchema)
    .action(
        async ({
            parsedInput: { name, email, password, barbershopId },
        }) => {
            try {
                console.log('createEmployee action called with:', { name, email, barbershopId });

                // Get dashboard token from headers
                const requestHeaders = await headers();
                const authHeader = requestHeaders.get('authorization') ?? undefined;
                const cookieHeader = requestHeaders.get('cookie') ?? undefined;

                const token = extractDashboardToken(authHeader, cookieHeader);

                if (!token) {
                    console.log('No dashboard token found');
                    return returnValidationErrors(createEmployeeSchema, {
                        _errors: ["Você precisa estar logado no dashboard para adicionar funcionários"],
                    });
                }

                const userPayload = parseDashboardToken(token);

                if (!userPayload) {
                    console.log('Invalid or expired token');
                    return returnValidationErrors(createEmployeeSchema, {
                        _errors: ["Token inválido ou expirado. Faça login novamente"],
                    });
                }

                // Check if user is admin of the barbershop
                const adminUser = await prisma.user.findUnique({
                    where: { id: userPayload.id },
                });

                console.log('Admin user found:', {
                    id: adminUser?.id,
                    role: adminUser?.role,
                    barbershopId: adminUser?.barbershopId,
                    incomingBarbershopId: barbershopId
                });

                if (!adminUser || adminUser.role?.toUpperCase() !== "ADMIN" || adminUser.barbershopId !== barbershopId) {
                    console.log('Permission check failed:', {
                        adminUserExists: !!adminUser,
                        isAdmin: adminUser?.role?.toUpperCase() === "ADMIN",
                        barbershopMatch: adminUser?.barbershopId === barbershopId
                    });
                    return returnValidationErrors(createEmployeeSchema, {
                        _errors: [
                            "Você não tem permissão para adicionar funcionários nesta barbearia",
                        ],
                    });
                }

                // Check if email already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email },
                });

                if (existingUser) {
                    console.log('Email already exists');
                    return returnValidationErrors(createEmployeeSchema, {
                        _errors: ["Email já registrado"],
                    });
                }

                // Hash password
                const hashedPassword = await hash(password, 10);

                const employee = await prisma.user.create({
                    data: {
                        name,
                        email,
                        password: hashedPassword,
                        role: "EMPLOYEE",
                        barbershopId,
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                    },
                });

                console.log('Employee created successfully:', employee);
                return employee;
            } catch (error) {
                console.error("Error creating employee:", error);
                const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao criar funcionário";
                return returnValidationErrors(createEmployeeSchema, {
                    _errors: [errorMessage],
                });
            }
        }
    );

export const updateEmployee = actionClient
    .inputSchema(updateEmployeeSchema)
    .action(async ({ parsedInput: { id, name, email, barbershopId } }) => {
        try {
            // Get dashboard token from headers
            const requestHeaders = await headers();
            const authHeader = requestHeaders.get('authorization') ?? undefined;
            const cookieHeader = requestHeaders.get('cookie') ?? undefined;

            const token = extractDashboardToken(authHeader, cookieHeader);

            if (!token) {
                return returnValidationErrors(updateEmployeeSchema, {
                    _errors: ["Você precisa estar logado no dashboard para editar funcionários"],
                });
            }

            const userPayload = parseDashboardToken(token);

            if (!userPayload) {
                return returnValidationErrors(updateEmployeeSchema, {
                    _errors: ["Token inválido ou expirado. Faça login novamente"],
                });
            }

            // Check if user is admin of the barbershop
            const adminUser = await prisma.user.findUnique({
                where: { id: userPayload.id },
            });

            if (!adminUser || adminUser.role?.toUpperCase() !== "ADMIN" || adminUser.barbershopId !== barbershopId) {
                return returnValidationErrors(updateEmployeeSchema, {
                    _errors: [
                        "Você não tem permissão para editar funcionários nesta barbearia",
                    ],
                });
            }

            // Check if employee exists in the barbershop
            const employee = await prisma.user.findFirst({
                where: {
                    id,
                    barbershopId,
                    role: "EMPLOYEE",
                },
            });

            if (!employee) {
                return returnValidationErrors(updateEmployeeSchema, {
                    _errors: ["Funcionário não encontrado"],
                });
            }

            // Check if new email already exists
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            });

            if (existingEmail && existingEmail.id !== id) {
                return returnValidationErrors(updateEmployeeSchema, {
                    _errors: ["Email já registrado"],
                });
            }

            const updatedEmployee = await prisma.user.update({
                where: { id },
                data: {
                    name,
                    email,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            });

            return updatedEmployee;
        } catch (error) {
            console.error("Error updating employee:", error);
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao atualizar funcionário";
            return returnValidationErrors(updateEmployeeSchema, {
                _errors: [errorMessage],
            });
        }
    });

export const deleteEmployee = actionClient
    .inputSchema(deleteEmployeeSchema)
    .action(async ({ parsedInput: { id, barbershopId } }) => {
        try {
            // Get dashboard token from headers
            const requestHeaders = await headers();
            const authHeader = requestHeaders.get('authorization') ?? undefined;
            const cookieHeader = requestHeaders.get('cookie') ?? undefined;

            const token = extractDashboardToken(authHeader, cookieHeader);

            if (!token) {
                return returnValidationErrors(deleteEmployeeSchema, {
                    _errors: ["Você precisa estar logado no dashboard para deletar funcionários"],
                });
            }

            const userPayload = parseDashboardToken(token);

            if (!userPayload) {
                return returnValidationErrors(deleteEmployeeSchema, {
                    _errors: ["Token inválido ou expirado. Faça login novamente"],
                });
            }

            // Check if user is admin of the barbershop
            const adminUser = await prisma.user.findUnique({
                where: { id: userPayload.id },
            });

            if (!adminUser || adminUser.role?.toUpperCase() !== "ADMIN" || adminUser.barbershopId !== barbershopId) {
                return returnValidationErrors(deleteEmployeeSchema, {
                    _errors: [
                        "Você não tem permissão para deletar funcionários nesta barbearia",
                    ],
                });
            }

            // Check if employee exists in the barbershop
            const employee = await prisma.user.findFirst({
                where: {
                    id,
                    barbershopId,
                    role: "EMPLOYEE",
                },
            });

            if (!employee) {
                return returnValidationErrors(deleteEmployeeSchema, {
                    _errors: ["Funcionário não encontrado"],
                });
            }

            await prisma.user.delete({
                where: { id },
            });

            return { success: true };
        } catch (error) {
            console.error("Error deleting employee:", error);
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao deletar funcionário";
            return returnValidationErrors(deleteEmployeeSchema, {
                _errors: [errorMessage],
            });
        }
    });
