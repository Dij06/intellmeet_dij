import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          950: "#0A0B0D",
          900: "#111216",
          800: "#1C1E24",
          700: "#2B2E37",
          600: "#4B505F",
          500: "#707688",
          400: "#9DA3B4",
          300: "#D1D5DF",
          200: "#E6E8EE",
          100: "#F2F3F6",
          50: "#FAFBFD",
        },
        paper: {
          50: "#FCFCF9",
          100: "#F7F6F1",
          200: "#EFECE4",
          300: "#E3DFD4",
        },
        coral: {
          DEFAULT: "#FF4D2D",
          hover: "#E83A1A",
          subtle: "#FFF1EE",
          dark: "#B8240A",
        },
        emeraldBrand: {
          DEFAULT: "#059669",
          dark: "#047857",
          subtle: "#ECFDF5",
        },
        amberBrand: {
          DEFAULT: "#D97706",
          subtle: "#FFFBEB",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        tactile: "2px 2px 0px 0px rgba(17, 18, 22, 1)",
        "tactile-lg": "4px 4px 0px 0px rgba(17, 18, 22, 1)",
        "tactile-sm": "1px 1px 0px 0px rgba(17, 18, 22, 1)",
        "tactile-coral": "3px 3px 0px 0px #FF4D2D",
      },
    },
  },
  plugins: [],
};
export default config;
