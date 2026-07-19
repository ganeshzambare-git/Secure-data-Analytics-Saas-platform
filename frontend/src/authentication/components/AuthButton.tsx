import { HTMLMotionProps, motion } from "framer-motion";

interface AuthButtonProps extends HTMLMotionProps<"button"> {
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export const AuthButton: React.FC<AuthButtonProps> = ({ 
  children, 
  loading, 
  variant = "primary", 
  className = "", 
  disabled,
  ...props 
}) => {
  const isPrimary = variant === "primary";
  
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={`
        relative w-full rounded-[12px] px-4 py-3.5 font-semibold text-sm transition-all duration-200 flex items-center justify-center overflow-hidden
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isPrimary 
          ? "bg-gradient-to-r from-[#0B6E69] to-[#15B8A6] text-white shadow-lg shadow-[#0B6E69]/30" 
          : "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.08)]"
        }
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};
