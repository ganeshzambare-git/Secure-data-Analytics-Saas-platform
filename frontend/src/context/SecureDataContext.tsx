"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthState {
  token: string | null;
  role: "admin" | "analyst" | null;
  username: string | null;
  tenantId: string | null;
  companyName: string | null;
}

interface SecureDataContextType {
  auth: AuthState;
  loading: boolean;
  resolveTenant: (companyName: string) => Promise<{ exists: boolean; tenantId?: string; companyName?: string }>;
  login: (tenantId: string, username: string, password: string, role: "admin" | "analyst") => Promise<boolean>;
  logout: () => void;
  secureRequest: <T>(url: string, options?: RequestInit) => Promise<T>;
}

const SecureDataContext = createContext<SecureDataContextType | undefined>(undefined);

const AES_KEY_STRING = process.env.NEXT_PUBLIC_AES_SECRET_KEY || "y3K9xP2wL4mN7qR1sT8uV5wX0zA3bC6d";

export const SecureDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    role: null,
    username: null,
    tenantId: null,
    companyName: null,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load auth state from sessionStorage (tab-isolated context protection)
  useEffect(() => {
    const stored = sessionStorage.getItem("readynest_session");
    if (stored) {
      try {
        setAuth(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored session", e);
      }
    }
    setLoading(false);
  }, []);

  // Web Crypto helper to decrypt AES-256-GCM data stream in-memory
  const decryptPayload = async (base64Ciphertext: string): Promise<string> => {
    try {
      // Decode base64 to Uint8Array
      const binaryString = window.atob(base64Ciphertext);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Extract IV (12 bytes) and data payload
      const iv = bytes.slice(0, 12);
      const data = bytes.slice(12);

      // Prepare Key
      const keyEncoder = new TextEncoder();
      let keyBytes = keyEncoder.encode(AES_KEY_STRING);
      
      // Ensure key length is exactly 32 bytes
      if (keyBytes.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(keyBytes);
        keyBytes = padded;
      } else if (keyBytes.length > 32) {
        keyBytes = keyBytes.slice(0, 32);
      }

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // Decrypt
      const decryptedBuf = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        cryptoKey,
        data
      );

      return new TextDecoder().decode(decryptedBuf);
    } catch (err) {
      console.error("Web Crypto Decryption Failed:", err);
      throw new Error("Client network stream verification failure.");
    }
  };

  // Secure API requests that intercept ciphertext responses
  const secureRequest = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const targetUrl = url.startsWith("http") ? url : `${apiUrl}${url}`;

    // Add Authorization Headers
    const headers = new Headers(options.headers || {});
    if (auth.token) {
      headers.set("Authorization", `Bearer ${auth.token}`);
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const updatedOptions = {
      ...options,
      headers,
    };

    const response = await fetch(targetUrl, updatedOptions);

    if (response.status === 401 && url !== "/api/v1/auth/token") {
      logout();
      throw new Error("Session expired. Re-authentication required.");
    }

    const json = await response.json();

    if (!response.ok) {
      // If error payload is encrypted, decrypt it
      if (json && json.ciphertext) {
        const decryptedText = await decryptPayload(json.ciphertext);
        const parsedErr = JSON.parse(decryptedText);
        throw new Error(parsedErr.detail || "System request failure.");
      }
      throw new Error(json.detail || "Network connection failure.");
    }

    if (!json || !json.ciphertext) {
      throw new Error("Zero-Trust integrity check failed: missing network response shielding.");
    }

    // Decrypt in-memory
    const decryptedText = await decryptPayload(json.ciphertext);
    return JSON.parse(decryptedText) as T;
  };

  const resolveTenant = async (companyName: string) => {
    const res = await secureRequest<{ exists: boolean; tenant_id?: string; company_name?: string }>(
      "/api/v1/auth/tenant-resolve",
      {
        method: "POST",
        body: JSON.stringify({ company_name: companyName }),
      }
    );
    return {
      exists: res.exists,
      tenantId: res.tenant_id,
      companyName: res.company_name,
    };
  };

  const login = async (tenantId: string, username: string, password: string, role: "admin" | "analyst") => {
    try {
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

      // Get corporate detail from session state
      const targetSession: AuthState = {
        token: res.access_token,
        role: res.role,
        username: res.username,
        tenantId: res.tenant_id,
        companyName: auth.companyName || "Organization",
      };

      setAuth(targetSession);
      sessionStorage.setItem("readynest_session", JSON.stringify(targetSession));
      return true;
    } catch (e) {
      console.error("Login attempt failure:", e);
      throw e;
    }
  };

  const logout = () => {
    setAuth({
      token: null,
      role: null,
      username: null,
      tenantId: null,
      companyName: null,
    });
    sessionStorage.removeItem("readynest_session");
    router.push("/");
  };

  return (
    <SecureDataContext.Provider value={{ auth, loading, resolveTenant, login, logout, secureRequest }}>
      {children}
    </SecureDataContext.Provider>
  );
};

export const useSecureData = () => {
  const context = useContext(SecureDataContext);
  if (!context) {
    throw new Error("useSecureData must be executed inside a SecureDataProvider context wrapper.");
  }
  return context;
};
