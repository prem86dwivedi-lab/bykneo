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
          dark: '#111827',
          surface: '#1F2937',
          accent: '#10B981',
          danger: '#EF4444'
        },
        gray: {
          750: '#232d3d',
          850: '#141b27',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
