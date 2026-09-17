/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        unhimas: {
          blue: '#1e3a8a',
          gold: '#fbbf24',
          dark: '#111827',
          light: '#f3f4f6'
        }
      }
    },
  },
  plugins: [],
}
