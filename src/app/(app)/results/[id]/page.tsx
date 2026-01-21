"use client";

import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { VerifiedTxCard } from "@/components/verified-tx-card";
import { HeatmapToggle } from "@/components/heatmap-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Share, Download, ArrowRight, AlertTriangle, FileText } from "lucide-react";
import { mockScanAnalysis } from "@/lib/mock";

export default function ResultsPage() {
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);

  const riskColorClass =
    mockScanAnalysis.riskLevel === "High"
      ? "text-destructive"
      : mockScanAnalysis.riskLevel === "Medium"
      ? "text-amber-500"
      : "text-accent";

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        title={`Scan Analysis #${mockScanAnalysis.id}`}
        showBack
        showLogo={false}
        showNotifications={false}
        showAvatar={false}
        rightContent={
          <Button variant="ghost" size="icon" className="w-9 h-9">
            <Share className="w-5 h-5" />
          </Button>
        }
      />

      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Visual Diagnosis Section */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                VISUAL DIAGNOSIS
              </CardTitle>
              <HeatmapToggle enabled={heatmapEnabled} onToggle={setHeatmapEnabled} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* CT Scan Preview */}
            <div className="relative aspect-[4/3] bg-black rounded-xl mx-4 overflow-hidden">
              {/* Simulated CT scan with gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
              
              {/* Simulated scan visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-gray-600 relative">
                  <div className="absolute inset-4 rounded-full border border-gray-500">
                    <div className="absolute inset-4 rounded-full bg-gray-800" />
                  </div>
                  
                  {/* Nodule indicator */}
                  {heatmapEnabled && (
                    <div className="absolute top-8 right-6 w-6 h-6 rounded-full bg-destructive/60 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Nodule label */}
              {heatmapEnabled && (
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-xs font-medium text-foreground">
                    Nodule Detected
                  </span>
                </div>
              )}

              {/* Slice info */}
              <div className="absolute bottom-2 left-2 text-[10px] text-gray-400 font-mono">
                SLICE 42/108
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-mono">
                THICKNESS: 1mm | FOV: 310mm
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Score and Findings */}
        <div className="grid grid-cols-2 gap-3">
          {/* Risk Score */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                RISK SCORE
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${riskColorClass}`}>
                  {mockScanAnalysis.riskScore}
                </span>
                <span className={`text-xl ${riskColorClass}`}>%</span>
              </div>
              <p className={`text-sm font-medium ${riskColorClass}`}>
                {mockScanAnalysis.riskLevel} Probability
              </p>
              <Progress
                value={mockScanAnalysis.riskScore}
                className="h-1.5 mt-3"
                indicatorClassName={
                  mockScanAnalysis.riskLevel === "High"
                    ? "bg-destructive"
                    : mockScanAnalysis.riskLevel === "Medium"
                    ? "bg-amber-500"
                    : "bg-accent"
                }
              />
            </CardContent>
          </Card>

          {/* Findings */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  FINDINGS
                </p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {mockScanAnalysis.findings}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Conf. {mockScanAnalysis.confidence}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Verified Transaction Card */}
        <VerifiedTxCard txHash={mockScanAnalysis.txHash} />

        {/* Medical Disclaimer */}
        <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              AI-Assisted Result:
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
              This analysis does not constitute a final diagnosis. Results should be
              reviewed by a certified radiologist.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Save Report
          </Button>
          <Button className="flex-1">
            Consult Specialist
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
