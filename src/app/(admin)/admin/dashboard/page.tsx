"use client";

import React from "react";
import {
  FileStack,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Users,
  Zap,
  Download,
  Calendar,
  Bell,
} from "lucide-react";
import { WobbleCard } from "@/components/ui/wobble-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import { FocusCards } from "@/components/ui/focus-cards";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const kpiCards = [
  {
    label: "Total Scans Processed",
    value: 12453,
    change: "+12.5%",
    trend: "up",
    icon: FileStack,
  },
  {
    label: "AI Accuracy Rate",
    value: 97.2,
    change: "+0.8%",
    trend: "up",
    icon: ShieldCheck,
  },
  {
    label: "Active Nodes",
    value: 847,
    change: "+24 new",
    trend: "up",
    icon: Users,
  },
  {
    label: "System Load",
    value: 42,
    change: "-5% vs peak",
    trend: "down",
    icon: Zap,
  },
];

const monthlyTrends = [
  { month: "Aug", ct: 420, mri: 310, xray: 580, ultrasound: 190 },
  { month: "Sep", ct: 380, mri: 290, xray: 620, ultrasound: 210 },
  { month: "Oct", ct: 510, mri: 340, xray: 490, ultrasound: 230 },
  { month: "Nov", ct: 470, mri: 380, xray: 550, ultrasound: 250 },
  { month: "Dec", ct: 540, mri: 410, xray: 610, ultrasound: 280 },
  { month: "Jan", ct: 620, mri: 450, xray: 680, ultrasound: 320 },
];

const diseaseCategories = [
  { name: "Pulmonary", percentage: 32, color: "text-cyan-400", stroke: "#22d3ee" },
  { name: "Cardiac", percentage: 24, color: "text-indigo-400", stroke: "#818cf8" },
  { name: "Neuro", percentage: 18, color: "text-violet-400", stroke: "#a78bfa" },
  { name: "Skeletal", percentage: 14, color: "text-emerald-400", stroke: "#34d399" },
  { name: "Other", percentage: 12, color: "text-zinc-400", stroke: "#71717a" },
];

const generatedReports = [
  { id: "RPT-2026-001", name: "Monthly Diagnostic Summary", type: "Analytics", date: "Jan 25, 2026", status: "Ready" },
  { id: "RPT-2026-002", name: "AI Performance Metrics Q4", type: "Performance", date: "Jan 24, 2026", status: "Ready" },
  { id: "RPT-2026-003", name: "Patient Demographics Report", type: "Demographics", date: "Jan 23, 2026", status: "Ready" },
  { id: "RPT-2026-004", name: "Federated Learning Logs", type: "Technical", date: "Jan 22, 2026", status: "Processing" },
];

const quickActions = [
  {
    title: "Review High Risk Cases",
    src: "https://images.unsplash.com/photo-1551076805-e18690c5e53b?q=80&w=2938&auto=format&fit=crop",
  },
  {
    title: "Generate Analytics Report",
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
  },
  {
    title: "Manage Federated Nodes",
    src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop",
  },
];

export default function AdminDashboardPage() {
  const content = [
    {
      title: "Diagnostic Volume Trends",
      description:
        "Track the volume of MRI, CT, X-Ray, and Ultrasound scans processed by the MediChainAI network across all connected healthcare facilities over the past six months. This data is critical for scaling our federated computing nodes.",
      content: (
        <div className="h-full w-full bg-[#0A0A0A] rounded-xl flex items-center justify-center p-6 text-white overflow-hidden shadow-inner border border-white/10">
          <div className="w-full h-full flex items-end justify-between gap-4">
            {monthlyTrends.map((month) => {
              const maxValue = 1800;
              const total = month.ct + month.mri + month.xray + month.ultrasound;
              const hPercent = (total / maxValue) * 100;
              return (
                <div key={month.month} className="flex-1 flex flex-col justify-end items-center h-full gap-2">
                  <div className="w-full rounded-t-sm overflow-hidden flex flex-col-reverse relative hover:brightness-110 transition-all cursor-pointer" style={{ height: `${hPercent}%` }}>
                    <div style={{ flex: month.ct }} className="w-full bg-cyan-500/70" />
                    <div style={{ flex: month.mri }} className="w-full bg-amber-400/70" />
                    <div style={{ flex: month.xray }} className="w-full bg-violet-500/70" />
                    <div style={{ flex: month.ultrasound }} className="w-full bg-emerald-500/70" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400">{month.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      title: "Disease Distribution Insights",
      description:
        "Real-time breakdown of disease categories identified by our consensus AI model. Notice the significant uptick in pulmonary anomalies correlating with the latest seasonal findings. Validated via decentralized consensus.",
      content: (
        <div className="h-full w-full bg-[#0A0A0A] flex items-center justify-center p-6 text-white rounded-xl shadow-inner border border-white/10">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {diseaseCategories.reduce((acc, cat) => {
                const dashArray = `${cat.percentage} ${100 - cat.percentage}`;
                const offset = acc.offset;
                acc.elements.push(
                  <circle
                    key={cat.name}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={cat.stroke}
                    strokeWidth="12"
                    strokeDasharray={dashArray}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 hover:strokeWidth-[16px] cursor-pointer"
                  />
                );
                acc.offset += cat.percentage;
                return acc;
              }, { elements: [] as React.ReactElement[], offset: 0 }).elements}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold tracking-tighter text-white">100%</span>
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">Total</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Recent Generated Reports",
      description:
        "Access cryptographic proofs, validation reports, and analytics summaries from the ledger. These reports are generated and signed by the master node and broadcasted to stakeholders.",
      content: (
        <div className="h-full w-full bg-[#0A0A0A] rounded-xl text-white p-6 shadow-inner overflow-hidden flex flex-col border border-white/10">
          <div className="space-y-4 flex-1 mt-4">
            {generatedReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <p className="text-sm font-semibold truncate max-w-[120px]">{report.name}</p>
                  <p className="text-xs text-zinc-400">{report.id}</p>
                </div>
                <div className="text-right">
                  <span className={cn("text-[10px] px-2 py-1 rounded-full", report.status === 'Ready' ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400")}>
                    {report.status}
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1">{report.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-10 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24"
    >
      {/* Header Area */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Admin Overview</h1>
          <p className="text-zinc-400 mt-2">Network analytics, AI consensus metrics, and administrative controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[#0A0A0A] px-4 py-2 rounded-full text-sm font-medium border border-white/10">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-300">Feb 10, 2026</span>
          </div>
          <button className="p-2.5 rounded-full bg-[#0A0A0A] hover:bg-zinc-900 transition-colors border border-white/10">
            <Bell className="w-5 h-5 text-zinc-400" />
          </button>
          <button className="flex items-center gap-2 bg-cyan-500 text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap shadow-lg shadow-cyan-500/20">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Status</span>
          </button>
        </div>
      </motion.header>

      {/* KPI Grid with Wobble Cards */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        aria-label="Key Performance Indicators"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 w-full mb-10">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <WobbleCard key={kpi.label} containerClassName="col-span-1 h-full min-h-[200px] shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-cyan-500/10 rounded-xl backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold backdrop-blur-sm",
                    kpi.trend === "up" 
                      ? "bg-cyan-500/10 text-cyan-400" 
                      : "bg-zinc-500/10 text-zinc-400"
                  )}>
                    {kpi.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {kpi.change}
                  </div>
                </div>
                <div className="text-4xl font-bold text-white tracking-tight mb-2">
                  <NumberTicker value={kpi.value} />
                  {kpi.label === "AI Accuracy Rate" || kpi.label === "System Load" ? "%" : ""}
                </div>
                <p className="text-sm text-zinc-400 font-medium">
                  {kpi.label}
                </p>
              </WobbleCard>
            );
          })}
        </div>
      </motion.section>

      {/* Interactive Sticky Scroll Section for Analytics */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        aria-label="System Analytics"
      >
        <div className="mt-12 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0A0A0A] w-full relative z-20">
          <StickyScroll content={content} contentClassName="rounded-2xl" />
        </div>
      </motion.section>

      {/* Quick Actions / Focus Cards */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        aria-labelledby="quick-actions-heading"
        className="mt-16"
      >
        <h2 id="quick-actions-heading" className="text-2xl font-bold mb-6 text-white">Quick Actions</h2>
        <FocusCards cards={quickActions} />
      </motion.section>

    </motion.main>
  );
}
