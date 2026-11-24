import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0b1220",
          soft: "#111a2e",
        },
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        // CPCB National AQI band palette.
        aqi: {
          good: "#4caf50",
          satisfactory: "#a3c853",
          moderate: "#f6d242",
          poor: "#f99a1c",
          verypoor: "#e63946",
          severe: "#8e24aa",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(2,12,27,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
