/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FDFDFB",
        "paper-dim": "#F3F2EC",
        ink: "#161A20",
        "ink-muted": "#565F6D",
        "ink-faint": "#8D93A0",
        line: "#E6E4DB",
        accent: "#4CBB6C",
        "accent-deep": "#2E8F4C",
        "accent-soft": "#E7F8EC",
        node: {
          violet: "#EDEBFC",
          "violet-ink": "#5B4FE0",
          rose: "#FCEBEE",
          "rose-ink": "#D95C6E",
          amber: "#FDF3E3",
          "amber-ink": "#C98A2A",
          sky: "#E9F3FC",
          "sky-ink": "#3B82C4",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-ui)"],
      },
      backgroundImage: {
        grid: "linear-gradient(to right, #E2E0D6 1px, transparent 1px), linear-gradient(to bottom, #E2E0D6 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      borderRadius: {
        card: "14px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-soft": "pulse-soft 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
