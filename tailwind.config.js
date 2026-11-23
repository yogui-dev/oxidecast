/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./tests/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        oxide: {
          rust: '#FF5722',
          canvas: '#090D13',
          surface: '#161B22',
        },
      },
    },
  },
  plugins: [],
}
