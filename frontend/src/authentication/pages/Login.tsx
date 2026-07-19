import React, { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../components/GlassCard";
import { AuthInput } from "../components/AuthInput";
import { AuthButton } from "../components/AuthButton";

interface LoginProps {
  onLogin: (orgName: string, username: string, pass: string, role: "admin" | "analyst") => Promise<void>;
  onSwitchToSignup: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup }) => {
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !email || !password) return;
    setError("");
    setLoading(true);

    try {
      // Hardcoded 'analyst' for demo purposes. Can be extended to allow admin login via UI.
      await onLogin(orgName, email, password, "analyst");
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
        <p className="text-sm text-[#B4BEC8]">
          Enter your organization&apos;s workspace and credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AuthInput
          label="Organization Name (Tenant ID)"
          type="text"
          placeholder="e.g. acme-corp"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          disabled={loading}
          required
        />
        
        <AuthInput
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        
        <div className="flex flex-col gap-1.5">
          <AuthInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            error={error}
          />
          <div className="flex justify-between items-center px-1 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 accent-[#0B6E69] rounded" />
              <span className="text-xs text-[#B4BEC8]">Remember Me</span>
            </label>
            <button type="button" className="text-xs text-[#15B8A6] hover:text-[#0B6E69] transition-colors">
              Forgot Password?
            </button>
          </div>
        </div>

        <AuthButton type="submit" disabled={!email || !password || loading} loading={loading} className="mt-2">
          Verify and Continue
        </AuthButton>
      </form>

      <div className="mt-6 text-center text-sm font-medium text-[#B4BEC8]">
        Don&apos;t have an account?{" "}
        <button onClick={onSwitchToSignup} className="text-[#15B8A6] hover:text-white transition-colors">
          Sign Up
        </button>
      </div>
    </GlassCard>
  );
};
