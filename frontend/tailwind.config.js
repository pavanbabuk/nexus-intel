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
        cyber: {
          900: '#0a0d14',
          800: '#101622',
          700: '#182030',
          600: '#232f46',
          border: '#2a3854',
          accent: '#00f2fe',
          green: '#10b981',
          purple: '#8b5cf6',
          amber: '#f59e0b',
          red: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
