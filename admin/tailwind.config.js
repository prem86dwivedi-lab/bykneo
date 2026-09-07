/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFC800',
          yellowHover: '#E5B400',
          dark: '#0B0F19',
          surface: '#111827',
          card: '#1F2937'
        }
      }
    },
  },
  plugins: [],
}
