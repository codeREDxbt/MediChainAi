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
import { TracingBeam } from "@/components/ui/tracing-beam";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ScanStatus = "Analyzed" | "Processing" | "Pending Review";

// Matches the shape returned by /api/scans/me
interface Scan {
  id: string;
  type: string;           // displayModality
  originalName: string | null;
  patientName: string | null;
  region: string;
  date: string;           // upload_date
  status: ScanStatus;
  aiScore: number;        // rounded confidence_score
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
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
          // Brief delay for the fancy multi-step loader UX
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
      scan.id.toLowerCase().includes(q) ||
      scan.region.toLowerCase().includes(q) ||
      scan.type.toLowerCase().includes(q) ||
      (scan.originalName?.toLowerCase().includes(q) ?? false) ||
      (scan.patientName?.toLowerCase().includes(q) ?? false);

    // Normalize type for flexible filter comparison
    const typeNorm = scan.type?.toLowerCase().replace(/\s+scan$/, '').replace(/^mr$/, 'mri');
    const selectedNorm = selectedType.toLowerCase().replace(/\s+scan$/, '').replace(/^mr$/, 'mri');
    const matchesType = selectedType === "All Types" || typeNorm === selectedNorm || scan.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Parse findings text for card display
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
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-transparent font-sans text-slate-200 selection:bg-emerald-500/30">
      {/* Mobile TopBar */}
      <div className="lg:hidden">
        <TopBar
          title="My Scans"
          showBack
          showLogo={false}
          showSettings
        />
      </div>

      <Loader loadingStates={loadingStates} loading={isLoading} duration={500} />

      <main className="flex-1 px-4 py-8 space-y-8 lg:px-0 lg:py-0 relative z-10">
        {!isLoading && (
          <>
            {/* Header */}
            <header>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">My Medical Scans</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    {scans.length} scan{scans.length !== 1 ? 's' : ''} &bull; {scans.filter((s) => s.status === "Analyzed" || s.aiScore > 0).length} analyzed
                  </p>
                </div>
                <Link
                  href="/patient/upload"
                  className="group relative inline-flex items-center justify-center px-6 py-2.5 font-medium text-white transition-all duration-200 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <Upload className="w-4 h-4 mr-2" />
                  <span>New Scan</span>
                </Link>
              </motion.div>
            </header>

            {/* Search & Filters */}
            <section aria-label="Search and Filter Scans">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col md:flex-row gap-4 mb-8"
              >
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, type, region, or patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
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
                          ? "bg-slate-800 text-white shadow-lg shadow-black/20 border border-white/10"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* Scans List with TracingBeam */}
            <section aria-label="Scans List">
              <TracingBeam className="px-0 md:px-6">
                <div className="space-y-6">
                  {filteredScans.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-white/10 rounded-3xl bg-slate-900/30"
                    >
                      <FileStack className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium text-slate-300">No scans found.</p>
                      <p className="text-sm mt-1 mb-6">
                        {searchQuery || selectedType !== "All Types"
                          ? "Try adjusting your search or filter."
                          : "Upload a DICOM or image file to get started."}
                      </p>
                      {!searchQuery && selectedType === "All Types" && (
                        <Link
                          href="/patient/upload"
                          className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors border border-white/5"
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
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {filteredScans.map((scan) => {
                        const isAnalyzed = scan.status === "Analyzed" || scan.aiScore > 0;
                        const scanTitle = scan.patientName
                          ? scan.patientName
                          : scan.originalName
                            ? scan.originalName
                            : scan.type;

                        return (
                          <motion.div key={scan.id} variants={itemVariants} className="h-full">
                            <Link href={`/patient/results?scan=${scan.id}`} className="block h-full">
                              <CardContainer className="inter-var w-full h-full">
                                <CardBody className="bg-slate-900/80 relative group/card hover:shadow-2xl hover:shadow-emerald-500/[0.1] border border-white/10 w-full h-full rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm">
                                  {/* Background Glow Effect */}
                                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover/card:from-emerald-500/5 group-hover/card:via-transparent group-hover/card:to-transparent transition-all duration-500 z-0" />

                                  <div className="relative z-10 flex flex-col h-full">
<div className="absolute top-2 right-2 z-50">
  <button
    onClick={(e) => handleDelete(e, scan.id)}
    disabled={isDeleting === scan.id}
    className="p-2 rounded-xl bg-slate-900/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all duration-200 shadow-xl"
    aria-label="Delete scan"
    title="Delete scan"
  >
    {isDeleting === scan.id ? (
      <Loader2 className="w-4 h-4 animate-spin text-red-400" />
    ) : (
      <Trash2 className="w-4 h-4" />
    )}
  </button>
</div>
                                    <div className="flex items-start justify-between mb-4">
                                      <CardItem
                                        translateZ="40"
                                        className={cn(
                                          "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner",
                                          scan.type === "MRI" ? "bg-violet-500/20 text-violet-400" :
                                            scan.type === "CT" ? "bg-blue-500/20 text-blue-400" :
                                              scan.type === "X-Ray" ? "bg-amber-500/20 text-amber-400" :
                                                "bg-emerald-500/20 text-emerald-400"
                                        )}
                                      >
                                        <FileStack className="w-6 h-6" />
                                      </CardItem>
                                      <CardItem translateZ="30">
                                        <span className={cn(
                                          "px-3 py-1 rounded-full text-xs font-semibold tracking-wide",
                                          isAnalyzed
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : scan.status === "Processing"
                                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        )}>
                                          {isAnalyzed ? "Analyzed" : scan.status}
                                        </span>
                                      </CardItem>
                                    </div>

                                    {/* Scan Title: PatientName > OriginalName > Type */}
                                    <CardItem
                                      translateZ="50"
                                      className="text-lg font-bold text-white mb-1 truncate min-w-0 max-w-[200px] md:max-w-[250px] w-full block"
                                    >
                                      {scanTitle}
                                    </CardItem>

                                    {/* Modality badge */}
                                    <CardItem translateZ="45" className="text-xs text-slate-400 font-medium mb-3 truncate w-full block min-w-0 pr-4">
                                      {scan.type === scan.region || scan.region === "Unknown" ? scan.type : `${scan.type} • ${scan.region}`}
                                    </CardItem>

                                    <CardItem
                                      as="p"
                                      translateZ="60"
                                      className="text-sm text-slate-400 mb-6 line-clamp-3 lg:line-clamp-4 flex-1"
                                    >
                                      {getParsedFindings(scan.findings)}
                                    </CardItem>

                                    <div className="mt-auto flex items-end justify-between pt-4 border-t border-white/5">
                                      <CardItem translateZ="40" className="flex flex-col gap-2 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5" />
                                          {scan.date ? new Date(scan.date).toLocaleDateString() : "—"}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-emerald-500/70">
                                          <ShieldCheck className="w-3.5 h-3.5" />
                                          {scan.blockchain !== "pending" ? "Verified on Solana" : "Pending Verification"}
                                        </div>
                                      </CardItem>

                                      <CardItem translateZ="40">
                                        {isAnalyzed ? (
                                          <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 mb-1 bg-white/5 px-2 py-1 rounded-lg">
                                              <Brain className="w-3.5 h-3.5 text-emerald-400" />
                                              <span className="text-lg font-bold text-emerald-400 leading-none">
                                                {Math.round(scan.aiScore)}%
                                              </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Confidence</span>
                                          </div>
                                        ) : scan.status === "Processing" ? (
                                          <div className="flex flex-col items-end gap-1 px-2 py-1">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                            <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">Processing</span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-end gap-1 px-2 py-1">
                                            <Clock className="w-4 h-4 text-amber-500/70" />
                                            <span className="text-[10px] text-amber-500/70 uppercase tracking-wider font-medium">Pending Review</span>
                                          </div>
                                        )}
                                      </CardItem>
                                    </div>
                                  </div>
                                </CardBody>
                              </CardContainer>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              </TracingBeam>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
