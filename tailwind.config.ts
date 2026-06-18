import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#05070a",
        panel: "#0a0e14",
        line: "#20262e",
        positive: "#18d39e",
        negative: "#ff5c68",
        amber: "#f6b94b",
      },
      boxShadow: {
        glow: "0 0 32px rgba(24, 211, 158, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
