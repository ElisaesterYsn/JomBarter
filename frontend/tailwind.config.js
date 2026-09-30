/** @type {import('tailwindcss').Config} */
import flowbite from 'flowbite/plugin'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/flowbite-vue/**/*.{js,jsx,ts,tsx,vue}',
    './node_modules/flowbite/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── JomBarter earth tone palette ────────────────────────────────────
        // Primary: warm amber-brown (buttons, links, brand accent)
        primary: {
          50: '#fdf8f0',
          100: '#faefd9',
          200: '#f3d9a8',
          300: '#e9bb6e',
          400: '#dd9b3c',
          500: '#c97f20', // base — rich golden amber
          600: '#a8641a', // default button bg
          700: '#8a4e14', // hover button bg
          800: '#6e3c10', // dark text / headings
          900: '#54300c', // deepest brand tone
        },
        // Surface: warm stone (backgrounds, cards)
        surface: {
          50: '#faf9f7', // page bg
          100: '#f3f0eb', // subtle section bg
          200: '#e6e0d6', // card borders
          300: '#cfc7b8', // input borders
          400: '#b5a994',
          500: '#9a8c76',
          600: '#7d7060',
          700: '#63584c',
          800: '#4a4138', // muted body text
          900: '#342e27', // darkest stone
        },
      },
    },
  },
  plugins: [flowbite],
}
