"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideMobileNav =
    pathname === "/dashboard-login" || pathname.startsWith("/barbershops/dashboard");

  return (
    <>
      <main className={hideMobileNav ? "flex-1" : "flex-1 pb-28"}>{children}</main>
      {!hideMobileNav && <MobileNav />}
      {pathname !== "/dashboard-login" && <Footer />}
    </>
  );
}
