"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// Types
export type UserRole = "patient" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: Record<UserRole, AuthUser> = {
  patient: {
    id: "usr_patient_1",
    name: "Dr. Silva",
    email: "dr.silva@hospital.com",
    role: "patient",
    walletAddress: "0x71c...9A23",
  },
  admin: {
    id: "usr_admin_1",
    name: "Admin User",
    email: "admin@medichai.ai",
    role: "admin",
    walletAddress: "0x82d...7B44",
  },
};

const AUTH_STORAGE_KEY = "medichain_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
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
  }, []);

  const login = useCallback((role: UserRole) => {
    const mockUser = MOCK_USERS[role];
    setUser(mockUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role }));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    login(role);
  }, [login]);

  const value: AuthContextType = {
    user,
    role: user?.role ?? null,
    isLoading,
    isAuthenticated: !!user,
    login,
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
