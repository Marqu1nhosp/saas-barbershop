import { BotMessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MenuSheet } from "./menu-sheet";
import { Button } from "./ui/button";

const Header = () => {
    return (
        <header className="bg-background flex items-center justify-between px-5 py-6">
            <Link href="/">
                <Image src="/logo.svg" alt="Barbershop" width={150} height={24} />
            </Link>
            <div className="flex items-center gap-2">
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