import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const { POST: betterAuthPOST, GET: betterAuthGET } = toNextJsHandler(auth);

export const POST = async (req: NextRequest) => {
    // Chamar o handler padrão do better-auth
    const response = await betterAuthPOST(req);

    // Clonar e parsear a resposta
    if (response.status === 200 || response.status === 201) {
        try {
            const clonedResponse = response.clone();
            const responseText = await clonedResponse.text();
            const responseData = JSON.parse(responseText);

            // Se há um usuário na resposta, validar/corrigir role
            if (responseData.user && responseData.user.id) {
                const user = await prisma.user.findUnique({
                    where: { id: responseData.user.id },
                });

                // Se usuário não tem barbershopId e não é ADMIN, deve ser CLIENT
                if (user && !user.barbershopId && user.role !== Role.ADMIN) {
                    if (user.role !== Role.CLIENT) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const updatedUser = await prisma.user.update({
                            where: { id: user.id },
                            data: { role: Role.CLIENT },
                        });

                        // Atualizar na resposta
                        responseData.user.role = "CLIENT";

                        return NextResponse.json(responseData, { status: response.status });
                    }
                }
            }
        } catch (error) {
            console.error("[Auth Route] Error processing response:", error);
            // Se algo deu errado, retornar resposta original
        }
    }

    return response;
};

export const GET = betterAuthGET;