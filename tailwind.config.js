/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,mdx}",
    "./components/**/*.{js,jsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#071014",
        night: "#0B1115",
        panel: "#101A20",
        mist: "#E7F4EF",
        mint: "#5FE0B7",
        lagoon: "#50C8E8",
        amber: "#F8C66A",
        coral: "#FF7A7A",
        violet: "#A78BFA"
      },
      boxShadow: {
        glow: "0 0 80px rgba(95, 224, 183, 0.16)",
        panel: "0 28px 80px rgba(0, 0, 0, 0.36)"
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
