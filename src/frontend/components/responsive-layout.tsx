"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopSidebar } from "@/components/desktop/desktop-sidebar";
import { DesktopHeader } from "@/components/desktop/desktop-header";
import { DesktopNavbar } from "@/components/desktop/desktop-navbar";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  showMobileNav?: boolean;
  layoutMode?: "sidebar" | "top-nav";
}

export function ResponsiveLayout({
  children,
  title,
  showMobileNav = true,
  layoutMode = "sidebar"
}: ResponsiveLayoutProps) {
  return (
    <>
      <div className="block lg:hidden">
        <AppShell showBottomNav={showMobileNav}>
          {children}
          {showMobileNav && <BottomNav />}
        </AppShell>
      </div>

      <div className="hidden lg:flex min-h-screen bg-background text-foreground">
        {layoutMode === "sidebar" ? (
          <DesktopSidebar>
            <div className="flex-1 flex flex-col min-w-0 h-full w-full bg-background overflow-hidden relative">
              <DesktopHeader title={title} />
              <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </DesktopSidebar>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 w-full relative">
            <DesktopNavbar />
            <main className="flex-1 p-8 mt-16 bg-background">
              <div className="container mx-auto">
                {children}
              </div>
            </main>
          </div>
        )}
      </div>
    </>
  );
}
