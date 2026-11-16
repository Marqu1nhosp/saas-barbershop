'use server';

import bcrypt from 'bcrypt';
import { headers } from 'next/headers';
import { returnValidationErrors } from 'next-safe-action';
import { z } from 'zod';

import { actionClient } from '@/lib/action-client';
import { BARBERSHOP_SERVICE_TEMPLATES } from '@/lib/barbershop-service-templates';
import { extractDashboardToken, parseDashboardToken } from '@/lib/dashboard-auth';
import { prisma } from '@/lib/prisma';

const templateKeys = BARBERSHOP_SERVICE_TEMPLATES.map((template) => template.key) as [string, ...string[]];

const imageUrlSchema = z.string().trim().refine(
    (value) => value.startsWith('/') || /^https?:\/\/.+/.test(value),
    'Informe uma URL de imagem válida',
);

const createBarbershopSchema = z.object({
    name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    address: z.string().trim().min(5, 'Endereço inválido'),
    phone: z.string().trim().min(8, 'Telefone inválido'),
    description: z.string().trim().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
    imageUrl: imageUrlSchema,
    ownerName: z.string().trim().min(3, 'Nome do proprietário inválido'),
    ownerEmail: z.string().trim().email('Email do proprietário inválido'),
    ownerPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    serviceKeys: z.array(z.enum(templateKeys)).min(1, 'Selecione pelo menos um serviço'),
});

const updateBarbershopSchema = z.object({
    id: z.string().uuid('ID da barbearia inválido'),
    name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    address: z.string().trim().min(5, 'Endereço inválido'),
    phone: z.string().trim().min(8, 'Telefone inválido'),
    description: z.string().trim().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
});

const barbershopIdSchema = z.object({ id: z.string().uuid('ID da barbearia inválido') });

async function requireGlobalAdmin() {
    const requestHeaders = await headers();
    const token = extractDashboardToken(
        requestHeaders.get('authorization') ?? undefined,
        requestHeaders.get('cookie') ?? undefined,
    );
    const payload = parseDashboardToken(token);

    if (!payload || payload.role !== 'SUPERADMIN' || payload.barbershopId) {
        throw new Error('Somente o administrador global pode cadastrar barbearias');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.role !== 'SUPERADMIN' || user.barbershopId) {
        throw new Error('Somente o administrador global pode cadastrar barbearias');
    }
}

export async function getGlobalBarbershops() {
    await requireGlobalAdmin();

    return prisma.barbershop.findMany({
        select: {
            id: true,
            name: true,
            address: true,
            imageUrl: true,
            isActive: true,
            _count: {
                select: {
                    services: true,
                    bookings: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });
}

export const updateBarbershopGlobal = actionClient
    .inputSchema(updateBarbershopSchema)
    .action(async ({ parsedInput }) => {
        try {
            await requireGlobalAdmin();
            return await prisma.barbershop.update({
                where: { id: parsedInput.id },
                data: {
                    name: parsedInput.name,
                    address: parsedInput.address,
                    description: parsedInput.description,
                    phones: [parsedInput.phone],
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível atualizar a barbearia';
            console.error('[updateBarbershopGlobal] Falha:', error);
            return returnValidationErrors(updateBarbershopSchema, { _errors: [message] });
        }
    });

export const toggleBarbershopStatus = actionClient
    .inputSchema(barbershopIdSchema)
    .action(async ({ parsedInput }) => {
        try {
            await requireGlobalAdmin();
            const barbershop = await prisma.barbershop.findUnique({ where: { id: parsedInput.id }, select: { isActive: true } });
            if (!barbershop) return returnValidationErrors(barbershopIdSchema, { _errors: ['Barbearia não encontrada'] });

            return prisma.barbershop.update({
                where: { id: parsedInput.id },
                data: { isActive: !barbershop.isActive },
                select: { id: true, isActive: true },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível alterar o status';
            return returnValidationErrors(barbershopIdSchema, { _errors: [message] });
        }
    });

export const deleteBarbershop = actionClient
    .inputSchema(barbershopIdSchema)
    .action(async ({ parsedInput }) => {
        try {
            await requireGlobalAdmin();
            const bookingCount = await prisma.booking.count({ where: { barbershopId: parsedInput.id } });
            if (bookingCount > 0) {
                return returnValidationErrors(barbershopIdSchema, {
                    _errors: ['Não é possível excluir uma barbearia com agendamentos. Desative-a em vez disso.'],
                });
            }

            await prisma.barbershop.delete({ where: { id: parsedInput.id } });
            return { id: parsedInput.id };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível excluir a barbearia';
            return returnValidationErrors(barbershopIdSchema, { _errors: [message] });
        }
    });

export const createBarbershop = actionClient
    .inputSchema(createBarbershopSchema)
    .action(async ({ parsedInput }) => {
        try {
            await requireGlobalAdmin();

            const existingOwner = await prisma.user.findUnique({
                where: { email: parsedInput.ownerEmail },
                select: { id: true },
            });

            if (existingOwner) {
                return returnValidationErrors(createBarbershopSchema, {
                    _errors: ['Já existe um usuário com este email'],
                });
            }

            const selectedTemplates = BARBERSHOP_SERVICE_TEMPLATES.filter((template) =>
                parsedInput.serviceKeys.includes(template.key),
            );
            const password = await bcrypt.hash(parsedInput.ownerPassword, 10);

            return prisma.$transaction(async (transaction) => {
                const barbershop = await transaction.barbershop.create({
                    data: {
                        name: parsedInput.name,
                        address: parsedInput.address,
                        description: parsedInput.description,
                        imageUrl: parsedInput.imageUrl,
                        phones: [parsedInput.phone],
                    },
                });

                await transaction.user.create({
                    data: {
                        name: parsedInput.ownerName,
                        email: parsedInput.ownerEmail,
                        password,
                        role: 'ADMIN',
                        barbershopId: barbershop.id,
                    },
                });

                await transaction.barbershopService.createMany({
                    data: selectedTemplates.map((template) => ({
                        name: template.name,
                        description: template.description,
                        imageUrl: template.imageUrl,
                        priceInCents: template.priceInCents,
                        durationMinutes: template.durationMinutes,
                        status: 'ACTIVE',
                        barbershopId: barbershop.id,
                    })),
                });

                return { id: barbershop.id, name: barbershop.name };
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Não foi possível cadastrar a barbearia';
            console.error('[createBarbershop] Falha ao cadastrar barbearia:', error);
            return returnValidationErrors(createBarbershopSchema, { _errors: [message] });
        }
    });