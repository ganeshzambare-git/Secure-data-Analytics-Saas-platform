import React, { InputHTMLAttributes, useState } from "react";
import { motion } from "framer-motion";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, error, className = "", ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-[#B4BEC8] uppercase tracking-wider pl-1">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full bg-[#10252C] border rounded-[12px] px-4 py-3.5 text-white text-sm
            placeholder:text-gray-500 outline-none transition-all duration-200
            ${error ? "border-[#EF5350]" : isFocused ? "border-[#15B8A6] shadow-[0_0_0_2px_rgba(21,184,166,0.2)]" : "border-[rgba(255,255,255,0.08)]"}
            ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      </div>
      {error && (
        <motion.span 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-xs text-[#EF5350] pl-1 font-medium"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
};
