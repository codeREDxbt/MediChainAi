"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

// Types
export type UserRole = "patient" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  address: string;
  role: UserRole;
}

export interface PatientTokenBalance {
  amount: number;
  uiAmount: number;
  decimals: number;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tokenBalance: PatientTokenBalance | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Optional: Provide a default mint address if env is missing, for dev purposes
const MCI_TOKEN_MINT = process.env.NEXT_PUBLIC_MCI_TOKEN_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // Defaulting to USDC mainnet format, but will be overriden by devnet

async function fetchJsonWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    const data = await response.json();
    return { response, data };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please make sure local services are running.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState<PatientTokenBalance | null>(null);

  const { publicKey, signMessage, disconnect } = useWallet();
  const { connection } = useConnection();

  // Fetch SPL Token Balance
  const fetchTokenBalance = useCallback(async () => {
    if (!publicKey) return;

    try {
      // Import dynamically to avoid SSR issues if any
      const { getAssociatedTokenAddress, getAccount } = await import("@solana/spl-token");
      const { PublicKey } = await import("@solana/web3.js");

      const mintPubkey = new PublicKey(MCI_TOKEN_MINT);
      const ata = await getAssociatedTokenAddress(mintPubkey, publicKey);

      try {
        const account = await getAccount(connection, ata);
        setTokenBalance({
          amount: Number(account.amount),
          uiAmount: Number(account.amount) / Math.pow(10, 9), // Assuming 9 decimals, standard
          decimals: 9
        });
      } catch (e) {
        // Account might not exist yet if they have 0 tokens
        setTokenBalance({ amount: 0, uiAmount: 0, decimals: 9 });
      }
    } catch (e) {
      console.error("Failed to fetch token balance", e);
      setTokenBalance(null);
    }
  }, [publicKey, connection]);

  // Fetch current user from server
  const fetchUser = useCallback(async () => {
    try {
      const { data } = await fetchJsonWithTimeout('/api/auth/me');

      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load auth state on mount
  useEffect(() => {
    // Real mode: fetch from server (works for both wallet login & demo token)
    fetchUser();
  }, [fetchUser]);

  // Update token balance when public key changes
  useEffect(() => {
    if (publicKey) {
      fetchTokenBalance();
    } else {
      setTokenBalance(null);
    }
  }, [publicKey, fetchTokenBalance]);

  // Sign-In flow
  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected or does not support signing');
    }

    try {
      setIsLoading(true);

      // 1. Get nonce from server
      const { response: nonceResponse, data: nonceData } = await fetchJsonWithTimeout('/api/auth/nonce', { method: 'POST' });
      if (!nonceResponse.ok) throw new Error('Failed to get nonce');
      const { nonce } = nonceData;

      if (!nonce) {
        throw new Error('Failed to get nonce');
      }

      // 2. Create message to sign
      const messageString = `Sign in to MediChainAI\nNonce: ${nonce}`;
      const message = new TextEncoder().encode(messageString);

      // 3. Request wallet signature
      const signatureBytes = await signMessage(message);
      const signature = bs58.encode(signatureBytes);

      // 4. Verify signature on server
      const { response: verifyResponse, data: verifyData } = await fetchJsonWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageString,
          signature,
          publicKey: publicKey.toBase58()
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Verification failed');
      }

      // 5. Set user state
      setUser(verifyData.user);
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      if (disconnect) {
        await disconnect();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [disconnect]);

  // Switch role (Demo login using real JWT API)
  const switchRole = useCallback(async (role: UserRole) => {
    try {
      setIsLoading(true);
      const { response: res, data } = await fetchJsonWithTimeout('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      setUser(data.user);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    role: user?.role ?? null,
    isLoading,
    isAuthenticated: !!user,
    tokenBalance,
    signIn,
    logout,
    switchRole,
    refreshBalance: fetchTokenBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const auth = useAuth();

  const hasAccess =
    auth.isAuthenticated &&
    (!allowedRoles || (auth.role && allowedRoles.includes(auth.role)));

  return {
    ...auth,
    hasAccess,
  };
}
