"use client";

import { TopBar } from "@/components/top-bar";
import { LiveLogPanel } from "@/components/live-log-panel";
import { Smartphone, Network, Shield, Zap, Wallet, Brain, Loader2, AlertCircle, CheckCircle2, FileText, FileDown, Printer } from "lucide-react";
import { mockFederatedStatus, mockLogEntries } from "@/lib/mock";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { Spotlight } from "@/components/ui/spotlight";
import { Lens } from "@/components/ui/lens";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { NumberTicker } from "@/components/ui/number-ticker";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { DicomViewer } from "@/components/dicom-viewer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/skeleton";
import { getActualModelConfidence } from "@/lib/analysis-confidence";

interface FormattedScan {
  id: string;
  scanType: string;
  type?: string;
  originalName?: string | null;
  patientName?: string | null;
  riskScore: number;
  riskLevel: "High" | "Low" | "Medium";
  findings: string;
  confidence: number;
  aiScore?: number;
  txHash: string;
  timestamp: string;
  date?: string;
  imageUrl: string;
  convertedImageUrl?: string | null;
  status: string;
  modality?: string;
  region?: string;
}

interface AnalysisFindings {
  summary: string;
  details: string[];
  urgent: boolean;
  scope_note?: string;
  report_summary?: string;
  report_details?: string[];
  technical_details?: string[];
  confidence_note?: string;
  providers?: {
    monai?: {
      label: string;
      confidence: number | null;
      analysis_mode: "bundle" | "fallback" | "unavailable";
      confidence_source: "model_probability" | "estimated_fallback" | "not_available";
      model_used: string;
      model_description: string;
      scope_note: string;
      inference_seconds: number;
      modality: string;
      filename: string;
      has_overlay: boolean;
    };
    vision?: {
      confidence: number | null;
      model?: string;
      parser_mode?: string;
    };
  };
  provider_errors?: {
    monai?: string;
    vision?: string;
  };
}

const DEMO_XRAY_URL = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function formatConfidence(value?: number | null) {
  return typeof value === "number" ? value.toFixed(1) : "N/A";
}

function describeDetails(details: unknown) {
  if (typeof details === "string") return details;
  if (details && typeof details === "object") {
    const record = details as Record<string, unknown>;
    const preferred = record.message ?? record.error ?? record.detail ?? record.details;
    if (typeof preferred === "string" && preferred.trim()) return preferred;
    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
  }
  return "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return character;
    }
  });
}

export default function PatientResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get('scan');
  const { tokenBalance, refreshBalance } = useAuth();
  const { success, error: showError } = useToast();

  const [scan, setScan] = useState<FormattedScan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hoveringLens, setHoveringLens] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [federatedStatus, setFederatedStatus] = useState<any>(null);
  const [blockchainLogs, setBlockchainLogs] = useState<any[]>([]);

  const buildDicomUrl = (baseUrl: string) => {
    if (baseUrl.includes('type=dcm')) return baseUrl;
    return baseUrl.includes('?') ? `${baseUrl}&type=dcm` : `${baseUrl}?type=dcm`;
  };

  const getFileType = (scanItem: FormattedScan) => {
    const name = (scanItem.originalName || scanItem.txHash || "").toLowerCase();
    if (name.endsWith('.nii.gz')) return 'nii.gz';
    if (name.endsWith('.nii')) return 'nii';
    if (name.endsWith('.dcm')) return 'dcm';
    return 'image';
  };

  useEffect(() => {
    if (!scanId) {
      setIsLoading(false);
      return;
    }

    async function loadScan() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/scans/${scanId}`);
        if (res.status === 404) { setError('Scan not found'); return; }
        if (!res.ok) throw new Error('Failed to load scan');
        const data = await res.json();
        setScan(data.scan);
      } catch (err) {
        console.error("Failed to load scan:", err);
        setError(err instanceof Error ? err.message : 'Failed to load scan');
      } finally {
        setIsLoading(false);
      }
    }

    async function loadFederatedStatus() {
      try {
        const res = await fetch('/api/federated/status');
        if (res.ok) { const data = await res.json(); setFederatedStatus(data); }
      } catch (err) { console.error("Failed to fetch federated status:", err); }
    }

    async function loadBlockchainLogs() {
      try {
        const res = await fetch('/api/blockchain/logs');
        if (res.ok) { const data = await res.json(); setBlockchainLogs(data.logs || []); }
      } catch (err) { console.error("Failed to fetch blockchain logs:", err); }
    }

    loadScan();
    loadFederatedStatus();
    loadBlockchainLogs();
  }, [scanId]);

  const triggerAnalysis = async () => {
    if (!scanId) return;
    try {
      setIsAnalyzing(true);
      const res = await fetch(`/api/scans/${scanId}/analyze`, { method: "POST" });
      const rawBody = await res.text();
      let data: any = null;
      if (rawBody) {
        try { data = JSON.parse(rawBody); } catch { data = { error: rawBody }; }
      }
      if (!res.ok) {
        const detailText = describeDetails(data?.details);
        const detailMessage = detailText
          ? `${data.error || 'Analysis failed'}: ${detailText}`
          : (data?.error || `Analysis failed (HTTP ${res.status})`);
        throw new Error(detailMessage);
      }
      await refreshBalance();
      const findingsObj = typeof data.analysis?.findings === 'string'
        ? JSON.parse(data.analysis.findings)
        : data.analysis?.findings;
      const confidenceScore = typeof data.analysis?.confidence_score === "number"
        ? data.analysis.confidence_score : 0;
      setScan((prev) => prev ? ({
        ...prev,
        status: "Analyzed",
        confidence: confidenceScore,
        findings: JSON.stringify(findingsObj),
        riskScore: confidenceScore,
        riskLevel: confidenceScore > 85 ? "High" : confidenceScore > 65 ? "Medium" : "Low"
      }) : null);
      success(data?.message || 'Analysis complete.');
    } catch (err) {
      console.error("Analysis error:", err);
      const errMsg = err instanceof Error ? err.message : 'Analysis failed';
      showError(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const displayTokens = tokenBalance?.uiAmount || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="lg:hidden">
          <TopBar title="AI Insights" showBack showLogo={false} showSettings />
        </div>
        <div className="p-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">
            {error || 'Scan not found'}
          </h2>
          <p className="text-slate-400">
            The scan you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
          </p>
        </div>
      </div>
    );
  }

  // Parse findings for display
  const parsedFindings = (() => {
    if (!scan?.findings) return null;
    if (scan.findings === "Pending Analysis") return null;
    try {
      return (typeof scan.findings === 'string' ? JSON.parse(scan.findings) : scan.findings) as AnalysisFindings;
    } catch { return null; }
  })();

  const monaiProvider = parsedFindings?.providers?.monai;
  const visionProvider = parsedFindings?.providers?.vision;
  const providerErrors = Object.values(parsedFindings?.provider_errors || {}).filter(Boolean) as string[];
  const monaiHasRealConfidence = monaiProvider?.analysis_mode === "bundle"
    && monaiProvider?.confidence_source === "model_probability"
    && typeof monaiProvider.confidence === "number";
  const visionReturnedEstimate = typeof visionProvider?.confidence === "number";
  const legacyConfidence = !parsedFindings?.providers && typeof scan?.confidence === "number" && scan.confidence > 0
    ? scan.confidence : null;
  const displayedConfidence = getActualModelConfidence({
    findings: parsedFindings,
    fallbackConfidence: legacyConfidence,
  });
  const confidenceHeading = monaiHasRealConfidence
    ? "ACTUAL MODEL CONFIDENCE"
    : "ACTUAL MODEL CONFIDENCE";
  const confidenceAccentClass = monaiHasRealConfidence
    ? "text-emerald-400"
    : "text-slate-500";
  const confidenceBarClass = monaiHasRealConfidence
    ? "bg-emerald-500"
    : "bg-slate-800";
  const emptyConfidenceText = monaiProvider?.analysis_mode === "bundle"
    ? "No calibrated probability returned"
    : "No actual MONAI probability";

  const confidenceCaption = (() => {
    if (monaiHasRealConfidence && visionProvider) {
      return `Actual MONAI probability ${formatConfidence(monaiProvider?.confidence)}% using ${monaiProvider?.model_used}. Vision AI added report text only.`;
    }
    if (monaiHasRealConfidence && monaiProvider) {
      return `Actual MONAI probability using ${monaiProvider.model_used}.`;
    }
    if (monaiProvider?.analysis_mode === "fallback") {
      return visionReturnedEstimate
        ? "No actual MONAI probability is available because the service had to use a technical fallback. Any Vision AI estimate is hidden because it is not calibrated."
        : "No actual MONAI probability is available because the service had to use a technical fallback.";
    }
    if (monaiProvider?.analysis_mode === "unavailable") {
      return visionReturnedEstimate
        ? "No actual MONAI probability is available because the configured MONAI bundle could not run on this upload. Any Vision AI estimate is hidden because it is not calibrated."
        : "No actual MONAI probability is available because the configured MONAI bundle could not run on this upload.";
    }
    if (visionProvider) {
      return `Vision AI generated a descriptive report${visionProvider.model ? ` using ${visionProvider.model}` : ""}, but it does not provide the actual calibrated probability shown on this card.`;
    }
    if (legacyConfidence !== null) return "Stored analysis confidence.";
    return "No actual model confidence is available for this scan yet.";
  })();

  const findingsList = Array.isArray(parsedFindings?.details)
    ? parsedFindings.details.filter((detail) => typeof detail === "string" && detail.trim().length > 0)
    : [];

  // Structured report fields (populated by mergeAnalysisFindings in monai.ts)
  const reportSummary = parsedFindings?.report_summary || parsedFindings?.summary || "";
  const reportDetails =
    Array.isArray(parsedFindings?.report_details) && parsedFindings!.report_details!.length > 0
      ? parsedFindings!.report_details!.filter((d) => typeof d === "string" && d.trim())
      : findingsList;
  const technicalDetails = Array.isArray(parsedFindings?.technical_details)
    ? parsedFindings!.technical_details!.filter((d) => typeof d === "string" && d.trim())
    : [];
  const storedConfidenceNote = parsedFindings?.confidence_note || confidenceCaption;
  const previewUrl = scan.convertedImageUrl || scan.imageUrl;
  const reportStats = [
    {
      label: "Model confidence",
      value: typeof displayedConfidence === "number" ? `${displayedConfidence.toFixed(1)}%` : "N/A",
      note: confidenceCaption,
    },
    {
      label: "Report sections",
      value: String(reportDetails.length || 0),
      note: "Patient-facing findings included in this report.",
    },
    {
      label: "Risk level",
      value: `${scan.riskLevel} Risk`,
      note: parsedFindings?.urgent ? "Urgent review required." : "Routine review status.",
    },
    {
      label: "Analysis mode",
      value: monaiProvider
        ? monaiProvider.analysis_mode === "bundle"
          ? "MONAI bundle"
          : monaiProvider.analysis_mode === "fallback"
            ? "MONAI fallback"
            : "MONAI unavailable"
        : visionProvider
          ? "Vision AI"
          : "Stored report",
      note: monaiProvider?.model_used || visionProvider?.model || "Saved scan metadata.",
    },
  ];
  const reportStatsHtml = reportStats.map((stat) => `
    <div class="stat-card">
      <div class="stat-label">${escapeHtml(stat.label)}</div>
      <div class="stat-value">${escapeHtml(stat.value)}</div>
      <div class="stat-note">${escapeHtml(stat.note)}</div>
    </div>
  `).join("");

  const buildReportDocument = (includePrintScript = false) => {
    if (!scan) return "";
    const scanDate = scan.timestamp
      ? new Date(scan.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const findingsHtml = reportDetails.map((d) => `<li><span class="bullet"></span><span>${escapeHtml(d)}</span></li>`).join("\n");
    const techHtml = technicalDetails.map((d) => `<li>${escapeHtml(d)}</li>`).join("\n");
    const monaiMode = monaiProvider?.analysis_mode;
    const monaiLabel = monaiMode === "bundle" ? "MONAI Bundle" : monaiMode === "fallback" ? "MONAI Fallback" : "MONAI Unavailable";
    const monaiColor = monaiMode === "bundle" ? "green" : monaiMode === "fallback" ? "amber" : "slate";
    const monaiBadge = monaiProvider ? `<span class="badge badge-${monaiColor}">${monaiLabel}</span>` : "";
    const visionBadge = visionProvider ? `<span class="badge badge-blue">Vision AI</span>` : "";
    const riskColorMap: Record<string, string> = { High: "red", Medium: "amber", Low: "green" };
    const riskColor = riskColorMap[scan.riskLevel] || "slate";
    const riskBadge = `<span class="badge badge-${riskColor}">${scan.riskLevel} Risk</span>`;
    const urgentBadge = parsedFindings?.urgent ? `<span class="badge badge-red">&#9888; Urgent</span>` : "";
    const confidenceHtml =
      typeof displayedConfidence === "number"
        ? `<span class="confidence-value">${displayedConfidence.toFixed(1)}%</span>`
        : `<span class="confidence-na">N/A</span><span class="confidence-na-sub"> &mdash; ${escapeHtml(emptyConfidenceText)}</span>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MediChainAI Diagnostic Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#0f172a; color:#e2e8f0; padding:40px 20px; min-height:100vh; }
  .page { max-width:780px; margin:0 auto; background:#1e293b; border-radius:18px; overflow:hidden; box-shadow:0 32px 64px rgba(0,0,0,.6); }
  .header { background:linear-gradient(135deg,#064e3b 0%,#1e3a5f 100%); padding:36px 44px; border-bottom:1px solid rgba(255,255,255,.08); }
  .logo { font-size:24px; font-weight:800; color:#34d399; letter-spacing:-.5px; margin-bottom:4px; }
  .logo-sub { font-size:13px; color:#94a3b8; letter-spacing:.3px; }
  .meta-grid { margin-top:20px; display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:16px; }
  .meta-label { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:3px; }
  .meta-value { font-size:14px; font-weight:600; color:#f1f5f9; }
  .body { padding:36px 44px; }
  .badges { margin-bottom:20px; display:flex; flex-wrap:wrap; gap:6px; }
  .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.3px; }
  .badge-green { background:rgba(16,185,129,.15); color:#34d399; border:1px solid rgba(16,185,129,.3); }
  .badge-blue { background:rgba(59,130,246,.15); color:#93c5fd; border:1px solid rgba(59,130,246,.3); }
  .badge-amber { background:rgba(245,158,11,.15); color:#fcd34d; border:1px solid rgba(245,158,11,.3); }
  .badge-slate { background:rgba(100,116,139,.15); color:#94a3b8; border:1px solid rgba(100,116,139,.3); }
  .badge-red { background:rgba(239,68,68,.15); color:#fca5a5; border:1px solid rgba(239,68,68,.3); }
  .preview-card { margin:0 0 22px; background:rgba(2,6,23,.9); border:1px solid rgba(148,163,184,.14); border-radius:16px; overflow:hidden; }
  .preview-card img { display:block; width:100%; height:auto; max-height:320px; object-fit:contain; background:#020617; }
  .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin:0 0 24px; }
  .stat-card { background:rgba(15,23,42,.62); border:1px solid rgba(148,163,184,.14); border-radius:14px; padding:16px; min-height:108px; }
  .stat-label { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:1.5px; font-weight:700; }
  .stat-value { font-size:20px; font-weight:800; color:#f8fafc; margin-top:10px; line-height:1.2; }
  .stat-note { font-size:12px; color:#94a3b8; margin-top:8px; line-height:1.55; }
  .urgent-box { background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.25); color:#fca5a5; padding:12px 16px; border-radius:10px; font-size:13px; margin-bottom:24px; line-height:1.5; }
  .section { margin-bottom:28px; }
  .section-title { font-size:10px; font-weight:700; color:#475569; letter-spacing:2px; text-transform:uppercase; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,.06); }
  .summary-box { background:rgba(16,185,129,.06); border:1px solid rgba(16,185,129,.18); border-radius:12px; padding:18px 22px; }
  .summary-text { font-size:15px; color:#f1f5f9; line-height:1.75; font-weight:500; }
  .findings-list { list-style:none; }
  .findings-list li { display:flex; align-items:flex-start; gap:12px; font-size:14px; color:#cbd5e1; line-height:1.65; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.04); }
  .findings-list li:last-child { border-bottom:none; }
  .bullet { width:7px; height:7px; background:#10b981; border-radius:50%; margin-top:8px; flex-shrink:0; }
  .divider { border:none; border-top:1px solid rgba(255,255,255,.07); margin:28px 0; }
  .confidence-box { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:20px 24px; }
  .confidence-value { font-size:36px; font-weight:800; color:#34d399; }
  .confidence-na { font-size:22px; font-weight:700; color:#475569; }
  .confidence-na-sub { font-size:14px; font-weight:500; color:#374151; }
  .confidence-note { font-size:12px; color:#64748b; margin-top:10px; line-height:1.6; }
  .tech-list { list-style:none; border-left:2px solid #1e3a5f; padding-left:18px; }
  .tech-list li { font-size:12px; color:#475569; padding:5px 0; line-height:1.55; }
  .footer { padding:20px 44px; background:rgba(0,0,0,.25); border-top:1px solid rgba(255,255,255,.06); }
  .footer-text { font-size:11px; color:#334155; line-height:1.7; }
  @media print { body{background:#fff;color:#111;padding:0} .page{box-shadow:none;border-radius:0} .header{background:#064e3b!important} }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">&#129514; MediChainAI</div>
    <div class="logo-sub">AI-Powered Medical Scan Analysis Report</div>
    <div class="meta-grid">
      <div class="meta-item"><div class="meta-label">Modality</div><div class="meta-value">${escapeHtml(String(scan.modality || scan.scanType))}</div></div>
      <div class="meta-item"><div class="meta-label">Region</div><div class="meta-value">${escapeHtml(String(scan.region || "—"))}</div></div>
      <div class="meta-item"><div class="meta-label">Scan Date</div><div class="meta-value">${scanDate}</div></div>
      <div class="meta-item"><div class="meta-label">Report Date</div><div class="meta-value">${reportDate}</div></div>
      <div class="meta-item"><div class="meta-label">Scan ID</div><div class="meta-value">${scan.id.substring(0, 12).toUpperCase()}</div></div>
      <div class="meta-item"><div class="meta-label">Status</div><div class="meta-value">${escapeHtml(scan.status)}</div></div>
    </div>
  </div>
  <div class="body">
    <div class="badges">${monaiBadge}${visionBadge}${riskBadge}${urgentBadge}</div>
    ${previewUrl ? `<div class="preview-card"><img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(scan.scanType || "Medical scan")}" /></div>` : ""}
    <div class="stats-grid">${reportStatsHtml}</div>
    ${parsedFindings?.urgent ? `<div class="urgent-box">&#9888; This scan has been flagged for urgent clinical review. Please consult a qualified medical professional immediately.</div>` : ""}
    ${reportSummary ? `<div class="section"><div class="section-title">Summary</div><div class="summary-box"><div class="summary-text">${escapeHtml(reportSummary)}</div></div></div>` : ""}
    ${reportDetails.length > 0 ? `<div class="section"><div class="section-title">Findings (${reportDetails.length} points)</div><ul class="findings-list">${findingsHtml}</ul></div>` : ""}
    <hr class="divider" />
    <div class="section"><div class="section-title">Model Confidence</div><div class="confidence-box">${confidenceHtml}<div class="confidence-note">${escapeHtml(storedConfidenceNote)}</div></div></div>
    ${technicalDetails.length > 0 ? `<div class="section"><div class="section-title">Technical Notes</div><ul class="tech-list">${techHtml}</ul></div>` : ""}
  </div>
  <div class="footer"><div class="footer-text">This report was generated by MediChainAI and is intended for informational purposes only. It does not constitute a medical diagnosis or clinical recommendation. Please consult a licensed healthcare professional for medical advice, diagnosis, or treatment. Report generated on ${reportDate}.</div></div>
</div>
${includePrintScript ? `<script>window.addEventListener('load', function () { setTimeout(function () { window.focus(); window.print(); }, 250); }); window.onafterprint = function () { try { window.close(); } catch (e) {} };</script>` : ""}
</body>
</html>`;

    return html;
  };

  const downloadReport = () => {
    const html = buildReportDocument(false);
    if (!html) return;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MediChainAI_Report_${scan.id.substring(0, 8).toUpperCase()}_${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPdfReport = () => {
    const html = buildReportDocument(true);
    if (!html) return;

    const pdfWindow = window.open("", "_blank", "width=1024,height=1400");

    if (!pdfWindow) {
      showError("Popup blocked. Allow popups to export the report as a PDF.");
      return;
    }

    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] relative overflow-hidden bg-transparent font-sans text-slate-200">
      <Spotlight className="-top-40 right-0 md:right-60 md:-top-20 z-0" fill="white" />
      <Spotlight className="top-40 left-0 md:left-20 z-0" fill="emerald" />

      {/* Mobile TopBar */}
      <div className="lg:hidden relative z-10">
        <TopBar
          title="AI Insights"
          showBack
          showLogo={false}
          showSettings
          showNotifications={false}
          showAvatar={false}
          rightContent={
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full font-medium tracking-wide">
              ● DEVNET
            </span>
          }
        />
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 px-4 py-8 space-y-8 lg:px-0 lg:py-0 relative z-10"
      >
        {/* Desktop Header */}
        <motion.div variants={itemVariants} className="hidden lg:flex lg:items-center lg:justify-between lg:mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">AI Insights &amp; Federated Status</h1>
            <p className="text-sm text-slate-400 mt-1">
              {scan ? `Viewing scan: ${scan.modality || scan.scanType}` : "Monitor your local model training and global synchronization"}
            </p>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SOLANA DEVNET
          </span>
        </motion.div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Left Column */}
          <div className="space-y-8">

            {/* Scan Image Viewer with Lens */}
            <motion.div variants={itemVariants}>
              <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-white/10 p-2 shadow-2xl">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center group cursor-crosshair">
                  {scan?.imageUrl ? (
                    (() => {
                      const previewUrl = scan.convertedImageUrl || scan.imageUrl;
                      if (scan.convertedImageUrl) {
                        return (
                          <Lens hovering={hoveringLens} setHovering={setHoveringLens} zoomFactor={2.5}>
                            <img
                              src={previewUrl}
                              alt={scan.scanType || "Medical Scan"}
                              className="w-full h-full object-contain opacity-90"
                            />
                          </Lens>
                        );
                      }

                      const fileType = getFileType(scan);

                      if (fileType === 'dcm') {
                        return (
                          <div className="w-full h-full relative cursor-default">
                            <DicomViewer url={buildDicomUrl(scan.imageUrl)} />
                          </div>
                        );
                      }

                      if (fileType === 'nii' || fileType === 'nii.gz') {
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center bg-slate-950">
                            <AlertCircle className="w-10 h-10 text-amber-400 mb-4" />
                            <h3 className="text-white text-lg font-semibold mb-2">NIfTI Preview Unavailable</h3>
                            <p className="text-slate-400 text-sm max-w-md">
                              This scan uses volumetric NIfTI format ({fileType.toUpperCase()}).
                              In-browser 2D preview is not enabled yet for this format.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <Lens hovering={hoveringLens} setHovering={setHoveringLens} zoomFactor={2.5}>
                          <img
                            src={previewUrl}
                            alt={scan.scanType || "Medical Scan"}
                            className="w-full h-full object-contain opacity-90"
                          />
                        </Lens>
                      );
                    })()
                  ) : (
                    <Lens hovering={hoveringLens} setHovering={setHoveringLens} zoomFactor={2.5}>
                      <img
                        src={DEMO_XRAY_URL}
                        alt="Medical Scan"
                        className="w-full h-full object-cover opacity-80"
                      />
                    </Lens>
                  )}
                  <AnimatePresence>
                    {!hoveringLens && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40"
                      >
                        <ScanOverlayLabel text={scan.region || scan.modality || 'Chest'} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Simulated Training / Epoch Progress */}
            <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900">
              <div className="absolute inset-0 w-full h-full opacity-100 mix-blend-screen">
                <CanvasRevealEffect
                  animationSpeed={3}
                  containerClassName="bg-transparent"
                  colors={[
                    [16, 185, 129],
                    [59, 130, 246],
                  ]}
                  dotSize={2}
                  showGradient={false}
                />
              </div>

              <div className="relative z-10 p-6 md:p-8 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-6 md:gap-10 mb-8">
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"
                    >
                      <Smartphone className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                      LOCAL DEVICE
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                      />
                    ))}
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30"
                    >
                      <Network className="w-6 h-6 text-blue-400" />
                    </motion.div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                      GLOBAL MODEL
                    </span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-white tracking-tight mb-1">
                    Local Round {federatedStatus?.localRound || mockFederatedStatus.localRound}
                  </h2>
                  <p className="text-sm text-emerald-400 font-medium">{federatedStatus?.status || mockFederatedStatus.status}</p>
                </div>

                <div className="space-y-4 bg-black/40 rounded-2xl p-5 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">CURRENT EPOCH</span>
                    <span className="text-xs font-medium text-slate-500">Est. Time Remaining</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-bold text-white leading-none">
                      {federatedStatus?.currentEpoch || mockFederatedStatus.currentEpoch}
                      <span className="text-lg text-slate-500 font-medium ml-1">
                        / {federatedStatus?.totalEpochs || mockFederatedStatus.totalEpochs}
                      </span>
                    </span>
                    <span className="text-lg font-semibold text-emerald-400">
                      {federatedStatus?.timeRemaining || mockFederatedStatus.timeRemaining}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((federatedStatus?.currentEpoch || mockFederatedStatus.currentEpoch) / (federatedStatus?.totalEpochs || mockFederatedStatus.totalEpochs)) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8 mt-8 lg:mt-0 flex flex-col">
            {/* Confidence & Tokens */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              {/* Confidence Card */}
              <div className="relative rounded-3xl bg-slate-900 border border-white/10 p-6 flex flex-col justify-between overflow-hidden">
                <GlowingEffect spread={20} glow={true} className="z-0" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">
                    {confidenceHeading}
                  </p>

                  {/* Confidence value */}
                  <div className="mb-3">
                    {typeof displayedConfidence === "number" ? (
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-4xl font-bold tracking-tight", confidenceAccentClass)}>
                          <NumberTicker value={displayedConfidence} decimalPlaces={1} />
                        </span>
                        <span className={cn("text-xl font-bold", confidenceAccentClass)}>%</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-slate-500 tracking-tight">N/A</span>
                        <p className="text-[10px] text-slate-600 mt-1 font-medium tracking-wide uppercase">
                          {emptyConfidenceText}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Provider badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {monaiProvider && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border",
                        monaiProvider.analysis_mode === "bundle"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          : monaiProvider.analysis_mode === "fallback"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : "bg-slate-700/50 text-slate-400 border-slate-600/30"
                      )}>
                        {monaiProvider.analysis_mode === "bundle"
                          ? "✓ MONAI bundle"
                          : monaiProvider.analysis_mode === "fallback"
                            ? "~ MONAI fallback"
                            : "✗ MONAI unavailable"}
                      </span>
                    )}
                    {visionProvider && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border bg-blue-500/10 text-blue-300 border-blue-500/20">
                        ✓ Vision AI
                      </span>
                    )}
                  </div>

                  {/* Caption */}
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {confidenceCaption}
                  </p>

                  {/* Bar */}
                  <div className="flex gap-1.5 h-1.5 w-full mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                        className={cn(
                          "flex-1 rounded-full origin-left",
                          typeof displayedConfidence === "number" && i <= Math.ceil(displayedConfidence / 20)
                            ? confidenceBarClass
                            : "bg-slate-800"
                        )}
                      />
                    ))}
                  </div>

                  {scan?.status === "Analyzed" && (
                    <button
                      onClick={triggerAnalysis}
                      disabled={isAnalyzing}
                      className="w-full rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/15 disabled:opacity-50"
                    >
                      {isAnalyzing ? "Refreshing analysis..." : "Run Fresh Analysis"}
                    </button>
                  )}
                </div>
              </div>

              {/* Tokens Card */}
              <div className="relative rounded-3xl bg-slate-900 border border-white/10 p-6 flex flex-col justify-between overflow-hidden">
                <GlowingEffect spread={20} glow={true} className="z-0" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">
                    REWARD TOKENS (MCI)
                  </p>
                  <div className="text-4xl font-bold text-white tracking-tight mb-2">
                    <NumberTicker value={displayTokens} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Solana Devnet
                  </p>
                  <div className="flex items-center gap-1.5 mt-4 text-emerald-500/80 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-500/20">
                    <Wallet className="w-3.5 h-3.5" />
                    Secure Wallet Connected
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Smart Trigger - show if NOT analyzed AND confidence is 0 */}
            {scan && scan.status !== "Analyzed" && scan.confidence === 0 && (
              <motion.div variants={itemVariants}>
                <div className="relative rounded-3xl bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 p-8 text-center flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-blue-500/20 p-4 rounded-2xl mb-4"
                  >
                    <Brain className="w-8 h-8 text-blue-400" />
                  </motion.div>
                  <h3 className="font-bold text-xl text-white mb-2">Analysis Required</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-[280px]">
                    Participate in federated training and receive MCI rewards by running the inference simulation locally.
                  </p>
                  <button
                    onClick={triggerAnalysis}
                    disabled={isAnalyzing}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing AI Layers...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Run AI Analysis &amp; Claim Reward
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Full Diagnostic Report - show if analyzed OR if confidence > 0 */}
            {(scan?.status === "Analyzed" || (scan && scan.confidence > 0)) && parsedFindings && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 flex-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-[60px] rounded-full" />

                {/* Report header */}
                <div className="flex items-start justify-between gap-3 mb-5 relative z-10">
                  <div>
                    <h3 className="font-bold text-lg text-emerald-400 flex items-center gap-2">
                      <FileText className="w-5 h-5 shrink-0" />
                      Diagnostic Report
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wide">
                      {scan.modality || scan.scanType}{scan.region ? ` · ${scan.region}` : ""} · {scan.timestamp ? new Date(scan.timestamp).toLocaleDateString() : "Today"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={downloadReport}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 text-[11px] font-semibold hover:bg-slate-700/90 active:scale-95 transition-all"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      HTML
                    </button>
                    <button
                      onClick={downloadPdfReport}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  </div>
                </div>

                {/* Risk badges */}
                <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-semibold border",
                    scan.riskLevel === "High"
                      ? "bg-red-500/10 text-red-300 border-red-500/20"
                      : scan.riskLevel === "Medium"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  )}>
                    {scan.riskLevel} Risk
                  </span>
                  {parsedFindings.urgent && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-red-500/10 text-red-300 border-red-500/20">
                      ⚠ Urgent Review
                    </span>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-5 relative z-10">
                  {reportStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/5 bg-slate-800/60 p-4">
                      <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{stat.label}</p>
                      <p className="mt-2 text-lg font-semibold text-white leading-tight">{stat.value}</p>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{stat.note}</p>
                    </div>
                  ))}
                </div>

                {/* Urgent alert */}
                {parsedFindings.urgent && (
                  <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 relative z-10">
                    ⚠ This scan has been flagged for urgent clinical review. Consult a medical professional immediately.
                  </div>
                )}

                {/* Provider errors */}
                {providerErrors.length > 0 && (
                  <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 relative z-10">
                    {providerErrors.join(" ")}
                  </div>
                )}

                {/* Summary box */}
                {reportSummary && (
                  <div className="mb-5 p-4 rounded-2xl bg-slate-800/60 border border-white/5 relative z-10">
                    <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">Summary</p>
                    <p className="text-white text-sm leading-relaxed font-medium">{reportSummary}</p>
                  </div>
                )}

                {/* Patient-facing findings */}
                {reportDetails.length > 0 && (
                  <div className="mb-4 relative z-10">
                    <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3">Findings</p>
                    <ul className="space-y-2">
                      {reportDetails.map((detail: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technical notes — collapsible */}
                {technicalDetails.length > 0 && (
                  <details className="mt-4 group relative z-10">
                    <summary className="cursor-pointer select-none flex items-center gap-2 text-[10px] font-bold text-slate-600 tracking-widest uppercase hover:text-slate-400 transition-colors list-none">
                      <span className="inline-block transition-transform group-open:rotate-90">▶</span>
                      Technical Notes ({technicalDetails.length})
                    </summary>
                    <ul className="mt-3 space-y-1.5 pl-4 border-l border-slate-700/60">
                      {technicalDetails.map((detail: string, idx: number) => (
                        <li key={idx} className="text-[11px] text-slate-600 leading-relaxed">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Confidence note */}
                {storedConfidenceNote && (
                  <div className="mt-5 pt-4 border-t border-white/5 relative z-10">
                    <p className="text-[10px] font-bold text-slate-600 tracking-widest uppercase mb-1.5">Confidence Note</p>
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">{storedConfidenceNote}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Live Blockchain Log */}
            <motion.div variants={itemVariants} className="mt-auto">
              <LiveLogPanel entries={blockchainLogs.length > 0 ? blockchainLogs : mockLogEntries} />
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}

const ScanOverlayLabel = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white shadow-2xl">
    <ScanBoxIcon />
    <span className="text-sm tracking-widest font-semibold uppercase">{text}</span>
  </div>
);

const ScanBoxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-400">
    <path d="M4 8V6C4 4.89543 4.89543 4 6 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 16V18C4 19.1046 4.89543 20 6 20H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 4H18C19.1046 4 20 4.89543 20 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);
