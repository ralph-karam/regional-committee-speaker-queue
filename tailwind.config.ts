import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10233f",
        unblue: "#1475bd",
        mist: "#eef4f8"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(16, 35, 63, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
