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
          'rust-light': '#FFB5A0',
          canvas: '#0A0E17',
          surface: '#181B25',
          card: '#1C1F29',
          hover: '#262A34',
          active: '#31353F',
          cyan: '#00F1FD',
          lavender: '#D5BAFF',
        },
        surface: {
          lowest: '#0A0E17',
          low: '#181B25',
          DEFAULT: '#1C1F29',
          high: '#262A34',
          highest: '#31353F',
        },
        cyber: {
          cyan: '#00F1FD',
          green: '#53FC18',
          orange: '#FF5722',
          purple: '#9146FF',
          red: '#FF0000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
