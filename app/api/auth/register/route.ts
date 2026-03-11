import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, email, password, role } = await req.json();

        // Validar dados de entrada obrigatórios
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        // Verificar se o email já está registrado
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email já registrado' }, { status: 400 });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Definir role como CLIENT por padrão (usuários do SaaS)
        // Se for necessário registrar funcionários, usar a rota de manage-employees
        const userRole = 'CLIENT';

        // Criar novo usuário
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: userRole,
            },
        });

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}