import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce7fd",
          200: "#c0d3fb",
          300: "#94b6f8",
          400: "#618ef2",
          500: "#3d67ec",
          600: "#2748e0",
          700: "#1f36ce",
          800: "#202fa7",
          900: "#1f2d84",
          950: "#171d51",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)",
        pop: "0 10px 30px -8px rgba(16,24,40,.18)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .3s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
