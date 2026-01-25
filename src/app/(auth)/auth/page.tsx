"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (role: "patient" | "admin") => {
    login(role);
    router.push(role === "admin" ? "/admin/dashboard" : "/patient/dashboard");
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

        {/* Login Options */}
        <div className="space-y-4">
          <button
            onClick={() => handleLogin("patient")}
            className="group w-full py-5 px-6 rounded-2xl bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" />
              </svg>
              <span className="text-lg">Connect Wallet (Patient)</span>
            </div>
          </button>

          <button
            onClick={() => handleLogin("admin")}
            className="group w-full py-5 px-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 text-foreground font-medium hover:bg-muted/50 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>System Admin Login</span>
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
            Powered by Polygon POS • MediTokens (MC-AI)
          </p>
        </div>
      </div>
    </div>
  );
}
