"use client";

import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { Card, CardBody, Button } from "@heroui/react";
import {
  Heart,
  Activity,
  Weight,
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
  ExternalLink,
  TrendingUp,
  Brain,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "motion/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CardSpotlight } from "@/components/ui/card-spotlight";

// Mock data matching Stitch design
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
    chart: [65, 70, 68, 72, 71, 73, 72],
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
    chart: [118, 122, 119, 120, 121, 120, 120],
  },
  {
    label: "Weight",
    value: "68.5",
    unit: "kg",
    trend: "-0.5 this week",
    trendType: "positive" as const,
    icon: Weight,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    chart: [70, 69.5, 69.2, 69, 68.8, 68.7, 68.5],
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
    color: "bg-violet-500",
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

// Container variants for staggered animation
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

interface DashboardStat {
  label: string;
  value: string | number;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  icon: "scan" | "report" | "completed" | "accuracy";
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
        if (!res.ok) {
          throw new Error(`Stats request failed with status ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data?.stats)) {
          throw new Error("Invalid stats payload");
        }

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
      case 'report': return FileText;
      case 'completed': return CheckCircle2;
      case 'accuracy': return Brain;
      default: return Heart;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-transparent">
      {/* Mobile TopBar */}
      <div className="lg:hidden">
        <TopBar />
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                Welcome back, {user?.name?.split(' ')[0] || "User"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {stats ? `${stats[0]?.value ?? 0} scans uploaded · ${stats[1]?.value ?? 0} reports submitted · ${stats[2]?.value ?? 0} scans done` : "Last data sync: 2 mins ago via MediChain Node #44"}
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Encrypted & Synced
              </span>
            </div>
          </div>
        </motion.div>

        {/* Health Summary + Reward Balance Grid */}
        <section aria-labelledby="health-summary">
          <h2 id="health-summary" className="sr-only">Health Summary and Reward Balance</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Dynamic Metric Cards from Database */}
            {isLoading ? (
              <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 flex items-center justify-center p-8 bg-card rounded-xl border border-border shadow-sm">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground text-sm">Loading on-chain stats...</span>
              </motion.div>
            ) : !stats ? (
              <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 flex items-center justify-center p-8 bg-card rounded-xl border border-border shadow-sm">
                <span className="text-muted-foreground text-sm">Unable to load live dashboard stats right now.</span>
              </motion.div>
            ) : (
              stats?.map((metric, index) => {
                const Icon = getIcon(metric.icon);
                const numericValue = typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value)) || 0;
                const valueText = typeof metric.value === 'string' ? metric.value : null;
                return (
                  <motion.div
                    key={metric.label}
                    variants={itemVariants}
                    className="relative rounded-2xl"
                  >
                    <div className="relative rounded-2xl border border-border/50 overflow-hidden">
                      <GlowingEffect
                        spread={40}
                        glow={true}
                        disabled={false}
                        proximity={64}
                        inactiveZone={0.01}
                        borderWidth={2}
                      />
                      <Card isBlurred className="overflow-hidden group hover:shadow-lg transition-all duration-300 rounded-2xl">
                        <CardBody className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${metric.deltaType === "positive"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}>
                              {metric.delta}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">
                              {valueText && valueText.includes("%") ? (
                                valueText
                              ) : numericValue > 0 ? (
                                <NumberTicker value={numericValue} className="text-foreground" />
                              ) : (
                                metric.value
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                        </CardBody>
                      </Card>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Reward Balance Card */}
            <motion.div variants={itemVariants} className="relative rounded-2xl">
              <div className="relative rounded-2xl border border-primary/20 overflow-hidden">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                <Card isBlurred className="overflow-hidden bg-gradient-to-br from-primary/10 via-card/50 to-accent/10 group hover:shadow-lg transition-all duration-300 rounded-2xl">
                  <CardBody className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        +0.0 this month
                      </span>
                    </div>
                    <div>
                      <span className="text-3xl font-bold text-foreground">
                        {numericBalance > 0 ? (
                          <NumberTicker value={numericBalance} className="text-foreground" decimalPlaces={2} />
                        ) : (
                          displayBalance
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">MCI</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ≈ ${usdValue} USD
                    </p>
                    <Button as={Link} href="/patient/wallet" size="sm" variant="flat" className="mt-3 w-full" endContent={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Wallet
                    </Button>
                  </CardBody>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Middle Row: Upload CTA + Appointments */}
        <section aria-label="Quick Actions and Appointments">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Quick Actions / Upload CTA */}
            <motion.div variants={itemVariants}>
              <CardSpotlight className="!p-0 !bg-card/50 !border-primary/30 !border-dashed !border-2 rounded-2xl" radius={300} color="#0ea5e920">
                <div className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Upload & Analyze Scan
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upload new MRI or CT scans for AI-powered analysis with end-to-end encryption.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button color="primary" as={Link} href="/patient/upload" className="flex-1" startContent={<Upload className="w-4 h-4" />}>
                      Upload Scan
                    </Button>
                    <Button as={Link} href="/patient/my-scans" variant="flat" startContent={<FileText className="w-4 h-4" />}>
                      My Scans
                    </Button>
                  </div>
                </div>
              </CardSpotlight>
            </motion.div>

            {/* Upcoming Appointments */}
            <motion.div variants={itemVariants}>
              <CardSpotlight className="!p-0 !bg-card/50 !border-border/50 rounded-2xl" radius={300} color="#6366f120">
                <div className="p-5 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Upcoming Appointments
                      </h3>
                    </div>
                    <Button variant="light" size="sm" className="text-xs text-muted-foreground">
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {appointments.map((apt) => {
                      const TypeIcon = apt.typeIcon;
                      return (
                        <div
                          key={apt.doctor}
                          className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group/apt cursor-pointer"
                        >
                          <div className={`w-10 h-10 rounded-xl ${apt.color} flex items-center justify-center`}>
                            <span className="text-sm font-bold text-white">
                              {apt.doctor.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{apt.doctor}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {apt.specialty}
                              <span className="inline-flex items-center gap-0.5 ml-1 text-primary">
                                <TypeIcon className="w-3 h-3" /> {apt.type}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-foreground">{apt.date}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" /> {apt.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardSpotlight>
            </motion.div>
          </div>
        </section>

        {/* Privacy Log + Data Ownership */}
        <section aria-label="Privacy Log and Details">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Privacy Log */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card isBlurred>
                <CardBody className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Privacy Log</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
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
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <EntryIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{entry.actor}</p>
                            <p className="text-xs text-muted-foreground">{entry.action}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.time}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Data Ownership Status */}
            <motion.div variants={itemVariants}>
              <Card isBlurred className="overflow-hidden">
                <CardBody className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-semibold text-foreground">Data Ownership</h3>
                  </div>

                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500/30 flex items-center justify-center mx-auto mb-3"
                    >
                      <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    </motion.div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      Status: Active
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You control 100% of your shared medical keys.
                    </p>
                  </div>

                  <div className="space-y-2 mt-2">
                    <Button as={Link} href="/patient/settings" variant="flat" size="sm" className="w-full" startContent={<KeyRound className="w-3.5 h-3.5" />}>
                      Manage Keys
                    </Button>
                    <Button variant="light" size="sm" className="w-full text-xs text-muted-foreground" startContent={<ExternalLink className="w-3 h-3" />}>
                      Privacy Policy
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </section>
      </motion.main>
    </div>
  );
}
