// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
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
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'Lato'", "sans-serif"],
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
