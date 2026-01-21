import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
      <BottomNav />
    </AppShell>
  );
}
