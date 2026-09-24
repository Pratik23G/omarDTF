import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#5c2a24",
          dark: "#431e1a",
          light: "#7a3b32",
        },
        gunmetal: {
          100: "#e6e9ee",
          300: "#aab2bc",
          500: "#7b848f",
          700: "#3b424a",
          800: "#23282d",
          900: "#14171a",
        },
        gold: {
          DEFAULT: "#d4af37",
          light: "#f1d98a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
