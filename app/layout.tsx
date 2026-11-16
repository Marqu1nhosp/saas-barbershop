import "./globals.css";

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import SonnerToaster from "@/components/sonner-toaster";
import { AppThemeProvider } from "@/providers/app-theme-provider";
import { TanstackQueryProvider } from "@/providers/tanstack-query";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Barbershop",
  description: "Agendamento de barbearia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} antialiased min-h-screen flex flex-col`}
      >
        <AppThemeProvider>
          <TanstackQueryProvider>
            <AppShell>{children}</AppShell>
            <SonnerToaster />
          </TanstackQueryProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
