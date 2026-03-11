import { auth } from "@/lib/auth";
import { ensureClientRole } from "@/lib/ensure-client-role";

export async function ensureUserClientRole() {
    try {
        // Obter sessão atual
        const sessionData = await auth.api.getSession();

        if (!sessionData || !sessionData.user?.id) {
            return { error: "Not authenticated" };
        }

        // Garantir que usuário tem role CLIENT
        const updatedUser = await ensureClientRole(sessionData.user.id);

        return {
            success: true,
            user: updatedUser,
        };
    } catch (error) {
        console.error("Error in ensureUserClientRole:", error);
        return { error: "Failed to ensure client role" };
    }
}
