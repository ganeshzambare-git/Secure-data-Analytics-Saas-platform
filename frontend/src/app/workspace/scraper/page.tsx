"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSecureData } from "@/context/SecureDataContext";
import { useRouter } from "next/navigation";

export default function ScraperTerminal() {
  const { secureRequest } = useSecureData();
  const router = useRouter();

  const [mode, setMode] = useState<"url" | "api">("url");
  const [targetUrl, setTargetUrl] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<{ id: number; text: string; color?: string; bold?: boolean }[]>([]);
  const [successModal, setSuccessModal] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (text: string, color = "#A0AEC0", bold = false) => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, color, bold }]);
  };

  const executePipeline = async () => {
    if (!targetUrl.trim()) return;

    setIsExecuting(true);
    setIsError(false);
    setLogs([]); // Clear logs

    // Simulated log streaming delays
    const delays = [500, 1500, 2500];

    setTimeout(() => {
      addLog("[Scraping Engine Initialized]", "#00E676", true);
    }, delays[0]);

    setTimeout(() => {
      if (!isError) {
        addLog("[ETL Formatting Active]", "#A0AEC0");
      }
    }, delays[1]);

    setTimeout(() => {
      if (!isError) {
        addLog("[Row Engineering Completed]", "#A0AEC0");
      }
    }, delays[2]);

    try {
      // Dispatches authorized network transaction
      await secureRequest("/api/v1/pipeline/scrape", {
        method: "POST",
        body: JSON.stringify({ mode, targetUrl })
      });

      // Wait for the simulated logs to finish before showing success modal
      setTimeout(() => {
        setSuccessModal(true);
      }, delays[2] + 500);

    } catch (err: any) {
      setIsError(true);
      setIsExecuting(false);
      // Fault Interruption Handling
      const errMsg = err.message || "Unknown Network Exception";
      const is403 = errMsg.includes("403");
      const errorText = is403 ? "Critical Handshake Interruption: Code 403 (Forbidden)" : `Critical Handshake Interruption: ${errMsg}`;
      
      // Delay error log slightly so it appears at the end of the current log queue
      setTimeout(() => {
        addLog(errorText, "#FF3B30", true);
      }, delays[0] + 100);
    }
  };

  const baseAccent = isError ? "#FF3B30" : "#00E676";
  const mutedBorder = isError ? "rgba(255, 59, 48, 0.4)" : "#1A3326";

  return (
    <div style={{
      display: "flex",
      height: "100%",
      gap: "24px"
    }}>
      {/* ── Left Column (40%): Config Control Panel ────────────────────── */}
      <div style={{
        flex: "0 0 40%",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        <h2 style={{
          fontFamily: "var(--font-mono)",
          color: baseAccent,
          fontSize: "20px",
          margin: 0
        }}>
          Data Configuration Control
        </h2>

        {/* Scraping Mode Selector Toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A0AEC0", textTransform: "uppercase" }}>
            Scraping Mode Selector
          </label>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setMode("url")}
              disabled={isExecuting}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "transparent",
                border: `2px solid ${mode === "url" ? baseAccent : mutedBorder}`,
                color: mode === "url" ? baseAccent : "#A0AEC0",
                fontFamily: "var(--font-mono)",
                cursor: isExecuting ? "not-allowed" : "pointer",
                borderRadius: "4px",
                opacity: isExecuting ? 0.5 : 1
              }}
            >
              Target URL Endpoint
            </button>
            <button
              onClick={() => setMode("api")}
              disabled={isExecuting}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "transparent",
                border: `2px solid ${mode === "api" ? baseAccent : mutedBorder}`,
                color: mode === "api" ? baseAccent : "#A0AEC0",
                fontFamily: "var(--font-mono)",
                cursor: isExecuting ? "not-allowed" : "pointer",
                borderRadius: "4px",
                opacity: isExecuting ? 0.5 : 1
              }}
            >
              Direct Data API
            </button>
          </div>
        </div>

        {/* Target Source Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A0AEC0", textTransform: "uppercase" }}>
            Target Destination Workspace URL
          </label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={isExecuting}
            placeholder={mode === "url" ? "https://example.com/data" : "https://api.example.com/v1/resource"}
            style={{
              padding: "12px",
              backgroundColor: "rgba(13, 27, 19, 0.5)",
              border: `2px solid ${mutedBorder}`,
              color: "#FFFFFF",
              fontFamily: "var(--font-mono)",
              outline: "none",
              borderRadius: "4px",
              opacity: isExecuting ? 0.5 : 1
            }}
            onFocus={(e) => e.target.style.borderColor = baseAccent}
            onBlur={(e) => e.target.style.borderColor = mutedBorder}
          />
        </div>

        <button
          onClick={executePipeline}
          disabled={isExecuting || !targetUrl.trim()}
          style={{
            marginTop: "auto",
            padding: "16px",
            backgroundColor: isError ? "transparent" : baseAccent,
            border: isError ? `2px solid ${baseAccent}` : "none",
            color: isError ? baseAccent : "#040D08",
            fontWeight: "bold",
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            textTransform: "uppercase",
            cursor: (isExecuting || !targetUrl.trim()) ? "not-allowed" : "pointer",
            borderRadius: "4px",
            transform: isExecuting ? "scale(0.98)" : "scale(1)",
            transition: "transform 0.1s ease, background-color 0.3s ease",
            opacity: (!targetUrl.trim() && !isExecuting) ? 0.5 : 1
          }}
        >
          {isExecuting ? "Executing Pipeline..." : "Launch Pipeline Execution"}
        </button>
      </div>

      {/* ── Right Column (60%): Terminal Log Stream ────────────────────── */}
      <div 
        ref={terminalRef}
        style={{
          flex: "0 0 60%",
          backgroundColor: "#0D1B13",
          border: `4px solid ${mutedBorder}`,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <div style={{ borderBottom: `1px dashed ${mutedBorder}`, paddingBottom: "8px", marginBottom: "8px", color: "#A0AEC0", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase" }}>
          DecisionIQ Live Terminal Protocol
        </div>
        
        {logs.map((log) => (
          <div key={log.id} style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9.5pt", // specific requirement
            color: log.color || "#A0AEC0",
            fontWeight: log.bold ? "bold" : "normal"
          }}>
            <span style={{ opacity: 0.5, marginRight: "8px" }}>{new Date().toISOString().substring(11, 23)}</span>
            {log.text}
          </div>
        ))}

        {!isExecuting && logs.length === 0 && (
          <div style={{ color: "#1A3326", fontFamily: "var(--font-mono)", fontSize: "9.5pt", fontStyle: "italic" }}>
            &gt; Awaiting pipeline execution target...
          </div>
        )}
      </div>

      {/* ── Success Modal ────────────────────── */}
      {successModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(4, 13, 8, 0.85)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            backgroundColor: "#0D1B13",
            border: "4px solid #00E676",
            padding: "32px",
            width: "480px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            boxShadow: "0 0 40px rgba(0, 230, 118, 0.2)"
          }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(0, 230, 118, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: "#00E676" }}>
              ✓
            </div>
            <p style={{ fontFamily: "var(--font-mono)", color: "#FFFFFF", fontSize: "14px", textAlign: "center", lineHeight: "1.5" }}>
              Ingested 14,250 unique raw records successfully. Pipeline metrics cached.
            </p>
            <button
              onClick={() => router.push("/workspace/workshop")}
              style={{
                padding: "12px 24px",
                backgroundColor: "#00E676",
                color: "#040D08",
                border: "none",
                borderRadius: "4px",
                fontFamily: "var(--font-mono)",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Proceed to ML Workshop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
