"use client";

import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Upload,
  Wallet,
  FileText,
  Clock,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MediChainLogo } from "@/components/top-bar";
import { Avatar } from "@heroui/react";

export function DesktopNavbar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", link: "/patient/dashboard", icon: LayoutDashboard },
    { name: "My Scans", link: "/patient/my-scans", icon: Clock },
    { name: "New Upload", link: "/patient/upload", icon: Upload },
    { name: "Results", link: "/patient/results", icon: FileText },
    { name: "Wallet", link: "/patient/wallet", icon: Wallet },
    { name: "Profile", link: "/patient/profile", icon: User },
  ];

  return (
    <>
      <nav className="fixed top-0 inset-x-0 h-16 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 z-[5000] flex items-center px-6 lg:px-12">
        <div className="flex items-center gap-8 w-full max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/patient/dashboard" className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <MediChainLogo className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight hidden lg:block">MediChain<span className="text-emerald-400">AI</span></span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.link;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.link}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side Tools */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-white">{user.name || "Patient"}</span>
                  <span className="text-[10px] text-emerald-400 tracking-wider uppercase">{user.role}</span>
                </div>
                <Avatar
                  name={user.name?.[0]?.toUpperCase() || "P"}
                  size="sm"
                  classNames={{
                    base: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  }}
                />
              </div>
            ) : (
              <Link href="/auth" className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors">
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
