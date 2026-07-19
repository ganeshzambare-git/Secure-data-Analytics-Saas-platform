"use client";

/**
 * AnalystLandingCanvas.tsx — Main Analyst Workspace (Enhanced UI Density)
 * ReadyNest Analytics Engine — Phase 5
 *
 * Analyst workspace features:
 *  - 12 total KPI Cards tracking scraper runs, dataset logs, and model accuracy (Screen 3)
 *  - Asymmetric 40/60 workspace composition layout
 *  - Responsive degradation drawer sliding canvas on Tablet
 *  - View 4: Pipeline Run Detail View (metadata cards, workflow timeline step cards, AI Summary, dependency logs)
 *  - View 5: Scraper Configuration Forms Drawer (Step trackers, auto-suggest header chips, live preview metrics)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useSecureData } from "@/context/SecureDataContext";

interface RunRecord {
  id: string;
  target_url: string;
  status: string;
  updated_at: string;
  metrics: {
    model_name?: string;
    accuracy?: number;
    rmse?: number;
    split_ratio?: number;
    columns_processed?: number;
    rows_scraped?: number;
  } | null;
}

export default function AnalystLandingCanvas() {
  const { secureRequest } = useSecureData();
  const [pipelineRuns, setPipelineRuns] = useState<RunRecord[]>([]);
  const [showNewTarget, setShowNewTarget] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"workspace" | "scraper" | "workshop" | "insights">("workspace");
  const [comments, setComments] = useState([
    { id: 1, user: "analyst_acme", text: "Normalized scraped records via BeautifulSoup v4.", time: "10m ago" },
    { id: 2, user: "admin_acme", text: "XGBoost accuracy fit verified (97.84% R²). Ready for production.", time: "2 hours ago" }
  ]);
  const [newComment, setNewComment] = useState("");
  const [predictInputDepth, setPredictInputDepth] = useState(12);
  const [predictInputLen, setPredictInputLen] = useState(45);
  const [predictInputExternal, setPredictInputExternal] = useState(true);
  const [predictionResult, setPredictionResult] = useState<number | null>(null);
  const [showNotebookCell, setShowNotebookCell] = useState(false);
  const [notebookCode, setNotebookCode] = useState("# Interactive Sandbox \nimport pandas as pd \nprint('Running ETL...')");
  const [activeBiTab, setActiveBiTab] = useState<"sales" | "ops" | "customer" | "finance" | "marketing">("sales");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [modelType, setModelType] = useState<string>("sklearn_rf");
  const [splitRatio, setSplitRatio] = useState<number>(80);
  const [trainingActive, setTrainingActive] = useState(false);
  
  // Dashboard SSR Chart
  const [svgChart, setSvgChart] = useState<string>("");
  const [heatmapChart, setHeatmapChart] = useState<string>("");
  const [forecastChart, setForecastChart] = useState<string>("");
  const [boundaryChart, setBoundaryChart] = useState<string>("");
  const [chartLoading, setChartLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Tablet drawer visibility state
  const [isTabletDrawerOpen, setIsTabletDrawerOpen] = useState(false);

  // Scraper Form Steps (Screen 5 Details)
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [customHeaderKey, setCustomHeaderKey] = useState("");
  const [customHeaderValue, setCustomHeaderValue] = useState("");
  const [autosaveIndicator, setAutosaveIndicator] = useState("Draft saved locally");

  // Phase 5 Ingestion and alert states
  const [scrapingMode, setScrapingMode] = useState<"url" | "api">("url");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "title_length", "has_number", "link_depth", "is_external"
  ]);

  const fetchRuns = useCallback(async () => {
    try {
      const runs = await secureRequest<RunRecord[]>("/api/v1/pipeline/runs");
      setPipelineRuns(runs);
      if (runs.length > 0) {
        setSelectedRunId((prev) => prev ?? runs[0].id);
      }
    } catch (e) {
      console.error("Failed to load runs", e);
    }
  }, [secureRequest]);

  const fetchChart = useCallback(async () => {
    if (!selectedRunId) return;
    setChartLoading(true);
    try {
      const res = await secureRequest<{ svg: string; heatmap: string; forecast: string; boundary: string }>(
        `/api/v1/dashboard/charts?run_id=${selectedRunId}`
      );
      setSvgChart(res.svg);
      setHeatmapChart(res.heatmap);
      setForecastChart(res.forecast);
      setBoundaryChart(res.boundary);
    } catch (e) {
      console.error("Failed to load SSR charts", e);
    } finally {
      setChartLoading(false);
    }
  }, [secureRequest, selectedRunId]);

  const handleExportPDF = async () => {
    if (!selectedRunId) return;
    setExportingPDF(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = sessionStorage.getItem("readynest_session") 
        ? JSON.parse(sessionStorage.getItem("readynest_session")!).token 
        : null;
        
      const response = await fetch(`${apiUrl}/api/v1/export/pdf?run_id=${selectedRunId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error("Failed to compile secure PDF document.");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Secure_PDF_Summary_${selectedRunId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e: any) {
      alert(e.message || "Failed to download PDF summary.");
    } finally {
      setExportingPDF(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  useEffect(() => {
    if (selectedRunId) {
      fetchChart();
    }
  }, [selectedRunId, fetchChart]);

  // Execute scrape and progressive output logs
  const handleScrapePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setLoading(true);
    setTerminalLogs([]);
    setHasError(false);
    setAutosaveIndicator("Syncing with queue...");
    
    const logStages = [
      "[Scraping Engine Initialized] Targetting URL: " + targetUrl,
      "[Scraping] Performing GET request...",
      "[Scraping] Successfully scraped target page elements.",
      "[ETL Formatting Active] Parsing DOM tree...",
      "[ETL] Cleaning whitespace and normalizing records...",
      "[Row Engineering Completed] Yielded clean feature matrix vectors."
    ];

    for (let i = 0; i < logStages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setTerminalLogs((prev) => [...prev, logStages[i]]);
    }

    try {
      const res = await secureRequest<{ success: boolean; run_id: string }>("/api/v1/pipeline/scrape", {
        method: "POST",
        body: JSON.stringify({ target_url: targetUrl }),
      });
      
      setTerminalLogs((prev) => [...prev, `[COMPLETED] Pipeline run verified. ID: ${res.run_id}`]);
      setTargetUrl("");
      setShowNewTarget(false);
      setIsTabletDrawerOpen(false);
      setFormStep(1);
      setAutosaveIndicator("Draft saved locally");
      setShowSuccessModal(true); // Trigger success flag alert layout
      fetchRuns();
    } catch (err: any) {
      setHasError(true); // Drop accents to warning crimson
      setTerminalLogs((prev) => [...prev, `[ERROR] Pipeline run failed: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedRunId) return;
    setTrainingActive(true);
    try {
      await secureRequest("/api/v1/pipeline/train", {
        method: "POST",
        body: JSON.stringify({
          run_id: selectedRunId,
          model_type: modelType,
          feature_columns: selectedFeatures,
          test_size: (100 - splitRatio) / 100,
        }),
      });
      
      await fetchRuns();
      await fetchChart();
    } catch (e: any) {
      alert(`Model training error: ${e.message}`);
    } finally {
      setTrainingActive(false);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments((prev) => [
      { id: Date.now(), user: "analyst_acme", text: newComment, time: "Just now" },
      ...prev
    ]);
    setNewComment("");
  };

  const handlePredictInference = (e: React.FormEvent) => {
    e.preventDefault();
    const score = Math.min(Math.max((predictInputDepth * 0.02) + (predictInputLen * 0.004) + (predictInputExternal ? 0.12 : 0.02) + 0.15, 0), 1);
    setPredictionResult(score);
  };

  const activeRun = pipelineRuns.find((r) => r.id === selectedRunId);

  // ── Auto-save simulated indicator ─────────────────────────────────
  useEffect(() => {
    if (targetUrl) {
      setAutosaveIndicator("Autosaving changes...");
      const t = setTimeout(() => setAutosaveIndicator("Draft saved locally"), 1000);
      return () => clearTimeout(t);
    }
  }, [targetUrl]);

  // ── Render Helpers ──────────────────────────────────────────────────

  const applySuggestedHeader = (key: string, val: string) => {
    setCustomHeaderKey(key);
    setCustomHeaderValue(val);
  };

  // Screen 5: Multi-step scraper node form
  const renderScraperForm = () => {
    const accentColor = hasError ? "#ff5555" : "var(--accent-neon)";
    const borderStyle = hasError ? { borderColor: "#ff5555" } : { borderColor: "var(--accent-neon)" };
    
    return (
      <div className="terminal-panel" style={borderStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: accentColor
          }}>
            {hasError ? "[!] Pipeline Ingestion Error" : "[▶] Configure Scraper Pipeline Node"}
          </h3>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {autosaveIndicator}
          </span>
        </div>
  
        {/* Steps Indicator inside form */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          <button 
            onClick={() => setFormStep(1)} 
            type="button" 
            style={{
              flex: 1,
              padding: "6px",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              border: `1px solid ${hasError ? "#ff5555" : "var(--border-green)"}`,
              borderRadius: "4px",
              backgroundColor: formStep === 1 ? (hasError ? "rgba(255, 85, 85, 0.08)" : "rgba(0, 230, 118, 0.08)") : "transparent",
              color: formStep === 1 ? accentColor : "var(--text-muted)"
            }}
          >
            [1] Target URL
          </button>
          <button 
            onClick={() => setFormStep(2)} 
            type="button" 
            style={{
              flex: 1,
              padding: "6px",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              border: `1px solid ${hasError ? "#ff5555" : "var(--border-green)"}`,
              borderRadius: "4px",
              backgroundColor: formStep === 2 ? (hasError ? "rgba(255, 85, 85, 0.08)" : "rgba(0, 230, 118, 0.08)") : "transparent",
              color: formStep === 2 ? accentColor : "var(--text-muted)"
            }}
          >
            [2] Request Headers
          </button>
          <button 
            onClick={() => setFormStep(3)} 
            type="button" 
            style={{
              flex: 1,
              padding: "6px",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              border: `1px solid ${hasError ? "#ff5555" : "var(--border-green)"}`,
              borderRadius: "4px",
              backgroundColor: formStep === 3 ? (hasError ? "rgba(255, 85, 85, 0.08)" : "rgba(0, 230, 118, 0.08)") : "transparent",
              color: formStep === 3 ? accentColor : "var(--text-muted)"
            }}
          >
            [3] Stream Preview
          </button>
        </div>
  
        <form onSubmit={handleScrapePipeline} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Step 1: Input URL */}
          {formStep === 1 && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--text-muted)", textTransform: "uppercase" }}>Ingestion Mode Selector</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setScrapingMode("url")}
                    style={{
                      padding: "3px 8px",
                      border: `1px solid ${hasError ? "#ff5555" : "var(--border-green)"}`,
                      backgroundColor: scrapingMode === "url" ? (hasError ? "rgba(255, 85, 85, 0.15)" : "rgba(0, 230, 118, 0.15)") : "transparent",
                      color: scrapingMode === "url" ? accentColor : "var(--text-muted)",
                      fontSize: "9px",
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                      borderRadius: "3px"
                    }}
                  >
                    Target URL Endpoint
                  </button>
                  <button
                    type="button"
                    onClick={() => setScrapingMode("api")}
                    style={{
                      padding: "3px 8px",
                      border: `1px solid ${hasError ? "#ff5555" : "var(--border-green)"}`,
                      backgroundColor: scrapingMode === "api" ? (hasError ? "rgba(255, 85, 85, 0.15)" : "rgba(0, 230, 118, 0.15)") : "transparent",
                      color: scrapingMode === "api" ? accentColor : "var(--text-muted)",
                      fontSize: "9px",
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                      borderRadius: "3px"
                    }}
                  >
                    Direct Data API
                  </button>
                </div>
              </div>
  
              <label style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                {scrapingMode === "url" ? "Target Web URL Location" : "Direct API Endpoint Address"}
              </label>
              <input
                type="text"
                placeholder={scrapingMode === "url" ? "https://news.ycombinator.com" : "/api/v1/external-feed"}
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="glow-input"
                style={hasError ? { borderColor: "#ff5555", boxShadow: "0 0 5px rgba(255,85,85,0.2)" } : undefined}
                required
              />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
              <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SUGGESTED:</span>
              <button type="button" onClick={() => setTargetUrl("https://news.ycombinator.com")} style={{ fontSize: "9px", color: "var(--accent-teal)", background: "transparent", border: "none", cursor: "pointer" }}>[HackerNews]</button>
              <button type="button" onClick={() => setTargetUrl("https://reddit.com/r/python")} style={{ fontSize: "9px", color: "var(--accent-teal)", background: "transparent", border: "none", cursor: "pointer" }}>[Reddit Python]</button>
            </div>
          </div>
        )}

        {/* Step 2: Custom headers + Suggestions */}
        {formStep === 2 && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Header Key</span>
                <input type="text" value={customHeaderKey} onChange={(e) => setCustomHeaderKey(e.target.value)} className="glow-input" placeholder="User-Agent" style={{ fontSize: "12px", padding: "6px" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Header Value</span>
                <input type="text" value={customHeaderValue} onChange={(e) => setCustomHeaderValue(e.target.value)} className="glow-input" placeholder="Mozilla/5.0" style={{ fontSize: "12px", padding: "6px" }} />
              </div>
            </div>

            {/* Suggestions Chips */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", alignSelf: "center" }}>AI SUGGESTIONS:</span>
              <button type="button" onClick={() => applySuggestedHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecureScraper/2.1")} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", backgroundColor: "rgba(49, 151, 149, 0.08)", border: "1px solid var(--accent-teal)", color: "var(--accent-teal)" }}>
                Standard Scraper Agent
              </button>
              <button type="button" onClick={() => applySuggestedHeader("Accept", "application/json")} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", backgroundColor: "rgba(49, 151, 149, 0.08)", border: "1px solid var(--accent-teal)", color: "var(--accent-teal)" }}>
                Accept JSON
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Stream Preview */}
        {formStep === 3 && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Dynamic Stream Preview Array
            </span>
            <div style={{ backgroundColor: "#020805", border: "1px solid var(--border-green)", padding: "10px", borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: "10px" }}>
              <code style={{ color: "var(--accent-teal)" }}>
                {`{
  "target_resolved": "${targetUrl || "none"}",
  "injected_custom_headers": {
    "${customHeaderKey || "null"}": "${customHeaderValue || "null"}"
  },
  "mock_yield_records": 12,
  "data_normalizer": "BeautifulSoup v4"
}`}
              </code>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
          <button 
            type="button" 
            onClick={() => { setShowNewTarget(false); setIsTabletDrawerOpen(false); setFormStep(1); }} 
            className="secondary-button" 
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            Cancel
          </button>
          
          {formStep < 3 ? (
            <button 
              type="button" 
              onClick={() => setFormStep((prev) => (prev + 1) as any)} 
              className="secondary-button" 
              style={{ padding: "8px 16px", fontSize: "12px", borderColor: "var(--accent-neon)", color: "var(--accent-neon)" }}
            >
              Next Step
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading || !targetUrl} 
              className="glow-button" 
              style={{ padding: "8px 20px", fontSize: "12px" }}
            >
              {loading ? "Engaged..." : "Execute Pipeline"}
            </button>
          )}
        </div>
      </form>

      {terminalLogs.length > 0 && (
        <div className="terminal-text" style={{
          marginTop: "16px",
          backgroundColor: "#020805",
          border: `1px solid ${accentColor}`,
          borderRadius: "4px",
          padding: "12px",
          maxHeight: "180px",
          overflowY: "auto",
          fontSize: "11px",
          color: accentColor,
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          {terminalLogs.map((log, idx) => (
            <div key={idx} style={{ color: log.includes("[ERROR]") ? "#ff5555" : undefined }}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};

  const renderWorkshop = () => {
    if (!activeRun) return null;
    return (
      <div id="ml-workshop-section" className="terminal-panel" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <h3 style={{
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--accent-teal)",
          marginBottom: "4px"
        }}>
          [🛠] Machine Learning Workshop
        </h3>

        {/* Model Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            CHOOSE PREDICTIVE MODEL
          </label>
          <select
            value={modelType}
            onChange={(e: any) => setModelType(e.target.value)}
            className="glow-input"
            style={{ cursor: "pointer", fontSize: "12px", padding: "8px 10px" }}
          >
            <option value="sklearn_rf">Scikit-Learn Random Forest Regressor</option>
            <option value="sklearn_rf_classifier">Scikit-Learn Random Forest Classifier</option>
            <option value="xgboost_regressor">XGBoost Gradient Boosting Regressor</option>
            <option value="xgboost_classifier">XGBoost Classifier</option>
            <option value="sklearn_linear">Scikit-Learn Linear Regression</option>
            <option value="sklearn_logistic">Scikit-Learn Logistic Regression Classifier</option>
          </select>
        </div>

        {/* Feature Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            TARGET FEATURE VECTORS
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", backgroundColor: "#020805", border: "1px solid var(--border-green)", padding: "8px", borderRadius: "4px" }}>
            {["title_length", "has_number", "link_depth", "is_external"].map((feat) => (
              <label key={feat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontFamily: "var(--font-mono)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feat)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFeatures((prev) => [...prev, feat]);
                    } else {
                      setSelectedFeatures((prev) => prev.filter((f) => f !== feat));
                    }
                  }}
                  style={{ accentColor: "var(--accent-neon)" }}
                />
                {feat}
              </label>
            ))}
          </div>
        </div>

        {/* Train/Test Split Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>TRAIN-TEST SPLIT RATIO</span>
            <span style={{ color: "var(--accent-neon)" }}>{splitRatio}% / {100 - splitRatio}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="90"
            value={splitRatio}
            onChange={(e) => setSplitRatio(parseInt(e.target.value))}
            style={{
              accentColor: "var(--accent-neon)",
              cursor: "pointer",
              width: "100%"
            }}
          />
        </div>

        <button
          onClick={handleTrainModel}
          disabled={trainingActive || activeRun.status === "Scraping"}
          className="tactile-button"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {trainingActive ? "Fitting parameters..." : "Execute Model Training"}
        </button>

        {/* Output Scores Table */}
        <div style={{ marginTop: "8px" }}>
          <h4 style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-primary)",
            marginBottom: "8px",
            textTransform: "uppercase"
          }}>
            [📈] Evaluation Metrics
          </h4>
          
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-green)", color: "var(--text-muted)" }}>
                <th style={{ textAlign: "left", padding: "6px 0", fontFamily: "var(--font-mono)" }}>Metric Configuration</th>
                <th style={{ textAlign: "right", padding: "6px 0", fontFamily: "var(--font-mono)" }}>Value</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: "var(--font-mono)" }}>
              <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.15)" }}>
                <td style={{ padding: "6px 0" }} data-label="Metric">Scraped Feature Rows</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: "var(--accent-teal)" }} data-label="Value">
                  {activeRun.metrics?.rows_scraped || 0}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.15)" }}>
                <td style={{ padding: "6px 0" }} data-label="Metric">Engineered Columns</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: "var(--accent-teal)" }} data-label="Value">
                  {activeRun.metrics?.columns_processed || 0}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.15)" }}>
                <td style={{ padding: "6px 0" }} data-label="Metric">Target Model Trained</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: "var(--accent-neon)", textTransform: "uppercase" }} data-label="Value">
                  {activeRun.metrics?.model_name || "N/A"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.15)" }}>
                <td style={{ padding: "6px 0" }} data-label="Metric">Training Split Ratio</td>
                <td style={{ padding: "6px 0", textAlign: "right" }} data-label="Value">
                  {activeRun.metrics?.split_ratio ? `${activeRun.metrics.split_ratio * 100}%` : "N/A"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.15)" }}>
                <td style={{ padding: "6px 0", fontWeight: "600" }} data-label="Metric">Accuracy (R²)</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: "var(--accent-neon)" }} data-label="Value">
                  {activeRun.metrics?.accuracy ? activeRun.metrics.accuracy.toFixed(4) : "N/A"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.15)" }}>
                <td style={{ padding: "6px 0", fontWeight: "600" }} data-label="Metric">RMSE</td>
                <td style={{ padding: "6px 0", textAlign: "right", color: "#f6ad55" }} data-label="Value">
                  {activeRun.metrics?.rmse ? activeRun.metrics.rmse.toFixed(4) : "N/A"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="fade-in">
      
      {/* ── Slide-Out Drawer overlay for Tablet Mode ────────────────── */}
      <div 
        className={`drawer-overlay ${isTabletDrawerOpen ? "active" : ""}`}
        onClick={() => setIsTabletDrawerOpen(false)}
      />
      <div className={`drawer-content ${isTabletDrawerOpen ? "active" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", textTransform: "uppercase" }}>
            Workspace Control Drawer
          </h3>
          <button 
            onClick={() => setIsTabletDrawerOpen(false)}
            className="secondary-button"
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            Close
          </button>
        </div>
        {renderScraperForm()}
        {renderWorkshop()}
      </div>

      {/* ── Local Sub-Tab Navigation Bar ───────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-green)", paddingBottom: "10px", flexWrap: "wrap" }}>
        <button 
          onClick={() => { setActiveWorkspaceTab("workspace"); setIsFullscreen(false); }}
          className={`role-btn ${activeWorkspaceTab === "workspace" ? "active" : ""}`}
          style={{ flex: "none", padding: "8px 16px" }}
        >
          📊 Analyst Workspace
        </button>
        <button 
          onClick={() => { setActiveWorkspaceTab("scraper"); setIsFullscreen(false); }}
          className={`role-btn ${activeWorkspaceTab === "scraper" ? "active" : ""}`}
          style={{ flex: "none", padding: "8px 16px" }}
        >
          🕸️ Scraper Terminal
        </button>
        <button 
          onClick={() => { setActiveWorkspaceTab("workshop"); setIsFullscreen(false); }}
          className={`role-btn ${activeWorkspaceTab === "workshop" ? "active" : ""}`}
          style={{ flex: "none", padding: "8px 16px" }}
        >
          🧠 ML Workshop
        </button>
        <button 
          onClick={() => setActiveWorkspaceTab("insights")}
          className={`role-btn ${activeWorkspaceTab === "insights" ? "active" : ""}`}
          style={{ flex: "none", padding: "8px 16px" }}
        >
          📈 Visual Insights
        </button>
      </div>

      {/* ── Screen 3: Analyst Workspace Tab ────────────────────────────── */}
      {activeWorkspaceTab === "workspace" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="fade-in">
          
          {/* High Density 12-Card KPI Grid (Analyst View) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Scraping Runs</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "4px" }}>{pipelineRuns.length}</div>
              </div>
              <span style={{ fontSize: "20px" }}>🌐</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Rows Scraped</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-teal)", marginTop: "4px" }}>{activeRun?.metrics?.rows_scraped || 0}</div>
              </div>
              <span style={{ fontSize: "20px" }}>📊</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Processed Cols</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>{activeRun?.metrics?.columns_processed || 0}</div>
              </div>
              <span style={{ fontSize: "20px" }}>⚡</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Model Fit (R²)</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "4px" }}>{activeRun?.metrics?.accuracy ? activeRun.metrics.accuracy.toFixed(4) : "N/A"}</div>
              </div>
              <span style={{ fontSize: "20px" }}>📈</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Error (RMSE)</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "#f6ad55", marginTop: "4px" }}>{activeRun?.metrics?.rmse ? activeRun.metrics.rmse.toFixed(4) : "N/A"}</div>
              </div>
              <span style={{ fontSize: "20px" }}>📉</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Fitting Queue</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "4px" }}>0</div>
              </div>
              <span style={{ fontSize: "20px" }}>📦</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Model Cache</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>2</div>
              </div>
              <span style={{ fontSize: "20px" }}>💾</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Normalizations</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-teal)", marginTop: "4px" }}>18</div>
              </div>
              <span style={{ fontSize: "20px" }}>🧹</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Scraper Queries</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>12</div>
              </div>
              <span style={{ fontSize: "20px" }}>🕸️</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Scrape Routes</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-neon)", marginTop: "4px" }}>1</div>
              </div>
              <span style={{ fontSize: "20px" }}>📍</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Telemetry Rate</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--accent-teal)", marginTop: "4px" }}>14.2 MB/s</div>
              </div>
              <span style={{ fontSize: "20px" }}>📟</span>
            </div>

            <div className="terminal-panel" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Scrape Memory</div>
                <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>4.2 MB</div>
              </div>
              <span style={{ fontSize: "20px" }}>💾</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {pipelineRuns.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>Selected Run:</span>
                <select
                  value={selectedRunId || ""}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                  className="glow-input"
                  style={{ padding: "6px 12px", fontSize: "12px", width: "280px", cursor: "pointer" }}
                >
                  {pipelineRuns.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.target_url} ({new Date(r.updated_at).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowNewTarget(true)} className="glow-button" style={{ padding: "8px 16px", fontSize: "12px" }}>+ New Workspace Target</button>
            </div>
          </div>

          {pipelineRuns.length === 0 && !showNewTarget ? (
            <div className="terminal-panel" style={{ textAlign: "center", padding: "80px 40px" }}>
              <div style={{ fontSize: "44px", marginBottom: "16px" }}>🔍</div>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>No Data Runs Configured</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "460px", margin: "0 auto 24px auto" }}>
                No analytical data streams initialized. Start your multi-phase end-to-end pipeline by designating a target file matrix or crawler route.
              </p>
              <button onClick={() => setShowNewTarget(true)} className="glow-button">+ Initiate Scraper Route</button>
            </div>
          ) : (
            <div className="split-view-container" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
              
              {/* Screen 3 Left: Data Summaries, Queries, Schema Viewer, Sandbox */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {showNewTarget && renderScraperForm()}
                
                {/* Dataset Summary Cards */}
                <div className="terminal-panel">
                  <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-neon)", marginBottom: "12px" }}>[📁] Active Dataset Summaries</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ border: "1px solid var(--border-green)", padding: "10px", borderRadius: "4px", backgroundColor: "#020805" }}>
                      <span style={{ fontSize: "11px", fontWeight: "bold" }}>hn_scraped_corpus_v1.parquet</span>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                        <span>Rows: 14,250</span>
                        <span>Size: 1.2 MB</span>
                        <span style={{ color: "var(--accent-neon)" }}>Integrity: 99.98%</span>
                      </div>
                    </div>
                    <div style={{ border: "1px solid var(--border-green)", padding: "10px", borderRadius: "4px", backgroundColor: "#020805" }}>
                      <span style={{ fontSize: "11px", fontWeight: "bold" }}>reddit_clean_vectors.csv</span>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                        <span>Rows: 8,420</span>
                        <span>Size: 760 KB</span>
                        <span style={{ color: "var(--accent-neon)" }}>Integrity: 100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Query Performance Metrics */}
                <div className="terminal-panel">
                  <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>[⚡] Query Execution Performance</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(26,51,38,0.2)", paddingBottom: "4px" }}>
                      <span>SELECT * FROM pipeline_runs</span>
                      <span style={{ color: "var(--accent-neon)" }}>18ms (Cached)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(26,51,38,0.2)", paddingBottom: "4px" }}>
                      <span>INSERT INTO system_audit_logs</span>
                      <span style={{ color: "var(--accent-teal)" }}>34ms</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
                      <span>JOIN tenants ON users.tenant_id</span>
                      <span style={{ color: "#f6ad55" }}>102ms (No Index)</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Schema Viewer */}
                <div className="terminal-panel">
                  <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>[🔍] Database Schema Viewer</h3>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div>📂 <strong>tenants</strong> (id: uuid, company_name: varchar, is_active: bool)</div>
                    <div style={{ paddingLeft: "12px" }}>└─ 📂 <strong>users</strong> (id: uuid, tenant_id: uuid, username: varchar, role: varchar)</div>
                    <div style={{ paddingLeft: "24px" }}>└─ 📂 <strong>pipeline_runs</strong> (id: uuid, tenant_id: uuid, target_url: varchar, metrics: jsonb)</div>
                    <div style={{ paddingLeft: "36px" }}>└─ 📂 <strong>system_audit_logs</strong> (id: bigserial, tenant_id: uuid, action_performed: text)</div>
                  </div>
                </div>

                {/* Interactive Code Notebook Sandbox */}
                <div className="terminal-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", margin: 0 }}>[📓] Interactive Notebook Cell</h3>
                    <button onClick={() => setShowNotebookCell(!showNotebookCell)} className="secondary-button" style={{ padding: "2px 8px", fontSize: "10px" }}>
                      {showNotebookCell ? "Collapse Cell" : "Expand Editor"}
                    </button>
                  </div>
                  {showNotebookCell && (
                    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <textarea
                        value={notebookCode}
                        onChange={(e) => setNotebookCode(e.target.value)}
                        className="glow-input"
                        style={{ width: "100%", height: "100px", fontFamily: "var(--font-mono)", fontSize: "11px", backgroundColor: "#020805", resize: "none" }}
                      />
                      <button onClick={() => alert("ETL cell execution compiled successfully.")} className="glow-button" style={{ padding: "6px", fontSize: "11px" }}>Execute Code Block</button>
                    </div>
                  )}
                </div>

                {/* Bookmarks & Saved Queries */}
                <div className="terminal-panel">
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>FAVORITES & BOOKMARKS</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                    <span className="badge badge-info" style={{ cursor: "pointer" }}>⭐ hacker_news_daily</span>
                    <span className="badge badge-info" style={{ cursor: "pointer" }}>⭐ reddit_python_weekly</span>
                    <span className="badge badge-info" style={{ cursor: "pointer" }}>⭐ acme_mrr_trends</span>
                  </div>
                </div>

              </div>

              {/* Screen 3 Right: Data Preview, Version History, Collaboration Comments */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Data Preview Grid */}
                <div className="terminal-panel">
                  <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-neon)", marginBottom: "12px" }}>[📊] Scraped Dataset Preview (Sample Rows)</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-green)", color: "var(--text-muted)", textAlign: "left" }}>
                          <th style={{ padding: "6px" }}>Title URL</th>
                          <th style={{ padding: "6px" }}>Depth</th>
                          <th style={{ padding: "6px" }}>HTML Elements</th>
                          <th style={{ padding: "6px", textAlign: "right" }}>Integrity Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid rgba(26,51,38,0.2)" }}>
                          <td style={{ padding: "6px", color: "var(--accent-neon)" }}>https://news.ycombinator.com</td>
                          <td style={{ padding: "6px" }}>12</td>
                          <td style={{ padding: "6px" }}>1,402 divs</td>
                          <td style={{ padding: "6px", textAlign: "right", color: "var(--accent-neon)" }}>99.98%</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid rgba(26,51,38,0.2)" }}>
                          <td style={{ padding: "6px", color: "var(--accent-neon)" }}>https://reddit.com/r/python</td>
                          <td style={{ padding: "6px" }}>8</td>
                          <td style={{ padding: "6px" }}>982 articles</td>
                          <td style={{ padding: "6px", textAlign: "right", color: "var(--accent-neon)" }}>100%</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid rgba(26,51,38,0.2)" }}>
                          <td style={{ padding: "6px", color: "var(--accent-neon)" }}>https://github.com/trending</td>
                          <td style={{ padding: "6px" }}>15</td>
                          <td style={{ padding: "6px" }}>2,145 lists</td>
                          <td style={{ padding: "6px", textAlign: "right", color: "var(--accent-neon)" }}>99.96%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Collaboration panel comments */}
                <div className="terminal-panel">
                  <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>[👥] Shared Workspace Annotations</h3>
                  <form onSubmit={handleAddComment} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <input
                      type="text"
                      placeholder="Type comment annotation..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="glow-input"
                      style={{ flex: 1, padding: "6px" }}
                      required
                    />
                    <button type="submit" className="glow-button" style={{ padding: "6px 12px", fontSize: "11px" }}>Post</button>
                  </form>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto" }}>
                    {comments.map((c) => (
                      <div key={c.id} style={{ borderBottom: "1px solid rgba(26,51,38,0.15)", paddingBottom: "6px", fontSize: "11.5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "10px", fontFamily: "var(--font-mono)" }}>
                          <span>@{c.user}</span>
                          <span>{c.time}</span>
                        </div>
                        <p style={{ color: "var(--text-primary)", marginTop: "2px" }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Version Control History */}
                <div className="terminal-panel">
                  <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>[📜] Parameter Version Registry</h3>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><span style={{ color: "var(--accent-neon)" }}>commit cc1892a</span>: updated Random Forest estimators count to 150. (analyst_acme)</div>
                    <div><span style={{ color: "var(--accent-teal)" }}>commit 991aa2c</span>: optimized BeautifulSoup tag normalizers parameters. (admin_acme)</div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ── Screen 4: Live Scraper Terminal Tab ─────────────────────────── */}
      {activeWorkspaceTab === "scraper" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }} className="fade-in split-view-container">
          
          {/* Screen 4 Left: Form, diagnostics, queue */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {renderScraperForm()}

            {/* Diagnostics and Core Loads */}
            <div className="terminal-panel">
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-neon)", marginBottom: "12px" }}>[🔌] Scraper Process Core Diagnostics</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                <div>
                  <span>Crawler CPU Core Utilization (Core 2)</span>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#020805", borderRadius: "3px", overflow: "hidden", marginTop: "3px" }}>
                    <div style={{ width: "24.8%", height: "100%", backgroundColor: "var(--accent-neon)" }}/>
                  </div>
                </div>
                <div>
                  <span>Crawler Memory Allocated Heap</span>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#020805", borderRadius: "3px", overflow: "hidden", marginTop: "3px" }}>
                    <div style={{ width: "62.4%", height: "100%", backgroundColor: "var(--accent-teal)" }}/>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "10px" }}>
                  <span>STATUS: RUNNING</span>
                  <span>SCHEDULER: 60s INTERVAL</span>
                  <span>RATE: NOMINAL</span>
                </div>
              </div>
            </div>

            {/* AI Ingestion Quality Monitor */}
            <div className="terminal-panel" style={{ border: "1px solid var(--accent-neon)", backgroundColor: "#020805" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-neon)" }}></span>
                <span style={{ fontSize: "11px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>[READYNEST_AI_CRAWL_AUDIT]</span>
              </div>
              <code style={{ fontSize: "10.5px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                &gt; CAPTCHA checking active. Zero anti-bot scripts matched. DOM layout conforms to clean hierarchy guidelines. Dead links: 0.12%.
              </code>
            </div>

          </div>

          {/* Screen 4 Right: Terminal logs, job queue, export */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Live Scraper Output Console */}
            <div className="terminal-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>[🕸️] Live Scraper Terminal Log Console</h3>
              <div style={{
                flex: 1,
                backgroundColor: "#020805",
                border: "1px solid var(--border-green)",
                borderRadius: "4px",
                padding: "16px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--accent-neon)",
                overflowY: "auto",
                minHeight: "220px",
                maxHeight: "350px",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}>
                <div>[SYSTEM] Scraper Kernel 4.19.0-x64-prod active</div>
                <div>[SYSTEM] Initializing memory pools... OK</div>
                <div>[SYSTEM] Handshaking with remote API cluster... OK</div>
                {terminalLogs.map((log, idx) => (
                  <div key={idx} style={{ color: log.includes("[ERROR]") ? "#ff5555" : undefined }}>{log}</div>
                ))}
                <div>&gt; Awaiting next scraping route trigger signal... <span style={{ animation: "pulse 1s infinite" }}>■</span></div>
              </div>
            </div>

            {/* Active Queues & Retries */}
            <div className="terminal-panel">
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>[⏳] Active Crawler Job Queue</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(26,51,38,0.2)", paddingBottom: "4px" }}>
                  <span>https://news.ycombinator.com</span>
                  <span style={{ color: "var(--accent-neon)" }}>In Progress (Depth 8/12)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(26,51,38,0.2)", paddingBottom: "4px" }}>
                  <span>https://reddit.com/r/python</span>
                  <span style={{ color: "var(--text-muted)" }}>Queued (Backlog: 1)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
                  <span>Retry Backlog Stack</span>
                  <span style={{ color: "var(--accent-neon)" }}>0 Items</span>
                </div>
              </div>
            </div>

            {/* Historical exports */}
            <div className="terminal-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>HISTORICAL INGESTION PACKAGES</span>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>hn_scraped_vectors_2026-07-16.parquet</div>
              </div>
              <button className="secondary-button" style={{ padding: "6px 12px", fontSize: "11px" }}>Export CSV</button>
            </div>

          </div>

        </div>
      )}

      {/* ── Screen 5: ML Workshop Tab ──────────────────────────────────── */}
      {activeWorkspaceTab === "workshop" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }} className="fade-in split-view-container">
          
          {/* Screen 5 Left: Parameters config form, Registry */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {renderWorkshop()}

            {/* Model Registry versions list */}
            <div className="terminal-panel">
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>[🧠] Enterprise Model Registry</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(26,51,38,0.2)", paddingBottom: "4px" }}>
                  <span>XGBoost Classifier v1.7.2 (Current Production)</span>
                  <span style={{ color: "var(--accent-neon)" }}>DEPLOYED (Accuracy: 97.84%)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(26,51,38,0.2)", paddingBottom: "4px" }}>
                  <span>RandomForest Regressor v1.4.1</span>
                  <span style={{ color: "var(--text-muted)" }}>ARCHIVED (Accuracy: 96.12%)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
                  <span>XGBoost Regressor v1.8.0-dev</span>
                  <span style={{ color: "var(--accent-teal)" }}>STAGING (Accuracy: 98.02%)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Screen 5 Right: Performance timelines, logs, predict sandbox */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Run metadata & timelines */}
            {activeRun && (
              <div className="terminal-panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", margin: 0 }}>[🔎] Run Telemetry Details & Timeline</h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="terminal-panel" style={{ padding: "8px", backgroundColor: "#020805" }}>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>TARGET DOMAIN</span>
                    <p style={{ fontSize: "11.5px", color: "var(--accent-neon)", marginTop: "2px", fontWeight: "600" }}>{activeRun.target_url}</p>
                  </div>
                  <div className="terminal-panel" style={{ padding: "8px", backgroundColor: "#020805" }}>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>TUNNEL SCAN</span>
                    <p style={{ fontSize: "11.5px", color: "var(--accent-neon)", marginTop: "2px", fontWeight: "600" }}>SHA-256 SECURED</p>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>WORKFLOW STEPS TRANSIT TRACKER</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginTop: "4px" }}>
                    {["1. SCRAPE", "2. CLEAN", "3. ML FIT", "4. PLOT"].map((stepText) => (
                      <div key={stepText} style={{ padding: "6px 2px", border: "1px solid var(--accent-neon)", borderRadius: "3px", backgroundColor: "rgba(0,230,118,0.04)", textAlign: "center" }}>
                        <span style={{ fontSize: "9.5px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)" }}>{stepText} ✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Inference Predict Simulator Sandbox */}
            <div className="terminal-panel">
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-neon)", marginBottom: "12px" }}>[🔬] Real-Time Prediction Sandbox</h3>
              <form onSubmit={handlePredictInference} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Link Depth Parameter</span>
                    <input type="number" value={predictInputDepth} onChange={(e) => setPredictInputDepth(parseInt(e.target.value) || 0)} className="glow-input" style={{ padding: "6px", fontSize: "12px" }} required />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Title Characters Length</span>
                    <input type="number" value={predictInputLen} onChange={(e) => setPredictInputLen(parseInt(e.target.value) || 0)} className="glow-input" style={{ padding: "6px", fontSize: "12px" }} required />
                  </div>
                </div>
                
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontFamily: "var(--font-mono)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={predictInputExternal}
                    onChange={(e) => setPredictInputExternal(e.target.checked)}
                    style={{ accentColor: "var(--accent-neon)" }}
                  />
                  Contains External Ingress Elements
                </label>

                <button type="submit" className="glow-button" style={{ padding: "8px", fontSize: "11px" }}>Compute Anomaly Prediction Score</button>
              </form>

              {predictionResult !== null && (
                <div className="fade-in" style={{ marginTop: "12px", padding: "10px", border: "1px solid var(--accent-neon)", borderRadius: "4px", backgroundColor: "#020805", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>PREDICTED ANOMALY CLASSIFICATION:</span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: predictionResult > 0.5 ? "#e53e3e" : "var(--accent-neon)", fontFamily: "var(--font-mono)" }}>
                    {(predictionResult * 100).toFixed(2)}% {predictionResult > 0.5 ? "[SUSPICIOUS]" : "[NOMINAL]"}
                  </span>
                </div>
              )}
            </div>

            {/* Experiment Runs Timeline Logs */}
            <div className="terminal-panel" style={{ flex: 1 }}>
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "12px" }}>[📜] Fitting Experiment Run History</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", fontFamily: "var(--font-mono)", maxHeight: "150px", overflowY: "auto" }}>
                <div>• Run ID: <code>fit-8842-xa</code> | XGBoost RF | Accuracy: 97.84% | Status: <span style={{ color: "var(--accent-neon)" }}>Completed</span></div>
                <div>• Run ID: <code>fit-1209-ba</code> | RF Regressor | Accuracy: 96.12% | Status: <span style={{ color: "var(--text-muted)" }}>Completed</span></div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── Screen 6: Visual Insights Board Tab ────────────────────────── */}
      {activeWorkspaceTab === "insights" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="fade-in">
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Storytelling annotation summary */}
            <div className="terminal-panel" style={{ flex: 1, padding: "14px", borderLeft: "3px solid var(--accent-neon)" }}>
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-neon)", margin: 0 }}>Strategic Executive Summary Statement</h3>
              <p style={{ fontSize: "11.5px", color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.4" }}>
                Neural network telemetry indexes indicate a <strong>94% optimization potential</strong> within the edge data crawling clusters. Current trajectories suggest bottleneck mitigations are required prior to Q3 integration sync.
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className="secondary-button" 
                style={{ padding: "8px 14px", fontSize: "11px" }}
              >
                {isFullscreen ? "Exit Presentation" : "📺 Presentation Mode"}
              </button>
              {svgChart && (
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="glow-button"
                  style={{ padding: "8px 16px", fontSize: "11px" }}
                >
                  {exportingPDF ? "[EXPORTING PDF...]" : "Export Secure PDF Summary Document"}
                </button>
              )}
            </div>
          </div>

          {/* Regional Performance Metrics */}
          <div className="terminal-panel">
            <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-teal)", marginBottom: "10px" }}>[🌍] Global Node Crawler Regional Performance</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
              <div style={{ border: "1px solid var(--border-green)", padding: "10px", borderRadius: "4px", backgroundColor: "#020805" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>US-EAST EDGE NODE</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--accent-neon)", marginTop: "2px" }}>142 reqs/s</div>
              </div>
              <div style={{ border: "1px solid var(--border-green)", padding: "10px", borderRadius: "4px", backgroundColor: "#020805" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>EU-WEST EDGE NODE</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--accent-neon)", marginTop: "2px" }}>104 reqs/s</div>
              </div>
              <div style={{ border: "1px solid var(--border-green)", padding: "10px", borderRadius: "4px", backgroundColor: "#020805" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>APAC-SOUTHEAST NODE</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--accent-teal)", marginTop: "2px" }}>89 reqs/s</div>
              </div>
            </div>
          </div>

          {/* BI Dashboard Selectors */}
          <div className="terminal-panel">
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>DOMAIN BUSINESS INTELLIGENCE DASHBOARDSELECTOR</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
              {["sales", "ops", "customer", "finance", "marketing"].map((tabName) => (
                <button
                  key={tabName}
                  onClick={() => setActiveBiTab(tabName as any)}
                  className={`secondary-button ${activeBiTab === tabName ? "glow-button" : ""}`}
                  style={{ fontSize: "10px", padding: "4px 8px", textTransform: "uppercase" }}
                >
                  {tabName} Dashboard
                </button>
              ))}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "12px" }}>
              <div style={{ padding: "10px", border: "1px solid var(--border-green)", borderRadius: "4px", backgroundColor: "#020805" }}>
                <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>TOTAL TELEMETRY INGESTED</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)", marginTop: "2px" }}>
                  {activeBiTab === "sales" && "$41,200 MRR"}
                  {activeBiTab === "ops" && "14,250 rows"}
                  {activeBiTab === "customer" && "99.85% Satisfaction"}
                  {activeBiTab === "finance" && "$1.24M ARR"}
                  {activeBiTab === "marketing" && "18.4% Conversion"}
                </div>
              </div>
              <div style={{ padding: "10px", border: "1px solid var(--border-green)", borderRadius: "4px", backgroundColor: "#020805" }}>
                <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>DAILY TREND ACCELERATION</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--accent-neon)", marginTop: "2px" }}>
                  {activeBiTab === "sales" && "+12.4% ARR"}
                  {activeBiTab === "ops" && "0.45ms Latency"}
                  {activeBiTab === "customer" && "+2.4% Retention"}
                  {activeBiTab === "finance" && "-1.2% Cost Offset"}
                  {activeBiTab === "marketing" && "+5.4% Ingress"}
                </div>
              </div>
              <div style={{ padding: "10px", border: "1px solid var(--border-green)", borderRadius: "4px", backgroundColor: "#020805" }}>
                <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>RISK INTEGRITY INDICATOR</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--accent-neon)", marginTop: "2px" }}>NOMINAL</div>
              </div>
              <div style={{ padding: "10px", border: "1px solid var(--border-green)", borderRadius: "4px", backgroundColor: "#020805" }}>
                <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>ANOMALY SCORE RATIO</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--accent-neon)", marginTop: "2px" }}>0.00% Leak</div>
              </div>
            </div>
          </div>

          {/* Visual SVG SSR Charts Grid */}
          <div className="terminal-panel">
            <h3 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--accent-neon)", marginBottom: "16px" }}>
              [🛡️] Pre-Rendered Server-Side Vector Charts
            </h3>
            
            {chartLoading ? (
              <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#020805", border: "1px solid var(--border-green)", borderRadius: "4px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                [DECRYPTING & COMPILING SSR VECTOR ASSETS...]
              </div>
            ) : svgChart ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: isFullscreen ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={{ backgroundColor: "rgba(13, 27, 19, 0.85)", border: "1px solid #1A3326", borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)", marginBottom: "8px" }}>MODEL ACCURACY FIT</div>
                    <div dangerouslySetInnerHTML={{ __html: svgChart }} style={{ width: "100%", height: isFullscreen ? "300px" : "180px", display: "flex", justifyContent: "center" }} />
                  </div>

                  <div style={{ backgroundColor: "rgba(13, 27, 19, 0.85)", border: "1px solid #1A3326", borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)", marginBottom: "8px" }}>METRIC HEATMAP CORRELATION</div>
                    <div dangerouslySetInnerHTML={{ __html: heatmapChart }} style={{ width: "100%", height: isFullscreen ? "300px" : "180px", display: "flex", justifyContent: "center" }} />
                  </div>

                  <div style={{ backgroundColor: "rgba(13, 27, 19, 0.85)", border: "1px solid #1A3326", borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)", marginBottom: "8px" }}>FORECAST PROJECTION PATHWAY</div>
                    <div dangerouslySetInnerHTML={{ __html: forecastChart }} style={{ width: "100%", height: isFullscreen ? "300px" : "180px", display: "flex", justifyContent: "center" }} />
                  </div>

                  <div style={{ backgroundColor: "rgba(13, 27, 19, 0.85)", border: "1px solid #1A3326", borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "var(--accent-neon)", fontFamily: "var(--font-mono)", marginBottom: "8px" }}>DECISION BOUNDARY PARTITION</div>
                    <div dangerouslySetInnerHTML={{ __html: boundaryChart }} style={{ width: "100%", height: isFullscreen ? "300px" : "180px", display: "flex", justifyContent: "center" }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#020805", border: "1px solid var(--border-green)", borderRadius: "4px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", textAlign: "center" }}>
                Please execute model training variables to compile performance metric visualizer maps.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Success Ingestion Modal */}
      {showSuccessModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(2, 8, 5, 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div className="terminal-panel fade-in" style={{
            maxWidth: "420px",
            borderColor: "var(--accent-neon)",
            textAlign: "center",
            padding: "24px",
            backgroundColor: "#08100b",
            boxShadow: "0 0 20px rgba(0, 230, 118, 0.2)"
          }}>
            <div style={{ fontSize: "24px", marginBottom: "12px" }}>🛡️ Ingestion Success</div>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginBottom: "20px" }}>
              Ingested 14,250 unique raw records successfully. Pipeline metrics cached.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setActiveWorkspaceTab("workshop");
              }}
              className="glow-button"
              style={{ width: "100%", padding: "10px", fontSize: "12px" }}
            >
              Configure Predictive Modeling Workshop
            </button>
          </div>
        </div>
      )}

      {/* CSS adjustments for button selectors */}
      <style jsx>{`
        @media (min-width: 1201px) {
          :global(.tablet-only-btn) {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
