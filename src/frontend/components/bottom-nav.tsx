"use client";

import { useAuth } from "@/lib/auth-context";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Home, FileStack, BarChart3, Settings, Wallet, Users, FileText, Upload, User } from "lucide-react";

export function BottomNav() {
  const { role } = useAuth();

  const patientNavItems = [
    { href: "/patient/dashboard", icon: <Home className="h-5 w-5" />, title: "Home" },
    { href: "/patient/my-scans", icon: <FileStack className="h-5 w-5" />, title: "My Scans" },
    { href: "/patient/upload", icon: <Upload className="h-5 w-5" />, title: "Upload" },
    { href: "/patient/results", icon: <BarChart3 className="h-5 w-5" />, title: "Insights" },
    { href: "/patient/wallet", icon: <Wallet className="h-5 w-5" />, title: "Wallet" },
    { href: "/patient/profile", icon: <User className="h-5 w-5" />, title: "Profile" },
    { href: "/patient/settings", icon: <Settings className="h-5 w-5" />, title: "Settings" },
  ];

  const adminNavItems = [
    { href: "/admin/dashboard", icon: <Home className="h-5 w-5" />, title: "Home" },
    { href: "/admin/patients", icon: <Users className="h-5 w-5" />, title: "Patients" },
    { href: "/admin/reports", icon: <FileText className="h-5 w-5" />, title: "Reports" },
    { href: "/admin/settings", icon: <Settings className="h-5 w-5" />, title: "Settings" },
  ];

  const navItems = role === "admin" ? adminNavItems : patientNavItems;

  return (
    <div className="fixed bottom-4 right-4 z-[5000]">
      <FloatingDock
        mobileClassName="translate-y-0"
        items={navItems}
      />
    </div>
  );
}
