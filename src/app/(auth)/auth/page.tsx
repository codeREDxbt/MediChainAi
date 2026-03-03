"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Spotlight } from "@/components/ui/spotlight";
import { LampContainer } from "@/components/ui/lamp";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { SparklesCore } from "@/components/ui/sparkles";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { Header } from "@/components/landing/header";
import { ScanVisual, BlockchainVisual, LearningVisual, PrivacyVisual, ReportsVisual, TokensVisual } from "@/components/landing/bento-visuals";
import { Shield, Loader2, CheckCircle2, AlertCircle, Scan, Link as LinkIcon, Network, ShieldCheck, Files, Coins } from "lucide-react";

const partners = [
  { quote: "Decentralized File Storage for medical imagery", name: "IPFS", title: "Protocol" },
  { quote: "High-speed Web3 Infrastructure and Tokenomics", name: "Solana", title: "Blockchain" },
  { quote: "Medical Imaging AI Open-Source Framework", name: "MONAI", title: "AI Framework" },
  { quote: "Enterprise PostgreSQL Database & Storage", name: "Supabase", title: "Backend Infrastructure" },
  { quote: "Global Edge Network Frontend Hosting", name: "Vercel", title: "Infrastructure" },
];


const bentoItems = [
  {
    title: "AI Scan Analysis",
    description: "Instant anomaly detection with 99.2% accuracy.",
    icon: <Scan className="w-4 h-4 text-emerald-500" />,
    header: <ScanVisual />,
  },
  {
    title: "Blockchain Provenance",
    description: "Every scan hash logged on Solana for immutability.",
    icon: <LinkIcon className="w-4 h-4 text-blue-500" />,
    header: <BlockchainVisual />,
  },
  {
    title: "Federated Learning",
    description: "Train global models without data ever leaving your device.",
    icon: <Network className="w-4 h-4 text-purple-500" />,
    header: <LearningVisual />,
  },
  {
    title: "Patient Privacy",
    description: "Zero-knowledge architecture for complete confidentiality.",
    icon: <ShieldCheck className="w-4 h-4 text-rose-500" />,
    header: <PrivacyVisual />,
  },
  {
    title: "Real-time Reports",
    description: "Generate comprehensive diagnostic reports instantly.",
    icon: <Files className="w-4 h-4 text-amber-500" />,
    header: <ReportsVisual />,
  },
  {
    title: "Reward Tokens",
    description: "Earn MCI tokens for contributing anonymous data.",
    icon: <Coins className="w-4 h-4 text-yellow-500" />,
    header: <TokensVisual />,
  }
];

export default function AuthPage() {
  const { switchRole, signIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { connected, publicKey, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleDemoLogin = async (role: "patient" | "admin") => {
    try {
      setError(null);
      setIsSigningIn(true);
      await switchRole(role);
      router.push(role === "admin" ? "/admin/dashboard" : "/patient/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo sign-in failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleWalletSignIn = async () => {
    try {
      setError(null);
      setIsSigningIn(true);
      await signIn();
      router.push("/patient/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 w-full relative select-none overflow-x-hidden font-sans">
      <Header />
      <BackgroundBeams className="absolute inset-0 z-0 h-full fixed" />
      <header className="sr-only" aria-label="Page title">
        <h1>MediChainAI - Privacy-First Medical AI Platform</h1>
      </header>

      <main className="pt-16">
        <section id="hero" aria-labelledby="hero-heading" className="relative h-screen flex items-center justify-center overflow-hidden">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 z-10" fill="white" />
          <Spotlight className="-top-40 right-0 md:right-60 md:-top-20 z-10" fill="white" />

          <LampContainer className="z-10 w-full">
            <motion.h2
              id="hero-heading"
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              className="bg-gradient-to-br from-white to-slate-500 py-4 bg-clip-text text-center text-5xl md:text-8xl font-bold tracking-tighter text-transparent drop-shadow-2xl font-primary"
            >
              MediChainAI
            </motion.h2>
            <div className="mt-4 w-full flex justify-center">
              <TextGenerateEffect
                words="AI-Powered Medical Imaging on the Blockchain"
                className="text-white/70 font-medium tracking-widest text-lg md:text-xl uppercase antialiased"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-12 flex flex-col items-center gap-4 z-20"
            >
              <Link href="#auth">
                <MovingBorderButton
                  borderRadius="1.75rem"
                  className="bg-slate-900/50 backdrop-blur-xl text-white border-neutral-800 font-medium px-8 py-4"
                >
                  Start Diagnosis Now
                </MovingBorderButton>
              </Link>
            </motion.div>
          </LampContainer>
        </section>

        {/* AUTH CARD */}
        <section id="auth" aria-labelledby="auth-heading" className="py-24 relative z-20 px-4 w-full flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-[2.5rem] overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-10 shadow-3xl"
          >
            <GlowingEffect blur={10} spread={20} glow={true} className="z-0 opacity-50" />

            <div className="relative z-10 space-y-8">
              <div className="text-center space-y-2">
                <h2 id="auth-heading" className="text-3xl font-bold text-white">Get Started</h2>
                <p className="text-slate-400 text-sm">Secure access to your medical ecosystem</p>
              </div>

              {connected && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-500">Connected</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => disconnect()} className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors">
                    Disconnect
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {!connected ? (
                  <div className="flex justify-center w-full [&_.wallet-adapter-button]:w-full [&_.wallet-adapter-button]:justify-center [&_.wallet-adapter-button]:bg-white [&_.wallet-adapter-button]:text-slate-950 [&_.wallet-adapter-button]:font-bold [&_.wallet-adapter-button]:rounded-2xl [&_.wallet-adapter-button]:!h-16 [&_.wallet-adapter-button:hover]:bg-slate-200 [&_.wallet-adapter-button]:transition-all">
                    <WalletMultiButton />
                  </div>
                ) : (
                  <MovingBorderButton
                    borderRadius="1rem"
                    className="w-full bg-white text-slate-950 font-bold hover:bg-slate-200"
                    containerClassName="w-full h-16"
                    onClick={handleWalletSignIn}
                    disabled={isSigningIn || authLoading}
                  >
                    <div className="flex items-center justify-center gap-3">
                      {isSigningIn ? <Loader2 className="w-6 h-6 animate-spin text-slate-950" /> : <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>}
                      <span>{isSigningIn ? "Processing..." : "Continue to Dashboard"}</span>
                    </div>
                  </MovingBorderButton>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-400 uppercase tracking-[0.2em] font-semibold">Secure Demo Access</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDemoLogin("patient")}
                    className="group py-4 px-4 rounded-2xl bg-white/5 border border-white/5 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold">Patient Account</span>
                  </button>
                  <button
                    onClick={() => handleDemoLogin("admin")}
                    className="group py-4 px-4 rounded-2xl bg-white/5 border border-white/5 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-semibold">Admin Console</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>


        {/* BENTO GRID */}
        <section aria-labelledby="features-heading" className="max-w-7xl mx-auto px-4 py-20 relative z-20">
          <h2 id="features-heading" className="text-4xl font-bold text-center text-white mb-16">Platform Features</h2>
          <BentoGrid className="max-w-5xl mx-auto gap-6">
            {bentoItems.map((item, i) => (
              <BentoGridItem
                key={i}
                title={<span className="text-white text-lg font-bold">{item.title}</span>}
                description={<span className="text-slate-400 font-medium">{item.description}</span>}
                header={item.header}
                icon={item.icon}
                className={cn(
                  "bg-black/40 backdrop-blur-xl border-white/5 hover:border-emerald-500/20 transition-all duration-500 group/item",
                  i === 0 || i === 3 ? "md:col-span-2" : ""
                )}
              />
            ))}
          </BentoGrid>
        </section>
      </main>

      <footer className="py-12 px-6 text-center text-sm text-slate-500 relative z-20 border-t border-white/5 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white">MediChainAI</span>
          </div>
          <p>&copy; {new Date().getFullYear()} MediChainAI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
