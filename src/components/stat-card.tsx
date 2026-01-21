import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine, Target, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  icon?: "scan" | "accuracy" | "custom";
  className?: string;
}

const iconMap = {
  scan: ScanLine,
  accuracy: Target,
  custom: ScanLine,
};

export function StatCard({
  label,
  value,
  delta,
  deltaType = "neutral",
  icon = "custom",
  className,
}: StatCardProps) {
  const Icon = iconMap[icon];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {delta && (
              <div className="flex items-center gap-1 mt-1">
                {deltaType === "positive" && (
                  <TrendingUp className="w-3 h-3 text-accent" />
                )}
                {deltaType === "negative" && (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-xs",
                    deltaType === "positive" && "text-accent",
                    deltaType === "negative" && "text-destructive",
                    deltaType === "neutral" && "text-muted-foreground"
                  )}
                >
                  {delta}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
