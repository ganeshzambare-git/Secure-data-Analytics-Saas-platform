"use client";

import React, { useEffect, useState } from "react";
import { useSecureData } from "@/context/SecureDataContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { auth, loading, logout } = useSecureData();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Client Hardening Hooks
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
      if ((e.ctrlKey && e.shiftKey && e.key === "I") || (e.metaKey && e.altKey && e.key === "i")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Route guarding
  useEffect(() => {
    if (!loading && !auth.token) {
      router.push("/");
    }
  }, [auth.token, loading, router]);

  if (loading || !auth.token) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", backgroundColor: "#040D08", color: "#00E676",
        fontFamily: "var(--font-mono)", fontSize: "14px"
      }}>
        [ESTABLISHING ZERO-TRUST SESSION...]
      </div>
    );
  }

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Workspace";
    
    // Format breadcrumbs: e.g., "Workspace > Dataset Canvas"
    const routeMap: Record<string, string> = {
      "workspace": "Workspace",
      "datasets": "Dataset Canvas",
      "scraper": "Scraper Terminal",
      "workshop": "ML Workshop",
      "insights": "Insights Board"
    };

    return segments.map(seg => routeMap[seg] || seg).join(" > ");
  };

  const navItems = [
    { path: "/workspace/datasets", icon: "🗃️", title: "Dataset Canvas" },
    { path: "/workspace/scraper", icon: "🕷️", title: "Scraper Terminal" },
    { path: "/workspace/workshop", icon: "🧠", title: "ML Workshop" },
    { path: "/workspace/insights", icon: "📊", title: "Insights Board" }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#040D08",
      display: "flex",
      flexDirection: "row"
    }}>
      {/* ── Global System Navigation Rail ────────────────────── */}
      <nav style={{
        width: "64px",
        height: "100vh",
        backgroundColor: "#040D08",
        borderRight: "1px solid #1A3326",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "16px"
      }}>
        <div style={{
          fontSize: "24px",
          marginBottom: "32px",
          cursor: "default"
        }} title="DecisionIQ Security Core">🛡️</div>
        
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path} style={{
              position: "relative",
              width: "100%",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "8px",
              textDecoration: "none",
              color: isActive ? "#00E676" : "#A0AEC0",
              transition: "all 150ms ease"
            }} className="workspace-nav-link" title={item.title}>
              {isActive && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "3px",
                  backgroundColor: "#00E676"
                }} />
              )}
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
            </Link>
          );
        })}
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        .workspace-nav-link:hover {
          color: #00E676 !important;
          text-shadow: 0 0 10px rgba(0, 230, 118, 0.6);
        }
      `}} />

      {/* ── Main Area (Top Banner + Content) ─────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden"
      }}>
        
        {/* Workspace Top Bar */}
        <header style={{
          height: "60px",
          backgroundColor: "#0D1B13",
          borderBottom: "4px solid #1A3326",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          {/* Left Control Panel Elements */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              color: "#00E676",
              fontWeight: 700
            }}>
              DecisionIQ SaaS Platform
            </span>
            <div style={{ width: "1px", height: "20px", backgroundColor: "#1A3326" }} />
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "#A0AEC0"
            }}>
              {getBreadcrumbs()}
            </span>
          </div>

          {/* Right Control Panel Elements */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            
            {/* System Environment Mode Badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              borderRadius: "4px",
              backgroundColor: "rgba(0, 230, 118, 0.1)",
              border: "1px solid #1A3326",
              backgroundImage: "radial-gradient(#00E676 1px, transparent 1px)",
              backgroundSize: "4px 4px",
              backgroundPosition: "0 0"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00E676" }} />
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "#00E676",
                fontWeight: 600,
                textTransform: "uppercase"
              }}>
                Zero-Trust Active
              </span>
            </div>

            {/* User Context Metadata Dropdown */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-mono)"
                }}
              >
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>{auth.username}</div>
                  <div style={{ fontSize: "10px", color: "#A0AEC0" }}>{auth.role === "admin" ? "System Admin" : "Data Analyst"}</div>
                </div>
                <span style={{ fontSize: "10px", color: "#00E676" }}>▼</span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  width: "180px",
                  backgroundColor: "#0D1B13",
                  border: "1px solid #1A3326",
                  borderRadius: "4px",
                  padding: "8px 0",
                  zIndex: 100,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                }}>
                  <div style={{
                    padding: "8px 16px",
                    borderBottom: "1px solid #1A3326",
                    marginBottom: "4px"
                  }}>
                    <div style={{ fontSize: "10px", color: "#A0AEC0", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Active Role Tier</div>
                    <div style={{ fontSize: "12px", color: "#00E676", fontWeight: "bold", fontFamily: "var(--font-mono)" }}>
                      {auth.role === "admin" ? "System Admin" : "Data Analyst"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 16px",
                      background: "none",
                      border: "none",
                      color: "#FF3B30",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.1)"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <span>🚪</span> Flush Token Cache
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content canvas container */}
        <main style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#040D08"
        }}>
          {children}
        </main>
      </div>

    </div>
  );
}
