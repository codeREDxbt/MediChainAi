"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // For demo, auto-login as patient
      // In production, redirect to login page
      return;
    }

    // Redirect to appropriate dashboard based on role
    if (role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/patient/dashboard");
    }
  }, [role, isLoading, isAuthenticated, router]);

  // Show login options when not authenticated
  if (!isLoading && !isAuthenticated) {
    return <LoginScreen />;
  }

  // Loading state
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

// Simple login screen for demo
function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (role: "patient" | "admin") => {
    login(role);
    router.push(role === "admin" ? "/admin/dashboard" : "/patient/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
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
          <h1 className="text-2xl font-bold text-foreground">MediChainAI</h1>
          <p className="text-muted-foreground mt-2">
            Privacy-First Medical AI Platform
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          <button
            onClick={() => handleLogin("patient")}
            className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Continue as Patient
            </div>
            <p className="text-xs text-white/70 mt-1">Dr. Silva - Radiologist</p>
          </button>

          <button
            onClick={() => handleLogin("admin")}
            className="w-full py-4 px-6 rounded-2xl bg-card border border-border text-foreground font-medium hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Continue as Admin
            </div>
            <p className="text-xs text-muted-foreground mt-1">System Administrator</p>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Demo mode - Select a role to continue
        </p>
      </div>
    </div>
  );
}
