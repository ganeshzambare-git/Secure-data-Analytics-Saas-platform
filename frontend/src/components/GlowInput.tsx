import React, { InputHTMLAttributes } from "react";

interface GlowInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const GlowInput: React.FC<GlowInputProps> = ({ label, className = "", ...props }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-primary)",
          textTransform: "uppercase"
        }}>
          {label}
        </label>
      )}
      <input
        className={`glow-input ${className}`}
        style={{
          backgroundColor: "#020805",
          border: "1px solid var(--border-green)",
          borderRadius: "4px",
          color: "var(--text-primary)",
          padding: "10px 14px",
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          outline: "none",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        {...props}
      />
    </div>
  );
};
