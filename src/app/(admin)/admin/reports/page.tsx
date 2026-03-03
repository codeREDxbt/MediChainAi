"use client";

import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { LayoutGrid } from "@/components/ui/layout-grid";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Abstract report covers from Unsplash
const generateThumbnail = (theme: string) => {
  const images: Record<string, string> = {
    analytics: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
    activity: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1000",
    ml: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1000",
    security: "https://images.unsplash.com/photo-1614064641913-6bca961c02ab?auto=format&fit=crop&q=80&w=1000",
    compliance: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1000",
  };
  return images[theme] || images.analytics;
};

const ReportContent = ({ title, desc, type, date, size, status }: any) => {
  return (
    <div className="flex flex-col h-full text-white">
      <div className="flex items-center gap-2 mb-2 text-emerald-400">
        <FileText className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-widest uppercase">{type} REPORT</span>
      </div>
      <p className="font-bold text-3xl mb-4">{title}</p>
      <p className="text-slate-300 mb-8 max-w-lg text-sm leading-relaxed">
        {desc}
      </p>

      <div className="mt-auto grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
          <p className="text-slate-400 text-xs mb-1">Generated</p>
          <p className="font-medium">{date}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
          <p className="text-slate-400 text-xs mb-1">Size</p>
          <p className="font-medium">{size}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
          <p className="text-slate-400 text-xs mb-1">Status</p>
          <p className="font-medium flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", status === "ready" ? "bg-emerald-500" : "bg-amber-500")} />
            {status === "ready" ? "Ready to Download" : "Generating..."}
          </p>
        </div>
      </div>

      <button
        disabled={status !== "ready"}
        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        {status === "ready" ? "Download Secure PDF" : "Processing..."}
      </button>
    </div>
  );
};

const cards = [
  {
    id: 1,
    className: "md:col-span-2",
    thumbnail: generateThumbnail("analytics"),
    content: <ReportContent
      title="Monthly Analytics Overview"
      type="Analytics"
      desc="Comprehensive summary of platform usage, node activity, and processing volumes for January 2026. This report includes diagnostic volume trends and system load metrics."
      date="Jan 25, 2026"
      size="2.4 MB"
      status="ready"
    />,
  },
  {
    id: 2,
    className: "col-span-1",
    thumbnail: generateThumbnail("activity"),
    content: <ReportContent
      title="Patient Activity Summary"
      type="Operational"
      desc="Aggregated summary of unique patient daily active users, uploads, and engagement statistics across the network."
      date="Jan 24, 2026"
      size="1.2 MB"
      status="ready"
    />,
  },
  {
    id: 3,
    className: "col-span-1",
    thumbnail: generateThumbnail("ml"),
    content: <ReportContent
      title="Federated Learning AI Metrics"
      type="Machine Learning"
      desc="Deep dive into the latest consensus model's accuracy, loss curves, and diagnostic performance across the 800+ global edge nodes."
      date="Jan 22, 2026"
      size="TBD"
      status="generating"
    />,
  },
  {
    id: 4,
    className: "md:col-span-2",
    thumbnail: generateThumbnail("security"),
    content: <ReportContent
      title="System Security & Access Audit"
      type="Security"
      desc="A full compliance review outlining failed access attempts, IAM changes, encryption key rotations, and overall infrastructure security posture."
      date="Jan 15, 2026"
      size="3.7 MB"
      status="ready"
    />,
  },
];

const quickStats = [
  { label: "Reports Generated", value: "156", icon: FileText },
  { label: "This Month", value: "12", icon: Calendar },
  { label: "Avg Processing", value: "2.3s", icon: TrendingUp },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-8 flex flex-col min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4 md:px-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Reports & Analytics</h1>
          <p className="text-slate-500">Access, generate, and securely download system compliance and performance reports.</p>
        </div>
        <button className="bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-xl flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" />
          Generate New Report
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 px-4 md:px-8">
        {quickStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={stat.label}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-50" />
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-emerald-500">
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Layout Grid */}
      <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950/50 mt-4 rounded-t-[3rem] border-t border-slate-200 dark:border-white/5 relative">
        <div className="h-[600px] w-full">
          <LayoutGrid cards={cards} />
        </div>
      </div>
    </div>
  );
}
