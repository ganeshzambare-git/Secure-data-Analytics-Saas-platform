"use client";

import React, { useState, useEffect } from "react";
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
  
  // Model training workshop states
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [modelType, setModelType] = useState<"sklearn" | "xgboost">("sklearn");
  const [splitRatio, setSplitRatio] = useState<number>(80);
  const [trainingActive, setTrainingActive] = useState(false);
  
  // Dashboard SSR Chart
  const [svgChart, setSvgChart] = useState<string>("");
  const [chartLoading, setChartLoading] = useState(false);

  const fetchRuns = async () => {
    try {
      const runs = await secureRequest<RunRecord[]>("/api/v1/pipeline/runs");
      setPipelineRuns(runs);
      if (runs.length > 0 && !selectedRunId) {
        setSelectedRunId(runs[0].id);
      }
    } catch (e) {
      console.error("Failed to load runs", e);
    }
  };

  const fetchChart = async () => {
    if (!selectedRunId) return;
    setChartLoading(true);
    try {
      const res = await secureRequest<{ svg: string }>(`/api/v1/dashboard/charts?run_id=${selectedRunId}`);
      setSvgChart(res.svg);
    } catch (e) {
      console.error("Failed to load SSR charts", e);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      fetchChart();
    }
  }, [selectedRunId]);

  // Execute scrape and progressive output logs
  const handleScrapePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setLoading(true);
    setTerminalLogs([]);
    
    // Simulate terminal logs live progression
    const logStages = [
      "[Scraping Engine Initialized] Targetting URL: " + targetUrl,
      "[Scraping] Performing GET request...",
      "[Scraping] Successfully scraped target page elements.",
      "[ETL Formatting Active] Parsing DOM tree...",
      "[ETL] Cleaning whitespace and normalizing records...",
      "[Row Engineering Completed] Yielded clean feature matrix vectors."
    ];

    for (let i = 0; i < logStages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
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
      fetchRuns();
    } catch (err: any) {
      setTerminalLogs((prev) => [...prev, `[ERROR] Pipeline run failed: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  // Execute Machine learning training task
  const handleTrainModel = async () => {
    if (!selectedRunId) return;
    setTrainingActive(true);
    try {
      await secureRequest("/api/v1/pipeline/train", {
        method: "POST",
        body: JSON.stringify({
          run_id: selectedRunId,
          model_type: modelType,
          split_ratio: splitRatio / 100,
        }),
      });
      
      // Reload runs & chart
      await fetchRuns();
      await fetchChart();
    } catch (e: any) {
      alert(`Model training error: ${e.message}`);
    } finally {
      setTrainingActive(false);
    }
  };

  const activeRun = pipelineRuns.find((r) => r.id === selectedRunId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Upper Area: List of runs or Empty State */}
      {pipelineRuns.length === 0 && !showNewTarget ? (
        <div className="terminal-panel" style={{ textAlign: "center", padding: "60px 40px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
            No Data Collection Run History
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Create a scraper targets pipeline to stream records, engineer features, and train ML model arrays.
          </p>
          <button onClick={() => setShowNewTarget(true)} className="glow-button">
            + New Collection Target
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              Active Pipeline Workspace:
            </span>
            <select
              value={selectedRunId || ""}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="glow-input"
              style={{ padding: "6px 12px", fontSize: "12px", width: "350px", cursor: "pointer" }}
            >
              {pipelineRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.target_url} ({new Date(r.updated_at).toLocaleTimeString()})
                </option>
              ))}
            </select>
          </div>
          
          <button onClick={() => setShowNewTarget(true)} className="glow-button" style={{ padding: "8px 16px", fontSize: "12px" }}>
            + New Collection Target
          </button>
        </div>
      )}

      {/* Slide-out/Toggle Scraper Configuration Panel */}
      {showNewTarget && (
        <div className="terminal-panel" style={{ borderColor: "var(--accent-neon)" }}>
          <h3 style={{
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--accent-neon)",
            marginBottom: "16px"
          }}>
            [▶] Configure Data Scraping Engine Target
          </h3>

          <form onSubmit={handleScrapePipeline} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Target URL Location
              </label>
              <input
                type="url"
                placeholder="https://news.ycombinator.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="glow-input"
                required
              />
            </div>
            
            <button type="button" onClick={() => setShowNewTarget(false)} className="secondary-button" style={{ padding: "10px 16px" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="glow-button" style={{ padding: "10px 20px" }}>
              {loading ? "Engaged..." : "Execute Pipeline"}
            </button>
          </form>

          {terminalLogs.length > 0 && (
            <div className="terminal-text" style={{
              marginTop: "20px",
              backgroundColor: "#020805",
              border: "1px solid var(--border-green)",
              borderRadius: "4px",
              padding: "16px",
              maxHeight: "220px",
              overflowY: "auto",
              fontSize: "12px",
              color: "var(--accent-neon)",
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}>
              {terminalLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Workshop on left, SSR Visuals on right */}
      {selectedRunId && activeRun && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          {/* Machine Learning Workshop */}
          <div className="terminal-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--accent-teal)",
              marginBottom: "4px"
            }}>
              [🛠] Machine Learning Workshop
            </h3>

            {/* Model Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                CHOOSE PREDICTIVE MODEL
              </label>
              <select
                value={modelType}
                onChange={(e: any) => setModelType(e.target.value)}
                className="glow-input"
                style={{ cursor: "pointer" }}
              >
                <option value="sklearn">Scikit-Learn Random Forest Regressor</option>
                <option value="xgboost">XGBoost Gradient Boosting Regressor</option>
              </select>
            </div>

            {/* Train/Test Split Slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
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
              className="glow-button"
              style={{ width: "100%" }}
            >
              {trainingActive ? "Fitting parameters..." : "Execute Model Training"}
            </button>

            {/* Output Scores Table */}
            <div style={{ marginTop: "10px" }}>
              <h4 style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
                marginBottom: "10px",
                textTransform: "uppercase"
              }}>
                [📈] Dynamic Evaluation Metrics
              </h4>
              
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-green)", color: "var(--text-muted)" }}>
                    <th style={{ textAlign: "left", padding: "6px", fontFamily: "var(--font-mono)" }}>Metric Configuration</th>
                    <th style={{ textAlign: "right", padding: "6px", fontFamily: "var(--font-mono)" }}>Calculated Value</th>
                  </tr>
                </thead>
                <tbody style={{ fontFamily: "var(--font-mono)" }}>
                  <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.2)" }}>
                    <td style={{ padding: "8px 6px" }}>Scraped Feature Rows</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--accent-teal)" }}>
                      {activeRun.metrics?.rows_scraped || 0}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.2)" }}>
                    <td style={{ padding: "8px 6px" }}>Engineered Columns</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--accent-teal)" }}>
                      {activeRun.metrics?.columns_processed || 0}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.2)" }}>
                    <td style={{ padding: "8px 6px" }}>Target Model Trained</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--accent-neon)", textTransform: "uppercase" }}>
                      {activeRun.metrics?.model_name || "N/A"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.2)" }}>
                    <td style={{ padding: "8px 6px" }}>Training Split Ratio</td>
                    <td style={{ padding: "8px 6px", textAlign: "right" }}>
                      {activeRun.metrics?.split_ratio ? `${activeRun.metrics.split_ratio * 100}%` : "N/A"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.2)" }}>
                    <td style={{ padding: "8px 6px" }}>Model Fit Accuracy (R²)</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: "var(--accent-neon)", fontWeight: "600" }}>
                      {activeRun.metrics?.accuracy ? activeRun.metrics.accuracy.toFixed(4) : "N/A"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(26, 51, 38, 0.2)" }}>
                    <td style={{ padding: "8px 6px" }}>Root Mean Squared Error (RMSE)</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: "#f6ad55", fontWeight: "600" }}>
                      {activeRun.metrics?.rmse ? activeRun.metrics.rmse.toFixed(4) : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Visual Insights Dashboard (Pre-compiled SVG Visualizer) */}
          <div className="terminal-panel" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--accent-neon)",
              marginBottom: "16px"
            }}>
              [📊] Server-Side Vector Graphic (SSR Chart)
            </h3>

            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#020805",
              border: "1px solid var(--border-green)",
              borderRadius: "4px",
              padding: "16px",
              minHeight: "350px",
              overflow: "hidden"
            }}>
              {chartLoading ? (
                <div style={{ color: "var(--accent-neon)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                  [COMPILING SSR VECTOR ASSETS...]
                </div>
              ) : svgChart ? (
                <div
                  dangerouslySetInnerHTML={{ __html: svgChart }}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                />
              ) : (
                <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "center" }}>
                  Please train the model to yield performance visualization maps.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
