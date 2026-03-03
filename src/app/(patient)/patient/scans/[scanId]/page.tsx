"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { Card, CardBody, CardHeader, Button, Chip, Progress } from "@heroui/react";
import {
  Shield,
  Activity,
  Brain,
  Share2,
  Download,
  FileCheck,
  Calendar,
  User,
  Hash,
  Loader2,
  AlertCircle
} from "lucide-react";
import Image from "next/image";

interface FormattedScan {
  id: string;
  scanType: string;
  originalName: string | null;
  patientName: string | null;
  studyDate: string | null;
  seriesDesc: string | null;
  riskScore: number;
  riskLevel: "High" | "Low" | "Medium";
  findings: string;
  confidence: number;
  txHash: string;
  timestamp: string;
  imageUrl: string;
  convertedImageUrl: string | null;
  status: string;
  modality?: string;
  region?: string;
}

interface AnalysisFindings {
  summary: string;
  details: string[];
  urgent: boolean;
}

export default function Page({ params }: { params: Promise<{ scanId: string }> }) {
  const resolvedParams = use(params);
  const scanId = resolvedParams.scanId;
  
  const [scan, setScan] = useState<FormattedScan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [findingsObj, setFindingsObj] = useState<AnalysisFindings | null>(null);

  useEffect(() => {
    async function loadScan() {
      try {
        setIsLoading(true);
        setError(null);
        
        const res = await fetch('/api/scans/me');
        
        if (!res.ok) {
          throw new Error('Failed to load scans');
        }
        
        const data = await res.json();
        const foundScan = data.scans?.find((s: FormattedScan) => s.id === scanId);
        
        if (!foundScan) {
          setError('Scan not found');
          return;
        }
        
        setScan(foundScan);
        
        if (foundScan.findings && foundScan.findings !== "Pending Analysis") {
          try {
            const parsed = typeof foundScan.findings === 'string' 
              ? JSON.parse(foundScan.findings) 
              : foundScan.findings;
            setFindingsObj(parsed);
          } catch (e) {
            console.error("Failed to parse findings:", e);
          }
        }
      } catch (err) {
        console.error("Failed to load scan:", err);
        setError(err instanceof Error ? err.message : 'Failed to load scan');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadScan();
  }, [scanId]);

  const getRiskColor = (score: number) => {
    if (score >= 85) return "danger";
    if (score >= 60) return "warning";
    return "primary";
  };

  const getRiskLevel = (score: number) => {
    if (score >= 85) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "Unknown Date";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Unknown Date";
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Unknown Date";
    }
  };

  const truncateHash = (hash: string) => {
    if (!hash || hash.length < 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="lg:hidden">
          <TopBar title="Scan Results" showBack />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="lg:hidden">
          <TopBar title="Scan Results" showBack />
        </div>
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <AlertCircle className="w-12 h-12 text-danger mb-4" />
          <p className="text-danger font-medium">{error || 'Scan not found'}</p>
          <Button 
            variant="flat" 
            color="primary" 
            className="mt-4"
            onPress={() => window.history.back()}
          >
            Go Back
          </Button>
        </main>
      </div>
    );
  }

  const confidence = scan.confidence || 0;
  const riskScore = scan.riskScore || (100 - confidence);
  const displayStatus = scan.status === "Analyzed" ? "Analyzed" : scan.status === "Pending Review" ? "Pending Review" : scan.status === "Pending" ? "Pending" : "Processing";
  const displayModality = scan.modality || scan.scanType || scan.region || "Medical Scan";
  const displayDate = scan.timestamp ? formatDate(scan.timestamp) : "Unknown Date";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="lg:hidden">
        <TopBar title="Scan Results" showBack />
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Scan Analysis</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <span className="font-mono text-sm">ID: {scan.id?.slice(0, 8) || 'unknown'}...</span>
              <span>•</span>
              <span>{displayModality}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="flat" startContent={<Share2 className="w-4 h-4" />}>
              Share Securely
            </Button>
            <Button color="primary" startContent={<Download className="w-4 h-4" />}>
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden bg-black/90 border-zinc-800">
              <div className="aspect-square lg:aspect-[16/9] relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />

                {scan.imageUrl ? (
                  scan.imageUrl.includes('.dcm') || scan.imageUrl.includes('.nii') ? (
                    <div className="flex flex-col items-center justify-center text-zinc-400 p-8">
                      <Brain className="w-20 h-20 text-primary/50 mb-4" />
                      <p className="text-lg font-semibold mb-2">DICOM Medical Image</p>
                      <p className="text-sm text-center max-w-md mb-4">
                        This is a DICOM (.dcm) medical imaging file that requires specialized 
                        medical imaging software to view.
                      </p>
                      <p className="text-xs text-zinc-500">
                        The AI analysis has been completed and results are available above.
                      </p>
                      <div className="mt-4 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-xs text-primary">
                          File: {scan.id}.dcm
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={scan.imageUrl}
                      alt={scan.scanType || "Medical Scan"}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-1 w-full h-full p-4 opacity-80">
                    <div className="bg-zinc-800 rounded-sm animate-pulse" />
                    <div className="bg-zinc-800 rounded-sm animate-pulse delay-75" />
                    <div className="bg-zinc-800 rounded-sm animate-pulse delay-150" />
                    <div className="bg-zinc-800 rounded-sm animate-pulse delay-200" />
                  </div>
                )}

                <div className="absolute z-20 flex flex-col items-center">
                  {!scan.imageUrl && (
                    <>
                      <Brain className="w-16 h-16 text-primary/50 mb-4" />
                      <p className="text-zinc-400 text-sm font-mono">DICOM VIEWER LOADING...</p>
                    </>
                  )}
                </div>

                {displayStatus === "Analyzed" ? (
                  <Chip variant="flat" color="success" className="absolute top-4 right-4 z-20">
                    AI Overlay Active
                  </Chip>
                ) : (
                  <Chip variant="flat" color="warning" className="absolute top-4 right-4 z-20">
                    Pending Analysis
                  </Chip>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Activity className="w-5 h-5 text-primary" />
                  AI Analysis Findings
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {displayStatus === "Analyzed" ? (
                  <>
                    <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                      <p className="text-sm font-medium text-success-foreground">
                        <FileCheck className="w-4 h-4 inline mr-2" />
                        Analysis Complete
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {findingsObj?.summary || scan.findings || "No findings available"}
                      </p>
                    </div>

                    {findingsObj?.details && findingsObj.details.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Detailed Findings</h4>
                        <ul className="space-y-2">
                          {findingsObj.details.map((detail, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Confidence Score</span>
                        <span className="font-medium">{confidence.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        aria-label="Confidence Score" 
                        value={confidence} 
                        color={getRiskColor(confidence)} 
                        size="sm" 
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Risk Assessment</span>
                        <span className={`font-medium ${
                          getRiskLevel(riskScore) === "High" ? "text-danger" :
                          getRiskLevel(riskScore) === "Medium" ? "text-warning" :
                          "text-success"
                        }`}>
                          {getRiskLevel(riskScore)} Risk
                        </span>
                      </div>
                      <Progress 
                        aria-label="Risk Score" 
                        value={riskScore} 
                        color={getRiskColor(riskScore)} 
                        size="sm" 
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <p className="text-sm font-medium text-warning-foreground">
                      <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                      Analysis Pending - Trigger analysis to get AI insights
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Provenance</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {scan.originalName && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileCheck className="w-4 h-4" />
                      <span>File</span>
                    </div>
                    <span className="font-medium text-foreground text-right max-w-[180px] truncate">{scan.originalName}</span>
                  </div>
                )}
                {scan.patientName && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>Patient</span>
                    </div>
                    <span className="font-medium text-foreground">{scan.patientName}</span>
                  </div>
                )}
                {scan.studyDate && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Study Date</span>
                    </div>
                    <span className="font-medium text-foreground">{formatDate(scan.studyDate)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Uploaded</span>
                  </div>
                  <span className="font-medium text-foreground">{displayDate}</span>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Blockchain Transaction Hash</p>
                  <div className="font-mono text-xs bg-muted p-2 rounded break-all flex items-start gap-2">
                    <Hash className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {truncateHash(scan.txHash || scan.id)}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-accent">
                    <Shield className="w-3 h-3" />
                    Verified on Solana
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Model Details</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground block text-xs mb-1">Federated Model</span>
                  <span className="font-medium">MedGemma v1.0</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground block text-xs mb-1">Processing Node</span>
                  <span className="font-medium">Federated Node #1</span>
                </div>
              </CardBody>
            </Card>

            <div className="lg:hidden grid gap-3">
              <Button className="w-full" variant="flat" startContent={<Share2 className="w-4 h-4" />}>
                Share
              </Button>
              <Button className="w-full" color="primary" startContent={<Download className="w-4 h-4" />}>
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
