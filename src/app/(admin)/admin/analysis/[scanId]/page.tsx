"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Users,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  User,
  Calendar,
  Layers,
  AlertTriangle,
  ChevronLeft,
  Brain,
  Target,
  Cpu
} from "lucide-react";

// Mock scan data
const scanData = {
  id: "scan_19023",
  patient: {
    id: "P001",
    name: "Dr. Sarah Silva",
    age: 45,
    gender: "Female"
  },
  modality: "CT",
  bodyPart: "Chest",
  date: "Jan 24, 2026",
  series: "HRCT_LUNG",
  slices: 256,
  anomalyScore: 78,
  confidence: 94.2,
  modelVersion: "MediChainAI-v3.2.1",
  findings: [
    {
      id: 1,
      type: "critical",
      title: "Pulmonary Nodule Detected",
      description: "8mm ground-glass opacity in right upper lobe (RUL), segment 3. Recommend follow-up CT in 3 months.",
      confidence: 96.8,
      location: "RUL S3"
    },
    {
      id: 2,
      type: "warning",
      title: "Mild Emphysematous Changes",
      description: "Paraseptal emphysema noted in bilateral upper lobes. Correlate with smoking history.",
      confidence: 89.4,
      location: "Bilateral UL"
    },
    {
      id: 3,
      type: "info",
      title: "Calcified Granuloma",
      description: "Small calcified granuloma in left lower lobe, likely benign. No action required.",
      confidence: 98.1,
      location: "LLL"
    },
    {
      id: 4,
      type: "info",
      title: "Normal Cardiac Silhouette",
      description: "Heart size within normal limits. No pericardial effusion.",
      confidence: 99.2,
      location: "Mediastinum"
    }
  ]
};

const findingTypeConfig = {
  critical: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    icon: AlertTriangle
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    icon: AlertTriangle
  },
  info: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2
  }
};

export default function AdminAnalysisPage({ params }: { params: Promise<{ scanId: string }> }) {
  const resolvedParams = use(params);

  const getAnomalyColor = (score: number) => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/patients">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analysis Review</h1>
            <p className="text-muted-foreground">Scan ID: {resolvedParams.scanId}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Request Peer Review
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report PDF
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve Findings
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-black">
              {/* Series/Slice Info */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Badge variant="outline" className="bg-black/60 text-white border-white/20 backdrop-blur">
                  Series: {scanData.series}
                </Badge>
                <Badge variant="outline" className="bg-black/60 text-white border-white/20 backdrop-blur">
                  Slice: 128/{scanData.slices}
                </Badge>
              </div>

              {/* Viewer Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Layers className="w-20 h-20 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400 font-mono text-lg">DICOM VIEWER</p>
                  <p className="text-zinc-600 text-sm mt-2">{scanData.modality} {scanData.bodyPart}</p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-full px-4 py-2 flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full w-8 h-8">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full w-8 h-8">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-zinc-700" />
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full w-8 h-8">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full w-8 h-8">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Anomaly Score & Confidence */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-medium">Anomaly Score</span>
                  </div>
                  <span className={`text-3xl font-bold ${getAnomalyColor(scanData.anomalyScore)}`}>
                    {scanData.anomalyScore}
                  </span>
                </div>
                <Progress value={scanData.anomalyScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Score above 70 indicates high priority review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    <span className="font-medium">AI Confidence</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    {scanData.confidence}%
                  </span>
                </div>
                <Progress value={scanData.confidence} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Overall prediction confidence level
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Patient Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{scanData.patient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {scanData.patient.gender}, {scanData.patient.age}y • {scanData.patient.id}
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {scanData.date}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {scanData.modality} {scanData.bodyPart}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Model Version */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Model Version</span>
              </div>
              <p className="font-mono text-sm font-medium">{scanData.modelVersion}</p>
            </CardContent>
          </Card>

          {/* Findings List */}
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                AI Findings
                <Badge variant="secondary" className="ml-auto">{scanData.findings.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {scanData.findings.map((finding) => {
                const config = findingTypeConfig[finding.type as keyof typeof findingTypeConfig];
                const Icon = config.icon;
                
                return (
                  <div
                    key={finding.id}
                    className={`p-3 rounded-lg border ${config.border} ${config.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.text}`} />
                        <span className={`text-sm font-medium ${config.text}`}>
                          {finding.title}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {finding.confidence}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {finding.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Location: {finding.location}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Radiologist Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Radiologist Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full bg-muted/50 rounded-lg border border-border p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Add clinical observations and recommendations..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
