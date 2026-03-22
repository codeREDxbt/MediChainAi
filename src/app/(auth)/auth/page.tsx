"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { LampContainer } from "@/components/ui/lamp";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { Header } from "@/components/landing/header";
import {
  EvervaultCardWrapper,
  Icon,
} from "@/components/ui/evervault-card";
import {
  ScanVisual,
  BlockchainVisual,
  LearningVisual,
  PrivacyVisual,
  ReportsVisual,
  TokensVisual,
} from "@/components/landing/bento-visuals";
import {
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Scan,
  Link as LinkIcon,
  Network,
  ShieldCheck,
  Files,
  Coins,
} from "lucide-react";

const bentoItems = [
  {
    title: "AI Scan Analysis",
    description: "Instant anomaly detection with 99.2% accuracy.",
    icon: <Scan className="w-4 h-4 text-[#5E6AD2]" />,
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
    icon: <ShieldCheck className="w-4 h-4 text-[#5E6AD2]" />,
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
  },
];

export default function AuthPage() {
  const { switchRole, signIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { connected, publicKey, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  const handleDemoLogin = async (role: "patient" | "admin") => {
    try {
      setError(null);
      setIsSigningIn(true);
      await switchRole(role);
      router.push(
        role === "admin" ? "/admin/dashboard" : "/patient/dashboard"
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Demo sign-in failed"
      );
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
    <div className="min-h-screen bg-[#050506] w-full relative select-none overflow-x-hidden font-sans">
      <Header />
      <BackgroundBeams className="absolute inset-0 z-0 h-full fixed" />

      <header className="sr-only" aria-label="Page title">
        <h1>MediChainAI - Privacy-First Medical AI Platform</h1>
      </header>

      <main className="pt-16">
        {/* HERO SECTION - With Parallax */}
        <motion.section
          ref={heroRef}
          id="hero"
          aria-labelledby="hero-heading"
          className="relative h-screen flex items-center justify-center overflow-hidden"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          {/* Cyan-aqua gradient - PRESERVED */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[6]"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 50% 100%, rgba(6,182,212,0.45) 0%, rgba(6,182,212,0.18) 35%, transparent 70%),
                radial-gradient(ellipse 60% 40% at 20% 100%, rgba(8,145,178,0.35) 0%, transparent 65%),
                radial-gradient(ellipse 60% 40% at 80% 100%, rgba(8,145,178,0.35) 0%, transparent 65%),
                radial-gradient(ellipse 100% 60% at 50% 110%, rgba(34,211,238,0.2) 0%, transparent 60%)
              `,
}}
        />

        {/* Lamp - PRESERVED */}
          <LampContainer className="z-10 w-full">
            <motion.h2
              id="hero-heading"
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="bg-gradient-to-br from-white to-slate-500 py-4 bg-clip-text text-center text-5xl md:text-8xl font-bold tracking-tighter text-transparent drop-shadow-2xl font-primary"
            >
              MediChainAI
            </motion.h2>

<div className="mt-4 w-full flex justify-center">
						<div className="font-[family-name:var(--font-inter)] font-semibold">
							<TextGenerateEffect
								words="AI-Powered Medical Imaging on the Blockchain"
								className="text-white/70 tracking-widest text-lg md:text-xl uppercase antialiased"
							/>
						</div>
					</div>

            {/* START DIAGNOSIS BUTTON - PRESERVED EXACTLY */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-12 flex flex-col items-center gap-4 z-20"
            >
              <Link href="#auth">
                <button className="relative inline-flex h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-10 py-1 text-base font-semibold text-white backdrop-blur-3xl">
                    Start Diagnosis Now
                  </span>
                </button>
              </Link>
            </motion.div>
          </LampContainer>

          {/* Bottom fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 z-30"
            style={{
              background: "linear-gradient(to bottom, transparent 0%, rgb(2 6 23) 100%)",
            }}
          />
        </motion.section>

        {/* AUTH CARD SECTION */}
        <section
          id="auth"
          aria-labelledby="auth-heading"
          className="py-24 relative z-20 px-4 w-full flex flex-col items-center justify-center"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

<motion.div
					initial={{ opacity: 0, y: 40 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: false, amount: 0.2, margin: "0px 0px -100px 0px" }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
					className="relative w-full max-w-md"
				>
            <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white/60 z-20" />
            <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white/60 z-20" />
            <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white/60 z-20" />
            <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white/60 z-20" />

            <EvervaultCardWrapper>
<div className="relative z-10 space-y-8 p-10">
              <div className="w-full flex flex-col items-center justify-center">
                <div className="text-center space-y-2 bg-black/50 backdrop-blur-md rounded-2xl py-3 px-6">
                  <motion.h2
                    id="auth-heading"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="text-3xl font-bold text-[#EDEDEF]"
                  >
                    GET STARTED
                  </motion.h2>
                  <p className="text-[#8A8F98] text-sm">
                    Secure access to your medical ecosystem
                  </p>
</div>
              </div>

              {connected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#12121a] border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-500 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                          Connected
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {publicKey?.toBase58().slice(0, 6)}...
                          {publicKey?.toBase58().slice(-4)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors"
                    >
                      Disconnect
                    </button>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#12121a] border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
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
                        {isSigningIn ? (
                          <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                        )}
                        <span>
                          {isSigningIn
                            ? "Processing..."
                            : "Continue to Dashboard"}
                        </span>
                      </div>
                    </MovingBorderButton>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/[0.1]" />
                    <span className="text-xs text-[#8A8F98] uppercase tracking-[0.2em] font-semibold bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
                      Secure Demo Access
                    </span>
                    <div className="flex-1 h-px bg-white/[0.1]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDemoLogin("patient")}
                      className="group py-4 px-4 rounded-2xl bg-[#12121a] border border-white/[0.1] text-[#EDEDEF] font-medium hover:bg-[#1a1a24] hover:border-[#5E6AD2]/30 transition-all duration-200 flex flex-col items-center gap-2 shadow-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#5E6AD2]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <svg
                          className="w-5 h-5 text-[#5E6AD2]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold">
                        Patient Account
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDemoLogin("admin")}
                      className="group py-4 px-4 rounded-2xl bg-[#12121a] border border-white/[0.1] text-[#EDEDEF] font-medium hover:bg-[#1a1a24] hover:border-amber-500/30 transition-all duration-200 flex flex-col items-center gap-2 shadow-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Shield className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-xs font-semibold">
                        Admin Console
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </EvervaultCardWrapper>
          </motion.div>
        </section>

        {/* BENTO GRID SECTION */}
        <section
          aria-labelledby="features-heading"
          className="max-w-7xl mx-auto px-4 py-20 relative z-20"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <motion.h2
            id="features-heading"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-4xl font-bold text-center text-[#EDEDEF] mb-16"
          >
            Platform Features
          </motion.h2>

          <BentoGrid className="max-w-5xl mx-auto gap-6">
            {bentoItems.map((item, i) => (
              <BentoGridItem
                key={i}
                title={
                  <span className="text-[#EDEDEF] text-lg font-bold">
                    {item.title}
                  </span>
                }
                description={
                  <span className="text-[#8A8F98] font-medium">
                    {item.description}
                  </span>
                }
                header={item.header}
                icon={item.icon}
                index={i}
                className={cn(
                  "bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl border-white/[0.06] hover:border-[#5E6AD2]/30 transition-all duration-300 group/item",
                  i === 0 || i === 3 ? "md:col-span-2" : ""
                )}
              />
            ))}
          </BentoGrid>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-12 px-6 text-center text-sm text-[#8A8F98] relative z-20 border-t border-white/[0.06] bg-[#050506]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#5E6AD2]" />
            <span className="font-bold text-[#EDEDEF]">MediChainAI</span>
          </div>
          <p>&copy; {new Date().getFullYear()} MediChainAI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="hover:text-[#EDEDEF] transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="hover:text-[#EDEDEF] transition-colors duration-200"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
