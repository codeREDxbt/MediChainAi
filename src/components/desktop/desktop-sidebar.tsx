"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, UserRole } from "@/lib/auth-context";
import { MediChainLogo } from "@/components/top-bar";
import {
  Home,
  FileStack,
  BarChart3,
  Settings,
  Wallet,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const patientNavItems: NavItem[] = [
  { href: "/patient/dashboard", icon: Home, label: "Dashboard" },
  { href: "/patient/upload", icon: FileStack, label: "My Scans" },
  { href: "/patient/results", icon: BarChart3, label: "AI Results" },
  { href: "/patient/wallet", icon: Wallet, label: "Wallet" },
  { href: "/patient/settings", icon: Settings, label: "Settings" },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
  { href: "/admin/patients", icon: Users, label: "Patients" },
  { href: "/admin/reports", icon: FileText, label: "Reports" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

interface DesktopSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DesktopSidebar({ collapsed = false, onToggleCollapse }: DesktopSidebarProps) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const navItems = role === "admin" ? adminNavItems : patientNavItems;

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0",
        "bg-card/50 backdrop-blur-xl border-r border-border/50",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-border/50",
        collapsed && "justify-center px-2"
      )}>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MediChainLogo className="w-6 h-6 text-primary" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg text-foreground">MediChainAI</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "transition-all duration-200",
                "hover:bg-muted/50",
                isActive && "bg-primary/10 text-primary",
                !isActive && "text-muted-foreground hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <span className={cn("font-medium", isActive && "text-primary")}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex items-center justify-center mx-2 mb-2 py-2 rounded-xl",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            "transition-colors duration-200"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      )}

      {/* User Profile */}
      <div className={cn(
        "border-t border-border/50 p-3",
        collapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-white">
              {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted/50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
