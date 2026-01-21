"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface HeatmapToggleProps {
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

export function HeatmapToggle({
  enabled = false,
  onToggle,
  className,
}: HeatmapToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-foreground">Heatmap</span>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
