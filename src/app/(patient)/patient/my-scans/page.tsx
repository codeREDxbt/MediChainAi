"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import {
  FileStack,
  Search,
  Clock,
  ShieldCheck,
  Brain,
  Upload,
  Loader2,
  Trash2
} from "lucide-react";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ScanStatus = "Analyzed" | "Processing" | "Pending Review";

interface Scan {
  id: string;
  type: string;
  originalName: string | null;
  patientName: string | null;
  region: string;
  date: string;
  status: ScanStatus;
  aiScore: number;
  confidence: number;
  findings: string;
  blockchain: string;
  size: string;
  modality?: string;
  txHash?: string | null;
}

const scanTypes = ["All Types", "MRI", "CT", "X-Ray", "Ultrasound", "PET", "DICOM"];

const loadingStates = [
  { text: "Connecting to secure network..." },
  { text: "Retrieving patient ledger..." },
  { text: "Decrypting medical records..." },
  { text: "Loading scan thumbnails..." },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MyScansPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    async function loadScans() {
      try {
        const res = await fetch('/api/scans/me');
        if (res.ok) {
          const data = await res.json();
          setTimeout(() => {
            setScans(data.scans || []);
            setIsLoading(false);
          }, 2000);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load scans", err);
        setIsLoading(false);
      }
    }
    loadScans();
  }, []);

  const handleDelete = async (e: React.MouseEvent, scanId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to completely delete this medical scan? This action cannot be reversed.")) {
      return;
    }

    try {
      setIsDeleting(scanId);
      const res = await fetch(`/api/scans/${scanId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete scan");
      }

      setScans(prev => prev.filter(s => s.id !== scanId));
      success("Scan permanently deleted");
    } catch (err) {
      console.error("Error deleting scan:", err);
      showError(err instanceof Error ? err.message : "Failed to delete scan");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredScans = scans.filter((scan) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (scan.id && scan.id.toLowerCase().includes(q)) ||
      (scan.region && scan.region.toLowerCase().includes(q)) ||
      (scan.type && scan.type.toLowerCase().includes(q)) ||
      (scan.originalName?.toLowerCase().includes(q) ?? false) ||
      (scan.patientName?.toLowerCase().includes(q) ?? false);

    const typeNorm = (scan.type || "").toLowerCase().replace(/\s+scan$/, '').replace(/^mr$/, 'mri');
    const selectedNorm = selectedType.toLowerCase().replace(/\s+scan$/, '').replace(/^mr$/, 'mri');
    const matchesType = selectedType === "All Types" || typeNorm === selectedNorm || scan.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getParsedFindings = (findings: string): string => {
    if (!findings || findings === "Pending Analysis") return "Awaiting AI analysis.";
    try {
      const parsed = typeof findings === 'string' ? JSON.parse(findings) : findings;
      return parsed?.summary || "Analysis complete.";
    } catch {
      return findings;
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] font-sans text-[#EDEDEF] selection:bg-[#5E6AD2]/30">
      <div className="lg:hidden">
        <TopBar title="My Scans" showBack showLogo={false} showSettings />
      </div>

      <Loader loadingStates={loadingStates} loading={isLoading} duration={500} />

      <main className="max-w-5xl mx-auto px-4 py-8 lg:py-12 space-y-8">
        {!isLoading && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-2xl font-bold text-[#EDEDEF] tracking-tight">My Medical Scans</h1>
                <p className="text-sm text-[#8A8F98] mt-1">
                  {scans.length} scan{scans.length !== 1 ? 's' : ''} &bull; {scans.filter((s) => s.status === "Analyzed" || s.aiScore > 0).length} analyzed
                </p>
              </div>
              <Link
                href="/patient/upload"
                className="group flex items-center gap-2 px-5 py-2.5 font-medium text-[#EDEDEF] transition-all duration-200 bg-[#12121a] border border-white/[0.1] rounded-xl hover:bg-[#1a1a24] hover:border-[#5E6AD2]/30"
              >
                <Upload className="w-4 h-4 text-[#5E6AD2]" />
                <span>New Scan</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-[#8A8F98] group-focus-within:text-[#5E6AD2] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, type, region, or patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/[0.1] rounded-xl py-3 pl-10 pr-4 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-all"
                />
              </div>

              <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2">
                {scanTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300",
                      selectedType === type
                        ? "bg-[#12121a] text-[#EDEDEF] border border-white/[0.1]"
                        : "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-[#12121a]"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>

            <section>
              <div className="space-y-6">
                {filteredScans.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-[#8A8F98] border border-dashed border-white/[0.1] rounded-2xl bg-[#12121a]"
                  >
                    <FileStack className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium text-[#EDEDEF]">No scans found.</p>
                    <p className="text-sm mt-1 mb-6">
                      {searchQuery || selectedType !== "All Types"
                        ? "Try adjusting your search or filter."
                        : "Upload a DICOM or image file to get started."}
                    </p>
                    {!searchQuery && selectedType === "All Types" && (
                      <Link
                        href="/patient/upload"
                        className="px-6 py-2.5 rounded-xl bg-[#12121a] text-[#EDEDEF] font-medium hover:bg-[#1a1a24] transition-colors border border-white/[0.1]"
                      >
                        Upload your first scan
                      </Link>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filteredScans.map((scan) => {
                      const isAnalyzed = scan.status === "Analyzed" || scan.aiScore > 0;
                      const scanTitle = scan.patientName
                        ? scan.patientName
                        : scan.originalName
                          ? scan.originalName
                          : scan.type;

                      return (
                        <motion.div key={scan.id} variants={itemVariants}>
                          <Link href={`/patient/results?scan=${scan.id}`} className="block h-full">
                            <div className="relative h-full bg-[#12121a] border border-white/[0.06] rounded-2xl p-5 hover:border-[#5E6AD2]/30 transition-all group">
                              <div className="absolute top-2 right-2 z-10">
                                <button
                                  onClick={(e) => handleDelete(e, scan.id)}
                                  disabled={isDeleting === scan.id}
                                  className="p-2 rounded-lg bg-[#050506]/50 hover:bg-red-500/20 text-[#8A8F98] hover:text-red-400 border border-white/[0.06] hover:border-red-500/30 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  aria-label="Delete scan"
                                  title="Delete scan"
                                >
                                  {isDeleting === scan.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-start justify-between mb-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  scan.type === "MRI" ? "bg-violet-500/20 text-violet-400" :
                                    scan.type === "CT" ? "bg-blue-500/20 text-blue-400" :
                                      scan.type === "X-Ray" ? "bg-amber-500/20 text-amber-400" :
                                        "bg-emerald-500/20 text-emerald-400"
                                )}>
                                  <FileStack className="w-5 h-5" />
                                </div>
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-xs font-medium",
                                  isAnalyzed
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : scan.status === "Processing"
                                      ? "bg-blue-500/10 text-blue-400"
                                      : "bg-amber-500/10 text-amber-400"
                                )}>
                                  {isAnalyzed ? "Analyzed" : scan.status}
                                </span>
                              </div>

                              <h3 className="text-base font-semibold text-[#EDEDEF] mb-1 truncate">
                                {scanTitle}
                              </h3>
                              <p className="text-xs text-[#8A8F98] mb-3 truncate">
                                {scan.type === scan.region || scan.region === "Unknown" ? scan.type : `${scan.type} • ${scan.region}`}
                              </p>

                              <p className="text-sm text-[#8A8F98] mb-4 line-clamp-2 min-h-[2.5rem]">
                                {getParsedFindings(scan.findings)}
                              </p>

                              <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
                                <div className="flex flex-col gap-1.5 text-xs text-[#8A8F98]">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {scan.date ? new Date(scan.date).toLocaleDateString() : "—"}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-emerald-500/70">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {scan.blockchain !== "pending" ? "Verified" : "Pending"}
                                  </div>
                                </div>

                                {isAnalyzed ? (
                                  <div className="flex items-center gap-1.5 bg-white/[0.02] px-2 py-1 rounded-lg">
                                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-sm font-bold text-emerald-400">
                                      {Math.round(scan.aiScore)}%
                                    </span>
                                  </div>
                                ) : scan.status === "Processing" ? (
                                  <div className="flex items-center gap-1.5 px-2 py-1">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                                    <span className="text-[10px] text-blue-400 font-medium">Processing</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 px-2 py-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-500/70" />
                                    <span className="text-[10px] text-amber-500/70 font-medium">Pending</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
