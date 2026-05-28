import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Amiri", "Scheherazade New", "Noto Naskh Arabic", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
