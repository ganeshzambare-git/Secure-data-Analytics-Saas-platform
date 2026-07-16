"use client";

import React, { useState, useEffect } from "react";
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

  const loadData = async () => {
    try {
      setError("");
      // Fetch tenants and audit logs
      const tenantsRes = await secureRequest<TenantRecord[]>("/api/v1/pipeline/admin/tenants");
      const auditRes = await secureRequest<AuditRecord[]>("/api/v1/pipeline/admin/audit-logs");
      setTenants(tenantsRes);
      setAuditLogs(auditRes);
    } catch (err: any) {
      setError(err.message || "Failed to load admin data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      
      {/* Column 1: Onboard Forms & Tenant Management */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Onboarding Panel */}
        <div className="terminal-panel">
          <h3 style={{
            fontSize: "16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--accent-neon)",
            marginBottom: "16px"
          }}>
            [+] Onboard Corporate Tenant
          </h3>

          {success && (
            <div style={{
              backgroundColor: "rgba(0, 230, 118, 0.08)",
              border: "1px solid var(--accent-neon)",
              borderRadius: "4px",
              padding: "10px",
              fontSize: "12px",
              color: "var(--accent-neon)",
              fontFamily: "var(--font-mono)",
              marginBottom: "16px"
            }}>
              ✓ {success}
            </div>
          )}

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

            <button type="submit" disabled={loading} className="glow-button" style={{ marginTop: "8px" }}>
              {loading ? "Onboarding..." : "Establish Tenant Block"}
            </button>
          </form>
        </div>

        {/* Tenants List Panel */}
        <div className="terminal-panel" style={{ flex: 1 }}>
          <h3 style={{
            fontSize: "16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--accent-teal)",
            marginBottom: "16px"
          }}>
            [≡] Active Tenant Inventory
          </h3>

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
                {tenants.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.4)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: "600" }}>{t.company_name}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span className={`badge ${t.is_active ? "badge-success" : "badge-danger"}`}>
                        {t.is_active ? "Active" : "Locked"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
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
        </div>

      </div>

      {/* Column 2: Audit Logs */}
      <div className="terminal-panel" style={{ display: "flex", flexDirection: "column" }}>
        <h3 style={{
          fontSize: "16px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--accent-neon)",
          marginBottom: "16px"
        }}>
          [⚡] Immutable Audit Logs
        </h3>

        <div style={{ flex: 1, overflowY: "auto", maxHeight: "550px" }}>
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
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: "8px", color: "var(--accent-teal)" }}>{log.company_name}</td>
                  <td style={{ padding: "8px" }}>{log.username}</td>
                  <td style={{ padding: "8px" }}>{log.action_performed}</td>
                  <td style={{ padding: "8px", textAlign: "right" }}>{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
