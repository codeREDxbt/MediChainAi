import { cn } from "@/lib/utils";
import { Chip } from "@heroui/react";
import { CheckCircle2, RefreshCw, Coins, Zap, ExternalLink } from "lucide-react";
import type { ActivityItem as ActivityItemType } from "@/lib/mock";

interface ActivityItemProps {
  item: ActivityItemType;
  className?: string;
  showHash?: boolean;
}

const iconMap = {
  batch_verified: CheckCircle2,
  model_updated: RefreshCw,
  rewards_distributed: Coins,
  fl_round: Zap,
};

export function ActivityItem({ item, className, showHash = false }: ActivityItemProps) {
  const Icon = iconMap[item.type];

  return (
    <div className={cn("flex items-start gap-3 py-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
          item.type === "batch_verified" && "bg-accent/10",
          item.type === "model_updated" && "bg-primary/10",
          item.type === "rewards_distributed" && "bg-amber-500/10",
          item.type === "fl_round" && "bg-primary/10"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5",
            item.type === "batch_verified" && "text-accent",
            item.type === "model_updated" && "text-primary",
            item.type === "rewards_distributed" && "text-amber-500",
            item.type === "fl_round" && "text-primary"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{item.title}</p>
            {item.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
            )}
          </div>

          <div className="flex flex-col items-end shrink-0">
            {item.amount !== undefined && (
              <span
                className={cn(
                  "font-semibold text-sm",
                  item.amountType === "positive" && "text-accent",
                  item.amountType === "negative" && "text-destructive"
                )}
              >
                {item.amountType === "positive" ? "+" : "-"}
                {item.amount.toFixed(2)}
                <span className="text-xs ml-1 text-muted-foreground">MC-AI</span>
              </span>
            )}
            <span className="text-xs text-muted-foreground">{item.timestamp}</span>
          </div>
        </div>

        {showHash && item.hash && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground font-mono">
              Hash: {item.hash}
            </span>
            <a
              href={`https://explorer.solana.com/tx/${item.hash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Verified on Solana
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {item.status && (
          <div className="mt-2">
            <Chip
              variant="flat"
              size="sm"
              color={
                item.status === "verified" || item.status === "completed"
                  ? "success"
                  : "warning"
              }
              className="text-[10px]"
            >
              {item.status === "pending" && "Pending"}
              {item.status === "verified" && "Verified"}
              {item.status === "completed" && "Completed"}
            </Chip>
          </div>
        )}
      </div>
    </div>
  );
}
