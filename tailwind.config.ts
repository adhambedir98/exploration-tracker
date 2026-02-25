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
        bg: "#D8D4CC",
        surface: "#CEC9C0",
        card: "#ECEAE6",
        border: "#B5AC9E",
        text: "#1E1C19",
        muted: "#55504A",
        dim: "#807A72",
        accent: "#4A6B50",
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
