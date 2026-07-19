"use client";

/**
 * page.tsx — Multi-Tier Authentication Gateway (Enhanced Density)
 * ReadyNest Analytics Engine — Phase 5 UI Enrichment
 * Refactored to use the modular AuthFlow orchestrator.
 */

import React from "react";
import { useSecureData } from "@/context/SecureDataContext";
import SystemAdminDeck from "./dashboard/admin/page";
import AnalystLandingCanvas from "./dashboard/analyst/page";
import DashboardLayout from "./dashboard/layout";
import { AuthFlow } from "@/authentication/AuthFlow";

export default function AuthGateway() {
  const { auth, loading: secureLoading } = useSecureData();

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

  if (auth.token) {
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

  return <AuthFlow />;
}
