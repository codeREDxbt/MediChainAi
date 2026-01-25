"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const { switchRole, signIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Demo mode handlers (using mock auth)
  const handleDemoLogin = (role: "patient" | "admin") => {
    switchRole(role);
    router.push(role === "admin" ? "/admin/dashboard" : "/patient/dashboard");
  };

  // Real wallet sign-in
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[128px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/10">
            <svg
              className="w-10 h-10 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <circle cx="12" cy="4" r="2" fill="currentColor" />
              <circle cx="12" cy="20" r="2" fill="currentColor" />
              <circle cx="4" cy="12" r="2" fill="currentColor" />
              <circle cx="20" cy="12" r="2" fill="currentColor" />
              <path
                d="M12 7v10M7 12h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">MediChainAI</h1>
          <p className="text-muted-foreground mt-2">
            Secure, Private, Federated Medical Intelligence
          </p>
        </div>

        {/* Wallet Connection Status */}
        {isConnected && (
          <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Wallet Connected</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Login Options */}
        <div className="space-y-4">
          {/* Wallet Connect Section */}
          {!isConnected ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center uppercase tracking-wider">
                Connect with Wallet
              </p>
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  className="group w-full py-4 px-6 rounded-xl bg-card/50 backdrop-blur border border-border/50 text-foreground font-medium hover:bg-muted/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-3">
                    {isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                    <span>{connector.name}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={handleWalletSignIn}
              disabled={isSigningIn || authLoading}
              className="group w-full py-5 px-6 rounded-2xl bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {isSigningIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                <span className="text-lg">
                  {isSigningIn ? "Signing Message..." : "Sign In with Wallet"}
                </span>
              </div>
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground uppercase">or demo mode</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Demo Mode Buttons */}
          <button
            onClick={() => handleDemoLogin("patient")}
            className="group w-full py-4 px-6 rounded-xl bg-card/50 backdrop-blur border border-border/50 text-foreground font-medium hover:bg-muted/50 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Demo: Sign in as Patient</span>
            </div>
          </button>

          <button
            onClick={() => handleDemoLogin("admin")}
            className="group w-full py-4 px-6 rounded-xl bg-card/50 backdrop-blur border border-border/50 text-foreground font-medium hover:bg-muted/50 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span>Demo: Sign in as Admin</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60">
            Powered by Base Sepolia • SIWE Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
