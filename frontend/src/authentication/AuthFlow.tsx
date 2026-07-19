"use client";

import React, { useState } from "react";
import { AuthLayout } from "./layouts/AuthLayout";
import { TenantVerification } from "./pages/TenantVerification";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { MfaSetup } from "./pages/MfaSetup";
import { useSecureData } from "@/context/SecureDataContext";
import { useRouter } from "next/navigation";

export type AuthState = "tenant" | "login" | "signup" | "mfa";

export function AuthFlow() {
  const [authState, setAuthState] = useState<AuthState>("signup");
  const [resolvedOrgName, setResolvedOrgName] = useState<string>("");
  const { login } = useSecureData();
  const router = useRouter();
  
  const handleLoginSubmit = async (orgName: string, username: string, pass: string, role: "admin" | "analyst") => {
    const success = await login(orgName, username, pass, role);
    if (success) {
      setAuthState("mfa");
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const handleSignupSubmit = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        setAuthState("mfa");
        resolve();
      }, 1500);
    });
  };

  const handleMfaSubmit = async (code: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (code === "123456" || code.length === 6) {
          router.push("/workspace/datasets");
          resolve(true);
        } else {
          reject(new Error("Invalid MFA code. Try 123456."));
        }
      }, 1200);
    });
  };

  return (
    <AuthLayout>
      {authState === "login" && (
        <Login 
          onLogin={handleLoginSubmit}
          onSwitchToSignup={() => setAuthState("signup")}
        />
      )}
      
      {authState === "signup" && (
        <Signup 
          onSignup={handleSignupSubmit}
          onSwitchToLogin={() => setAuthState("login")}
        />
      )}
      
      {authState === "mfa" && (
        <MfaSetup 
          onVerifyMfa={handleMfaSubmit}
        />
      )}
    </AuthLayout>
  );
}
