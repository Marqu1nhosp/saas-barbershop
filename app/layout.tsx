import "./globals.css";

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Footer } from "@/components/footer";
import SonnerToaster from "@/components/sonner-toaster";
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
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} antialiased min-h-screen flex flex-col`}
      >
        <TanstackQueryProvider>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <SonnerToaster />
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
