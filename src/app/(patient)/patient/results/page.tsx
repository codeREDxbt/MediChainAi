"use client";

import { TopBar } from "@/components/top-bar";
import { LiveLogPanel } from "@/components/live-log-panel";
import { Smartphone, Network, Shield, Zap, Wallet, Brain, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
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

        // Use direct single-scan endpoint for efficiency
        const res = await fetch(`/api/scans/${scanId}`);

        if (res.status === 404) {
          setError('Scan not found');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to load scan');
        }

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
        if (res.ok) {
          const data = await res.json();
          setFederatedStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch federated status:", err);
      }
    }

    async function loadBlockchainLogs() {
      try {
        const res = await fetch('/api/blockchain/logs');
        if (res.ok) {
          const data = await res.json();
          setBlockchainLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Failed to fetch blockchain logs:", err);
      }
    }

    loadScan();
    loadFederatedStatus();
    loadBlockchainLogs();
  }, [scanId]);

  const triggerAnalysis = async () => {
    if (!scanId) return;

    try {
      setIsAnalyzing(true);

      const res = await fetch(`/api/scans/${scanId}/analyze`, {
        method: "POST"
      });

      const rawBody = await res.text();
      let data: any = null;

      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = { error: rawBody };
        }
      }

      if (!res.ok) {
        const detailMessage = data?.details
          ? `${data.error || 'Analysis failed'}: ${data.details}`
          : (data?.error || `Analysis failed (HTTP ${res.status})`);
        throw new Error(detailMessage);
      }

      // Refresh token balance
      await refreshBalance();

      // Update scan state with new analysis
      const findingsObj = typeof data.analysis?.findings === 'string'
        ? JSON.parse(data.analysis.findings)
        : data.analysis?.findings;

      setScan((prev) => prev ? ({
        ...prev,
        status: "Analyzed",
        confidence: data.analysis?.confidence_score || 0,
        findings: JSON.stringify(findingsObj),
        riskScore: data.analysis?.confidence_score || 0,
        riskLevel: (data.analysis?.confidence_score || 0) > 85 ? "High" : "Low"
      }) : null);

      success('Analysis complete! MCI tokens rewarded.');
    } catch (err) {
      console.error("Analysis error:", err);
      const errMsg = err instanceof Error ? err.message : 'Analysis failed';
      showError(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const displayTokens = tokenBalance?.uiAmount || 0;

  // Parse findings for display
  const parsedFindings = (() => {
    if (!scan?.findings) return null;

    if (scan.findings === "Pending Analysis") return null;

    try {
      return typeof scan.findings === 'string' ? JSON.parse(scan.findings) : scan.findings;
    } catch {
      return null;
    }
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050506]">
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
      <div className="min-h-screen bg-[#050506] flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#EDEDEF]">
            {error || 'Scan not found'}
          </h2>
          <p className="text-[#8A8F98]">
            The scan you're looking for doesn't exist or couldn't be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] font-sans text-[#EDEDEF] selection:bg-[#5E6AD2]/30">

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
        className="max-w-5xl mx-auto px-4 py-8 lg:py-12 space-y-8"
      >
        <motion.div variants={itemVariants} className="hidden lg:flex lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#EDEDEF] tracking-tight">AI Insights & Federated Status</h1>
            <p className="text-sm text-[#8A8F98] mt-1">
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
              <div className="relative w-full rounded-2xl overflow-hidden bg-[#12121a] border border-white/[0.1] p-2">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center group cursor-crosshair">
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
            <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-[#12121a]">
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
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                      CURRENT EPOCH
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Est. Time Remaining
                    </span>
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
            {/* Accuracy & Tokens */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div className="relative rounded-2xl bg-[#12121a] border border-white/[0.1] p-5 flex flex-col justify-between overflow-hidden">
                <GlowingEffect spread={20} glow={true} className="z-0" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-[#8A8F98] tracking-widest uppercase mb-4">
                    MODEL CONFIDENCE
                  </p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-bold text-[#EDEDEF] tracking-tight">
                      {scan?.confidence ? <NumberTicker value={scan.confidence} /> : "0"}%
                    </span>
                  </div>
                  <div className="flex gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                        className={cn(
                          "flex-1 rounded-full origin-left",
                          scan?.confidence && i <= Math.ceil(scan.confidence / 20) ? "bg-emerald-500" : "bg-white/[0.06]"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl bg-[#12121a] border border-white/[0.1] p-5 flex flex-col justify-between overflow-hidden">
                <GlowingEffect spread={20} glow={true} className="z-0" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-[#8A8F98] tracking-widest uppercase mb-4">
                    REWARD TOKENS (MCI)
                  </p>
                  <div className="text-3xl font-bold text-[#EDEDEF] tracking-tight mb-2">
                    <NumberTicker value={displayTokens} />
                  </div>
                  <p className="text-xs text-[#8A8F98] font-medium">
                    Solana Devnet
                  </p>
                  <div className="flex items-center gap-1.5 mt-4 text-emerald-400/80 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-500/20">
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
                        Run AI Analysis & Claim Reward
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Findings - show if analyzed OR if confidence > 0 */}
            {(scan?.status === "Analyzed" || (scan && scan.confidence > 0)) && parsedFindings && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-3xl bg-slate-900 border border-emerald-500/30 p-8 flex-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full" />
                <h3 className="font-bold text-xl text-emerald-400 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Diagnostic Findings
                </h3>

                {parsedFindings.summary && (
                  <p className="text-white font-medium mb-4">
                    {parsedFindings.summary}
                  </p>
                )}

                {parsedFindings.details && Array.isArray(parsedFindings.details) && (
                  <ul className="space-y-2">
                    {parsedFindings.details.map((detail: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
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
