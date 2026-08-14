/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#10131F",
          soft: "#171B2B",
          softer: "#1F2437",
        },
        paper: "#F7F5F0",
        indigo: {
          deep: "#2B2E6B",
          mid: "#3D3F8F",
        },
        signal: "#F5A623",
        live: "#1FAE7A",
        danger: "#E1436B",
        slate: {
          muted: "#5B6478",
          faint: "#8A93A8",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 19, 31, 0.04), 0 8px 24px rgba(16, 19, 31, 0.06)",
        ring: "0 0 0 3px rgba(245, 166, 35, 0.35)",
      },
      keyframes: {
        pulseRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(31, 174, 122, 0.45)" },
          "50%": { boxShadow: "0 0 0 6px rgba(31, 174, 122, 0)" },
        },
        pulseDanger: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(225, 67, 107, 0.45)" },
          "50%": { boxShadow: "0 0 0 6px rgba(225, 67, 107, 0)" },
        },
      },
      animation: {
        "pulse-ring": "pulseRing 2s ease-in-out infinite",
        "pulse-danger": "pulseDanger 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
