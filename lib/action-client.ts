import { headers } from "next/headers";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "./auth";
import { prisma } from "./prisma";

export const actionClient = createSafeActionClient({
    handleServerError(e) {
        console.error("handleServerError called with:", e);
        if (e instanceof Error) {
            console.error("Error message:", e.message);
            console.error("Error stack:", e.stack);
            return e.message;
        }
        return "Algo deu errado ao executar a operação.";
    },
});

export const protectedActionClient = actionClient.use(
    async ({ next }) => {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            throw new Error("Por favor, faça um login para fazer um agendamento!");
        }

        return next({
            ctx: {
                prisma,
                user: session.user,
                session: session.session,
            },
        });
    }
);
