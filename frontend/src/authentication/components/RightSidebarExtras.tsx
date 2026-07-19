import React from "react";

interface RightSidebarExtrasProps {
  onSsoAcme: () => void;
  onSsoGlobex: () => void;
}

export const RightSidebarExtras: React.FC<RightSidebarExtrasProps> = ({ onSsoAcme, onSsoGlobex }) => {
  return (
    <>
      {/* Quick Login Methods (SSO Status Cards) */}
      <div className="terminal-panel" style={{ padding: "14px" }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>QUICK SINGLE SIGN-ON (SSO) IDENTITIES</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          <button type="button" onClick={onSsoAcme} className="secondary-button" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", padding: "6px" }}>
            🔐 Okta IDP Link
          </button>
          <button type="button" onClick={onSsoGlobex} className="secondary-button" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", padding: "6px" }}>
            ☁️ Azure Active AD
          </button>
        </div>
      </div>

      {/* AI Security scan assistant */}
      <div className="terminal-panel" style={{ padding: "12px", backgroundColor: "#020805", border: "1px solid var(--accent-neon)", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-neon)" }}></span>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent-neon)", fontWeight: "bold" }}>[READYNEST_AI_SCANNER]</span>
          </div>
          <span className="badge badge-success" style={{ fontSize: "8px" }}>THREAT LEVEL: LOW</span>
        </div>
        <code style={{ fontSize: "10px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
          &gt; Client node reputation verified. Proxy shielding configured. Zero anomaly vectors detected. Access ports secure.
        </code>
      </div>

      {/* Login History Logs */}
      <div className="terminal-panel" style={{ padding: "14px" }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>RECENT CONNECTION LOGS</span>
        <div style={{ overflowX: "auto", marginTop: "6px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", fontFamily: "var(--font-mono)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-green)", color: "var(--text-muted)", textAlign: "left" }}>
                <th style={{ padding: "4px 2px" }}>Time</th>
                <th style={{ padding: "4px 2px" }}>Operator</th>
                <th style={{ padding: "4px 2px" }}>IP Source</th>
                <th style={{ padding: "4px 2px", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(26,51,38,0.3)" }}>
                <td style={{ padding: "4px 2px" }}>01:32:15</td>
                <td style={{ padding: "4px 2px" }}>admin_acme</td>
                <td style={{ padding: "4px 2px" }}>192.168.1.48</td>
                <td style={{ padding: "4px 2px", color: "var(--accent-neon)", textAlign: "right" }}>Success</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(26,51,38,0.3)" }}>
                <td style={{ padding: "4px 2px" }}>01:14:02</td>
                <td style={{ padding: "4px 2px" }}>analyst_acme</td>
                <td style={{ padding: "4px 2px" }}>192.168.1.102</td>
                <td style={{ padding: "4px 2px", color: "var(--accent-neon)", textAlign: "right" }}>Success</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(26,51,38,0.3)" }}>
                <td style={{ padding: "4px 2px" }}>00:54:11</td>
                <td style={{ padding: "4px 2px" }}>guest_user</td>
                <td style={{ padding: "4px 2px" }}>185.220.101.4</td>
                <td style={{ padding: "4px 2px", color: "#e53e3e", textAlign: "right" }}>Blocked</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Devices Monitor */}
      <div className="terminal-panel" style={{ padding: "14px" }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>ACTIVE DEVICES TRACKER</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontFamily: "var(--font-mono)" }}>
            <span>💻 Chrome 126 / Win 11 (Current)</span>
            <span style={{ color: "var(--accent-neon)" }}>ONLINE</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontFamily: "var(--font-mono)" }}>
            <span>📱 Safari 17.5 / iPhone iOS 17</span>
            <span style={{ color: "var(--text-muted)" }}>2 hours ago</span>
          </div>
        </div>
      </div>

      {/* Screen 2 Supporting Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div className="terminal-panel" style={{ padding: "12px", borderLeft: "2px solid var(--accent-teal)" }}>
          <h5 style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-teal)", textTransform: "uppercase" }}>
            🔒 Safety Check instructions
          </h5>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.3" }}>
            Ensure your address bar shows the valid secure lock icon. Keep JWT auth tokens volatile; rotate credentials key profiles every 30 days.
          </p>
        </div>

        <div className="terminal-panel" style={{ padding: "12px", borderLeft: "2px solid #e53e3e" }}>
          <h5 style={{ fontSize: "11px", fontWeight: "700", color: "#e53e3e", textTransform: "uppercase" }}>
            ⚠️ Session limits
          </h5>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.3" }}>
            Authorized tunnels automatically close after 15 minutes of inactivity. State structures reside in volatile client memory buffers.
          </p>
        </div>

        <div className="terminal-panel" style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            SSO IDENTIFICATION STATUS:
          </span>
          <span className="badge badge-success" style={{ fontSize: "9px" }}>ACTIVE_TUNNEL</span>
        </div>
      </div>
    </>
  );
};
