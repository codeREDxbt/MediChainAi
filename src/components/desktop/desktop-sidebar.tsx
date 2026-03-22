"use client";

import React, { useState } from "react";
import { SidebarProvider, Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileStack,
  BarChart3,
  Settings,
  Wallet,
  Users,
  FileText,
  LogOut,
  Upload,
  User,
} from "lucide-react";
import { MediChainLogo } from "@/components/top-bar";
import { cn } from "@/lib/utils";

const patientNavItems = [
  { href: "/patient/dashboard", icon: <LayoutDashboard className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Dashboard" },
  { href: "/patient/my-scans", icon: <FileStack className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "My Scans" },
  { href: "/patient/upload", icon: <Upload className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Upload Scan" },
  { href: "/patient/results", icon: <BarChart3 className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "AI Results" },
  { href: "/patient/wallet", icon: <Wallet className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Wallet" },
  { href: "/patient/profile", icon: <User className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Profile" },
  { href: "/patient/settings", icon: <Settings className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Settings" },
];

const adminNavItems = [
  { href: "/admin/dashboard", icon: <LayoutDashboard className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Dashboard" },
  { href: "/admin/patients", icon: <Users className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Patients" },
  { href: "/admin/reports", icon: <FileText className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Reports" },
  { href: "/admin/settings", icon: <Settings className="text-slate-400 h-5 w-5 flex-shrink-0" />, label: "Settings" },
];

const Logo = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
      <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0 flex items-center justify-center">
        <MediChainLogo className="w-4 h-4 text-black" />
      </div>
      <span className="font-medium text-white whitespace-pre">
        MediChainAI
      </span>
    </div>
  );
};

const LogoIcon = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
      <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0 flex items-center justify-center">
        <MediChainLogo className="w-4 h-4 text-black" />
      </div>
    </div>
  );
};

export function DesktopSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const navItems = role === "admin" ? adminNavItems : patientNavItems;

  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={true}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {navItems.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <div onClick={logout} className="cursor-pointer">
              <SidebarLink
                link={{
                  label: "Logout",
                  href: "#",
                  icon: (
                    <LogOut className="text-slate-400 h-5 w-5 flex-shrink-0" />
                  ),
                }}
              />
            </div>

            <SidebarLink
              link={{
                label: user?.name || "User",
                href: "#",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                    {user?.name?.slice(0, 2).toUpperCase() || "U"}
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      {/* Main Content inside the provider */}
      {children}
    </SidebarProvider>
  );
}
