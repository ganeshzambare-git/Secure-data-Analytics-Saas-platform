"use client";

/**
 * ClientShellWrapper.tsx — Client Shell with Blur Shield & Provider Nesting
 * ReadyNest Analytics Engine — Phase 3
 *
 * This is a "use client" boundary that:
 *  1. Nests DecryptionProvider → AuthProvider → SecureDataProvider
 *  2. Applies .blur-shield / .blurred CSS classes on window blur and
 *     pointer-leave to prevent over-the-shoulder data leakage.
 */

import React, { useEffect, useRef, useState } from "react";
import { DecryptionProvider } from "@/context/DecryptionContext";
import { AuthProvider } from "@/context/AuthContext";
import { SecureDataProvider } from "@/context/SecureDataContext";

export const ClientShellWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    // Blur on window focus loss
    const handleBlur = () => setBlurred(true);
    const handleFocus = () => setBlurred(false);

    // Blur on pointer leaving the application window
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when the pointer truly leaves the viewport
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setBlurred(true);
      }
    };
    const handleMouseEnter = () => setBlurred(false);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return (
    <DecryptionProvider>
      <AuthProvider>
        <SecureDataProvider>
          <div
            ref={wrapperRef}
            className={`blur-shield ${blurred ? "blurred" : ""}`}
            style={{ minHeight: "100vh" }}
          >
            {children}
          </div>
        </SecureDataProvider>
      </AuthProvider>
    </DecryptionProvider>
  );
};
