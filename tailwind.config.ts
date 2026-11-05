import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        aura: {
          bg: "#0b0f19",
          card: "#121826",
          cardHover: "#182236",
          border: "#1f2b42",
          gold: "#d4af37",
          goldLight: "#f3e5ab",
          goldDark: "#997d25",
          accent: "#e5c07b",
          up: "#f43f5e", // 빨간색 계열 (상승/이익)
          down: "#38bdf8", // 파란색 계열 (하락/손실)
          muted: "#8899b3",
          light: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};
export default config;
