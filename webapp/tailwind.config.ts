import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Achromatic chrome
        ink: "#0a0a0a",
        muted: "#6b6b6b",
        faint: "#8a8a8a",
        line: "#e4e7ec",
        rule: "#eef0f3",
        control: "#d4d4d4",
        raised: "#eef0f3",
        ground: "#f2f4f7",
        // The one primary action is near-black
        accent: "#141414",
        // The one data hue (buffer ring, flood components)
        chart: "#1d5fbf",
        // Status colours, on the risk verdict only
        risk: {
          safe: "#2e7d32",
          caution: "#92400e",
          high: "#c4242a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {},
      borderRadius: {
        card: "8px",
        control: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
