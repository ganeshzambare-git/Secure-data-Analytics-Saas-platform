"use client";

/**
 * AuthContext.tsx — Volatile Authentication State Context
 * ReadyNest Analytics Engine — Phase 3
 *
 * Manages authentication session state in volatile React state.
 * Token is persisted in sessionStorage (tab-isolated, never localStorage)
 * to survive hard page reloads within a single tab.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────

export interface AuthState {
  token: string | null;
  role: "admin" | "analyst" | null;
  username: string | null;
  tenantId: string | null;
  companyName: string | null;
}

interface AuthContextType {
  auth: AuthState;
  loading: boolean;
  setAuth: (state: AuthState) => void;
  logout: () => void;
}

const EMPTY_AUTH: AuthState = {
  token: null,
  role: null,
  username: null,
  tenantId: null,
  companyName: null,
};

const SESSION_KEY = "readynest_session";

// ── Context ───────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [auth, setAuthState] = useState<AuthState>(EMPTY_AUTH);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Hydrate auth from sessionStorage on mount (tab-isolated persistence)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setAuthState(JSON.parse(stored));
      }
    } catch {
      // Corrupted storage — start fresh
    }
    setLoading(false);
  }, []);

  const setAuth = useCallback((state: AuthState) => {
    setAuthState(state);
    if (state.token) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState(EMPTY_AUTH);
    sessionStorage.removeItem(SESSION_KEY);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ auth, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
};
