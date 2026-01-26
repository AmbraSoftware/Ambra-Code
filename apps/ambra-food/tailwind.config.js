/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4CAF50', // Verde (Saudável)
          light: '#81C784',
          dark: '#388E3C',
        },
        secondary: {
          DEFAULT: '#FF6B35', // Laranja (Apetitoso)
          light: '#FF9E80',
          dark: '#D84315',
        },
        background: '#F5F5F5',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Roboto'],
        title: ['Poppins'],
      },
    },
  },
  plugins: [],
}
