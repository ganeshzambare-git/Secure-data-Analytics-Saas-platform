"use client";

import React, { useState } from "react";
import { useSecureData } from "@/context/SecureDataContext";
import { useRouter } from "next/navigation";

export default function AuthGateway() {
  const { resolveTenant, login, auth } = useSecureData();
  const [step, setStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [resolvedCompanyName, setResolvedCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "analyst">("analyst");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle step 1: tenant resolve
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await resolveTenant(companyName);
      if (res.exists && res.tenantId && res.companyName) {
        setTenantId(res.tenantId);
        setResolvedCompanyName(res.companyName);
        setStep(2);
      } else {
        setError("Organization not found or inactive.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to query organization database.");
    } finally {
      setLoading(false);
    }
  };

  // Handle step 2: authenticate credentials
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError("");
    setLoading(true);
    try {
      const success = await login(tenantId, username, password, role);
      if (success) {
        if (role === "admin") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/analyst");
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid authentication credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      backgroundImage: "radial-gradient(circle at center, #0B1F14 0%, #040D08 80%)"
    }}>
      <div className="terminal-panel" style={{ width: "100%", maxWidth: "420px" }}>
        
        {/* Shield Icon and Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "50px",
            height: "50px",
            borderRadius: "4px",
            border: "1px solid var(--accent-neon)",
            backgroundColor: "rgba(0, 230, 118, 0.05)",
            color: "var(--accent-neon)",
            fontSize: "24px",
            marginBottom: "12px",
            boxShadow: "var(--shadow-neon)"
          }}>
            🛡️
          </div>
          <h1 style={{
            fontSize: "20px",
            fontWeight: "700",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--text-primary)"
          }}>
            ReadyNest Analytics
          </h1>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--accent-teal)",
            marginTop: "4px"
          }}>
            [SECURE SHIELDED PIPELINE]
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "rgba(229, 62, 62, 0.08)",
            border: "1px solid #e53e3e",
            borderRadius: "4px",
            padding: "12px",
            fontSize: "13px",
            color: "#fc8181",
            fontFamily: "var(--font-mono)",
            marginBottom: "20px"
          }}>
            ❌ {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleResolve} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-primary)",
                textTransform: "uppercase"
              }}>
                1. Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
                className="glow-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-button"
              style={{ marginTop: "10px", width: "100%" }}
            >
              {loading ? "Resolving..." : "Verify Tenant Identity"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              backgroundColor: "rgba(49, 151, 149, 0.08)",
              border: "1px solid var(--accent-teal)",
              borderRadius: "4px",
              marginBottom: "4px"
            }}>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-teal)" }}>
                Active Tenant:
              </span>
              <span className="badge badge-info" style={{ fontSize: "11px" }}>
                {resolvedCompanyName}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-primary)",
                textTransform: "uppercase"
              }}>
                2. Target Security Role
              </label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                disabled={loading}
                className="glow-input"
                style={{ cursor: "pointer" }}
              >
                <option value="analyst">Data Analyst</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-primary)",
                textTransform: "uppercase"
              }}>
                3. Username
              </label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="glow-input"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-primary)",
                textTransform: "uppercase"
              }}>
                4. Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="glow-input"
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="secondary-button"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="glow-button"
                style={{ flex: 2 }}
              >
                {loading ? "Authorizing..." : "Authenticate"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
