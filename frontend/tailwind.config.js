/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        tactilePrimaryText: "#040008"
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
