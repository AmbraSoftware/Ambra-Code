import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#FC5407",
          "primary-dark": "#e04804",
          "primary-light": "#FBAF72",
        },
        surface: {
          light: "#ffffff",
          "light-alt": "#f8f6f5",
          dark: "#23150f",
          "dark-alt": "#2d1b14",
          card: "#ffffff",
          "card-dark": "#32211a",
        },
        text: {
          primary: "#1c110c",
          secondary: "#a06246",
          muted: "#d1b1a4",
          "primary-dark": "#fcf9f8",
          "secondary-dark": "#d1b1a4",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#e9d6cd",
          dark: "rgba(255, 255, 255, 0.1)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-jakarta)", "Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      },
      boxShadow: {
        "primary-sm": "0 2px 8px rgba(252, 84, 7, 0.2)",
        "primary-md": "0 4px 16px rgba(252, 84, 7, 0.3)",
        "primary-lg": "0 8px 24px rgba(252, 84, 7, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
