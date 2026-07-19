"use client";

import React, { useState, useEffect } from "react";
import { useSecureData } from "@/context/SecureDataContext";

export default function InsightsBoard() {
  const { secureRequest } = useSecureData();
  
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSecureReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulating the secure retrieval of pre-compiled SSR vector frame/image.
        // We will mock the secureRequest response for demonstration.
        await secureRequest("/api/v1/analytics/dashboard/default_id");
        
        // Simulating decoding of the SVG/Image from payload
        setTimeout(() => {
          if (isMounted) {
            setReportUrl("/api/mock/chart.svg"); // In a real app, this would be a blob URL or base64 encoded string from decrypted payload
            setLoading(false);
          }
        }, 1200);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to establish secure connection to analytics engine. Network timeout detected.");
          setLoading(false);
        }
      }
    };

    fetchSecureReport();

    return () => {
      isMounted = false;
    };
  }, [secureRequest]);

  const handleExportPdf = async () => {
    setExporting(true);
    setError(null);
    try {
      await secureRequest("/api/v1/export/pdf", { method: "GET" });
      
      // Simulate download trigger
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = "#";
        link.download = "DecisionIQ_Secure_Report.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExporting(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Export transaction failed. Verification boundary violated.");
      setExporting(false);
    }
  };

  const isErrorState = !!error;
  const baseColor = isErrorState ? "#FF3B30" : "#00E676";
  const mutedColor = isErrorState ? "rgba(255, 59, 48, 0.4)" : "#1A3326";
  const bgPanel = isErrorState ? "rgba(255, 59, 48, 0.05)" : "rgba(13, 27, 19, 0.5)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "var(--font-mono)", color: baseColor, fontSize: "20px", margin: 0 }}>
          Visual Insights Board & Encrypted Report View
        </h2>

        <button
          onClick={handleExportPdf}
          disabled={loading || isErrorState || exporting}
          style={{
            padding: "12px 24px",
            backgroundColor: (loading || isErrorState || exporting) ? "transparent" : "#00E676",
            border: `2px solid ${(loading || isErrorState || exporting) ? mutedColor : "#00E676"}`,
            color: (loading || isErrorState || exporting) ? mutedColor : "#040D08",
            fontWeight: "bold",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            borderRadius: "4px",
            cursor: (loading || isErrorState || exporting) ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          {exporting ? "Generating PDF..." : "Export Secure PDF Summary Document"}
        </button>
      </div>

      {/* Main Canvas Area */}
      <div style={{
        flex: 1,
        backgroundColor: bgPanel,
        border: `4px solid ${mutedColor}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: "24px"
      }}>
        
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", color: "#A0AEC0", fontFamily: "var(--font-mono)" }}>
            <div className="spinner" style={{
              width: "32px", height: "32px",
              border: "3px solid rgba(0, 230, 118, 0.2)",
              borderTopColor: "#00E676",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <span>Resolving Secure Vector Matrices...</span>
          </div>
        )}

        {error && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            color: "#FF3B30",
            fontFamily: "var(--font-mono)",
            textAlign: "center",
            maxWidth: "600px"
          }}>
            <div style={{ fontSize: "48px" }}>⚠️</div>
            <h3 style={{ margin: 0, fontSize: "16px", textTransform: "uppercase" }}>Critical Validation Interruption</h3>
            <p style={{ fontSize: "14px", lineHeight: "1.5" }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid #FF3B30",
                color: "#FF3B30",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                borderRadius: "4px"
              }}
            >
              Re-initialize Secure Handshake
            </button>
          </div>
        )}

        {!loading && !error && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Mocked Chart / Visual SVG Frame */}
            <div style={{
              width: "80%",
              height: "80%",
              border: "1px dashed #1A3326",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1A3326",
              fontFamily: "var(--font-mono)"
            }}>
              [SECURE SSR VECTOR GRAPHICS CANVAS]
              {/* In production, <img src={reportUrl} /> would be rendered here */}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
