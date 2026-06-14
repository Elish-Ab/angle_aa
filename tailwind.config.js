/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#0f2744', light: '#1a3a5c' },
        teal:  { DEFAULT: '#1a7f6e', light: '#22a08a', faint: '#e8f5f2' },
        gold:  { DEFAULT: '#e8a048', light: '#f0b86a' },
        cream: { DEFAULT: '#f8f4ef', dark: '#f0ebe3' },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
