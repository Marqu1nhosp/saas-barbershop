"use client";

import { usePathname } from "next/navigation";

import { ThemeProvider } from "@/providers/theme-provider";

type AppThemeProviderProps = {
  children: React.ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const pathname = usePathname();
  const isDashboardRoute =
    pathname.startsWith("/barbershops/dashboard") ||
    pathname.startsWith("/dashboard-login");
  const storageKey = isDashboardRoute
    ? "barbershop-dashboard-theme"
    : "barbershop-theme";
  const defaultTheme = isDashboardRoute ? "light" : "system";
  const forcedTheme = isDashboardRoute ? "light" : undefined;

  return (
    <ThemeProvider
      storageKey={storageKey}
      defaultTheme={defaultTheme}
      forcedTheme={forcedTheme}
    >
      {children}
    </ThemeProvider>
  );
}
