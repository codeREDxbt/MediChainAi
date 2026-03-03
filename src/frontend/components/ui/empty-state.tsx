import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <Icon className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <h3 className="heading-4 mb-2">{title}</h3>
      <p className="body-small text-center max-w-sm mb-6 text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
