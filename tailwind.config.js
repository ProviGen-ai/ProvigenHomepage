/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Thumbs up (green)
    "bg-green-100", "bg-green-50", "text-green-700", "text-green-400", "text-green-600",
    "dark:bg-green-900/30", "dark:text-green-400",
    "hover:text-green-600", "hover:bg-green-50", "dark:hover:bg-green-900/20",
    // Thumbs down (red)
    "bg-red-100", "bg-red-50", "text-red-700", "text-red-400",
    "dark:bg-red-900/30", "dark:text-red-400",
    "hover:text-red-600", "hover:bg-red-50", "dark:hover:bg-red-900/20",
    // Stress test
    "bg-yellow-500", "hover:bg-yellow-600", "text-yellow-500",
    "text-blue-500",
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    screens: {
      xs: "280px",
      sm: "575px",
      md: "768px",
      lg: "992px",
      xl: "1200px",
      "2xl": "1400px",
      "3xl": "1600px",
    },
    fontFamily: {
      sans: ['"Inter"', 'system-ui', 'sans-serif'],
      serif: ['"Source Serif 4"', "Georgia", "serif"],
      mono: ['"IBM Plex Mono"', "Menlo", "monospace"],
    },
    extend: {
      colors: {
        current: "currentColor",
        transparent: "transparent",
        white: "#FFFFFF",
        black: "#090E34",
        dark: "#1D2144",
        green: "#15803d",
        darkgreen: "#113939",
        primary: "#4A6CF7",
        yellow: "#FBB040",
        blue: "#2563eb",
        "logo-blue": "#05A2E6",
        "logo-green": "#057119",
        "body-color": "#959CB1",
        "body-color-dark": "#6c7793",
        // New premium palette (Ginkgo-inspired)
        cream: "#F2EEEB",
        "warm-white": "#FAFAF8",
        "soft-gray": "#f5f5f3",
        navy: "#0b1f30",
        "navy-light": "#1a3a52",
        "slate": "#3d4f5f",
        "muted": "#6b7b8d",
      },
      boxShadow: {
        signUp: "0px 5px 10px rgba(4, 10, 34, 0.2)",
        one: "0px 2px 3px rgba(7, 7, 77, 0.05)",
        sticky: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)",
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.04)",
        "card-hover": "0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.06)",
      },
      fontSize: {
        "display": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-sm": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "heading": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "heading-sm": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "subheading": ["1.25rem", { lineHeight: "1.5" }],
      },
      animation: {
        "scroll-infinite": "scroll-infinite 30s linear infinite",
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "slide-in-left": "slide-in-left 0.8s ease-out",
        "slide-in-right": "slide-in-right 0.8s ease-out",
      },
      keyframes: {
        "scroll-infinite": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
