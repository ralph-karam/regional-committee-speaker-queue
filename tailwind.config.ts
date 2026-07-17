import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10233f",
        unblue: "#1475bd",
        rcblue: "#08779a",
        rcteal: "#1b94aa",
        rcgreen: "#5a9f3f",
        rcorange: "#f47b20",
        mist: "#eef4f8"
      },
      boxShadow: {
        soft: "0 12px 36px rgba(16, 35, 63, 0.08)",
        lift: "0 18px 55px rgba(16, 35, 63, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
