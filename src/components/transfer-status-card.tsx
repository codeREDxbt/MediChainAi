import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TransferStatus } from "@/lib/mock";

interface TransferStatusCardProps {
  status: TransferStatus;
  className?: string;
}

const statusVariants = {
  ready: { label: "Ready", variant: "info" as const },
  processing: { label: "Processing", variant: "warning" as const },
  complete: { label: "Complete", variant: "success" as const },
  error: { label: "Error", variant: "destructive" as const },
};

export function TransferStatusCard({ status, className }: TransferStatusCardProps) {
  const statusInfo = statusVariants[status.status];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <CardTitle className="text-sm font-medium">TRANSFER STATUS</CardTitle>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.steps.map((step, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{step.name}</span>
              <span className="text-foreground font-medium">{step.progress}%</span>
            </div>
            <Progress value={step.progress} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
