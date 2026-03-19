"use client";

import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  showBottomNav?: boolean;
}

export function AppShell({ children, className, showBottomNav = true }: AppShellProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full max-w-md mx-auto bg-background",
        "gradient-bg noise-overlay",
        className
      )}
    >
      <div className={cn(
        "relative z-10 flex flex-col min-h-screen",
        showBottomNav && "pb-20"
      )}>
        {children}
      </div>
    </div>
  );
}
