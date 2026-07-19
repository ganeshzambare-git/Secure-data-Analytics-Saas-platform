import React from "react";
import { motion } from "framer-motion";

interface FeatureBadgeProps {
  icon: string;
  title: string;
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({ icon, title }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
      className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] transition-colors duration-200"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium text-[#B4BEC8]">{title}</span>
    </motion.div>
  );
};
