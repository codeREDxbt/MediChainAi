import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { StatCard } from "@/components/stat-card";
import { ActivityItem } from "@/components/activity-item";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Upload } from "lucide-react";
import {
  mockUser,
  mockDashboardStats,
  mockWallet,
  mockRecentActivity,
} from "@/lib/mock";

export default function PatientDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile TopBar - hidden on desktop */}
      <div className="lg:hidden">
        <TopBar />
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Welcome back,
          </h1>
          <h2 className="text-2xl font-bold text-primary lg:text-3xl">
            {mockUser.name}.
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {mockDashboardStats.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              delta={stat.delta}
              deltaType={stat.deltaType}
              icon={stat.icon as "scan" | "accuracy"}
            />
          ))}
          {/* Add more stats for desktop */}
          <div className="hidden lg:block">
            <StatCard
              label="PENDING REWARDS"
              value={mockWallet.pendingRewards}
              delta="+45 this month"
              deltaType="positive"
              icon="scan"
            />
          </div>
          <div className="hidden lg:block">
            <StatCard
              label="GLOBAL ROUND"
              value="120"
              delta="Active"
              deltaType="positive"
              icon="accuracy"
            />
          </div>
        </div>

        {/* Pending Rewards Card - Mobile only */}
        <Card className="lg:hidden">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              PENDING REWARDS
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground">
                {mockWallet.pendingRewards}
              </span>
              <span className="text-sm text-muted-foreground">MC-AI</span>
              <div className="flex gap-1 ml-auto">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-6 rounded-sm bg-primary/20"
                    style={{
                      opacity: i <= 3 ? 1 : 0.4,
                      backgroundColor: i <= 3 ? "hsl(var(--primary))" : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analyze New Scan CTA */}
        <Card className="overflow-hidden">
          <CardContent className="p-5 lg:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1 lg:text-xl">
                  Analyze New Scan
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload DICOM/CT files securely for federated analysis.
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center lg:w-10 lg:h-10">
                <Lock className="w-4 h-4 text-accent lg:w-5 lg:h-5" />
              </div>
            </div>
            <Button asChild className="w-full lg:w-auto">
              <Link href="/patient/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload CT Scan
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Chain Activity */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            RECENT CHAIN ACTIVITY
          </h3>
          <Card>
            <CardContent className="p-2 divide-y divide-border lg:p-4">
              {mockRecentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
