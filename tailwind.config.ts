import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAF7F2",
        surface: "#F0EBE3",
        card: "#FFFFFF",
        border: "#D8D0C4",
        text: "#2D2A26",
        muted: "#7A7067",
        dim: "#A89F93",
        accent: "#6B8F71",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
