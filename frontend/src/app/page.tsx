"use client";

/**
 * page.tsx — Multi-Tier Authentication Gateway (Enhanced Density)
 * ReadyNest Analytics Engine — Phase 5 UI Enrichment
 *
 * Implements a responsive dual-column layout on Desktop (single-column on Mobile/Tablet):
 *  - Left Column: Onboarding & Sandbox Info Panel (Screen 1)
 *    * Step Progress indicators (Resolve -> Credentials -> Encrypted Tunnel)
 *    * Feature Cards (Network Payload Shielding, Multi-tenant RLS, Celery ML Engine)
 *    * Partner Badges (Neon.tech, SQLAlchemy, FastAPI, Redis, XGBoost)
 *    * AI Welcome Panel [READYNEST_AI]
 *  - Right Column: Login Portal & Security Metrics (Screen 2)
 *    * Main Auth Form Card
 *    * Security Tips Card
 *    * Password Requirements Alert
 *    * Account Benefits Badge
 *    * Biometrics & SSO Integration Status
 */

import React, { useState, useEffect, useCallback } from "react";
import { useSecureData } from "@/context/SecureDataContext";
import { useRouter } from "next/navigation";
import { GlowInput } from "@/components/GlowInput";
import SystemAdminDeck from "./dashboard/admin/page";
import AnalystLandingCanvas from "./dashboard/analyst/page";
import DashboardLayout from "./dashboard/layout";

export default function AuthGateway() {
  const { auth, loading: secureLoading, resolveTenant, login } = useSecureData();
  const router = useRouter();

  // ── Local state ─────────────────────────────────────────────────────

  const [step, setStep] = useState<1 | 2>(1);
  const [orgName, setOrgName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "analyst">("analyst");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState("");

  // ── Snackbar auto-dismiss ──────────────────────────────────────────

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => setSnackbar(""), 4000);
    return () => clearTimeout(timer);
  }, [snackbar]);

  // ── Shake trigger ──────────────────────────────────────────────────

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  }, []);

  // ── Step 1: Tenant resolve ─────────────────────────────────────────

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orgName.trim().length < 3) return;
    setError("");
    setLoading(true);

    try {
      const res = await resolveTenant(orgName);
      if (res.resolved && res.tenantId && res.companyName) {
        setTenantId(res.tenantId);
        setResolvedName(res.companyName);
        setStep(2);
      } else {
        setError("Organization not found or inactive.");
        setSnackbar("Organization not found or inactive.");
        triggerShake();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to query organization database.";
      setError(msg);
      setSnackbar(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Login ──────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError("");
    setLoading(true);

    try {
      const success = await login(tenantId, username, password, role);
      if (success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 1600);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials for selected role.";
      setError(msg);
      setSnackbar(msg);
      setPassword(""); // Purge password
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  if (secureLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--bg-base)",
        color: "var(--accent-neon)",
        fontFamily: "var(--font-mono)",
        fontSize: "14px"
      }}>
        [ESTABLISHING ENCRYPTED SESSION CANALS...]
      </div>
    );
  }

  if (auth.token && !showSuccess) {
    return (
      <DashboardLayout>
        {auth.role === "admin" ? (
          <SystemAdminDeck />
        ) : (
          <AnalystLandingCanvas />
        )}
      </DashboardLayout>
    );
  }

  const canContinue = orgName.trim().length >= 3;

  return (
    <>
      {/* Success overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="checkmark">✓</div>
          <div className="label">Authentication Verified</div>
        </div>
      )}

      {/* Snackbar */}
      <div className={`snackbar ${snackbar ? "visible" : ""}`}>
        ⚠ {snackbar}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "40px 20px",
          backgroundImage:
            "radial-gradient(circle at center, #0B1F14 0%, #040D08 80%)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            alignItems: "stretch",
          }}
          className="auth-grid-responsive"
        >
          {/* ════════════════════════════════════════════════════════════════
             Left Column: Screen 1 Onboarding & Benefits Panel
             ════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              justifyContent: "space-between",
            }}
          >
            {/* Title & Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "28px" }}>🛡️</span>
                <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-primary)", textTransform: "uppercase" }}>
                  ReadyNest Core
                </h1>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
                Welcome to the SecureData Pipeline SaaS dashboard workspace environment. Initialize session parameters and verify role-based security tokens to access sandbox resources.
              </p>
            </div>

            {/* Step Progress Indicators */}
            <div className="terminal-panel" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px" }}>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                AUTHENTICATION PROGRESS FLOW
              </span>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "var(--accent-neon)",
                    color: "var(--bg-base)",
                    fontWeight: 700
                  }}>1</span>
                  <span style={{ fontSize: "11px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>Tenant</span>
                </div>
                <div style={{ width: "20px", height: "1px", backgroundColor: step === 2 ? "var(--accent-neon)" : "var(--border-green)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    backgroundColor: step === 2 ? "var(--accent-neon)" : "var(--border-green)",
                    color: step === 2 ? "var(--bg-base)" : "var(--text-muted)",
                    fontWeight: 700
                  }}>2</span>
                  <span style={{ fontSize: "11px", color: step === 2 ? "var(--text-primary)" : "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Identity</span>
                </div>
                <div style={{ width: "20px", height: "1px", backgroundColor: showSuccess ? "var(--accent-neon)" : "var(--border-green)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    backgroundColor: showSuccess ? "var(--accent-neon)" : "var(--border-green)",
                    color: showSuccess ? "var(--bg-base)" : "var(--text-muted)",
                    fontWeight: 700
                  }}>3</span>
                  <span style={{ fontSize: "11px", color: showSuccess ? "var(--text-primary)" : "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Shield</span>
                </div>
              </div>
            </div>

            {/* Feature Cards (Screen 1 Density) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
              <div className="terminal-panel" style={{ padding: "14px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "20px" }}>🔒</span>
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-primary)" }}>
                    Zero-Trust Network Shielding
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                    All backend API response payloads are fully encrypted via AES-256-GCM. Unencrypted data never touches the wire.
                  </p>
                </div>
              </div>

              <div className="terminal-panel" style={{ padding: "14px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "20px" }}>🏢</span>
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-primary)" }}>
                    Granular Multi-Tenant Isolation
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                    PostgreSQL 16 Row-Level Security (RLS) policies enforce strict database data boundaries at the connection transaction layer.
                  </p>
                </div>
              </div>

              <div className="terminal-panel" style={{ padding: "14px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "20px" }}>🧠</span>
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-primary)" }}>
                    Distributed Processing & ML
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                    Asynchronous scraping engines and model training workflows powered by Celery queues and Redis brokers.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Welcome Panel */}
            <div className="terminal-panel" style={{ padding: "14px", backgroundColor: "#020805", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-neon)" }}></span>
                <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent-neon)" }}>[READYNEST_AI_AGENT]</span>
              </div>
              <code style={{ fontSize: "11px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                &gt; Sandbox parameters loaded. Awaiting workspace validation query...
              </code>
            </div>

            {/* Partner Logos / Trust Badges */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginRight: "4px" }}>PARTNERS:</span>
              <span className="badge badge-info" style={{ fontSize: "9px" }}>NEON_SERVERLESS</span>
              <span className="badge badge-info" style={{ fontSize: "9px" }}>SQLALCHEMY_2.0</span>
              <span className="badge badge-info" style={{ fontSize: "9px" }}>FASTAPI</span>
              <span className="badge badge-info" style={{ fontSize: "9px" }}>REDIS_BROKER</span>
              <span className="badge badge-info" style={{ fontSize: "9px" }}>XGBOOST</span>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
             Right Column: Screen 2 Authentication & Access Card
             ════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* The main access form card */}
            <div
              className={`terminal-panel ${shaking ? "form-shake" : ""}`}
              style={{ padding: "30px", border: "1px solid var(--border-green)" }}
            >
              {/* Shield Icon Header */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "44px",
                    height: "44px",
                    borderRadius: "4px",
                    border: "1px solid var(--accent-neon)",
                    backgroundColor: "rgba(0, 230, 118, 0.05)",
                    color: "var(--accent-neon)",
                    fontSize: "20px",
                    marginBottom: "8px",
                    boxShadow: "var(--shadow-neon)",
                  }}
                >
                  🛡️
                </div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-primary)" }}>
                  Secure Access Request
                </h2>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-teal)", marginTop: "2px" }}>
                  Tunneling: {step === 1 ? "AWAITING_TENANT" : "AWAITING_RBAC"}
                </p>
              </div>

              {/* Step 1.1 Form */}
              <form onSubmit={handleResolve} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ position: "relative" }}>
                  <GlowInput
                    label="1. Organization / Company Workspace Name"
                    placeholder="e.g. Acme Corp"
                    value={step === 2 ? resolvedName : orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={step === 2 || loading}
                    required
                    className={`${step === 2 ? "input-locked" : ""} ${error && step === 1 ? "input-error" : ""}`}
                  />
                  {step === 2 && (
                    <div style={{ position: "absolute", right: "12px", top: "34px", color: "var(--accent-neon)", fontSize: "16px" }}>✓</div>
                  )}
                </div>

                {step === 1 && (
                  <button
                    type="submit"
                    disabled={!canContinue || loading}
                    className="accent-button-solid"
                    style={{ marginTop: "4px" }}
                  >
                    {loading ? "Resolving..." : "Verify Tenant Identity"}
                  </button>
                )}
              </form>

              {/* Step 1.2 Form */}
              {step === 2 && (
                <form
                  onSubmit={handleLogin}
                  className="fade-in"
                  style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}
                >
                  {/* Role selection buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-primary)", textTransform: "uppercase" }}>
                      2. Target Security Role
                    </label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        className={`role-btn ${role === "admin" ? "active" : ""}`}
                        onClick={() => setRole("admin")}
                        disabled={loading}
                      >
                        🔧 Administrator
                      </button>
                      <button
                        type="button"
                        className={`role-btn ${role === "analyst" ? "active" : ""}`}
                        onClick={() => setRole("analyst")}
                        disabled={loading}
                      >
                        📊 Analyst
                      </button>
                    </div>
                  </div>

                  <GlowInput
                    label="3. Username"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                    className={error && step === 2 ? "input-error" : ""}
                  />

                  <GlowInput
                    label="4. Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className={error && step === 2 ? "input-error" : ""}
                  />

                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError("");
                        setOrgName("");
                        setResolvedName("");
                        setTenantId("");
                        setUsername("");
                        setPassword("");
                      }}
                      disabled={loading}
                      className="secondary-button"
                      style={{ flex: 1 }}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !username.trim() || !password.trim()}
                      className="accent-button-solid"
                      style={{ flex: 2 }}
                    >
                      {loading ? "Authenticating..." : "Establish Connection"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Screen 2 Supporting Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Security tips card */}
              <div className="terminal-panel" style={{ padding: "12px", borderLeft: "2px solid var(--accent-teal)" }}>
                <h5 style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-teal)", textTransform: "uppercase" }}>
                  🔒 Safety Check instructions
                </h5>
                <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.3" }}>
                  Ensure your address bar shows the valid secure lock icon. Keep JWT auth tokens volatile; rotate credentials key profiles every 30 days.
                </p>
              </div>

              {/* Password parameters warning */}
              <div className="terminal-panel" style={{ padding: "12px", borderLeft: "2px solid #e53e3e" }}>
                <h5 style={{ fontSize: "11px", fontWeight: "700", color: "#e53e3e", textTransform: "uppercase" }}>
                  ⚠️ Session limits
                </h5>
                <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.3" }}>
                  Authorized tunnels automatically close after 15 minutes of inactivity. State structures reside in volatile client memory buffers.
                </p>
              </div>

              {/* Biometrics & SSO Options */}
              <div className="terminal-panel" style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  SSO IDENTIFICATION STATUS:
                </span>
                <span className="badge badge-success" style={{ fontSize: "9px" }}>ACTIVE_TUNNEL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.auth-grid-responsive) {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
      `}</style>
    </>
  );
}
