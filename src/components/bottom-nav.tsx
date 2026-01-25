"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Home, FileStack, BarChart3, Settings, Wallet, Users, FileText } from "lucide-react";

const patientNavItems = [
  { href: "/patient/dashboard", icon: Home, label: "Home" },
  { href: "/patient/my-scans", icon: FileStack, label: "My Scans" },
  { href: "/patient/results", icon: BarChart3, label: "Insights", isCenter: true },
  { href: "/patient/wallet", icon: Wallet, label: "Wallet" },
  { href: "/patient/settings", icon: Settings, label: "Settings" },
];

const adminNavItems = [
  { href: "/admin/dashboard", icon: Home, label: "Home" },
  { href: "/admin/patients", icon: Users, label: "Patients" },
  { href: "/admin/reports", icon: FileText, label: "Reports", isCenter: true },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

const legacyNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/upload", icon: FileStack, label: "My Scans" },
  { href: "/status", icon: BarChart3, label: "Insights", isCenter: true },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const navItems = role === "admin" 
    ? adminNavItems 
    : role === "patient" 
      ? patientNavItems 
      : legacyNavItems;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "max-w-md mx-auto",
        "bg-background/90 backdrop-blur-xl",
        "border-t border-border/50",
        "safe-bottom"
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/patient/dashboard" && item.href !== "/admin/dashboard" && item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "-mt-6"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-2xl",
                    "bg-primary shadow-lg shadow-primary/30",
                    "transition-all duration-200 hover:scale-105 active:scale-95"
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 min-w-[60px]",
                "transition-colors duration-200"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mb-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
