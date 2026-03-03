"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export function AuthGuard({ children, allowedRoles, fallbackPath }: AuthGuardProps) {
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login or home
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    // Authenticated but wrong role
    if (role && !allowedRoles.includes(role)) {
      // Redirect to the correct dashboard based on role
      const correctPath = role === "admin" ? "/admin/dashboard" : "/patient/dashboard";
      if (pathname !== correctPath) {
        router.replace(correctPath);
      }
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, router, pathname]);

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated or wrong role
  if (!isAuthenticated || (role && !allowedRoles.includes(role))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
