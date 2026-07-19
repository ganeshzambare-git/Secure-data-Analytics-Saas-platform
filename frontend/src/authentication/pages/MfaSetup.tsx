import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../components/GlassCard";
import { AuthInput } from "../components/AuthInput";
import { AuthButton } from "../components/AuthButton";

interface MfaSetupProps {
  onVerifyMfa: (code: string) => Promise<boolean>;
}

export const MfaSetup: React.FC<MfaSetupProps> = ({ onVerifyMfa }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a 6-digit code.");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      await onVerifyMfa(code);
    } catch (err: any) {
      setError(err.message || "Invalid MFA code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Secure Your Account</h2>
        <p className="text-sm text-[#B4BEC8]">Set up Multi-Factor Authentication to continue.</p>
      </div>

      <div className="flex flex-col items-center gap-6 mb-6">
        {/* Placeholder for QR Code since this is UI-only redesign */}
        <div className="w-48 h-48 bg-white p-2 rounded-xl flex items-center justify-center">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/DecisionIQ:john@acme.com?secret=JBSWY3DPEHPK3PXP&issuer=DecisionIQ" alt="MFA QR Code" className="w-full h-full object-contain" />
        </div>

        <div className="w-full text-sm text-[#B4BEC8] flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#10252C] border border-[#0B6E69] text-[#15B8A6] flex items-center justify-center font-bold text-xs shrink-0">1</div>
            <p>Download Google Authenticator or Authy.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#10252C] border border-[#0B6E69] text-[#15B8A6] flex items-center justify-center font-bold text-xs shrink-0">2</div>
            <p>Scan the QR code shown above.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#10252C] border border-[#0B6E69] text-[#15B8A6] flex items-center justify-center font-bold text-xs shrink-0">3</div>
            <p>Enter the generated 6-digit code below.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          label="6-Digit Verification Code"
          type="text"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
          disabled={loading}
          required
          error={error}
          className="text-center"
          style={{ letterSpacing: "8px", fontSize: "1.25rem", fontWeight: "bold" }}
        />

        <AuthButton type="submit" disabled={code.length !== 6 || loading} loading={loading}>
          Verify MFA & Continue
        </AuthButton>
      </form>
    </GlassCard>
  );
};
