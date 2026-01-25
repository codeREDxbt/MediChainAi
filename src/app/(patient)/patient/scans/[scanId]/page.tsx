"use client";

import { use } from "react";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Activity, 
  Brain, 
  Share2, 
  Download, 
  FileCheck,
  Calendar,
  User,
  Hash
} from "lucide-react";

// Mock scan details
const mockScanDetails = {
  id: "scan_18992",
  modality: "MRI Brain",
  patientName: "Dr. Silva (Self)",
  date: "Jan 20, 2026",
  status: "Analysed",
  riskScore: 12,
  riskLevel: "Low",
  findings: "No significant abnormalities detected. Ventricular system appears normal. No evidence of hemorrhage or mass effect.",
  txHash: "0x8b32...3a11",
  flNode: "Node #42 (Eu-West)",
  model: "NeuroNet v4.2"
};

export default function Page({ params }: { params: Promise<{ scanId: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="lg:hidden">
        <TopBar title="Scan Results" showBack />
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        {/* Header (Desktop) */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Scan Analysis</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <span className="font-mono text-sm">ID: {resolvedParams.scanId}</span>
              <span>•</span>
              <span>{mockScanDetails.modality}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share Securely
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content: Viewer & Findings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mock Viewer */}
            <Card className="overflow-hidden bg-black/90 border-zinc-800">
              <div className="aspect-square lg:aspect-[16/9] relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                
                {/* Simulated MRI Grid */}
                <div className="grid grid-cols-2 gap-1 w-full h-full p-4 opacity-80">
                  <div className="bg-zinc-800 rounded-sm animate-pulse" />
                  <div className="bg-zinc-800 rounded-sm animate-pulse delay-75" />
                  <div className="bg-zinc-800 rounded-sm animate-pulse delay-150" />
                  <div className="bg-zinc-800 rounded-sm animate-pulse delay-200" />
                </div>
                
                <div className="absolute z-20 flex flex-col items-center">
                  <Brain className="w-16 h-16 text-primary/50 mb-4" />
                  <p className="text-zinc-400 text-sm font-mono">DICOM VIEWER LOADING...</p>
                </div>

                <Badge variant="outline" className="absolute top-4 right-4 z-20 border-primary text-primary bg-primary/10">
                  AI Overlay Active
                </Badge>
              </div>
            </Card>

            {/* AI Findings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  AI Analysis Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-sm font-medium text-success-foreground">
                    <FileCheck className="w-4 h-4 inline mr-2" />
                    Analysis Complete
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mockScanDetails.findings}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Anomaly Probability</span>
                    <span className="font-medium">{mockScanDetails.riskScore}%</span>
                  </div>
                  <Progress value={mockScanDetails.riskScore} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Metadata & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase text-muted-foreground">Provenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Date</span>
                  </div>
                  <span className="font-medium text-foreground">{mockScanDetails.date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Patient</span>
                  </div>
                  <span className="font-medium text-foreground">{mockScanDetails.patientName}</span>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Blockchain Transaction Hash</p>
                  <div className="font-mono text-xs bg-muted p-2 rounded break-all flex items-start gap-2">
                    <Hash className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {mockScanDetails.txHash}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-accent">
                    <Shield className="w-3 h-3" />
                    Verified on Polygon
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase text-muted-foreground">Model Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground block text-xs mb-1">Federated Model</span>
                  <span className="font-medium">{mockScanDetails.model}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground block text-xs mb-1">Processing Node</span>
                  <span className="font-medium">{mockScanDetails.flNode}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Mobile Actions */}
            <div className="lg:hidden grid gap-3">
              <Button className="w-full" variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
