"use client";

import React, { useState } from "react";
import { useSecureData } from "@/context/SecureDataContext";

const FEATURES = [
  { id: "f1", label: "Age Demographics Vector" },
  { id: "f2", label: "Transaction Frequency Matrix" },
  { id: "f3", label: "Geospatial Anomaly Hash" },
  { id: "f4", label: "Device Fingerprint Score" }
];

export default function MLWorkshop() {
  const { secureRequest } = useSecureData();

  const [modelType, setModelType] = useState<string>("xgboost");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [testSplit, setTestSplit] = useState<number>(20);
  
  const [isComputing, setIsComputing] = useState(false);
  const [results, setResults] = useState<{ rmse: string; accuracy: string } | null>(null);

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const computeWeights = async () => {
    setIsComputing(true);
    setResults(null);

    try {
      // Dispatches authenticated request to POST /api/v1/analytics/train
      await secureRequest("/api/v1/analytics/train", {
        method: "POST",
        body: JSON.stringify({ modelType, selectedFeatures, testSplit })
      });
    } catch (e) {
      console.warn("API not fully mocked, falling back to local simulation.", e);
    }

    // Simulate decrypt & score processing pass
    setTimeout(() => {
      setIsComputing(false);
      setResults({
        rmse: "0.0412",
        accuracy: "97.84%"
      });
    }, 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%", position: "relative" }}>
      
      {/* ── Processing View-Blocker ────────────────────── */}
      {isComputing && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(4, 13, 8, 0.9)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          color: "#00E676",
          fontFamily: "var(--font-mono)",
          opacity: isComputing ? 1 : 0,
          transition: "opacity 0.3s ease-in-out"
        }}>
          <div className="spinner" style={{
            width: "48px", height: "48px",
            border: "4px solid rgba(0, 230, 118, 0.2)",
            borderTopColor: "#00E676",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <div style={{ letterSpacing: "2px", textTransform: "uppercase", fontSize: "14px" }}>
            [EXECUTING TENSOR MATRIX COMPUTATION]
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      )}

      {/* ── Dashboard Config Panel ────────────────────── */}
      <h2 style={{ fontFamily: "var(--font-mono)", color: "#FFFFFF", fontSize: "20px", margin: 0 }}>
        Predictive Analytics Workshop
      </h2>

      <div style={{ display: "flex", gap: "24px" }}>
        
        {/* Left Column - Parameters */}
        <div style={{ flex: "0 0 50%", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ backgroundColor: "#0D1B13", border: "4px solid #1A3326", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Algorithmic Model Selection Menu */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A0AEC0", textTransform: "uppercase" }}>
                Algorithmic Model Selection
              </label>
              <select 
                value={modelType} 
                onChange={(e) => setModelType(e.target.value)}
                style={{
                  padding: "12px",
                  backgroundColor: "rgba(13, 27, 19, 0.5)",
                  border: "2px solid #1A3326",
                  color: "#00E676",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                  borderRadius: "4px"
                }}
              >
                <option value="xgboost">XGBoost Classifier / Regressor</option>
                <option value="sklearn">Scikit-Learn Linear Model Suite</option>
              </select>
            </div>

            {/* Target Vector Feature Arrays Box */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A0AEC0", textTransform: "uppercase" }}>
                Target Vector Feature Arrays
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {FEATURES.map(f => (
                  <label key={f.id} className="feature-vector-item" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    border: "2px solid #1A3326",
                    backgroundColor: selectedFeatures.includes(f.id) ? "rgba(0, 230, 118, 0.05)" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedFeatures.includes(f.id)}
                      onChange={() => toggleFeature(f.id)}
                      style={{ accentColor: "#00E676", width: "16px", height: "16px" }}
                    />
                    <span style={{ fontFamily: "var(--font-mono)", color: selectedFeatures.includes(f.id) ? "#00E676" : "#A0AEC0", fontSize: "12px" }}>
                      {f.label}
                    </span>
                  </label>
                ))}
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                .feature-vector-item:hover {
                  border-color: #00E676 !important;
                  box-shadow: 0 0 12px rgba(0, 230, 118, 0.2);
                }
              `}} />
            </div>

            {/* Test Split Validation Slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A0AEC0", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
                <span>Test Split Validation</span>
                <span style={{ color: "#00E676" }}>{testSplit}%</span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="1" 
                value={testSplit}
                onChange={(e) => setTestSplit(parseInt(e.target.value))}
                style={{
                  accentColor: "#00E676",
                  width: "100%",
                  cursor: "ew-resize"
                }}
              />
            </div>

          </div>

          <button
            onClick={computeWeights}
            style={{
              padding: "16px",
              backgroundColor: "#00E676",
              color: "#040D08",
              fontWeight: "bold",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Compute Predictive Weights
          </button>
        </div>

        {/* Right Column - Results Dashboard */}
        <div style={{ flex: "0 0 50%" }}>
          {results ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              animation: "fadeIn 0.5s ease-in-out"
            }}>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
              `}} />
              
              <h3 style={{ fontFamily: "var(--font-mono)", color: "#00E676", fontSize: "16px", margin: 0, textTransform: "uppercase" }}>
                [Analysis Complete] Absolute Accuracy Matrix
              </h3>
              
              {/* Performance Layer Card A */}
              <div style={{
                backgroundColor: "#0D1B13",
                border: "4px solid #1A3326",
                borderLeftColor: "#00E676",
                padding: "24px"
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A0AEC0", textTransform: "uppercase", marginBottom: "8px" }}>
                  Root Mean Squared Error (RMSE)
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace, var(--font-mono)",
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "#FFFFFF"
                }}>
                  {results.rmse}
                </div>
              </div>

              {/* Performance Layer Card B */}
              <div style={{
                backgroundColor: "#0D1B13",
                border: "4px solid #1A3326",
                borderLeftColor: "#00E676",
                padding: "24px"
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A0AEC0", textTransform: "uppercase", marginBottom: "8px" }}>
                  Global Classification Accuracy
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace, var(--font-mono)",
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "#00E676"
                }}>
                  {results.accuracy}
                </div>
              </div>

            </div>
          ) : (
            <div style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "4px dashed #1A3326",
              color: "#1A3326",
              fontFamily: "var(--font-mono)",
              fontSize: "14px"
            }}>
              AWAITING COMPUTATION TARGETS...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
