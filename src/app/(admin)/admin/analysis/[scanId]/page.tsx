"use client";

import { use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Flag,
  ZoomIn,
  MessageSquare,
  FileText,
  User,
  Calendar,
  Layers
} from "lucide-react";

export default function AdminAnalysisPage({ params }: { params: Promise<{ scanId: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] lg:h-[calc(100vh-theme(spacing.24))]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analysis Review</h1>
          <p className="text-muted-foreground">Scan Ref: {resolvedParams.scanId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Flag className="w-4 h-4 mr-2" />
            Flag Issue
          </Button>
          <Button variant="outline" className="text-accent hover:text-accent">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve Auto-Report
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Main Viewer - Takes up most space */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <Card className="flex-1 bg-black overflow-hidden relative border-zinc-800 flex items-center justify-center">
             <div className="absolute top-4 left-4 z-10 flex gap-2">
               <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                 Series: T2_FLAIR
               </Badge>
               <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                 Slice: 14/128
               </Badge>
             </div>
             
             {/* Main Image Area */}
             <div className="w-full h-full flex items-center justify-center opacity-50">
               <div className="text-center">
                 <Layers className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                 <p className="text-zinc-500 font-mono">HIGH-RES VIEWER CANVAS</p>
                 <p className="text-zinc-600 text-xs mt-2">Interactive 3D rendering engine suspended</p>
               </div>
             </div>

             {/* Floating Toolbar */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-full px-4 py-2 flex items-center gap-4">
               <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10 rounded-full w-8 h-8">
                 <ZoomIn className="w-4 h-4" />
               </Button>
               <div className="w-px h-4 bg-zinc-700" />
               <span className="text-xs font-mono text-zinc-400">WW/WL</span>
               <span className="text-xs font-mono text-zinc-400">MEASURE</span>
             </div>
          </Card>
        </div>

        {/* Right Sidebar - Review Controls */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Patient Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                   <p className="font-medium">Patient #4922</p>
                   <p className="text-xs text-muted-foreground">Male, 45y</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Jan 20, 2026</span>
                <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> MRI</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Findings Review */}
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col gap-4">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">AI Findings</h3>
              
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-red-500 text-sm font-medium">Potential Anomaly</span>
                  <Badge variant="destructive" className="text-[10px]">98% Conf</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hyperintensity in left temporal lobe suggesting potential gliosis or edema.
                </p>
              </div>

              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                   <span className="text-accent text-sm font-medium">Volumetric Analysis</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hippocampal volume within normal range (L: 3.2cm³, R: 3.1cm³).
                </p>
              </div>

              <div className="mt-auto pt-4">
                <h4 className="font-medium text-sm mb-2">Radiologist Notes</h4>
                <textarea 
                  className="w-full bg-muted/50 rounded-lg border border-border p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Add clinical observations..."
                />
              </div>
            </CardContent>
          </Card>

          <Button className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Generate Final Report
          </Button>
        </div>
      </div>
    </div>
  );
}
