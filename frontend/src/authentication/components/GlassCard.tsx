import React from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "" }) => {
  return (
    <motion.div 
      className={`relative w-full bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-[24px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden ${className}`}
    >
      {/* Subtle top glare effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent" />
      {children}
    </motion.div>
  );
};
