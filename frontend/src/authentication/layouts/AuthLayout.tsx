import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeatureBadge } from "../components/FeatureBadge";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-[#081A1F] text-white font-sans overflow-hidden">
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#0B6E69]/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#15B8A6]/10 blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative flex w-full max-w-[1600px] mx-auto z-10">
        
        {/* Left Side: Large Hero Section */}
        <div className="hidden lg:flex flex-col w-[45%] xl:w-[50%] p-12 xl:p-20 justify-center relative">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#15B8A6] to-[#0B6E69] flex items-center justify-center shadow-lg shadow-[#0B6E69]/30">
                <span className="text-white font-bold text-xl leading-none">D</span>
              </div>
              <span className="font-bold text-2xl tracking-tight">DecisionIQ</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-6">
              Multi-Tenant SaaS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#15B8A6] to-[#0B6E69]">Command Center</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[#B4BEC8] text-lg mb-12 leading-relaxed max-w-md">
              Enterprise-grade secure authentication platform with zero-trust architecture, robust access controls, and seamless tenant isolation.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureBadge icon="🔒" title="JWT Authentication" />
              <FeatureBadge icon="📱" title="MFA Security" />
              <FeatureBadge icon="🏢" title="Tenant Isolation" />
              <FeatureBadge icon="📋" title="Audit Logs" />
              <FeatureBadge icon="⚡" title="Rate Limiting" />
              <FeatureBadge icon="🛡️" title="Secure Sessions" />
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div className="w-full lg:w-[55%] xl:w-[50%] flex items-center justify-center p-6 sm:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key="auth-card-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
              className="w-full max-w-[480px]"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
