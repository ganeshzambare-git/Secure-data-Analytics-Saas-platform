"use client";

/**
 * SecureDataContext.tsx — Unified Secure Data Provider
 * ReadyNest Analytics Engine — Phase 3
 *
 * Orchestrates:
 *  - Auth state (via AuthContext)
 *  - AES-256-GCM decryption (via DecryptionContext)
 *  - Secure API request wrapper that transparently decrypts {"payload":"<hex>"}
 *  - Tenant resolution & login flows
 */

import React, { createContext, useContext, useCallback } from "react";
import { useAuth, AuthState } from "./AuthContext";
import { useDecryption } from "./DecryptionContext";

// ── Types ─────────────────────────────────────────────────────────────

interface SecureDataContextType {
  auth: AuthState;
  loading: boolean;
  resolveTenant: (orgName: string) => Promise<{
    resolved: boolean;
    tenantId?: string;
    companyName?: string;
  }>;
  login: (
    tenantId: string,
    username: string,
    password: string,
    role: "admin" | "analyst"
  ) => Promise<boolean>;
  logout: () => void;
  secureRequest: <T>(url: string, options?: RequestInit) => Promise<T>;
}

const SecureDataContext = createContext<SecureDataContextType | undefined>(
  undefined
);

// ── Provider ──────────────────────────────────────────────────────────

export const SecureDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { auth, loading, setAuth, logout } = useAuth();
  const { decryptPayload } = useDecryption();

  // ── Secure API request wrapper ─────────────────────────────────────

  const secureRequest = useCallback(
    async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const targetUrl = url.startsWith("http") ? url : `${apiUrl}${url}`;

      // Attach auth headers
      const headers = new Headers(options.headers || {});
      if (auth.token) {
        headers.set("Authorization", `Bearer ${auth.token}`);
      }
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(targetUrl, { ...options, headers });

      // Auto-logout on 401 (except during login itself)
      if (response.status === 401 && url !== "/api/v1/auth/token") {
        logout();
        throw new Error("Session expired. Re-authentication required.");
      }

      const json = await response.json();

      if (!response.ok) {
        // Error payload may also be encrypted
        if (json?.payload) {
          const decrypted = (await decryptPayload(json.payload)) as Record<string, unknown>;
          throw new Error(
            (decrypted.detail as string) || "System request failure."
          );
        }
        throw new Error(json.detail || "Network connection failure.");
      }

      // Expect ALL /api/v1/* responses to arrive as {"payload": "<hex>"}
      if (!json?.payload) {
        throw new Error(
          "Zero-Trust integrity check failed: missing network response shielding."
        );
      }

      return (await decryptPayload(json.payload)) as T;
    },
    [auth.token, decryptPayload, logout]
  );

  // ── Tenant resolution ──────────────────────────────────────────────

  const resolveTenant = useCallback(
    async (orgName: string) => {
      const res = await secureRequest<{
        resolved: boolean;
        tenant_id?: string;
        company_name?: string;
      }>("/api/v1/auth/tenant-resolve", {
        method: "POST",
        body: JSON.stringify({ organization_name: orgName }),
      });
      return {
        resolved: res.resolved,
        tenantId: res.tenant_id,
        companyName: res.company_name,
      };
    },
    [secureRequest]
  );

  // ── Login ──────────────────────────────────────────────────────────

  const login = useCallback(
    async (
      tenantId: string,
      username: string,
      password: string,
      role: "admin" | "analyst"
    ) => {
      const res = await secureRequest<{
        access_token: string;
        token_type: string;
        role: "admin" | "analyst";
        username: string;
        tenant_id: string;
      }>("/api/v1/auth/token", {
        method: "POST",
        body: JSON.stringify({ tenant_id: tenantId, username, password, role }),
      });

      const session: AuthState = {
        token: res.access_token,
        role: res.role,
        username: res.username,
        tenantId: res.tenant_id,
        companyName: auth.companyName || "Organization",
      };

      setAuth(session);
      return true;
    },
    [auth.companyName, secureRequest, setAuth]
  );

  return (
    <SecureDataContext.Provider
      value={{ auth, loading, resolveTenant, login, logout, secureRequest }}
    >
      {children}
    </SecureDataContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────

export const useSecureData = (): SecureDataContextType => {
  const ctx = useContext(SecureDataContext);
  if (!ctx) {
    throw new Error(
      "useSecureData must be used within a SecureDataProvider context wrapper."
    );
  }
  return ctx;
};
