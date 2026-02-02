import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/dashboard-login', req.url));
    }

    try {
        await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
        return NextResponse.next();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return NextResponse.redirect(new URL('/dashboard-login', req.url));
    }
}

export const config = {
    matcher: ['/barbershops/dashboard/:path*'],
};