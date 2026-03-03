import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader, Chip, Progress } from "@heroui/react";
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
    <Card className={cn("overflow-hidden bg-background/50 border border-border/50", className)} shadow="sm">
      <CardHeader className="pb-3 px-5 pt-5">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-medium">TRANSFER STATUS</h3>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color={
              statusInfo.variant === "info" ? "primary" :
                statusInfo.variant === "destructive" ? "danger" :
                  statusInfo.variant as any
            }
          >
            {statusInfo.label}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="space-y-4 px-5 pb-5 pt-0">
        {status.steps.map((step, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{step.name}</span>
              <span className="text-foreground font-medium">{step.progress}%</span>
            </div>
            <Progress
              aria-label={step.name}
              value={step.progress}
              className="h-1.5"
              color={step.progress === 100 ? "success" : "primary"}
              size="sm"
            />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
