"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Bell, Search, Moon, Sun, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";

interface DesktopHeaderProps {
  title?: string;
  className?: string;
}

// Breadcrumb generator based on pathname
function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    breadcrumbs.push({ label, href: currentPath });
  });

  return breadcrumbs;
}

export function DesktopHeader({ title, className }: DesktopHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        "hidden lg:flex items-center justify-between",
        "sticky top-0 z-40 px-6 py-4",
        "bg-background/80 backdrop-blur-xl",
        "border-b border-border/50",
        className
      )}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-sm",
                index === breadcrumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {crumb.label}
            </span>
          </div>
        ))}
        {title && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{title}</span>
          </>
        )}
      </div>

      {/* Right: Search, Theme, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className={cn(
              "w-64 pl-9 pr-4 py-2 rounded-xl",
              "bg-muted/50 border border-border/50",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl",
            "bg-muted/50 hover:bg-muted transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <button
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-xl",
            "bg-muted/50 hover:bg-muted transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-border/50">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
