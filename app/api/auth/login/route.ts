import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        // Validar dados de entrada
        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
        }

        // Verificar se o email existe
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Verificar se o usuário tem senha (não é usuário OAuth)
        if (!user.password) {
            return NextResponse.json({ error: 'Este usuário não tem senha cadastrada. Use autenticação com Google.' }, { status: 400 });
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, barbershopId: user.barbershopId, },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                barbershopId: user.barbershopId,
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}