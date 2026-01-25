"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight 
} from "lucide-react";

// Mock scan library with enhanced data
const myScans = [
  {
    id: "scan_19023",
    modality: "CT",
    bodyPart: "Chest",
    date: "Jan 24, 2026",
    source: "City General Hospital",
    status: "processing",
    thumbnail: "/scans/ct-chest-thumb.jpg",
  },
  {
    id: "scan_18992",
    modality: "MRI",
    bodyPart: "Brain",
    date: "Jan 20, 2026",
    source: "NeuroImaging Center",
    status: "verified",
    thumbnail: "/scans/mri-brain-thumb.jpg",
  },
  {
    id: "scan_18230",
    modality: "X-Ray",
    bodyPart: "Lung",
    date: "Dec 15, 2025",
    source: "Primary Care Clinic",
    status: "review",
    thumbnail: "/scans/xray-lung-thumb.jpg",
  },
  {
    id: "scan_17550",
    modality: "CT",
    bodyPart: "Abdomen",
    date: "Nov 28, 2025",
    source: "City General Hospital",
    status: "verified",
    thumbnail: "/scans/ct-abdomen-thumb.jpg",
  },
  {
    id: "scan_17120",
    modality: "Ultrasound",
    bodyPart: "Liver",
    date: "Oct 10, 2025",
    source: "Diagnostic Labs",
    status: "verified",
    thumbnail: "/scans/us-liver-thumb.jpg",
  },
  {
    id: "scan_16890",
    modality: "MRI",
    bodyPart: "Spine",
    date: "Sep 05, 2025",
    source: "NeuroImaging Center",
    status: "verified",
    thumbnail: "/scans/mri-spine-thumb.jpg",
  },
];

const tabs = ["All", "MRI", "CT", "X-Ray", "Ultrasound"];

const statusConfig = {
  verified: {
    label: "AI Verified",
    icon: CheckCircle2,
    variant: "success" as const,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  review: {
    label: "Review Needed",
    icon: AlertCircle,
    variant: "destructive" as const,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

export default function MyScansPage() {
  const [activeTab, setActiveTab] = useState("All");

  const filteredScans = activeTab === "All" 
    ? myScans 
    : myScans.filter(scan => scan.modality === activeTab);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="lg:hidden">
        <TopBar title="My Scans" showBack />
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Scans</h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage your medical imaging library
            </p>
          </div>
          <Button size="lg" className="gap-2" asChild>
            <Link href="/patient/upload">
              <Upload className="w-5 h-5" />
              Upload New Scan
            </Link>
          </Button>
        </div>

        {/* Mobile Upload Button */}
        <div className="lg:hidden">
          <Button className="w-full gap-2" asChild>
            <Link href="/patient/upload">
              <Upload className="w-4 h-4" />
              Upload New Scan
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full lg:w-auto justify-start bg-muted/50 p-1 h-auto flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab}
                className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Scan Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredScans.length} scan{filteredScans.length !== 1 ? "s" : ""}
        </p>

        {/* Scan Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredScans.map((scan) => {
            const status = statusConfig[scan.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            
            return (
              <Card 
                key={scan.id} 
                className="overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                  {/* Modality Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur font-medium">
                      {scan.modality}
                    </Badge>
                  </div>
                  {/* Status Chip */}
                  <div className="absolute top-3 right-3">
                    <Badge className={`${status.className} gap-1 font-medium border`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Title & Body Part */}
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {scan.modality} {scan.bodyPart}
                    </h3>
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{scan.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{scan.source}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    asChild
                  >
                    <Link href={`/patient/scans/${scan.id}`}>
                      View Report
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredScans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No scans found</h3>
            <p className="text-muted-foreground mb-4">
              No {activeTab} scans in your library yet
            </p>
            <Button asChild>
              <Link href="/patient/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Scan
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
