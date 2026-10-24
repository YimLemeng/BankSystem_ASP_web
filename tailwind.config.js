/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        navy: {
          800: '#0f172a',
          900: '#0b1120',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Kantumruy Pro', 'Inter', 'system-ui', 'sans-serif'],
        khmer: ['Kantumruy Pro', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
