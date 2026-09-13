/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef2ee",
          100: "#fde0d4",
          500: "#d8562e",
          600: "#b8451f",
          700: "#8f3517",
        },
      },
    },
  },
  plugins: [],
};
