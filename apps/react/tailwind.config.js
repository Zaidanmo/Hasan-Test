export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: [
    // animation utilities used dynamically
    "animate-fadeUp", "animate-slideInLeft", "animate-slideInRight",
    "animate-popIn", "animate-stepPop", "animate-pulseSoft",
    "animate-floatBlob", "animate-spinSlow", "animate-shimmer",
  ],
  theme: {
    extend: {
      colors: {
        ovgu: {
          primary:     "#7A003F",
          primaryDark: "#5F002F",
          soft:        "#F7EEF3",
          surface:     "#FDF8FB",
          border:      "#E8D0DA",
          ink:         "#1B1B1F",
          muted:       "#6B7280",
          accent:      "#FF6978",
          yellow:      "#FFD400",
        },
      },
      fontFamily: {
        sans:    ["'DM Sans'", "system-ui", "sans-serif"],
        display: ["'Syne'",    "system-ui", "sans-serif"],
      },
      boxShadow: {
        ovgu:    "0 20px 50px rgba(122, 0, 63, 0.14)",
        card:    "0 2px 16px rgba(122, 0, 63, 0.07)",
        cardHov: "0 8px 32px rgba(122, 0, 63, 0.15)",
      },

      // ── All keyframes defined here ───────────────────────────────
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%":   { opacity: "0", transform: "translateX(-28px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(28px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        popIn: {
          "0%":   { opacity: "0", transform: "scale(0.80)" },
          "65%":  { transform: "scale(1.06)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        stepPop: {
          "0%":   { transform: "scale(0.55)", opacity: "0" },
          "60%":  { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1",    transform: "scale(1)" },
          "50%":       { opacity: "0.5", transform: "scale(0.86)" },
        },
        floatBlob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%":       { transform: "translate(8px, -14px) scale(1.04)" },
          "66%":       { transform: "translate(-6px, 7px) scale(0.97)" },
        },
        spinSlow: {
          "to": { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
      },

      // ── Animation utilities ──────────────────────────────────────
      animation: {
        fadeUp:        "fadeUp       0.45s cubic-bezier(0.22,1,0.36,1) both",
        slideInLeft:   "slideInLeft  0.45s cubic-bezier(0.22,1,0.36,1) both",
        slideInRight:  "slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both",
        popIn:         "popIn        0.35s cubic-bezier(0.22,1,0.36,1) both",
        stepPop:       "stepPop      0.4s  cubic-bezier(0.34,1.56,0.64,1) both",
        pulseSoft:     "pulseSoft    2.2s  ease-in-out infinite",
        floatBlob:     "floatBlob    7s    ease-in-out infinite",
        spinSlow:      "spinSlow     0.9s  linear infinite",
        shimmer:       "shimmer      2.2s  linear infinite",
      },
    },
  },
  plugins: [],
};