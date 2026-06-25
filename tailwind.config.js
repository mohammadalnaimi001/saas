/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Chrome / ink — deep plum-black, used for text and app chrome
        ink: {
          DEFAULT: "#1E1B2E",
          soft: "#2B2740",
        },
        // Brand — a deep "loyal" indigo-plum
        brand: {
          50: "#F1EEF7",
          100: "#E0D9EE",
          200: "#C2B6DC",
          300: "#9E8DC4",
          400: "#7A66AB",
          500: "#5B4B8A",
          600: "#473C6B",
          700: "#382F54",
          800: "#2A2440",
          900: "#1E1B2E",
        },
        // Reward accent — warm honey amber. RESERVED for stamp / reward moments.
        reward: {
          DEFAULT: "#E8A33D",
          soft: "#F6D9A6",
          deep: "#C77F1A",
        },
        // Redeemed / success
        leaf: "#3A7D5C",
        // Surfaces
        paper: "#FAF8F5",
        hairline: "#E9E4DC",
        muted: "#6B6577",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,27,46,0.04), 0 8px 24px rgba(30,27,46,0.06)",
        lift: "0 8px 30px rgba(30,27,46,0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        stampDrop: {
          "0%": { transform: "scale(1.6) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(0.92) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        rewardGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,163,61,0.0)" },
          "50%": { boxShadow: "0 0 0 6px rgba(232,163,61,0.18)" },
        },
        fadeUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        stampDrop: "stampDrop 0.45s cubic-bezier(0.18,0.89,0.32,1.28)",
        rewardGlow: "rewardGlow 2.2s ease-in-out infinite",
        fadeUp: "fadeUp 0.4s ease both",
      },
    },
  },
  plugins: [],
};
