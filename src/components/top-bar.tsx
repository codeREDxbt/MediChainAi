"use client";

import Link from "next/link";
import { Bell, Settings, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Badge, Avatar } from "@heroui/react";

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
    <Navbar
      isBordered
      className={cn("bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 shadow-sm dark:shadow-none", className)}
      maxWidth="full"
      aria-label="Mobile navigation"
    >
      <NavbarContent justify="start" className="gap-3">
        {showBack && (
          <NavbarItem>
            <Link
              href={role === "admin" ? "/admin/dashboard" : "/patient/dashboard"}
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
          </NavbarItem>
        )}

        {showLogo && !title && (
          <NavbarBrand as={Link} href={role === "admin" ? "/admin/dashboard" : "/patient/dashboard"} className="gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <MediChainLogo className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">MediChainAI</span>
          </NavbarBrand>
        )}

        {title && (
          <NavbarItem>
            <h1 className="font-semibold text-foreground text-lg">{title}</h1>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2">
        {rightContent && <NavbarItem>{rightContent}</NavbarItem>}

        {showSettings && (
          <NavbarItem>
            <button className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </NavbarItem>
        )}

        {showNotifications && (
          <NavbarItem>
            <button className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-colors">
              <Badge content="" color="primary" shape="circle" placement="top-right">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </Badge>
            </button>
          </NavbarItem>
        )}

        {showAvatar && (
          <NavbarItem>
            <Avatar
              name="DS"
              size="sm"
              classNames={{
                base: "bg-gradient-to-br from-accent to-primary text-white font-medium"
              }}
            />
          </NavbarItem>
        )}
      </NavbarContent>
    </Navbar>
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
