"use client";

import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showSettings?: boolean;
  showNotifications?: boolean;
  showAvatar?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

export function TopBar({
  title,
  showBack = false,
  showLogo = true,
  showSettings = false,
  showNotifications = true,
  showAvatar = true,
  rightContent,
  className,
}: TopBarProps) {
  const { role } = useAuth();
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full px-4 py-3",
        "bg-background/80 backdrop-blur-xl",
        "border-b border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              href={role === "admin" ? "/admin/dashboard" : "/patient/dashboard"}
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-colors"
            >
              <svg
                className="w-5 h-5 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          )}

          {showLogo && !title && (
            <Link href={role === "admin" ? "/admin/dashboard" : "/patient/dashboard"} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <MediChainLogo className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">MediChainAI</span>
            </Link>
          )}

          {title && (
            <h1 className="font-semibold text-foreground text-lg">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightContent}

          {showSettings && (
            <button className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          {showNotifications && (
            <button className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>
          )}

          {showAvatar && (
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <span className="text-xs font-medium text-white">DS</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MediChainLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <circle cx="12" cy="20" r="2" fill="currentColor" />
      <circle cx="4" cy="12" r="2" fill="currentColor" />
      <circle cx="20" cy="12" r="2" fill="currentColor" />
      <circle cx="6.34" cy="6.34" r="1.5" fill="currentColor" />
      <circle cx="17.66" cy="17.66" r="1.5" fill="currentColor" />
      <circle cx="6.34" cy="17.66" r="1.5" fill="currentColor" />
      <circle cx="17.66" cy="6.34" r="1.5" fill="currentColor" />
      <path
        d="M12 7v10M7 12h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { MediChainLogo };
