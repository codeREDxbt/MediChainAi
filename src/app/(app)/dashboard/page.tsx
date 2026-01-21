import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { StatCard } from "@/components/stat-card";
import { ActivityItem } from "@/components/activity-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Upload } from "lucide-react";
import {
  mockUser,
  mockDashboardStats,
  mockWallet,
  mockRecentActivity,
} from "@/lib/mock";

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back,
          </h1>
          <h2 className="text-2xl font-bold text-primary">
            {mockUser.name}.
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Pending Rewards Card */}
        <Card>
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
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Analyze New Scan
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload DICOM/CT files securely for federated analysis.
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-accent" />
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/upload">
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
            <CardContent className="p-2 divide-y divide-border">
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
