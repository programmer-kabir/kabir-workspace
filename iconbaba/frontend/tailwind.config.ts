import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: "var(--sidebar)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        primary: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
          hover: "#7c3aed",
        },
        secondary: {
          DEFAULT: "#1e1e2d",
          foreground: "#e2e8f0",
          hover: "#2a2a3c",
        },
        muted: {
          DEFAULT: "#181825",
          foreground: "#94a3b8",
        },
        accent: {
          DEFAULT: "#2d1b4e",
          foreground: "#c084fc",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
