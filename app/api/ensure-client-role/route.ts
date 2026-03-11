import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { ensureClientRole } from "@/lib/ensure-client-role";

export async function POST(req: NextRequest) {
    try {
        // Obter usuário da sessão
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Garantir que usuário tem role CLIENT
        const updatedUser = await ensureClientRole(session.user.id);

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error("[ensure-client-role] Error:", error);
        return NextResponse.json(
            { error: "Failed to ensure client role" },
            { status: 500 }
        );
    }
}
