"use client";

import { ResponsiveLayout } from "@/components/responsive-layout";
import { AuthGuard } from "@/components/auth-guard";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["patient"]}>
      <div className="dark text-[#EDEDEF] bg-[#050506] min-h-screen relative overflow-x-hidden font-sans">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <BackgroundBeams />
        </div>

        <div className="relative z-10">
          <ResponsiveLayout layoutMode="top-nav">
            {children}
          </ResponsiveLayout>
        </div>
      </div>
    </AuthGuard>
  );
}
