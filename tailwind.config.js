/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neon colors from the game
        neon: {
          blue: '#00ffff',
          orange: '#ff6600',
          yellow: '#ffff00',
          purple: '#ff00ff',
        }
      }
    },
  },
  plugins: [],
}
