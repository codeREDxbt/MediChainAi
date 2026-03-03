"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import {
  ArrowUp, ArrowDown, Layers, Eye, EyeOff, ExternalLink,
  TrendingUp, Coins, Zap, Award, Database, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SparklesCore } from "@/components/ui/sparkles";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { NumberTicker } from "@/components/ui/number-ticker";
import { motion } from "motion/react";

interface FederatedStatus {
  localRound: number;
  globalRound: number;
  status: string;
  currentEpoch: number;
  totalEpochs: number;
  timeRemaining: string;
  modelAccuracy: number;
  accuracyDelta: string;
  mediTokens: number;
  totalContributions: number;
  networkNodes: number;
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

function ActionButton({ icon: Icon, label, highlighted = false }: { icon: React.ElementType; label: string; highlighted?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button isIconOnly variant={highlighted ? "solid" : "flat"} color={highlighted ? "primary" : "default"} className="w-14 h-14 rounded-2xl">
        <Icon className="w-6 h-6" />
      </Button>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export default function PatientWalletPage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { user, tokenBalance } = useAuth();
  const [federatedStatus, setFederatedStatus] = useState<FederatedStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFederatedStatus() {
      try {
        const res = await fetch('/api/federated/status');
        if (res.ok) {
          const data = await res.json();
          setFederatedStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch federated status:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFederatedStatus();
    
    const interval = setInterval(fetchFederatedStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayAddress = user?.address ? `${user.address.slice(0, 4)}...${user.address.slice(-4)}` : "Not Connected";
  const numericBalance = tokenBalance?.uiAmount ?? 0;
  const displayBalance = tokenBalance?.uiAmount !== undefined ? tokenBalance.uiAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0";
  const usdValue = tokenBalance?.uiAmount !== undefined ? (tokenBalance.uiAmount * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

  const recentActivity = federatedStatus ? [
    { title: `Federated Learning Round #${federatedStatus.globalRound}`, time: "Live", amount: `+${(federatedStatus.localRound * 0.5).toFixed(1)} MCI`, type: "earning" as const, icon: Zap, verified: true },
    { title: "Model Accuracy Bonus", time: "Today", amount: `+${federatedStatus.accuracyDelta.replace('+', '')} MCI`, type: "earning" as const, icon: Award, verified: true },
    { title: "Data Contribution Reward", time: "This epoch", amount: `+${(federatedStatus.totalContributions * 2).toFixed(0)} MCI`, type: "earning" as const, icon: Database, verified: true },
    { title: `Staking Reward - Epoch ${federatedStatus.currentEpoch}`, time: "Active", amount: `+${(federatedStatus.mediTokens / 10).toFixed(1)} MCI`, type: "earning" as const, icon: Layers, verified: true },
    { title: "Network Node Contribution", time: "Ongoing", amount: "+0.5 MCI", type: "earning" as const, icon: Database, verified: true },
  ] : [];

  const earningsData = federatedStatus ? [
    { month: "Aug", value: Math.floor(federatedStatus.mediTokens * 4) },
    { month: "Sep", value: Math.floor(federatedStatus.mediTokens * 5) },
    { month: "Oct", value: Math.floor(federatedStatus.mediTokens * 6) },
    { month: "Nov", value: Math.floor(federatedStatus.mediTokens * 5.5) },
    { month: "Dec", value: Math.floor(federatedStatus.mediTokens * 7) },
    { month: "Jan", value: Math.floor(federatedStatus.mediTokens * 8) },
    { month: "Feb", value: Math.floor(federatedStatus.mediTokens * 8.5) },
  ] : [
    { month: "Aug", value: 180 }, { month: "Sep", value: 220 },
    { month: "Oct", value: 310 }, { month: "Nov", value: 280 },
    { month: "Dec", value: 350 }, { month: "Jan", value: 420 },
    { month: "Feb", value: 380 },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="lg:hidden">
        <TopBar title="Wallet" showLogo={false} showSettings rightContent={<Chip variant="flat" className="font-mono text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1" />{displayAddress}</Chip>} />
      </div>

      <motion.main variants={containerVariants} initial="hidden" animate="visible" className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        <motion.div variants={itemVariants} className="hidden lg:flex lg:items-center lg:justify-between lg:mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground text-sm">Manage your MCI tokens and transactions</p>
          </div>
          <Chip variant="flat" size="lg" className="font-mono text-sm px-4 py-2"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2 animate-pulse" />{displayAddress}</Chip>
        </motion.div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Balance Card with Sparkles + GlowingEffect */}
          <motion.div variants={itemVariants} className="relative rounded-2xl lg:col-span-1">
            <div className="relative rounded-2xl border border-primary/20 overflow-hidden">
              <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
              <Card className="overflow-hidden bg-gradient-to-b from-card to-primary/5 rounded-2xl">
                <CardBody className="p-6 relative">
                  <div className="absolute inset-0 z-0 opacity-40">
                    <SparklesCore id="walletSparkles" background="transparent" minSize={0.3} maxSize={1} particleDensity={30} className="w-full h-full" particleColor="#3b82f6" speed={0.8} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Balance</span>
                      <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                        {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="mb-1">
                      <span className="text-4xl font-bold text-primary lg:text-5xl tracking-tight">
                        {balanceVisible ? (numericBalance > 0 ? <NumberTicker value={numericBalance} className="text-primary" decimalPlaces={2} /> : displayBalance) : "••••"}
                      </span>
                      <span className="text-lg text-primary/80 ml-2 font-semibold">MCI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">≈ ${balanceVisible ? usdValue : "••••"} USD</p>
                      <span className="text-xs font-medium text-emerald-500 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+0.0%</span>
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                      <ActionButton icon={ArrowUp} label="Send" />
                      <ActionButton icon={ArrowDown} label="Receive" />
                      <ActionButton icon={Layers} label="Stake" highlighted />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-6 mt-6 lg:mt-0 lg:col-span-2">
            {/* Earnings Chart */}
            <motion.div variants={itemVariants}>
              <Card><CardBody className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Coins className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Earnings History</h3></div>
                  <Button variant="light" size="sm" className="text-xs text-muted-foreground">Last 7 months</Button>
                </div>
                <div className="flex items-end justify-between gap-3 h-36">
                  {earningsData.map((item, index) => {
                    const maxVal = Math.max(...earningsData.map((d) => d.value));
                    const heightPct = (item.value / maxVal) * 100;
                    return (
                      <motion.div key={item.month} initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.3 + index * 0.08, duration: 0.5, ease: "easeOut" }} className="flex-1 flex flex-col items-center gap-1.5 origin-bottom">
                        <span className="text-xs font-medium text-foreground">{item.value}</span>
                        <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${heightPct}%` }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/30 rounded-t-lg" />
                        </div>
                        <span className="text-xs text-muted-foreground">{item.month}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardBody></Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <Card><CardBody className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Recent Activity</h3>
                  <Button variant="light" size="sm" className="text-xs text-muted-foreground" endContent={<ArrowRight className="w-3 h-3" />}>View All</Button>
                </div>
                <div className="space-y-1">
                  {recentActivity.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === "earning" ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                          <Icon className={`w-5 h-5 ${item.type === "earning" ? "text-emerald-500" : "text-amber-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${item.type === "earning" ? "text-emerald-500" : "text-amber-500"}`}>{item.amount}</p>
                          {item.verified && <button className="text-xs text-primary hover:underline flex items-center gap-0.5 ml-auto">Verified <ExternalLink className="w-3 h-3" /></button>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardBody></Card>
            </motion.div>
          </div>
        </div>

        <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Solana Devnet: Connected<span className="mx-1">•</span>MCI is currently a testnet token.
        </motion.div>
      </motion.main>
    </div>
  );
}
