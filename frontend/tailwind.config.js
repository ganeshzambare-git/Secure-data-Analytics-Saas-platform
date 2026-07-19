/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/authentication/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: "#040D08",
        bgSurface: "rgba(13, 27, 19, 0.85)",
        accentNeon: "#00E676",
        accentTeal: "#319795",
        borderGreen: "#1A3326",
        tactilePrimary: "#006676",
        tactilePrimaryText: "#040008",
        // New Authentication UI Theme
        authBg: "#081A1F",
        authSurface: "#10252C",
        authPrimary: "#0B6E69",
        authAccent: "#15B8A6",
        authCard: "rgba(255,255,255,.05)",
        authBorder: "rgba(255,255,255,.08)",
        authText: "#FFFFFF",
        authTextSec: "#B4BEC8",
        authSuccess: "#00C853",
        authWarning: "#F9A825",
        authError: "#EF5350"
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "SF Pro Display", "sans-serif"],
      },
      borderRadius: {
        geo: "4px"
      }
    },
  },
  plugins: [],
};
