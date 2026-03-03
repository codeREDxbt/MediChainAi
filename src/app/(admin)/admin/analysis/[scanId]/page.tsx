"use client";

import { use } from "react";
import Link from "next/link";
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
import { NumberTicker } from "@/components/ui/number-ticker";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    icon: AlertTriangle,
    indicator: "bg-rose-500"
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    icon: AlertTriangle,
    indicator: "bg-amber-500"
  },
  info: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    icon: CheckCircle2,
    indicator: "bg-emerald-500"
  }
};

export default function AdminAnalysisPage({ params }: { params: Promise<{ scanId: string }> }) {
  const resolvedParams = use(params);

  const getAnomalyColor = (score: number) => {
    if (score >= 70) return "text-rose-500";
    if (score >= 40) return "text-amber-500";
    return "text-emerald-500";
  };

  const getAnomalyProgressColor = (score: number) => {
    if (score >= 70) return "bg-rose-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/patients" className="flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Analysis Review</h1>
            <p className="text-slate-400 text-sm mt-1 font-mono tracking-wider">SCAN_ID: {resolvedParams.scanId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Users className="w-4 h-4" />
            Peer Review
          </button>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            Approve Findings
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 mt-8">
        {/* Main Viewer & Core Metrics */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* DICOM Viewer Placeholder */}
          <div className="relative w-full aspect-video md:aspect-[21/9] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent" />

            {/* Series/Slice Info */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium uppercase tracking-widest text-slate-300">
                Series: {scanData.series}
              </span>
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium uppercase tracking-widest text-emerald-400">
                Slice: 128/{scanData.slices}
              </span>
            </div>

            <div className="relative z-10 text-center flex flex-col items-center">
              <Layers className="w-16 h-16 text-slate-600 mb-4 opacity-50" />
              <p className="text-slate-400 font-mono text-lg tracking-widest">SECURE VIEWER</p>
              <p className="text-slate-500 text-sm mt-1 font-medium">{scanData.modality} • {scanData.bodyPart}</p>
            </div>

            {/* Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full px-2 py-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors"><ZoomIn className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors"><ZoomOut className="w-5 h-5" /></button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors"><RotateCcw className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors"><Maximize2 className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Anomaly & Confidence Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative p-6 rounded-3xl bg-slate-900 border border-white/10 overflow-hidden"
            >
              <GlowingEffect spread={15} glow={true} className="z-0" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Target className="w-5 h-5" />
                    <span className="font-semibold uppercase tracking-wider text-xs">Anomaly Score</span>
                  </div>
                  <span className={cn("text-4xl font-bold tracking-tight", getAnomalyColor(scanData.anomalyScore))}>
                    <NumberTicker value={scanData.anomalyScore} />
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
                  <div className={cn("h-full", getAnomalyProgressColor(scanData.anomalyScore))} style={{ width: `${scanData.anomalyScore}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-3 font-medium">
                  Scores &gt;70 indicate high priority review
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative p-6 rounded-3xl bg-slate-900 border border-white/10 overflow-hidden"
            >
              <GlowingEffect spread={15} glow={true} className="z-0" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Brain className="w-5 h-5" />
                    <span className="font-semibold uppercase tracking-wider text-xs">AI Confidence</span>
                  </div>
                  <span className="text-4xl font-bold tracking-tight text-white">
                    <NumberTicker value={scanData.confidence} />%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={cn("flex-1 h-full rounded-full bg-emerald-500", i > 4 && "bg-slate-700")} />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 font-medium">
                  Overall prediction robustness
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Sidebar - Details & Findings */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Patient Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full" />
            <div className="flex items-center gap-4 mb-5 relative z-10">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white text-lg">{scanData.patient.name}</p>
                <p className="text-xs text-slate-400 font-medium tracking-wide">
                  {scanData.patient.gender} • {scanData.patient.age}y • {scanData.patient.id}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-white/10 relative z-10">
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg">
                <Calendar className="w-4 h-4 text-emerald-500" />
                {scanData.date}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg">
                <Cpu className="w-4 h-4 text-emerald-500" />
                {scanData.modelVersion}
              </span>
            </div>
          </div>

          {/* AI Findings List */}
          <div className="flex-1 flex flex-col p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-white">AI Findings</h3>
              <span className="px-3 py-1 text-xs font-bold bg-white/10 rounded-full">{scanData.findings.length} TOTAL</span>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
              {scanData.findings.map((finding) => {
                const config = findingTypeConfig[finding.type as keyof typeof findingTypeConfig];
                const Icon = config.icon;

                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={finding.id}
                    className={cn("p-4 rounded-2xl border flex flex-col relative overflow-hidden", config.bg, config.border)}
                  >
                    {/* Left status indicator block */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-50", config.indicator)} />

                    <div className="flex items-start justify-between gap-2 mb-2 ml-1">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-4 h-4", config.text)} />
                        <span className={cn("text-sm font-bold tracking-wide", config.text)}>
                          {finding.title}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/40 text-white border border-white/10 backdrop-blur-md">
                        {finding.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed ml-1 mb-3">
                      {finding.description}
                    </p>
                    <p className="text-xs text-slate-500 font-mono ml-1 flex items-center gap-1.5 bg-black/20 w-fit px-2 py-1 rounded">
                      <Target className="w-3 h-3" />
                      LOC: {finding.location}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Radiologist Notes */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl">
            <h3 className="font-bold text-sm text-slate-400 mb-3 uppercase tracking-widest">Radiologist Notes</h3>
            <textarea
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              placeholder="Add clinical observations, corrections to AI findings, and recommendations here..."
            />
            <div className="flex justify-end mt-3">
              <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
