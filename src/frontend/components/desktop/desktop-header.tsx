"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Bell, Search, Moon, Sun, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { Input, Button, Badge, User } from "@heroui/react";

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
      aria-label="Desktop header"
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
        <Input
          classNames={{
            base: "w-64",
            innerWrapper: "bg-muted/50 hover:bg-muted/70 focus-within:bg-muted/50",
            input: "text-sm",
            inputWrapper: "border border-border/50 shadow-none",
          }}
          placeholder="Search..."
          startContent={<Search className="w-4 h-4 text-muted-foreground" />}
          radius="lg"
        />

        {/* Theme Toggle */}
        <Button
          isIconOnly
          variant="light"
          onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          isIconOnly
          variant="light"
          className="text-muted-foreground mr-2"
        >
          <Badge content="" color="primary" shape="circle" placement="top-right">
            <Bell className="w-5 h-5" />
          </Badge>
        </Button>

        {/* User Avatar */}
        <div className="pl-3 border-l border-border/50">
          <User
            name={user?.name || "User"}
            description={user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : ""}
            classNames={{
              name: "font-medium text-foreground",
              description: "text-xs text-muted-foreground"
            }}
            avatarProps={{
              name: user?.name?.slice(0, 2).toUpperCase() || "U",
              classNames: {
                base: "bg-gradient-to-br from-accent to-primary text-white font-medium"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}
