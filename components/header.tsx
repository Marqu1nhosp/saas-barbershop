"use client";

import { BotMessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { MenuSheet } from "./menu-sheet";
import ThemeToggle from "./theme-toggle";
import { Button } from "./ui/button";

const Header = () => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Evita erro de hidratação entre servidor e cliente
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const logoSrc =
        resolvedTheme === "dark"
            ? "/logo-dark.svg"
            : "/logo-light.svg";

    return (
        <header className="bg-background flex items-center justify-between px-5 py-6">
            <Link href="/">
                <Image
                    src={logoSrc}
                    alt="Barbershop"
                    width={150}
                    height={24}
                    priority
                />
            </Link>

            <div className="flex items-center gap-2">
                <ThemeToggle />

                <Link href="/chat">
                    <Button variant="outline" size="icon">
                        <BotMessageSquare className="size-5" />
                    </Button>
                </Link>

                <MenuSheet />
            </div>
        </header>
    );
};

export default Header;