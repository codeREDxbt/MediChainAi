"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";

// Types
export type UserRole = "patient" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  address: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo mode - when true, uses mock auth instead of real wallet
const DEMO_MODE = true;

// Mock users for demo
const MOCK_USERS: Record<UserRole, AuthUser> = {
  patient: {
    id: "usr_patient_1",
    name: "Dr. Silva",
    address: "0x71c...9A23",
    role: "patient",
  },
  admin: {
    id: "usr_admin_1",
    name: "Admin User",
    address: "0x82d...7B44",
    role: "admin",
  },
};

const AUTH_STORAGE_KEY = "medichain_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  // Fetch current user from server
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
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
    if (DEMO_MODE) {
      // Demo mode: load from localStorage
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role && MOCK_USERS[parsed.role as UserRole]) {
            setUser(MOCK_USERS[parsed.role as UserRole]);
          }
        }
      } catch {
        // Invalid stored data, ignore
      }
      setIsLoading(false);
    } else {
      // Real mode: fetch from server
      fetchUser();
    }
  }, [fetchUser]);

  // SIWE Sign-In flow
  const signIn = useCallback(async () => {
    if (DEMO_MODE) {
      // Demo mode: just log in as patient
      const mockUser = MOCK_USERS.patient;
      setUser(mockUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role: 'patient' }));
      return;
    }

    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);

      // 1. Get nonce from server
      const nonceResponse = await fetch('/api/auth/nonce', { method: 'POST' });
      const { nonce } = await nonceResponse.json();

      if (!nonce) {
        throw new Error('Failed to get nonce');
      }

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to MediChainAI',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });

      const messageString = message.prepareMessage();

      // 3. Request wallet signature
      const signature = await signMessageAsync({ message: messageString });

      // 4. Verify signature on server
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageString, signature }),
      });

      const verifyData = await verifyResponse.json();

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
  }, [address, chainId, signMessageAsync]);

  // Logout
  const logout = useCallback(async () => {
    if (DEMO_MODE) {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      disconnect();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [disconnect]);

  // Switch role (demo mode only)
  const switchRole = useCallback((role: UserRole) => {
    if (DEMO_MODE) {
      const mockUser = MOCK_USERS[role];
      setUser(mockUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role }));
    }
  }, []);

  const value: AuthContextType = {
    user,
    role: user?.role ?? null,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    logout,
    switchRole,
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
