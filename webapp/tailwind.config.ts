import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Traffic-light risk palette (mirrors risk_score.py bands)
        risk: {
          safe: "#2e7d32",
          caution: "#f57c00",
          high: "#c62828",
        },
        brand: {
          DEFAULT: "#0d47a1",
          accent: "#1e88e5",
          earth: "#1b5e20",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
