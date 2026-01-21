"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EarningsDataPoint } from "@/lib/mock";

interface EarningsChartProps {
  data: EarningsDataPoint[];
  className?: string;
}

export function EarningsChart({ data, className }: EarningsChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  // Calculate points for SVG path
  const width = 280;
  const height = 80;
  const padding = 10;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - 2 * padding),
    y: height - padding - ((d.value - minValue) / range) * (height - 2 * padding),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Create gradient fill area
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const lastPoint = points[points.length - 1];
  const lastValue = data[data.length - 1];
  const deltaPercent = ((lastValue.value - data[0].value) / data[0].value * 100).toFixed(1);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Earnings History</CardTitle>
          <Tabs defaultValue="1W" className="h-8">
            <TabsList className="h-7 p-0.5">
              <TabsTrigger value="1W" className="text-xs h-6 px-2">1W</TabsTrigger>
              <TabsTrigger value="1M" className="text-xs h-6 px-2">1M</TabsTrigger>
              <TabsTrigger value="All" className="text-xs h-6 px-2">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative">
          <svg width="100%" viewBox={`0 0 ${width} ${height + 10}`} className="overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Gradient fill */}
            <path d={areaD} fill="url(#chartGradient)" />
            
            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* End point dot */}
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="4"
              fill="hsl(var(--accent))"
            />
            
            {/* End point label */}
            <g transform={`translate(${lastPoint.x + 8}, ${lastPoint.y - 8})`}>
              <rect
                x="-2"
                y="-12"
                width="45"
                height="18"
                rx="4"
                fill="hsl(var(--accent))"
              />
              <text
                x="20"
                y="0"
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="600"
              >
                +{deltaPercent}%
              </text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
