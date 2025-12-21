// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#e67e22',
        primary: "#1a1a1a", // Deep charcoal for strong primary actions
        "background-light": "#FDFBF7", // Warm editorial paper
        "background-dark": "#050505", // Deep luxury black
        "accent-light": "#E5E5E5",
        "accent-dark": "#262626",
        "space-primary": "#8C7B6C",
        "space-bg-light": "#D8D6D1",
        "space-bg-dark": "#1C1C1E",
        "space-surface-light": "#EAE8E4",
        "space-surface-dark": "#2C2C2E",
        "space-text-light": "#333333",
        "space-text-dark": "#E5E5E5"
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'Lato'", "sans-serif"],
        "space-display": ["Montserrat", "sans-serif"],
        "space-serif": ["'Playfair Display'", "serif"],
      },
      borderRadius: {
        DEFAULT: "2px", // Sharp, editorial corners
        'lg': "4px"
      },
      letterSpacing: {
        widest: '.25em',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 400ms ease-out forwards',
      },
    },
  },
  plugins: [],
}
