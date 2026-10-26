/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080C14",
        foreground: "#F1F5F9",
        card: "#0F172A",
        border: "#1E293B",
        primary: {
          DEFAULT: "#EF4444", // Life-critical emergency red
          hover: "#DC2626",
          muted: "#991B1B"
        },
        warning: "#F59E0B",
        success: "#10B981",
        info: "#06B6D4",
        p1: "#EF4444",
        p2: "#F97316",
        p3: "#EAB308",
        p4: "#10B981",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      }
    },
  },
  plugins: [],
};
