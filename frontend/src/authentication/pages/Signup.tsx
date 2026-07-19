import React, { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../components/GlassCard";
import { AuthInput } from "../components/AuthInput";
import { AuthButton } from "../components/AuthButton";

interface SignupProps {
  onSignup: () => Promise<void>;
  onSwitchToLogin: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    let strength = 0;
    if (password.length > 7) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9!@#$%^&*]+/)) strength += 25;
    return strength;
  };
  const strength = getPasswordStrength();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName) {
      setError("Please enter the organization name.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms) {
      setError("You must accept the terms of service.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await onSignup();
      setStep(3); // Success step
    } catch (err: any) {
      setError(err.message || "Failed to create workspace.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <GlassCard className="!p-6 sm:!p-8 text-center">
        <div className="w-16 h-16 bg-[#0B6E69] text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Signup Successfully Completed</h2>
        <p className="text-sm text-[#B4BEC8] mb-8">
          Your workspace and ID have been successfully created. You can now login to access your dashboard.
        </p>
        <AuthButton onClick={onSwitchToLogin} type="button">
          Go to Login Page
        </AuthButton>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="!p-6 sm:!p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Create Workspace</h2>
          <p className="text-sm text-[#B4BEC8]">Step {step} of 2: {step === 1 ? 'Organization Details' : 'Account Security'}</p>
        </div>
        <div className="flex gap-2">
          <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-[#15B8A6]' : 'bg-[#10252C]'}`} />
          <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-[#15B8A6]' : 'bg-[#10252C]'}`} />
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-[#EF5350] bg-[#EF5350]/10 p-3 rounded-lg border border-[#EF5350]/20">{error}</div>}

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="flex flex-col gap-5">
          <AuthInput
            label="Organization Name (Tenant ID)"
            placeholder="e.g. Acme Corp"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <AuthButton type="submit" className="mt-4">
            VERIFY TENANT IDENTITY
          </AuthButton>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthInput
            label="Work Email"
            type="email"
            placeholder="john@acme.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          
          <div className="flex flex-col gap-2">
            <AuthInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            {password.length > 0 && (
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#10252C] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${strength}%` }}
                    className={`h-full ${strength < 50 ? 'bg-[#EF5350]' : strength < 100 ? 'bg-[#F9A825]' : 'bg-[#00C853]'}`}
                  />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#B4BEC8]">
                  {strength < 50 ? 'Weak' : strength < 100 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          <AuthInput
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />

          <label className="flex items-start gap-3 cursor-pointer mt-2">
            <input 
              type="checkbox" 
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#0B6E69] rounded border-[rgba(255,255,255,0.1)]" 
            />
            <span className="text-xs text-[#B4BEC8] leading-tight">
              I accept the Terms of Service and Privacy Policy.
            </span>
          </label>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#10252C] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              disabled={loading}
            >
              Back
            </button>
            <AuthButton type="submit" disabled={loading || !email || !password || !confirmPassword || !terms} loading={loading} className="flex-1">
              Complete Signup
            </AuthButton>
          </div>
        </form>
      )}

      <div className="mt-6 text-center text-sm font-medium text-[#B4BEC8]">
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} className="text-[#15B8A6] hover:text-white transition-colors" disabled={loading}>
          Login
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}} />
    </GlassCard>
  );
};
