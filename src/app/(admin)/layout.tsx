"use client";

import { ResponsiveLayout } from "@/components/responsive-layout";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="light text-foreground bg-background min-h-screen">
        <ResponsiveLayout layoutMode="sidebar">
          {children}
        </ResponsiveLayout>
      </div>
    </AuthGuard>
  );
}
