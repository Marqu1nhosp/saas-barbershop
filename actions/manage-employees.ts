"use server";

import { hash } from "bcrypt";
import { headers } from "next/headers";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { Role } from "@/generated/prisma/enums";
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
                role: Role.EMPLOYEE,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
                // Get dashboard token from headers
                const requestHeaders = await headers();
                const authHeader = requestHeaders.get('authorization') ?? undefined;
                const cookieHeader = requestHeaders.get('cookie') ?? undefined;

                const token = extractDashboardToken(authHeader, cookieHeader);

                if (!token) {
                    return returnValidationErrors(createEmployeeSchema, {
                        _errors: ["Você precisa estar logado no dashboard para adicionar funcionários"],
                    });
                }

                const userPayload = parseDashboardToken(token);

                if (!userPayload) {
                    return returnValidationErrors(createEmployeeSchema, {
                        _errors: ["Token inválido ou expirado. Faça login novamente"],
                    });
                }

                // Check if user is admin of the barbershop
                let adminUser = await prisma.user.findUnique({
                    where: { id: userPayload.id },
                });

                if (!adminUser) {
                    return returnValidationErrors(createEmployeeSchema, {
                        _errors: ["Usuário não encontrado"],
                    });
                }

                // If user is CLIENT of this barbershop, promote to ADMIN
                if (adminUser.role === Role.CLIENT && adminUser.barbershopId === barbershopId) {
                    adminUser = await prisma.user.update({
                        where: { id: userPayload.id },
                        data: { role: Role.ADMIN },
                    });
                }

                // Verify user is now ADMIN of the barbershop
                if (adminUser.role !== Role.ADMIN || adminUser.barbershopId !== barbershopId) {
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
                        role: Role.EMPLOYEE,
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

                return employee;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return returnValidationErrors(createEmployeeSchema, {
                    _errors: [errorMessage || "Erro desconhecido ao criar funcionário"],
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

            if (!adminUser || adminUser.role !== Role.ADMIN || adminUser.barbershopId !== barbershopId) {
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
                    role: Role.EMPLOYEE,
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

            if (!adminUser || adminUser.role !== Role.ADMIN || adminUser.barbershopId !== barbershopId) {
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
                    role: Role.EMPLOYEE,
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

            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao deletar funcionário";
            return returnValidationErrors(deleteEmployeeSchema, {
                _errors: [errorMessage],
            });
        }
    });
