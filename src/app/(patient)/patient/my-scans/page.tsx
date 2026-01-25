"use client";

import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Clock, ChevronRight, Activity, Calendar, Lock } from "lucide-react";
import { mockUser } from "@/lib/mock";

// Mock scan library
const myScans = [
  {
    id: "scan_19023",
    modality: "CT Chest",
    date: "Jan 24, 2026",
    status: "processing",
    risk: "Medium",
    txHash: "0x7a...f92c" 
  },
  {
    id: "scan_18992",
    modality: "MRI Brain",
    date: "Jan 20, 2026",
    status: "completed",
    risk: "Low",
    txHash: "0x8b...3a11"
  },
  {
    id: "scan_18230",
    modality: "X-Ray Lung",
    date: "Dec 15, 2025",
    status: "completed",
    risk: "High",
    txHash: "0x3c...2b99"
  },
  {
    id: "scan_17550",
    modality: "CT Abdomen",
    date: "Nov 28, 2025",
    status: "completed",
    risk: "Low",
    txHash: "0x1d...4e55"
  }
];

export default function MyScansPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="lg:hidden">
        <TopBar title="My Scans" showBack />
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        <div className="flex items-center justify-between lg:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground hidden lg:block">My Scans</h1>
            <p className="text-muted-foreground hidden lg:block">Manage and view your uploaded medical imaging data</p>
          </div>
          <Button asChild>
            <Link href="/patient/upload">
              <Upload className="w-4 h-4 mr-2" />
              New Upload
            </Link>
          </Button>
        </div>

        {/* Scan Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myScans.map((scan) => (
            <Link key={scan.id} href={`/patient/scans/${scan.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <Badge variant={
                      scan.status === "completed" ? "success" : "secondary"
                    }>
                      {scan.status === "completed" ? "Analyzed" : "Processing"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{scan.modality}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      {scan.date}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       {scan.status === "completed" && (
                         <Badge variant={scan.risk === "Low" ? "outline" : "destructive"} className="text-[10px] h-5">
                           {scan.risk} Risk
                         </Badge>
                       )}
                       <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                         <Lock className="w-3 h-3" />
                         {scan.txHash}
                       </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
