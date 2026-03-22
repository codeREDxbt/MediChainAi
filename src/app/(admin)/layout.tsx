"use client";

import { ResponsiveLayout } from "@/components/responsive-layout";
import { AuthGuard } from "@/components/auth-guard";
import { Silk } from "@/components/ui/silk";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="dark text-foreground bg-[#050506] min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
          <Silk speed={6.7} scale={1.4} color="#171717" noiseIntensity={1.8} rotation={0} />
        </div>
        <div className="relative z-10">
          <ResponsiveLayout layoutMode="sidebar">
            {children}
          </ResponsiveLayout>
        </div>
      </div>
    </AuthGuard>
  );
}
