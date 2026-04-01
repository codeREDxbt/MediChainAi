"use client";

import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import {
  Heart,
  Activity,
  Shield,
  ShieldCheck,
  Upload,
  ArrowRight,
  Clock,
  Eye,
  KeyRound,
  FileText,
  Coins,
  Calendar,
  Video,
  MapPin,
  TrendingUp,
  Brain,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { NumberTicker } from "@/components/ui/number-ticker";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const healthMetrics = [
  {
    label: "Heart Rate",
    value: "72",
    unit: "BPM",
    trend: "Normal",
    trendType: "positive" as const,
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    label: "Blood Pressure",
    value: "120/80",
    unit: "mmHg",
    trend: "Optimal",
    trendType: "positive" as const,
    icon: Activity,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
];

const appointments = [
  {
    doctor: "Dr. Sarah Alisha",
    specialty: "Oncology Follow-up",
    type: "Telehealth",
    typeIcon: Video,
    date: "Feb 12, 2026",
    time: "10:30 AM",
    color: "bg-[#5E6AD2]",
  },
  {
    doctor: "City General Imaging",
    specialty: "MRI Scan - Lumbar Spine",
    type: "In-person",
    typeIcon: MapPin,
    date: "Feb 18, 2026",
    time: "2:00 PM",
    color: "bg-blue-500",
  },
];

const privacyLog = [
  {
    actor: "Dr. Sarah Alisha",
    action: "Viewed Lab Results #LR-992",
    time: "2 hours ago",
    icon: Eye,
  },
  {
    actor: "MediChain Validator",
    action: "Verified Identity Hash",
    time: "5 hours ago",
    icon: ShieldCheck,
  },
  {
    actor: "Pharmacy Network",
    action: "Prescription Sync #RX-21",
    time: "Yesterday",
    icon: FileText,
  },
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

interface DashboardStat {
  label: string;
  value: string | number;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  icon: string;
}

export default function PatientDashboardPage() {
  const [stats, setStats] = useState<DashboardStat[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, tokenBalance } = useAuth();

  const displayBalance = tokenBalance?.uiAmount !== undefined
    ? tokenBalance.uiAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : "0";

  const numericBalance = tokenBalance?.uiAmount ?? 0;

  const usdValue = tokenBalance?.uiAmount !== undefined
    ? (tokenBalance.uiAmount * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error(`Stats request failed with status ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data?.stats)) throw new Error("Invalid stats payload");
        setStats(data.stats);
      } catch (e) {
        console.error("Failed to load stats", e);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'scan': return Activity;
      case 'accuracy': return Brain;
      default: return Heart;
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] font-sans text-[#EDEDEF] selection:bg-[#5E6AD2]/30">
      <div className="lg:hidden">
        <TopBar />
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto px-4 py-8 lg:py-12 space-y-8"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#EDEDEF] tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || "User"}
              </h1>
              <p className="text-sm text-[#8A8F98] mt-1">
                Last data sync: 2 mins ago via MediChain Node #44
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">
                Encrypted & Synced
              </span>
            </div>
          </div>
        </motion.div>

        {/* Health Summary + Reward Balance Grid */}
        <section>
          <h2 className="sr-only">Health Summary and Reward Balance</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {isLoading ? (
              <motion.div variants={itemVariants} className="col-span-1 lg:col-span-3 flex items-center justify-center p-8 bg-[#12121a] rounded-2xl border border-white/[0.1]">
                <Loader2 className="w-5 h-5 animate-spin text-[#5E6AD2]" />
                <span className="ml-2 text-[#8A8F98] text-sm">Loading on-chain stats...</span>
              </motion.div>
            ) : !stats ? (
              <motion.div variants={itemVariants} className="col-span-1 lg:col-span-3 flex items-center justify-center p-8 bg-[#12121a] rounded-2xl border border-white/[0.1]">
                <span className="text-[#8A8F98] text-sm">Unable to load live dashboard stats right now.</span>
              </motion.div>
            ) : (
              stats?.map((metric) => {
                const Icon = getIcon(metric.icon);
                const numericValue = typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value)) || 0;
                return (
                  <motion.div
                    key={metric.label}
                    variants={itemVariants}
                    className="relative rounded-2xl"
                  >
                    <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden bg-[#12121a]">
                      <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-[#5E6AD2]/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-[#5E6AD2]" />
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${metric.deltaType === "positive"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                            }`}>
                            {metric.delta}
                          </span>
                        </div>
                        <span className="text-3xl font-bold text-[#EDEDEF]">
                          {numericValue > 0 ? (
                            <NumberTicker value={numericValue} className="text-[#EDEDEF]" />
                          ) : (
                            metric.value
                          )}
                        </span>
                        <p className="text-xs text-[#8A8F98] mt-1">{metric.label}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Reward Balance Card */}
            <motion.div variants={itemVariants} className="relative rounded-2xl">
              <div className="relative rounded-2xl border border-[#5E6AD2]/20 overflow-hidden bg-[#12121a]">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5E6AD2]/20 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-[#5E6AD2]" />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      +0.0 this month
                    </span>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-[#EDEDEF]">
                      {numericBalance > 0 ? (
                        <NumberTicker value={numericBalance} className="text-[#EDEDEF]" decimalPlaces={2} />
                      ) : (
                        displayBalance
                      )}
                    </span>
                    <span className="text-sm text-[#8A8F98] ml-2">MCI</span>
                  </div>
                  <p className="text-xs text-[#8A8F98] mt-1">
                    ≈ ${usdValue} USD
                  </p>
                  <Link href="/patient/wallet" className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 text-[#EDEDEF] text-sm font-medium hover:bg-[#5E6AD2]/20 transition-all">
                    View Wallet
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Middle Row: Upload CTA + Appointments */}
        <section>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Quick Actions / Upload CTA */}
            <motion.div variants={itemVariants}>
              <div className="relative rounded-2xl border border-dashed border-[#5E6AD2]/30 bg-[#12121a] p-6 hover:border-[#5E6AD2]/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#EDEDEF] mb-1">
                      Upload & Analyze Scan
                    </h3>
                    <p className="text-sm text-[#8A8F98]">
                      Upload new MRI or CT scans for AI-powered analysis with end-to-end encryption.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#5E6AD2]/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#5E6AD2]" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href="/patient/upload" className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#5E6AD2] text-white text-sm font-medium hover:bg-[#6872D9] transition-all">
                    <Upload className="w-4 h-4" />
                    Upload Scan
                  </Link>
                  <Link href="/patient/my-scans" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#12121a] border border-white/[0.1] text-[#EDEDEF] text-sm font-medium hover:bg-[#1a1a24] transition-all">
                    <FileText className="w-4 h-4" />
                    My Scans
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Upcoming Appointments */}
            <motion.div variants={itemVariants}>
              <div className="relative rounded-2xl border border-white/[0.06] bg-[#12121a] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#5E6AD2]" />
                    <h3 className="text-lg font-semibold text-[#EDEDEF]">
                      Upcoming Appointments
                    </h3>
                  </div>
                  <button className="text-xs text-[#8A8F98] hover:text-[#EDEDEF] transition-colors">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {appointments.map((apt) => {
                    const TypeIcon = apt.typeIcon;
                    return (
                      <div
                        key={apt.doctor}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-xl ${apt.color} flex items-center justify-center`}>
                          <span className="text-sm font-bold text-white">
                            {apt.doctor.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#EDEDEF] truncate">{apt.doctor}</p>
                          <p className="text-xs text-[#8A8F98] flex items-center gap-1">
                            {apt.specialty}
                            <span className="inline-flex items-center gap-0.5 ml-1 text-[#5E6AD2]">
                              <TypeIcon className="w-3 h-3" /> {apt.type}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-[#EDEDEF]">{apt.date}</p>
                          <p className="text-xs text-[#8A8F98] flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" /> {apt.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Privacy Log + Data Ownership */}
        <section>
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Privacy Log */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="relative rounded-2xl border border-white/[0.06] bg-[#12121a] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#5E6AD2]" />
                    <h3 className="text-lg font-semibold text-[#EDEDEF]">Privacy Log</h3>
                  </div>
                  <span className="text-xs text-[#8A8F98]">
                    Recent access to your encrypted medical data
                  </span>
                </div>
                <div className="space-y-1">
                  {privacyLog.map((entry, i) => {
                    const EntryIcon = entry.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center flex-shrink-0">
                          <EntryIcon className="w-4 h-4 text-[#5E6AD2]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#EDEDEF]">{entry.actor}</p>
                          <p className="text-xs text-[#8A8F98]">{entry.action}</p>
                        </div>
                        <span className="text-xs text-[#8A8F98] whitespace-nowrap">{entry.time}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Data Ownership Status */}
            <motion.div variants={itemVariants}>
              <div className="relative rounded-2xl border border-white/[0.06] bg-[#12121a] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-[#EDEDEF]">Data Ownership</h3>
                </div>

                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500/30 flex items-center justify-center mx-auto mb-3"
                  >
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </motion.div>
                  <p className="text-sm font-semibold text-emerald-400">
                    Status: Active
                  </p>
                  <p className="text-xs text-[#8A8F98] mt-1">
                    You control 100% of your shared medical keys.
                  </p>
                </div>

                <div className="space-y-2 mt-2">
                  <Link href="/patient/settings" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[#EDEDEF] text-sm font-medium hover:bg-white/[0.04] transition-all">
                    <KeyRound className="w-3.5 h-3.5" />
                    Manage Keys
                  </Link>
                  <Link href="/patient/settings" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-[#8A8F98] text-sm hover:text-[#EDEDEF] transition-colors">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </motion.main>
    </div>
  );
}
