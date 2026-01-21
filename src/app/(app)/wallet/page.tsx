import { TopBar } from "@/components/top-bar";
import { EarningsChart } from "@/components/earnings-chart";
import { ActivityItem } from "@/components/activity-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Layers, Info } from "lucide-react";
import { mockUser, mockWallet, mockWalletActivity, mockEarningsHistory } from "@/lib/mock";

export default function WalletPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title="Wallet"
        showLogo={false}
        showSettings
        rightContent={
          <Badge variant="secondary" className="font-mono text-xs">
            ● {mockUser.walletAddress}
          </Badge>
        }
      />

      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                TOTAL BALANCE
              </span>
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="mb-1">
              <span className="text-4xl font-bold text-foreground">
                {mockWallet.balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-lg text-muted-foreground ml-2">MC-AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ≈ ${mockWallet.usdValue.toFixed(2)} USD
            </p>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <ActionButton icon={ArrowUp} label="Send" variant="outline" />
              <ActionButton icon={ArrowDown} label="Receive" variant="outline" />
              <ActionButton icon={Layers} label="Stake" variant="accent" />
            </div>
          </CardContent>
        </Card>

        {/* Earnings History Chart */}
        <EarningsChart data={mockEarningsHistory} />

        {/* Recent Activity */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">
            Recent Activity
          </h3>
          <Card>
            <CardContent className="p-2 divide-y divide-border">
              {mockWalletActivity.map((item) => (
                <ActivityItem key={item.id} item={item} showHash />
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  variant,
}: {
  icon: React.ElementType;
  label: string;
  variant: "outline" | "accent";
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant={variant === "accent" ? "accent" : "outline"}
        size="icon"
        className="w-14 h-14 rounded-2xl"
      >
        <Icon className="w-6 h-6" />
      </Button>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
