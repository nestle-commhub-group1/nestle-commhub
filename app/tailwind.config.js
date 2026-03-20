/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nestle: {
          brown: '#2C1810',
          'brown-light': '#3D2B1F', // used for primary button and active nav
          'brown-hover': '#4A3326', // slightly lighter for hover/active
          gray: '#F5F3F0',
          success: '#2D7A4F',
          warning: '#E6A817',
          danger: '#C0392B',
          border: '#E0DBD5',
        }
      }
    },
  },
  plugins: [],
};
