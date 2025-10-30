import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // MEVrebels Brand Colors
        rebellious: {
          red: "#E63946",
          DEFAULT: "#E63946",
        },
        midnight: {
          black: "#1D1D1D",
          DEFAULT: "#1D1D1D",
        },
        trust: {
          blue: "#457B9D",
          DEFAULT: "#457B9D",
        },
        profit: {
          green: "#06D6A0",
          DEFAULT: "#06D6A0",
        },
        warning: {
          orange: "#F4A261",
          DEFAULT: "#F4A261",
        },
        neutral: {
          gray: "#6C757D",
          DEFAULT: "#6C757D",
        },
        // Base colors
        background: "#1D1D1D",
        foreground: "#FFFFFF",
        border: "#2D2D2D",
        primary: {
          DEFAULT: "#E63946",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#457B9D",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#06D6A0",
          foreground: "#1D1D1D",
        },
        destructive: {
          DEFAULT: "#E63946",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#2D2D2D",
          foreground: "#6C757D",
        },
        accent: {
          DEFAULT: "#457B9D",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1D1D1D",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#1D1D1D",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
        code: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
