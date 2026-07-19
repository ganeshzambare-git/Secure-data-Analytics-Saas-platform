"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Mock Data Type
interface DatasetAsset {
  id: string;
  name: string;
  ingestionProfile: string;
  rowLength: number;
  lineage: string;
}

export default function DatasetCanvas() {
  const router = useRouter();
  
  // Empty state simulation as requested
  const [datasets] = useState<DatasetAsset[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      height: "100%",
      position: "relative"
    }}>
      {/* Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{
          fontFamily: "var(--font-mono)",
          fontSize: "24pt",
          fontWeight: "bold",
          color: "#FFFFFF",
          letterSpacing: "-0.5px"
        }}>
          Active Dataset Collections
        </h1>
        
        <button 
          onClick={() => {
            // Trigger drawer state, but the prompt says "opening the parameter configurations drawer (Screen 4 component envelope)"
            // For now, let's route to Screen 4 since building an elaborate drawer that fetches another route is tricky,
            // or we can simulate the drawer and redirect if they want a full page.
            // Let's implement a visual drawer here.
            setDrawerOpen(true);
          }}
          style={{
            backgroundColor: "#00E676",
            color: "#040D08",
            fontWeight: "bold",
            padding: "12px 24px",
            border: "none",
            borderRadius: "4px",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0, 230, 118, 0.4)"
          }}
        >
          + New Collection Target
        </button>
      </div>

      {/* Grid Layout / Empty State */}
      <div style={{ flex: 1, position: "relative" }}>
        {datasets.length === 0 ? (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
            maxWidth: "600px"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              border: "2px dashed #1A3326",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1A3326",
              fontSize: "24px"
            }}>
              ⚠️
            </div>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              color: "#A0AEC0",
              lineHeight: "1.6"
            }}>
              No analytical data streams initialized. Start your multi-phase end-to-end pipeline by designating a target file matrix or setting up a target web crawler route.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px"
          }}>
            {datasets.map(dataset => (
              <div key={dataset.id} style={{
                backgroundColor: "rgba(13, 27, 19, 0.85)",
                border: "4px solid #1A3326",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <h3 style={{ color: "#00E676", fontFamily: "var(--font-mono)", margin: 0, fontSize: "16px" }}>{dataset.name}</h3>
                <div style={{ fontSize: "12px", color: "#A0AEC0", fontFamily: "var(--font-mono)" }}>
                  <div><strong>Ingestion:</strong> {dataset.ingestionProfile}</div>
                  <div><strong>Rows:</strong> {dataset.rowLength.toLocaleString()}</div>
                  <div><strong>Lineage:</strong> {dataset.lineage}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The Drawer Trigger Hook (Slide-in) */}
      <div style={{
        position: "fixed",
        top: 0,
        right: drawerOpen ? 0 : "-100%",
        width: "600px",
        height: "100vh",
        backgroundColor: "#0D1B13",
        borderLeft: "4px solid #1A3326",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.8)",
        transition: "right 0.3s ease-in-out",
        zIndex: 100,
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ padding: "24px", borderBottom: "1px solid #1A3326", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontFamily: "var(--font-mono)", color: "#00E676", margin: 0 }}>Parameter Configurations Drawer</h2>
          <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", color: "#A0AEC0", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>
        <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "16px", color: "#A0AEC0", fontFamily: "var(--font-mono)", fontSize: "14px" }}>
          <p>Redirecting to standalone Scraper Terminal envelope...</p>
          <button 
            onClick={() => router.push("/workspace/scraper")}
            style={{
              padding: "12px",
              backgroundColor: "transparent",
              border: "1px solid #00E676",
              color: "#00E676",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            Go to Scraper Terminal Screen
          </button>
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div 
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(4, 13, 8, 0.7)",
            zIndex: 90
          }}
        />
      )}
    </div>
  );
}
