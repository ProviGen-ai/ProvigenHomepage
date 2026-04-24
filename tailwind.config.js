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
      // => @media (min-width: 450px) { ... }

      sm: "575px",
      // => @media (min-width: 576px) { ... }

      md: "768px",
      // => @media (min-width: 768px) { ... }

      lg: "992px",
      // => @media (min-width: 992px) { ... }

      xl: "1200px",
      // => @media (min-width: 1200px) { ... }

      "2xl": "1400px",
      // => @media (min-width: 1400px) { ... }

      "3xl": "1600px",
      // => @media (min-width: 1600px) { ... }
    },
    fontFamily: {
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
      },
      boxShadow: {
        signUp: "0px 5px 10px rgba(4, 10, 34, 0.2)",
        one: "0px 2px 3px rgba(7, 7, 77, 0.05)",
        sticky: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
