"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
  defaultTheme?: "light" | "dark" | "system";
  forcedTheme?: "light" | "dark";
};

export function ThemeProvider({
  children,
  storageKey = "barbershop-theme",
  defaultTheme = "system",
  forcedTheme,
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      storageKey={storageKey}
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
