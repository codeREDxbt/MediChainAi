"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LogEntry } from "@/lib/mock";

interface LiveLogPanelProps {
  entries: LogEntry[];
  className?: string;
}

export function LiveLogPanel({ entries, className }: LiveLogPanelProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <CardTitle className="text-sm font-medium">Live Blockchain Log</CardTitle>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar font-mono text-xs space-y-1.5">
          {entries.map((entry, index) => (
            <LogLine key={index} entry={entry} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">[{entry.timestamp}]</span>
      <span
        className={cn(
          "break-all",
          entry.type === "success" && "text-accent",
          entry.type === "error" && "text-destructive",
          entry.type === "hash" && "text-primary",
          entry.type === "info" && "text-foreground"
        )}
      >
        {entry.message}
      </span>
    </div>
  );
}
