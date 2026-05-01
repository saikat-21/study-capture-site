/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,mdx}",
    "./components/**/*.{js,jsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        night: "rgb(var(--color-night) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        strong: "rgb(var(--color-strong) / <alpha-value>)",
        line: "var(--border-soft)",
        mint: "#5FE0B7",
        lagoon: "#50C8E8",
        amber: "#F8C66A",
        coral: "#FF7A7A",
        violet: "#A78BFA"
      },
      boxShadow: {
        glow: "0 0 80px rgba(95, 224, 183, 0.16)",
        panel: "var(--shadow-panel)"
      },
      animation: {
        "float-slow": "float-slow 9s ease-in-out infinite",
        "scan-line": "scan-line 5s ease-in-out infinite",
        "slide-up": "slide-up 700ms ease both"
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -16px, 0)" }
        },
        "scan-line": {
          "0%, 100%": { transform: "translateY(-15%)", opacity: "0" },
          "12%, 76%": { opacity: "1" },
          "88%": { transform: "translateY(118%)", opacity: "0" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};
