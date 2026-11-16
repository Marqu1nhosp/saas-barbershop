import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import path from 'path';

import { extractDashboardToken, parseDashboardToken } from '@/lib/dashboard-auth';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
} as const;

async function isGlobalAdmin() {
    const requestHeaders = await headers();
    const token = extractDashboardToken(
        requestHeaders.get('authorization') ?? undefined,
        requestHeaders.get('cookie') ?? undefined,
    );
    const payload = parseDashboardToken(token);

    if (!payload || payload.role !== 'SUPERADMIN' || payload.barbershopId) {
        return false;
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { role: true, barbershopId: true },
    });

    return user?.role === 'SUPERADMIN' && !user.barbershopId;
}

export async function POST(request: Request) {
    if (!(await isGlobalAdmin())) {
        return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Nenhuma imagem foi enviada' }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!extension) {
        return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WEBP' }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'A imagem deve ter entre 1 byte e 5 MB' }, { status: 400 });
    }

    const fileName = `barbershop-${randomUUID()}.${extension}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'images', 'barbershops');
    const filePath = path.join(uploadDirectory, fileName);

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ imageUrl: `/images/barbershops/${fileName}` });
}