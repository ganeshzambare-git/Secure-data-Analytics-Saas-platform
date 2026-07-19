"use client";

/**
 * DashboardLayout.tsx — Responsive Multi-Role Layout Shell with Navigation Rail
 * ReadyNest Analytics Engine — Phase 4
 *
 * Implements the layout shell:
 *  - Mandatory 64px left-side global vertical navigation rail
 *  - User profile identity and role indicator context
 *  - Route guarding & terminal exit operations
 *  - Fully responsive structure collapsing rail on mobile
 */

import React, { useEffect } from "react";
import { useSecureData } from "@/context/SecureDataContext";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { auth, loading, logout } = useSecureData();
  const router = useRouter();
  const pathname = usePathname();

  // Route guarding & redirection to new workspace
  useEffect(() => {
    if (!loading) {
      if (!auth.token) {
        router.push("/");
      } else {
        router.push("/workspace/datasets");
      }
    }
  }, [auth.token, loading, router]);

  if (loading || !auth.token) {
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

  const isAdmin = auth.role === "admin";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-base)",
      display: "flex",
      flexDirection: typeof window !== "undefined" && window.innerWidth < 768 ? "column" : "row"
    }} className="dashboard-shell-container">
      
      {/* ── Global Vertical Navigation Rail (64px) ────────────────────── */}
      <nav className="nav-rail">
        <div className="nav-rail-logo" title="ReadyNest Security Core">🛡️</div>
        
        {/* Nav Link: Admin Space */}
        {isAdmin && (
          <button 
            onClick={() => router.push("/dashboard/admin")}
            className={`nav-rail-btn ${pathname.includes("/admin") ? "active" : ""}`}
            title="System Admin Deck"
          >
            🔧
          </button>
        )}

        {/* Nav Link: Analyst Space */}
        <button 
          onClick={() => router.push("/dashboard/analyst")}
          className={`nav-rail-btn ${pathname.includes("/analyst") ? "active" : ""}`}
          title="Data Analyst Workdesk"
        >
          📊
        </button>

        {/* Bottom Spacer (only flex pushes it in column mode) */}
        <div style={{ flexGrow: 1 }} className="nav-rail-spacer" />

        {/* Exit Button */}
        <button 
          onClick={logout}
          className="nav-rail-btn" 
          title="Terminal Exit"
          style={{ color: "#e53e3e" }}
        >
          🚪
        </button>
      </nav>

      {/* ── Main Area (Top Banner + Content) ─────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden"
      }}>
        
        {/* Top Context Banner */}
        <header style={{
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-green)",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
          zIndex: 90
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--accent-neon)",
              fontWeight: 700,
              letterSpacing: "0.1em"
            }}>
              [SHIELD ACTIVE]
            </span>
          </div>

          {/* User profile identifier block */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  fontWeight: 600
                }}>
                  {auth.username}
                </span>
                <span className={`badge ${isAdmin ? "badge-danger" : "badge-success"}`} style={{ fontSize: "9px" }}>
                  {auth.role}
                </span>
              </div>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-muted)"
              }}>
                WORKSPACE: {auth.companyName}
              </span>
            </div>
          </div>
        </header>

        {/* Content canvas container */}
        <main style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column"
        }}>
          {children}
        </main>
      </div>

    </div>
  );
}
