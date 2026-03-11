'use server';

import { Role } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

interface CreateClientParams {
    name: string;
    email: string;
    barbershopId: string;
}

export async function createClient(params: CreateClientParams) {
    try {
        const { name, email, barbershopId } = params;

        // Validar se o email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return {
                data: null,
                error: 'Email já cadastrado no sistema',
            };
        }

        // Criar novo usuário com role CLIENT
        const newClient = await prisma.user.create({
            data: {
                name,
                email,
                role: Role.CLIENT,
                barbershopId,
                emailVerified: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        return {
            data: newClient,
            error: null,
        };
    } catch (error) {
        console.error('Error creating client:', error);
        return {
            data: null,
            error: 'Erro ao criar cliente',
        };
    }
}
