import React, { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../components/GlassCard";
import { AuthInput } from "../components/AuthInput";
import { AuthButton } from "../components/AuthButton";

interface TenantVerificationProps {
  onVerify: (orgName: string) => Promise<boolean>;
  onTenantFound: () => void;
  onTenantNotFound: () => void;
  onSwitchToLogin: () => void;
  onSwitchToSignup: () => void;
}

export const TenantVerification: React.FC<TenantVerificationProps> = ({
  onVerify,
  onTenantFound,
  onTenantNotFound,
  onSwitchToLogin,
  onSwitchToSignup
}) => {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orgName.trim().length < 3) {
      setError("Organization name must be at least 3 characters.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const found = await onVerify(orgName);
      if (found) {
        onTenantFound();
      } else {
        onTenantNotFound();
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-sm text-[#B4BEC8]">Enter your organization&apos;s workspace name to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <AuthInput
          label="Organization Workspace"
          placeholder="e.g. acme-corp"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          disabled={loading}
          required
          error={error}
        />

        <AuthButton type="submit" disabled={!orgName.trim() || loading} loading={loading}>
          Continue to Workspace
        </AuthButton>
      </form>

      <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.08)] flex justify-center gap-4 text-sm font-medium">
        <button onClick={onSwitchToLogin} className="text-[#B4BEC8] hover:text-white transition-colors">
          Direct Login
        </button>
        <span className="text-[rgba(255,255,255,0.1)]">|</span>
        <button onClick={onSwitchToSignup} className="text-[#15B8A6] hover:text-[#0B6E69] transition-colors">
          Create Workspace
        </button>
      </div>
    </GlassCard>
  );
};
