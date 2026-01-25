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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Layout - visible below lg breakpoint */}
      <div className="block lg:hidden">
        <AppShell showBottomNav={showMobileNav}>
          {children}
          {showMobileNav && <BottomNav />}
        </AppShell>
      </div>

      {/* Desktop Layout - visible at lg breakpoint and above */}
      <div className="hidden lg:flex min-h-screen bg-background">
        {layoutMode === "sidebar" ? (
          <>
            <DesktopSidebar 
              collapsed={sidebarCollapsed} 
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
            <div className="flex-1 flex flex-col min-w-0">
              <DesktopHeader title={title} />
              <main className={cn(
                "flex-1 p-6",
                "bg-background"
              )}>
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            <DesktopNavbar />
            <main className={cn(
              "flex-1 p-8",
              "bg-background"
            )}>
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
