"use client";

import { ResponsiveLayout } from "@/components/responsive-layout";
import { AuthGuard } from "@/components/auth-guard";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["patient"]}>
      <ResponsiveLayout>
        {children}
      </ResponsiveLayout>
    </AuthGuard>
  );
}
