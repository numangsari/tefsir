import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Amiri", "Scheherazade New", "Noto Naskh Arabic", "serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        glow: "0 8px 30px -12px rgba(16, 185, 129, 0.45)",
        "glow-lg": "0 18px 50px -16px rgba(16, 185, 129, 0.55)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
