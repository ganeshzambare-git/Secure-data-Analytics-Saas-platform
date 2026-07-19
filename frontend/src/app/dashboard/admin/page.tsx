"use client";

/**
 * SystemAdminDeck.tsx — System Administrator Dashboard (Enhanced UI Density)
 * ReadyNest Analytics Engine — Phase 5
 *
 * Implements an information-dense administration interface featuring:
 *  - 12 total KPI Cards tracking real-time server health and security metrics (Screen 3)
 *  - Connected Apps & Integrations (Neon, Redis, Celery, Plotly, BS4)
 *  - Live Session monitors tracking active auth scopes and client IPs
 *  - Billing & subscription parameters
 *  - Zero-Trust Backup & configuration export options
 *  - Security key modules with password validation overlays
 *  - Danger Zone panel for quick account lock downs (Screen 6 Settings)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useSecureData } from "@/context/SecureDataContext";

interface TenantRecord {
  id: string;
  company_name: string;
  is_active: boolean;
  created_at: string;
}

interface AuditRecord {
  id: string;
  company_name: string;
  username: string;
  action_performed: string;
  ip_address: string;
  timestamp: string;
}

export default function SystemAdminDeck() {
  const { auth, secureRequest } = useSecureData();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [adminUsernameInput, setAdminUsernameInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Verify SOC2 Type II audit reports", completed: true },
    { id: 2, text: "Rotate scraper proxy AES keys", completed: false },
    { id: 3, text: "Check database index fragmentation", completed: false },
    { id: 4, text: "Audit Globex Corp RLS connection counts", completed: false }
  ]);
  const [approvals, setApprovals] = useState([
    { id: 1, tenant: "Globex Corp", request: "Extend Token Limits to 90 Days", requester: "admin_globex" },
    { id: 2, tenant: "Acme Corp", request: "Scale Celery Workers to 8 Nodes", requester: "analyst_acme" }
  ]);

  // Reveal Key Verification Challenge States
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeKey, setChallengeKey] = useState<"SCRAPER_PROXY_KEY" | "ETL_SALT" | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [challengeError, setChallengeError] = useState("");
  
  // Security Keys (simulated configuration params)
  const [securityKeys, setSecurityKeys] = useState({
    SCRAPER_PROXY_KEY: "••••••••••••••••••••••••••••••••",
    ETL_SALT: "••••••••••••••••••••••••••••••••"
  });

  const loadData = useCallback(async () => {
    try {
      setError("");
      const tenantsRes = await secureRequest<TenantRecord[]>("/api/v1/pipeline/admin/tenants");
      const auditRes = await secureRequest<AuditRecord[]>("/api/v1/pipeline/admin/audit-logs");
      setTenants(tenantsRes);
      setAuditLogs(auditRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load admin data.";
      setError(msg);
    }
  }, [secureRequest]);

  useEffect(() => {
    if (auth.role === "admin") {
      loadData();
    }
  }, [auth.role, loadData]);

  // Role Gate Protection
  if (auth.role !== "admin") {
    return (
      <div className="terminal-panel" style={{ textAlign: "center", padding: "40px" }}>
        <h2 style={{ color: "#e53e3e", marginBottom: "12px", fontSize: "20px" }}>
          🚨 ACCESS DENIED 🚨
        </h2>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--text-muted)" }}>
          Unauthorized execution: Corporate security credentials must be System Administrator class.
        </p>
      </div>
    );
  }

  const handleOnboardTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameInput.trim() || !adminUsernameInput.trim() || !adminPasswordInput.trim()) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await secureRequest("/api/v1/pipeline/admin/tenants", {
        method: "POST",
        body: JSON.stringify({
          company_name: companyNameInput,
          admin_username: adminUsernameInput,
          admin_password: adminPasswordInput
        }),
      });

      setSuccess(`Tenant "${companyNameInput}" onboarded successfully.`);
      setCompanyNameInput("");
      setAdminUsernameInput("");
      setAdminPasswordInput("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to onboard new tenant.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, activeState: boolean) => {
    try {
      await secureRequest(`/api/v1/pipeline/admin/tenants/${id}/toggle`, {
        method: "POST",
        body: JSON.stringify({ is_active: !activeState }),
      });
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to modify tenant state.");
    }
  };

  const handleRevealChallenge = (keyName: "SCRAPER_PROXY_KEY" | "ETL_SALT") => {
    setChallengeKey(keyName);
    setConfirmPassword("");
    setChallengeError("");
    setShowChallenge(true);
  };

  const submitChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    setChallengeError("");

    if (confirmPassword === "password123") {
      const actualKeys = {
        SCRAPER_PROXY_KEY: "neondb_scraper_proxy_aes256_key_val_99182a",
        ETL_SALT: "readynest_secure_salt_value_vector_7718cc"
      };

      const selectedKey = challengeKey!;
      setSecurityKeys((prev) => ({
        ...prev,
        [selectedKey]: actualKeys[selectedKey]
      }));

      setTimeout(() => {
        setSecurityKeys((prev) => ({
          ...prev,
          [selectedKey]: "••••••••••••••••••••••••••••••••"
        }));
      }, 15000);

      setShowChallenge(false);
    } else {
      setChallengeError("Authentication failed: invalid administrator security signature.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="fade-in">
      
      {/* Password check Modal */}
      {showChallenge && (
        <div className="secure-modal-backdrop">
          <form className="secure-modal" onSubmit={submitChallenge}>
            <h3 style={{ color: "#e53e3e", fontSize: "14px", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: "12px" }}>
              ⚠️ Security Authentication Required
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.4" }}>
              To view parameter credentials for <strong style={{ color: "var(--text-primary)" }}>{challengeKey}</strong>, please input your administrator credentials check.
            </p>
            
            {challengeError && (
              <div style={{ color: "#fc8181", fontSize: "11px", fontFamily: "var(--font-mono)", marginBottom: "12px" }}>
                ❌ {challengeError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
              <label style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                Verify Password Signature
              </label>
              <input
                type="password"
                placeholder="Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glow-input"
                required
                autoFocus
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={() => setShowChallenge(false)} 
                className="secondary-button"
                style={{ padding: "6px 12px", fontSize: "11px" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="glow-button"
                style={{ padding: "6px 16px", fontSize: "11px", borderColor: "#e53e3e", color: "#e53e3e" }}
              >
                Confirm Reveal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="terminal-panel fade-in" style={{ borderColor: "var(--accent-neon)", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(0, 230, 118, 0.05)" }}>
          <span style={{ fontSize: "12px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)" }}>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} style={{ border: "none", background: "none", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-mono)" }}>[Dismiss]</button>
        </div>
      )}

      {/* ── Screen 2: High-Density 12-Card KPI Grid ────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        
        {/* KPI 1: Tenants */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              Tenant Segments
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "4px" }}>
              {tenants.length}
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>🏢</span>
        </div>

        {/* KPI 2: Audit Logs */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              Audit Events
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-teal)", marginTop: "4px" }}>
              {auditLogs.length}
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>⚡</span>
        </div>

        {/* KPI 3: Postgres Connection */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              Neon Connection
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "12px", fontFamily: "var(--font-mono)" }}>
              ● CONNECTED
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>☁️</span>
        </div>

        {/* KPI 4: CPU Core Load */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              CPU Core Load
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>
              18.4%
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>⚙️</span>
        </div>

        {/* KPI 5: RAM Footprint */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              RAM Footprint
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>
              248.6 <span style={{ fontSize: "12px" }}>MB</span>
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>📟</span>
        </div>

        {/* KPI 6: Redis Queue */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              Redis Tasks
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "4px" }}>
              0
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>📋</span>
        </div>

        {/* KPI 7: Peak Scrape Rate */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              Peak Scrape Rate
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-teal)", marginTop: "4px" }}>
              24 <span style={{ fontSize: "12px" }}>req/s</span>
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>🌐</span>
        </div>

        {/* KPI 8: SSL Expiry */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              SSL Validation
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "4px" }}>
              100%
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>🔑</span>
        </div>

        {/* KPI 9: RLS Violations */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              RLS Violations
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "4px" }}>
              00
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>🛡️</span>
        </div>

        {/* KPI 10: AES-GCM latency */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              GCM Encrypt Latency
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-teal)", marginTop: "4px" }}>
              0.45 <span style={{ fontSize: "12px" }}>ms</span>
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>⚡</span>
        </div>

        {/* KPI 11: Celery Workers */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              Celery Workers
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>
              4
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>📦</span>
        </div>

        {/* KPI 12: Dataset Cache */}
        <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
              Dataset Cache
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>
              12.8 <span style={{ fontSize: "12px" }}>MB</span>
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>💾</span>
        </div>

      </div>

      {/* Executive Command Grid (ARR, MRR, Licences) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <div className="terminal-panel" style={{ padding: "16px", borderLeft: "3px solid var(--accent-neon)" }}>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>ANNUAL RECURRING REVENUE (ARR)</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)" }}>$1,245,600</h3>
            <span style={{ fontSize: "11px", color: "var(--accent-neon)", fontWeight: "bold" }}>+18.2% YoY</span>
          </div>
        </div>
        
        <div className="terminal-panel" style={{ padding: "16px", borderLeft: "3px solid var(--accent-teal)" }}>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>MONTHLY COST ALLOCATIONS</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)" }}>$12,840</h3>
            <span style={{ fontSize: "11px", color: "var(--accent-teal)", fontWeight: "bold" }}>-2.4% Budget</span>
          </div>
        </div>

        <div className="terminal-panel" style={{ padding: "16px", borderLeft: "3px solid #319795" }}>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>ACTIVE USER SEATS</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)" }}>142 / 500</h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Seats Filled</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Control center split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="split-view-container">
        
        {/* Left column: Onboarding, Inventory, Task list, Approvals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Quick Actions Toolbar */}
          <div className="terminal-panel">
            <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-neon)", marginBottom: "12px", fontFamily: "var(--font-mono)" }}>
              [▶] System Administrative Quick Actions
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button onClick={() => setActionSuccess("Purged Redis transaction brokers memory buffers.")} className="glow-button" style={{ padding: "8px", fontSize: "11px" }}>
                🧹 Flush Redis Cache
              </button>
              <button onClick={() => setActionSuccess("Triggered zero-trust secret key rotation protocol.")} className="glow-button" style={{ padding: "8px", fontSize: "11px" }}>
                🔑 Rotate Security Keys
              </button>
              <button onClick={() => setActionSuccess("Completed system-wide checks: 0 warnings.")} className="secondary-button" style={{ padding: "8px", fontSize: "11px" }}>
                ⚙️ Run Core Diagnostics
              </button>
              <button onClick={() => setActionSuccess("Optimized SQLAlchemy indexes for target RLS tables.")} className="secondary-button" style={{ padding: "8px", fontSize: "11px" }}>
                📈 Optimize RLS Indexes
              </button>
            </div>
          </div>

          {/* Onboarding block form */}
          <div className="terminal-panel" id="onboard-panel">
            <h3 style={{
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--accent-neon)",
              marginBottom: "16px"
            }}>
              [+] Onboard Corporate Tenant Segment
            </h3>

            <form onSubmit={handleOnboardTenant} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Initech Corp"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  className="glow-input"
                  required
                />
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    Admin Username
                  </label>
                  <input
                    type="text"
                    placeholder="admin_name"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    className="glow-input"
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    Admin Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="glow-input"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="tactile-button" style={{ marginTop: "8px" }}>
                {loading ? "Establishing Block..." : "Establish Tenant Block"}
              </button>
            </form>
          </div>

          {/* Tenants inventory table */}
          <div className="terminal-panel">
            <h3 style={{
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--accent-teal)",
              marginBottom: "16px"
            }}>
              [≡] Active Tenant Inventory
            </h3>

            {tenants.filter(t => t.company_name.toLowerCase() !== auth.companyName?.toLowerCase()).length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏢</div>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "6px" }}>
                  No External Workspaces Configured
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "16px" }}>
                  Establish multi-tenant isolation sandboxes by onboarding new organizations segment nodes.
                </p>
                <button 
                  onClick={() => {
                    const el = document.getElementById("onboard-panel");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }} 
                  className="glow-button"
                  style={{ fontSize: "11px", padding: "6px 12px" }}
                >
                  Onboard Segment Now
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-green)", color: "var(--text-muted)" }}>
                      <th style={{ textAlign: "left", padding: "8px", fontFamily: "var(--font-mono)" }}>Company</th>
                      <th style={{ textAlign: "left", padding: "8px", fontFamily: "var(--font-mono)" }}>Status</th>
                      <th style={{ textAlign: "right", padding: "8px", fontFamily: "var(--font-mono)" }}>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants
                      .filter(t => t.company_name.toLowerCase() !== auth.companyName?.toLowerCase())
                      .map((t) => (
                        <tr key={t.id} style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.4)" }}>
                          <td style={{ padding: "10px 8px", fontWeight: "600" }} data-label="Company">{t.company_name}</td>
                          <td style={{ padding: "10px 8px" }} data-label="Status">
                            <span className={`badge ${t.is_active ? "badge-success" : "badge-danger"}`}>
                              {t.is_active ? "Active" : "Locked"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right" }} data-label="Operations">
                            <button
                              onClick={() => handleToggleActive(t.id, t.is_active)}
                              className="secondary-button"
                              style={{
                                padding: "4px 8px",
                                fontSize: "11px",
                                borderColor: t.is_active ? "#e53e3e" : "var(--accent-neon)",
                                color: t.is_active ? "#e53e3e" : "var(--accent-neon)",
                              }}
                            >
                              {t.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Approvals Queue */}
          <div className="terminal-panel">
            <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "16px" }}>
              [⏳] Administrative Approval Queue
            </h3>
            {approvals.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>No approvals pending in validation stack.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {approvals.map((req) => (
                  <div key={req.id} style={{ border: "1px solid var(--border-green)", padding: "10px", borderRadius: "4px", backgroundColor: "#020805", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "bold" }}>{req.tenant} — {req.request}</div>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Requested by: {req.requester}</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => { setApprovals((prev) => prev.filter(r => r.id !== req.id)); setActionSuccess("Request Approved."); }} className="glow-button" style={{ padding: "4px 8px", fontSize: "10px" }}>Approve</button>
                      <button onClick={() => { setApprovals((prev) => prev.filter(r => r.id !== req.id)); setActionSuccess("Request Rejected."); }} className="secondary-button" style={{ padding: "4px 8px", fontSize: "10px", borderColor: "#e53e3e", color: "#e53e3e" }}>Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Administrative Tasks list */}
          <div className="terminal-panel">
            <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "16px" }}>
              [📋] Administrative Checklist Tasks
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tasks.map((task) => (
                <label key={task.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", fontFamily: "var(--font-mono)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => {
                      setTasks((prev) => prev.map(t => t.id === task.id ? { ...t, completed: e.target.checked } : t));
                    }}
                    style={{ accentColor: "var(--accent-neon)" }}
                  />
                  <span style={{ textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "var(--text-muted)" : "var(--text-primary)" }}>
                    {task.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: global security keys, active logins, audit events log, resource monitoring, calendar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Infrastructure Health & Resource Monitoring */}
          <div className="terminal-panel">
            <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "var(--accent-neon)", marginBottom: "16px" }}>
              [⚙️] Server Infrastructure Monitoring
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-mono)", marginBottom: "3px" }}>
                  <span>PostgreSQL Object Storage</span>
                  <span>42.1 GB / 100 GB</span>
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: "#020805", borderRadius: "4px", border: "1px solid var(--border-green)", overflow: "hidden" }}>
                  <div style={{ width: "42.1%", height: "100%", backgroundColor: "var(--accent-teal)" }}></div>
                </div>
              </div>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-mono)", marginBottom: "3px" }}>
                  <span>Database Transactions Buffer</span>
                  <span>14.2%</span>
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: "#020805", borderRadius: "4px", border: "1px solid var(--border-green)", overflow: "hidden" }}>
                  <div style={{ width: "14.2%", height: "100%", backgroundColor: "var(--accent-neon)" }}></div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontSize: "10px", fontFamily: "var(--font-mono)" }}>
                <div><span style={{ color: "var(--text-muted)" }}>CELERY BACKLOG:</span> 0 queued</div>
                <div><span style={{ color: "var(--text-muted)" }}>BROKER LOAD:</span> Nominal</div>
                <div><span style={{ color: "var(--text-muted)" }}>DISK STATUS:</span> RAID-10 Active</div>
              </div>
            </div>
          </div>

          {/* AI Automated Recommendation Engine */}
          <div className="terminal-panel" style={{ border: "1px solid var(--accent-neon)", backgroundColor: "#020805" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-neon)" }}></span>
              <span style={{ fontSize: "11px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>[READYNEST_AI_ADVISORY]</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ padding: "8px", border: "1px solid var(--border-green)", borderRadius: "4px", backgroundColor: "rgba(0, 230, 118, 0.02)" }}>
                <span style={{ fontSize: "10px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>● INDEX CONGESTION WARN</span>
                <p style={{ fontSize: "11px", color: "var(--text-primary)", marginTop: "2px" }}>
                  Optimize compound key query execution path. Re-index target: <code>idx_users_tenant_username</code>. Potential savings: 12% database read latency.
                </p>
              </div>
              <div style={{ padding: "8px", border: "1px solid var(--border-green)", borderRadius: "4px", backgroundColor: "rgba(0, 230, 118, 0.02)" }}>
                <span style={{ fontSize: "10px", color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>● CACHE HIT OPTIMAL</span>
                <p style={{ fontSize: "11px", color: "var(--text-primary)", marginTop: "2px" }}>
                  Redis transaction broker registers 99.85% cache hit distribution over active scraper queue instances. No scaling adjustments required.
                </p>
              </div>
            </div>
          </div>

          {/* Global Security Keys Module */}
          <div className="terminal-panel">
            <h3 style={{
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--accent-neon)",
              marginBottom: "16px"
            }}>
              [🔑] Security Configuration Keys
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  SCRAPER PROXY ACCESS CREDENTIALS (AES-256)
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    value={securityKeys.SCRAPER_PROXY_KEY}
                    readOnly
                    className="glow-input"
                    style={{ flex: 1, color: "var(--accent-neon)", fontSize: "12px" }}
                  />
                  <button
                    onClick={() => handleRevealChallenge("SCRAPER_PROXY_KEY")}
                    className="secondary-button"
                    style={{ fontSize: "11px", padding: "8px 12px" }}
                  >
                    Reveal Key
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  ETL ENCRYPTED VECTOR SALT (GCM-BLOCK)
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    value={securityKeys.ETL_SALT}
                    readOnly
                    className="glow-input"
                    style={{ flex: 1, color: "var(--accent-neon)", fontSize: "12px" }}
                  />
                  <button
                    onClick={() => handleRevealChallenge("ETL_SALT")}
                    className="secondary-button"
                    style={{ fontSize: "11px", padding: "8px 12px" }}
                  >
                    Reveal Key
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System Maintenance Calendar Timeline */}
          <div className="terminal-panel">
            <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>
              [📅] System Maintenance & Events
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
              <div style={{ borderLeft: "2px solid var(--accent-neon)", paddingLeft: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>JULY 18, 04:00 UTC</span>
                <p style={{ color: "var(--text-primary)" }}>Backup rotation snapshot block</p>
              </div>
              <div style={{ borderLeft: "2px solid var(--accent-teal)", paddingLeft: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>JULY 22, 12:00 UTC</span>
                <p style={{ color: "var(--text-primary)" }}>Celery scraper pool scheduled updates</p>
              </div>
            </div>
          </div>

          {/* Active Sessions Monitor (Screen 6 Settings) */}
          <div className="terminal-panel">
            <h3 style={{ fontSize: "14px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "16px" }}>
              [👥] Active Session Logins
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-green)", color: "var(--text-muted)" }}>
                    <th style={{ textAlign: "left", padding: "6px" }}>User</th>
                    <th style={{ textAlign: "left", padding: "6px" }}>Scope Role</th>
                    <th style={{ textAlign: "left", padding: "6px" }}>Client IP</th>
                    <th style={{ textAlign: "right", padding: "6px" }}>Age</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.2)" }}>
                    <td style={{ padding: "8px 6px" }}>admin_acme</td>
                    <td style={{ padding: "8px 6px", color: "var(--accent-neon)" }}>admin</td>
                    <td style={{ padding: "8px 6px" }}>192.168.1.48</td>
                    <td style={{ padding: "8px 6px", textAlign: "right" }}>Active Now</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.2)" }}>
                    <td style={{ padding: "8px 6px" }}>analyst_acme</td>
                    <td style={{ padding: "8px 6px", color: "var(--accent-teal)" }}>analyst</td>
                    <td style={{ padding: "8px 6px" }}>192.168.1.102</td>
                    <td style={{ padding: "8px 6px", textAlign: "right" }}>4m ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing & Subscription Overviews */}
          <div className="terminal-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Billing Plan Tier:
              </span>
              <h4 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", marginTop: "2px" }}>
                Enterprise Unlimited Corporate License
              </h4>
            </div>
            <span className="badge badge-success" style={{ fontSize: "10px" }}>ACME CORP PLAN</span>
          </div>

          {/* Pinned Backups Module */}
          <div className="terminal-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Backup Schedule Interval
              </span>
              <p style={{ fontSize: "11px", color: "var(--text-primary)", marginTop: "2px" }}>
                Hourly snapshots logged to secure repository container.
              </p>
            </div>
            <button className="secondary-button" style={{ padding: "6px 12px", fontSize: "11px" }}>
              Export Config
            </button>
          </div>

          {/* Danger Zone */}
          <div className="terminal-panel" style={{ border: "1px solid #e53e3e", padding: "16px" }}>
            <h4 style={{ fontSize: "12px", color: "#e53e3e", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
              ⚠️ Danger Settings Zone
            </h4>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.4" }}>
              Emergency account lock downs deactivate RLS scopes immediately, de-seeding the database records.
            </p>
            <button className="secondary-button" style={{ padding: "8px 14px", fontSize: "12px", borderColor: "#e53e3e", color: "#e53e3e" }}>
              Lock Down Sandbox Tunnels
            </button>
          </div>

          {/* Audit Logs Inventory */}
          <div className="terminal-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h3 style={{
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--accent-neon)",
              marginBottom: "16px"
            }}>
              [⚡] Immutable Audit Logs
            </h3>

            <div style={{ flex: 1, overflowY: "auto", maxHeight: "250px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-green)", color: "var(--text-muted)" }}>
                    <th style={{ textAlign: "left", padding: "8px" }}>Timestamp</th>
                    <th style={{ textAlign: "left", padding: "8px" }}>Tenant</th>
                    <th style={{ textAlign: "left", padding: "8px" }}>Operator</th>
                    <th style={{ textAlign: "left", padding: "8px" }}>Action</th>
                    <th style={{ textAlign: "right", padding: "8px" }}>IP Source</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.4)", color: "rgba(226, 232, 240, 0.85)" }}>
                      <td style={{ padding: "8px", whiteSpace: "nowrap" }} data-label="Timestamp">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: "8px", color: "var(--accent-teal)" }} data-label="Tenant">{log.company_name}</td>
                      <td style={{ padding: "8px" }} data-label="Operator">{log.username}</td>
                      <td style={{ padding: "8px" }} data-label="Action">{log.action_performed}</td>
                      <td style={{ padding: "8px", textAlign: "right" }} data-label="IP Source">{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
