import { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * Garante que um usuário OAuth recém-criado tem role CLIENT
 */
export async function ensureClientRole(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) return null;

        // Se usuário não tem barbershopId e não é ADMIN, deve ser CLIENT
        if (!user.barbershopId && user.role !== Role.ADMIN) {
            if (user.role !== Role.CLIENT) {
                const updated = await prisma.user.update({
                    where: { id: userId },
                    data: { role: Role.CLIENT },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        image: true,
                    },
                });

                return updated;
            }
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
        };
    } catch (error) {
        console.error("[ensureClientRole] Error:", error);
        return null;
    }
}
