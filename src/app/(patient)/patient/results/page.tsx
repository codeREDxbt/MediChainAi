"use client";

import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { LiveLogPanel } from "@/components/live-log-panel";
import { HeatmapToggle } from "@/components/heatmap-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Smartphone, Network, Shield, Zap, Wallet } from "lucide-react";
import { mockFederatedStatus, mockLogEntries } from "@/lib/mock";

export default function PatientResultsPage() {
  const [highPerformance, setHighPerformance] = useState(true);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile TopBar */}
      <div className="lg:hidden">
        <TopBar
          title="AI Insights"
          showBack
          showLogo={false}
          showSettings
          showNotifications={false}
          showAvatar={false}
          rightContent={
            <Badge variant="success" className="text-[10px]">
              ● POLYGON MAINNET
            </Badge>
          }
        />
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        {/* Desktop Header */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Insights & Federated Status</h1>
            <p className="text-muted-foreground">Monitor your local model training and global synchronization</p>
          </div>
          <Badge variant="success" className="text-sm px-4 py-2">
            ● POLYGON MAINNET
          </Badge>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Device ↔ Global Model */}
            <div className="flex items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  LOCAL DEVICE
                </span>
              </div>

              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Network className="w-7 h-7 text-accent" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  GLOBAL MODEL
                </span>
              </div>
            </div>

            {/* Local Round */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">
                Local Round {mockFederatedStatus.localRound}
              </h2>
              <p className="text-sm text-primary">{mockFederatedStatus.status}</p>
            </div>

            {/* Privacy Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="gap-2 py-2 px-4">
                <Shield className="w-4 h-4" />
                Privacy Active: Data never leaves this device
              </Badge>
            </div>

            {/* Epoch Progress */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    CURRENT EPOCH
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Est. Time Remaining
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-foreground">
                    {mockFederatedStatus.currentEpoch}
                    <span className="text-muted-foreground font-normal">
                      {" "}/ {mockFederatedStatus.totalEpochs}
                    </span>
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {mockFederatedStatus.timeRemaining}
                  </span>
                </div>
                <Progress
                  value={(mockFederatedStatus.currentEpoch / mockFederatedStatus.totalEpochs) * 100}
                  className="h-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6 mt-6 lg:mt-0">
            {/* Accuracy & Tokens */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    MODEL ACCURACY
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {mockFederatedStatus.modelAccuracy}%
                    </span>
                    <span className="text-sm text-accent font-medium">
                      {mockFederatedStatus.accuracyDelta}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            i <= 4 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    MEDITOKENS
                  </p>
                  <span className="text-2xl font-bold text-foreground">
                    {mockFederatedStatus.mediTokens}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    MATIC Equivalent
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Wallet className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Wallet Connected
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Blockchain Log */}
            <LiveLogPanel entries={mockLogEntries} />

            {/* High Performance Toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-foreground">High Performance</p>
                      <p className="text-xs text-muted-foreground">
                        Battery drain anticipated
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={highPerformance}
                    onCheckedChange={setHighPerformance}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
