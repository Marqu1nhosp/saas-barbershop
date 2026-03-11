"use client"
import { Calendar, Home, LogIn, LogOut, MenuIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "./ui/sheet";
export function MenuSheet() {
    const { data: session } = authClient.useSession();

    // Garantir que usuário logado tem role CLIENT
    useEffect(() => {
        if (session?.user?.id) {
            const ensureRole = async () => {
                try {
                    const response = await fetch("/api/ensure-client-role", {
                        method: "POST",
                    });

                    if (!response.ok) {
                        console.error("[MenuSheet] Failed to fix role:", response.status);
                    }
                } catch (err) {
                    console.error("[MenuSheet] Error ensuring client role:", err);
                }
            };

            ensureRole();
        }
    }, [session?.user?.id]);

    async function handleLogin() {
        const { error } = await authClient.signIn.social({
            provider: "google",

        });

        if (error) {
            toast.error("Erro ao fazer login: " + error.message);
            return;
        }

        // Após login bem-sucedido, garantir que o usuário tem role CLIENT
        try {
            const response = await fetch("/api/ensure-client-role", {
                method: "POST",
            });

            if (!response.ok) {
                console.warn("Failed to ensure client role");
            }
        } catch (err) {
            console.error("Error ensuring client role:", err);
        }
    }

    const isLoggedIn = !!session?.user;

    async function handleLogout() {
        await authClient.signOut();
    }
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <MenuIcon />
                </Button>
            </SheetTrigger>

            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                <div className="p-4 flex flex-col gap-6">
                    <div className="flex items-center justify-between px-5">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="size-12 overflow-hidden rounded-full">
                                    <AvatarImage
                                        src={session.user.image ?? ""}
                                        alt={session.user.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback>
                                        {session.user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-semibold">{session.user.name}</span>
                                    <span className="text-muted-foreground text-sm">
                                        {session.user.email}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="font-semibold">Olá. Faça seu login!</p>
                                <Button className="gap-3 rounded-full" onClick={handleLogin}>
                                    Login
                                    <LogIn className="size-4" />
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 mr-4">
                        <Link href="/">
                            <Button variant="ghost" className="justify-start">
                                <Home className="mr-3 size-4" />
                                Início
                            </Button>
                        </Link>

                        <Link href="/bookings">
                            <Button variant="ghost" className="justify-start">
                                <Calendar className="mr-3 size-4" />
                                Agendamentos
                            </Button>
                        </Link>
                    </div>

                    <div className="border-t border-border" />

                    {/* Categories */}
                    <div className="flex flex-col gap-4">
                        <Link
                            href="/barbershops?search=cabelo"
                            className="text-base"
                        >
                            Cabelo
                        </Link>
                        <Link
                            href="/barbershops?search=barba"
                            className="text-base"
                        >
                            Barba
                        </Link>
                        <Link
                            href="/barbershops?search=acabamento"
                            className="text-base"
                        >
                            Acabamento
                        </Link>
                        <Link
                            href="/barbershops?search=sobrancelha"
                            className="text-base"
                        >
                            Sobrancelha
                        </Link>
                        <Link
                            href="/barbershops?search=massagem"
                            className="text-base"
                        >
                            Massagem
                        </Link>
                        <Link
                            href="/barbershops?search=hidratacao"
                            className="text-base"
                        >
                            Hidratação
                        </Link>
                    </div>

                    <div className="border-t border-border" />

                    {isLoggedIn && (
                        <div className="text-gray-500">
                            <Button
                                variant="ghost"
                                className="justify-start"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-3 size-4" />
                                Sair da conta
                            </Button>
                        </div>
                    )}
                </div>

                <SheetFooter>
                    <div className="text-xs text-muted-foreground p-4">
                        Versão de desenvolvimento
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}