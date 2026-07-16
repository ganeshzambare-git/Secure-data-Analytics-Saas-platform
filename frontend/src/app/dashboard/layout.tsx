"use client";

import React, { useEffect } from "react";
import { useSecureData } from "@/context/SecureDataContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { auth, loading, logout } = useSecureData();
  const router = useRouter();

  // Route guarding: Check if authenticated, otherwise redirect to landing
  useEffect(() => {
    if (!loading && !auth.token) {
      router.push("/");
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

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-base)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Top Banner Navigation Bar */}
      <header style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-green)",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        position: "relative"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>🛡️</span>
          <div>
            <h2 style={{
              fontSize: "15px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-primary)"
            }}>
              ReadyNest Engine
            </h2>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--accent-neon)"
            }}>
              [SHIELD ACTIVE]
            </p>
          </div>
        </div>

        {/* Corporate Details */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          
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
              <span className={`badge ${auth.role === "admin" ? "badge-danger" : "badge-success"}`} style={{ fontSize: "9px" }}>
                {auth.role}
              </span>
            </div>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--accent-teal)"
            }}>
              Tenant: {auth.companyName}
            </span>
          </div>

          <button
            onClick={logout}
            className="secondary-button"
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              textTransform: "uppercase"
            }}
          >
            Terminal Exit
          </button>
        </div>
      </header>

      {/* Main Panel Content Container */}
      <main style={{
        flex: 1,
        padding: "32px 24px",
        maxWidth: "1400px",
        width: "100%",
        margin: "0 auto"
      }}>
        {children}
      </main>
    </div>
  );
}
