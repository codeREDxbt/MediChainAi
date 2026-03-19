"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function AppHeroUIProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <HeroUIProvider>
                {children}
            </HeroUIProvider>
        </NextThemesProvider>
    );
}
